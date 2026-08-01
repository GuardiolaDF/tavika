"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [perfil, setPerfil] = useState({
    nombre: "",
    area_estudios: "",
    telefono: "",
    asunto: "",
    cuerpo: "",
    cv_filename: ""
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [terminos, setTerminos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const apiUrl = '/backend';

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      fetch(`${apiUrl}/api/campaigns/profile`, { credentials: "include" })
        .then(res => {
          if (!res.ok) throw new Error("No profile");
          return res.json();
        })
        .then(data => {
          setPerfil({
            nombre: data.nombre || "",
            area_estudios: data.area_estudios || "",
            telefono: data.telefono || "",
            asunto: data.asunto_template || "",
            cuerpo: data.cuerpo_template || "",
            cv_filename: data.cv_filename || ""
          });
          setFetching(false);
        })
        .catch(() => setFetching(false));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("El archivo no puede pesar más de 2MB.");
        e.target.value = '';
        return;
      }
      setCvFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("email", localStorage.getItem("email") || "");
      formData.append("nombre", perfil.nombre);
      formData.append("area_estudios", perfil.area_estudios);
      formData.append("telefono", perfil.telefono);
      formData.append("asunto", perfil.asunto);
      formData.append("cuerpo", perfil.cuerpo);
      if (cvFile) formData.append("cv", cvFile);
      
      const res = await fetch(`${apiUrl}/api/campaigns/profile`, {
        method: "POST",
        credentials: "include",
        body: formData
      });
      
      if (res.ok) {
        alert("Perfil guardado con éxito.");
        if (cvFile) {
          setPerfil(prev => ({...prev, cv_filename: cvFile.name}));
          setCvFile(null);
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Error al guardar el perfil");
      }
    } catch (e) {
      alert("Error de red");
    }
    setSaving(false);
  };

  if (fetching) return <div className="p-10 text-center"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Cargando perfil...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink mb-2">Mis datos</h1>
        <p className="text-slate-500">Configurá tus datos personales y mantené tu currículum actualizado.</p>
      </div>

      <div className="bg-paper rounded-2xl border border-line p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* BLOQUE 1: Datos Personales */}
          <div className="bg-white rounded-xl p-6 border border-line shadow-sm">
            <h2 className="text-xl font-bold text-ink mb-4 border-b border-line pb-2">
              <i className="fa-solid fa-user text-emerald mr-2"></i> Bloque 1: Datos Personales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de Pila</label>
                <input 
                  type="text"
                  value={perfil.nombre}
                  onChange={e => setPerfil({...perfil, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:border-emerald outline-none transition-colors"
                  placeholder="Ej: María"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Materia o Área</label>
                <input 
                  type="text"
                  value={perfil.area_estudios}
                  onChange={e => {
                    const val = e.target.value;
                    setPerfil({...perfil, area_estudios: val, asunto: `Postulacion espontanea para el area ${val}`});
                  }}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:border-emerald outline-none transition-colors"
                  placeholder="Ej: Matemáticas"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono de Contacto</label>
                <input 
                  type="text"
                  value={perfil.telefono}
                  onChange={e => setPerfil({...perfil, telefono: e.target.value})}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:border-emerald outline-none transition-colors"
                  placeholder="Ej: 11 1234-5678"
                  required
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 2: eMail */}
          <div className="bg-white rounded-xl p-6 border border-line shadow-sm">
            <h2 className="text-xl font-bold text-ink mb-4 border-b border-line pb-2">
              <i className="fa-solid fa-envelope text-blue-500 mr-2"></i> Bloque 2: Plantilla de Email
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Estos textos se usarán por defecto al crear tus campañas. Puedes usar variables como <code className="bg-slate-100 text-slate-700 px-1 rounded">{`{{colegio_nombre}}`}</code>.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Asunto del correo</label>
                <input 
                  type="text"
                  value={perfil.asunto}
                  onChange={e => setPerfil({...perfil, asunto: e.target.value})}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:border-emerald outline-none transition-colors"
                  placeholder={`Postulacion espontanea para el area ${perfil.area_estudios || '...'}`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cuerpo del texto</label>
                <textarea 
                  value={perfil.cuerpo}
                  onChange={e => setPerfil({...perfil, cuerpo: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:border-emerald outline-none transition-colors resize-none"
                  placeholder="Estimados representantes del colegio {{colegio_nombre}},&#10;&#10;Mi nombre es {{nombre}} y les escribo para..."
                  required
                ></textarea>
                <button type="button" onClick={() => setPerfil({...perfil, cuerpo: `Estimados directivos de {{colegio_nombre}},\n\nMe dirijo a ustedes para presentarles mi candidatura espontánea para el área de ${perfil.area_estudios || '___'}. Mi nombre es ${perfil.nombre || '___'}.\n\nAdjunto a este correo mi CV actualizado para que puedan considerar mi perfil en futuras búsquedas.\n\nQuedo a su entera disposición para una entrevista.\n\nAtentamente,\n${perfil.nombre || '___'}\nTel: ${perfil.telefono || '___'}`})} className="text-xs text-emerald font-semibold mt-2 hover:underline">
                  <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Generar texto predefinido
                </button>
              </div>
            </div>
          </div>

          {/* BLOQUE 3: Carga del CV */}
          <div className="bg-white rounded-xl p-6 border border-line shadow-sm">
            <h2 className="text-xl font-bold text-ink mb-4 border-b border-line pb-2">
              <i className="fa-solid fa-file-pdf text-red-500 mr-2"></i> Bloque 3: Carga de CV
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Archivo CV (PDF, Max 2MB)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-slate-300">
                  <i className="fa-solid fa-upload mr-2"></i> Seleccionar PDF
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                </label>
                <span className="text-sm text-slate-500">
                  {cvFile ? cvFile.name : (perfil.cv_filename ? `Actual: ${perfil.cv_filename}` : 'Ningún archivo seleccionado')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-line mt-4">
              <input 
                type="checkbox" 
                id="terminos" 
                checked={terminos}
                onChange={e => setTerminos(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terminos" className="text-xs text-slate-600 leading-tight cursor-pointer">
                Declaro que la información contenida en el CV es verdadera y acepto los Términos y condiciones para el envío de Mis datos a los colegios seleccionados mediante la plataforma.
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={saving || (!!cvFile && !terminos)}
              className="bg-emerald hover:bg-emeralddeep text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

