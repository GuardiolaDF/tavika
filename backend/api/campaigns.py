from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Usuario, Campana, Postulacion, Colegio
import os
import shutil
import uuid
from typing import List, Optional

router = APIRouter()

def get_current_user(email: str, db: Session):
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.post("/profile")
async def update_profile(
    email: str = Form(...),
    area_estudios: str = Form(""),
    dni: str = Form(""),
    telefono: str = Form(""),
    cv: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(email, db)
    
    user.area_estudios = area_estudios
    user.dni = dni
    user.telefono = telefono
    
    if cv:
        if not cv.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="El CV debe ser un archivo PDF")
        
        # Read the file content to check size (limit to 2MB)
        content = await cv.read()
        if len(content) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="El PDF no debe pesar más de 2MB")
        
        # Save file to uploads folder
        os.makedirs("uploads/cvs", exist_ok=True)
        filename = f"{user.id}_{uuid.uuid4().hex}.pdf"
        filepath = os.path.join("uploads/cvs", filename)
        
        with open(filepath, "wb") as f:
            f.write(content)
            
        user.cv_filename = filepath
        
    db.commit()
    return {"message": "Perfil actualizado con éxito"}

@router.get("/profile")
def get_profile(email: str, db: Session = Depends(get_db)):
    user = get_current_user(email, db)
    return {
        "area_estudios": user.area_estudios or "",
        "dni": user.dni or "",
        "telefono": user.telefono or "",
        "cv_filename": user.cv_filename,
        "plan": user.plan,
        "envios_restantes": user.envios_restantes
    }

@router.post("/create")
def create_campaign(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    asunto = data.get("asunto")
    cuerpo = data.get("cuerpo")
    colegios_ids = data.get("colegios", [])
    nombre = data.get("nombre", "Campaña")
    
    user = get_current_user(email, db)
    
    if not colegios_ids:
        raise HTTPException(status_code=400, detail="Debes seleccionar al menos un colegio")
        
    if user.plan != "pro" and len(colegios_ids) > user.envios_restantes:
        raise HTTPException(status_code=400, detail=f"Excedes tus envíos restantes. Puedes enviar hasta {user.envios_restantes} correos.")
        
    campana = Campana(
        nombre=nombre,
        propietario_id=user.id,
        asunto_template=asunto,
        cuerpo_template=cuerpo,
        cv_utilizado=user.cv_filename,
        estado="en_progreso"
    )
    db.add(campana)
    db.commit()
    db.refresh(campana)
    
    # Restar los envíos si no es pro
    if user.plan != "pro":
        user.envios_restantes -= len(colegios_ids)
    
    # Crear las postulaciones pendientes
    for c_id in colegios_ids:
        post = Postulacion(
            campana_id=campana.id,
            colegio_id=c_id,
            estado="pendiente"
        )
        db.add(post)
        
    db.commit()
    
    # Aquí en el futuro se llamará a Celery para que procese el envío asíncrono
    return {"message": "Campaña iniciada", "campana_id": campana.id}

@router.get("/list")
def list_campaigns(email: str, db: Session = Depends(get_db)):
    user = get_current_user(email, db)
    campanas = db.query(Campana).filter(Campana.propietario_id == user.id).order_by(Campana.id.desc()).all()
    
    res = []
    for c in campanas:
        postulaciones = db.query(Postulacion).filter(Postulacion.campana_id == c.id).all()
        enviados = sum(1 for p in postulaciones if p.estado == "enviado")
        rebotados = sum(1 for p in postulaciones if p.estado == "rebotado")
        pendientes = sum(1 for p in postulaciones if p.estado == "pendiente")
        
        res.append({
            "id": c.id,
            "nombre": c.nombre,
            "estado": c.estado,
            "fecha_creacion": c.fecha_creacion,
            "total": len(postulaciones),
            "enviados": enviados,
            "rebotados": rebotados,
            "pendientes": pendientes
        })
    return {"campanas": res}
