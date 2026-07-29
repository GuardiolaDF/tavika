"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [perfil, setPerfil] = useState({ area_estudios: "", dni: "", telefono: "", cv_filename: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      fetch(`${apiUrl}/api/campaigns/profile?email=${encodeURIComponent(email)}`)
        .then(res => {
          if (!res.ok) throw new Error("No profile");
          return res.json();
        })
        .then(data => {
          setPerfil({
            area_estudios: data.area_estudios || "",
            dni: data.dni || "",
            telefono: data.telefono || "",
            cv_filename: data.cv_filename || ""
          });
          setFetching(false);
        })
        .catch(() => setFetching(false));
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", localStorage.getItem("email") || "");
      formData.append("area_estudios", perfil.area_estudios);
      formData.append("dni", perfil.dni);
      formData.append("telefono", perfil.telefono);
      if (cvFile) formData.append("cv", cvFile);
      
      const res = await fetch(`${apiUrl}/api/campaigns/profile`, {
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        alert("Perfil guardado con éxito.");
        if (cvFile) {
          setPerfil({...perfil, cv_filename: "Actualizado recientemente"});
          setCvFile(null);
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Error al guardar el perfil");
      }
    } catch (e) {
      alert("Error de red");
    }
    setLoading(false);
  };

  if (fetching) return <div className="p-10 text-center"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Cargando perfil...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink mb-2">Mis Datos</h1>
        <p className="text-slate-500">Configurá tus datos personales y mantené tu currículum actualizado.</p>
      </div>

      <div className="bg-paper rounded-2xl border border-line p-8 shadow-sm">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Área de Estudios / Materia</label>
              <input required type="text" value={perfil.area_estudios} onChange={e => setPerfil({...perfil, area_estudios: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 outline-none focus:border-emerald" placeholder="Ej: Matemáticas" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">DNI / Pasaporte</label>
              <input type="text" value={perfil.dni} onChange={e => setPerfil({...perfil, dni: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 outline-none focus:border-emerald" placeholder="Ej: 12.345.678" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Teléfono de Contacto</label>
              <input type="text" value={perfil.telefono} onChange={e => setPerfil({...perfil, telefono: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 outline-none focus:border-emerald" placeholder="Ej: 11 1234-5678" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-line">
            <label className="block text-sm font-semibold text-ink mb-2">Currículum (PDF)</label>
            <div className="border-2 border-dashed border-line rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
              <i className="fa-solid fa-file-pdf text-4xl text-slate-300 mb-4"></i>
              {perfil.cv_filename ? (
                <p className="text-emerald text-sm font-semibold mb-4"><i className="fa-solid fa-check mr-2"></i>CV Guardado: {perfil.cv_filename.split("/").pop()}</p>
              ) : (
                <p className="text-amber-500 text-sm font-semibold mb-4"><i className="fa-solid fa-triangle-exclamation mr-2"></i>Aún no has subido tu CV</p>
              )}
              <input 
                type="file" 
                accept=".pdf" 
                onChange={e => setCvFile(e.target.files ? e.target.files[0] : null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald/10 file:text-emerald hover:file:bg-emerald/20 cursor-pointer"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-6">
            <button type="submit" disabled={loading} className="bg-emerald text-white px-8 py-3 rounded-xl font-bold hover:bg-emeralddeep transition-colors">
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
