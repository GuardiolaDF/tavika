from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    nombre = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    gmail_token = Column(String, nullable=True) # Guardará el refresh token de OAuth2
    plan = Column(String, default="freemium")
    envios_restantes = Column(Integer, default=30)
    
    campanas = relationship("Campana", back_populates="propietario")

class Colegio(Base):
    __tablename__ = "colegios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    provincia = Column(String, index=True)
    distrito = Column(String, index=True)
    sector = Column(String, index=True) # Privado, Estatal, etc
    nivel = Column(String, index=True) # Jardin, Primaria, Secundaria, etc
    email = Column(String, nullable=True)
    origen = Column(String) # Origen del dato (abc, web, etc)
    estado = Column(String, default="sano") # sano, rebotado, actualizando
    fecha_actualizacion = Column(DateTime, default=datetime.datetime.utcnow)

class Campana(Base):
    __tablename__ = "campanas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    propietario_id = Column(Integer, ForeignKey("usuarios.id"))
    asunto_template = Column(String)
    cuerpo_template = Column(String)
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    estado = Column(String, default="pendiente") # pendiente, en_progreso, completado
    
    propietario = relationship("Usuario", back_populates="campanas")
    postulaciones = relationship("Postulacion", back_populates="campana")

class Postulacion(Base):
    __tablename__ = "postulaciones"

    id = Column(Integer, primary_key=True, index=True)
    campana_id = Column(Integer, ForeignKey("campanas.id"))
    colegio_id = Column(Integer, ForeignKey("colegios.id"))
    estado = Column(String, default="pendiente") # pendiente, enviado, rebotado
    fecha_envio = Column(DateTime, nullable=True)

    campana = relationship("Campana", back_populates="postulaciones")
    colegio = relationship("Colegio")

class Configuracion(Base):
    __tablename__ = "configuracion"
    
    clave = Column(String, primary_key=True, index=True)
    valor = Column(String)
