"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCampaign() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Perfil state
  const [perfil, setPerfil] = useState({ area_estudios: "", dni: "", telefono: "", cv_filename: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  
  // Template state
  const [template, setTemplate] = useState({ 
    asunto: "Postulación Espontánea - Docente de {{area_estudios}}", 
    cuerpo: "Estimados directivos de {{nombre_colegio}},\n\nMe dirijo a ustedes con el propósito de presentar mi postulación espontánea para vacantes en el área de {{area_estudios}}.\n\nAdjunto a este correo encontrarán mi currículum vitae con el detalle de mi formación y trayectoria. Me encantaría tener la oportunidad de conversar con ustedes para contarles cómo puedo aportar valor a la institución.\n\nQuedo a su entera disposición.\n\nAtentamente,\n{{mi_nombre}}" 
  });
  
  // Targeting state
  const [filters, setFilters] = useState({ provincia: "", ciudad: "", distrito: "", nivel: "" });
  const [q, setQ] = useState("");
  const [colegios, setColegios] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [targetingLoading, setTargetingLoading] = useState(false);
  
  const [provinciasOpt, setProvinciasOpt] = useState<string[]>([]);
  const [ciudadesOpt, setCiudadesOpt] = useState<string[]>([]);
  const [distritosOpt, setDistritosOpt] = useState<string[]>([]);
  const [nivelesOpt, setNivelesOpt] = useState<string[]>([]);
  
  const [enviosRestantes, setEnviosRestantes] = useState(10);
  const [plan, setPlan] = useState("freemium");
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Load initial data
    const email = localStorage.getItem("email");
    if (email) {
      const token = localStorage.getItem('token');
      fetch(`${apiUrl}/api/campaigns/profile`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          setPerfil({
            area_estudios: data.area_estudios || "",
            dni: data.dni || "",
            telefono: data.telefono || "",
            cv_filename: data.cv_filename || ""
          });
          setPlan(data.plan);
          setEnviosRestantes(data.envios_restantes);
          
          if (data.area_estudios) {
            setTemplate(prev => ({
              ...prev,
              asunto: prev.asunto.replace("{{area_estudios}}", data.area_estudios),
              cuerpo: prev.cuerpo.replace("{{area_estudios}}", data.area_estudios)
            }));
          }
        });
        
      fetchOptions("provincias").then(setProvinciasOpt);
      fetchOptions("niveles").then(setNivelesOpt);
    }
  }, []);
  
  const fetchOptions = async (endpoint: string, params: string = "") => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/${endpoint}${params}`, { credentials: "include" });
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  };

  useEffect(() => {
    if (filters.provincia) {
      fetchOptions("ciudades", `?provincia=${encodeURIComponent(filters.provincia)}`).then(setCiudadesOpt);
      fetchOptions("distritos", `?provincia=${encodeURIComponent(filters.provincia)}`).then(setDistritosOpt);
    } else {
      setCiudadesOpt([]);
      setDistritosOpt([]);
    }
  }, [filters.provincia]);

  useEffect(() => {
    if (filters.ciudad) {
      fetchOptions("distritos", `?provincia=${encodeURIComponent(filters.provincia)}&ciudad=${encodeURIComponent(filters.ciudad)}`).then(setDistritosOpt);
    }
  }, [filters.ciudad]);

  const searchColegios = async () => {
    setTargetingLoading(true);
    let query = `?limit=100&skip=0`;
    if (q) query += `&q=${encodeURIComponent(q)}`;
    if (filters.provincia) query += `&provincia=${encodeURIComponent(filters.provincia)}`;
    if (filters.ciudad) query += `&ciudad=${encodeURIComponent(filters.ciudad)}`;
    if (filters.distrito) query += `&distrito=${encodeURIComponent(filters.distrito)}`;
    if (filters.nivel) query += `&nivel=${encodeURIComponent(filters.nivel)}`;
    
    try {
      const res = await fetch(`${apiUrl}/api/admin/colegios${query}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setColegios(data.colegios || []);
      }
    } catch (e) {}
    setTargetingLoading(false);
  };

  const handleFilterChange = (e: any) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    if (e.target.name === "provincia") { newFilters.ciudad = ""; newFilters.distrito = ""; }
    if (e.target.name === "ciudad") { newFilters.distrito = ""; }
    setFilters(newFilters);
  };
  
  useEffect(() => {
    const delay = setTimeout(() => {
      searchColegios();
    }, 500);
    return () => clearTimeout(delay);
  }, [filters, q]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil.cv_filename && !cvFile) {
      alert("Debes adjuntar un CV en PDF.");
      return;
    }
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
        credentials: "include",
        body: formData,
      });
      
      if (res.ok) {
        setStep(2);
      } else {
        const err = await res.json();
        alert(err.detail || "Error al guardar el perfil");
      }
    } catch (e) {
      alert("Error de red");
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    if (!filters.ciudad && !filters.distrito) {
      alert("Debes filtrar al menos por Ciudad o Distrito para seleccionar todos.");
      return;
    }
    const currentIds = colegios.map(c => c.id);
    const newSelected = Array.from(new Set([...selectedIds, ...currentIds]));
    if (plan !== "pro" && newSelected.length > enviosRestantes) {
      alert(`Sólo te quedan ${enviosRestantes} envíos permitidos en tu plan actual.`);
      return;
    }
    setSelectedIds(newSelected);
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (plan !== "pro" && selectedIds.length >= enviosRestantes) {
        alert(`Sólo te quedan ${enviosRestantes} envíos permitidos en tu plan actual.`);
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleLaunch = async () => {
    if (selectedIds.length === 0) {
      alert("Debes seleccionar al menos un colegio.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/campaigns/create`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          asunto: template.asunto,
          cuerpo: template.cuerpo,
          colegios: selectedIds,
          nombre: `Campaña ${new Date().toLocaleDateString()}`
        })
      });
      
      if (res.ok) {
        alert("¡Campaña iniciada con éxito!");
        router.push("/dashboard/campaigns");
      } else {
        const err = await res.json();
        alert(err.detail || "Error al lanzar la campaña");
      }
    } catch (e) {
      alert("Error de red");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink mb-2">Crear Campaña</h1>
        <p className="text-slate-500">Configurá tu postulación masiva en 4 simples pasos.</p>
      </div>
      
      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-line -z-10 transform -translate-y-1/2"></div>
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 border-surface shadow-sm ${step >= s ? 'bg-emerald text-white' : 'bg-paper text-slate-400'}`}>
              {s}
            </div>
            <span className={`text-xs mt-2 font-semibold ${step >= s ? 'text-emerald' : 'text-slate-400'}`}>
              {s === 1 ? 'Datos & CV' : s === 2 ? 'Mensaje' : s === 3 ? 'Colegios' : 'Checkout'}
            </span>
          </div>
        ))}
      </div>
      
      <div className="bg-paper rounded-2xl border border-line p-8 shadow-sm">
        {step === 1 && (
          <form onSubmit={handleSaveProfile} className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-ink mb-6"><i className="fa-solid fa-address-card text-emerald mr-3"></i>Datos Personales y CV</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Área de Estudios / Materia</label>
                <input required type="text" value={perfil.area_estudios} onChange={e => setPerfil({...perfil, area_estudios: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 outline-none focus:border-emerald" placeholder="Ej: Matemáticas, Nivel Inicial, Inglés..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Teléfono de Contacto</label>
                <input type="text" value={perfil.telefono} onChange={e => setPerfil({...perfil, telefono: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 outline-none focus:border-emerald" placeholder="Ej: 11 1234-5678" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-line">
              <label className="block text-sm font-semibold text-ink mb-2">Adjuntar Currículum (PDF)</label>
              <div className="border-2 border-dashed border-line rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                <i className="fa-solid fa-file-pdf text-4xl text-slate-300 mb-4"></i>
                <p className="text-slate-500 mb-4">Subí tu currículum actualizado. El tamaño máximo es de 2MB.</p>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={e => setCvFile(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald/10 file:text-emerald hover:file:bg-emerald/20 cursor-pointer"
                />
                {perfil.cv_filename && !cvFile && (
                  <p className="text-emerald text-sm mt-4 font-semibold"><i className="fa-solid fa-check mr-2"></i>Ya tenés un CV guardado. Podés subir otro para reemplazarlo.</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <button type="submit" disabled={loading} className="bg-emerald text-white px-8 py-3 rounded-xl font-bold hover:bg-emeralddeep transition-colors">
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Siguiente Paso"}
              </button>
            </div>
          </form>
        )}
        
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-ink mb-6"><i className="fa-solid fa-pen-nib text-emerald mr-3"></i>Redacción del Mensaje</h2>
            <p className="text-slate-500 mb-6">Personalizá el mensaje que recibirán los colegios. Usá las variables para que cada correo sea único.</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {["{{nombre_colegio}}", "{{provincia}}", "{{ciudad}}", "{{distrito}}", "{{nivel}}", "{{area_estudios}}"].map(v => (
                <button key={v} onClick={() => setTemplate({...template, cuerpo: template.cuerpo + " " + v})} className="bg-slate-100 hover:bg-emerald/10 hover:text-emerald text-slate-600 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors">
                  {v}
                </button>
              ))}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Asunto</label>
              <input type="text" value={template.asunto} onChange={e => setTemplate({...template, asunto: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 outline-none focus:border-emerald" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Cuerpo del Correo</label>
              <textarea value={template.cuerpo} onChange={e => setTemplate({...template, cuerpo: e.target.value})} rows={10} className="w-full border border-line rounded-xl px-4 py-3 outline-none focus:border-emerald resize-y" />
            </div>
            
            <div className="flex justify-between pt-6 border-t border-line">
              <button onClick={() => setStep(1)} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Atrás</button>
              <button onClick={() => setStep(3)} className="bg-emerald text-white px-8 py-3 rounded-xl font-bold hover:bg-emeralddeep transition-colors">Siguiente Paso</button>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ink mb-2"><i className="fa-solid fa-crosshairs text-emerald mr-3"></i>Selección de Colegios</h2>
                <p className="text-slate-500">Filtrá y seleccioná a qué colegios querés enviar tu currículum.</p>
              </div>
              <div className="bg-emerald/10 text-emerald px-4 py-2 rounded-xl font-bold text-sm">
                Seleccionados: {selectedIds.length} {plan !== "pro" && `/ ${enviosRestantes}`}
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-xl border border-line">
              <div className="flex-1 min-w-[200px] relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre..." 
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-line rounded-lg text-sm bg-white outline-none focus:border-emerald"
                />
              </div>
              <select name="provincia" value={filters.provincia} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-2 text-sm bg-white outline-none flex-1 min-w-[150px]">
                <option value="">Provincias</option>
                {provinciasOpt.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select name="distrito" value={filters.distrito} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-2 text-sm bg-white outline-none flex-1 min-w-[150px]" disabled={!filters.provincia || distritosOpt.length === 0}>
                <option value="">Distritos</option>
                {distritosOpt.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select name="ciudad" value={filters.ciudad} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-2 text-sm bg-white outline-none flex-1 min-w-[150px]" disabled={!filters.provincia || ciudadesOpt.length === 0}>
                <option value="">Ciudades</option>
                {ciudadesOpt.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select name="nivel" value={filters.nivel} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-2 text-sm bg-white outline-none flex-1 min-w-[150px]">
                <option value="">Niveles</option>
                {nivelesOpt.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <h3 className="font-bold text-ink">Resultados</h3>
              <button 
                onClick={handleSelectAll}
                disabled={!filters.ciudad && !filters.distrito}
                className="text-sm font-semibold text-emerald hover:text-emeralddeep disabled:opacity-50 disabled:text-slate-400"
                title={!filters.ciudad && !filters.distrito ? "Filtrá por Ciudad o Distrito para seleccionar todos" : "Seleccionar todos los resultados"}
              >
                <i className="fa-solid fa-check-double mr-2"></i>Seleccionar Todos
              </button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto border border-line rounded-xl">
              {targetingLoading ? (
                <div className="p-8 text-center text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Buscando colegios...</div>
              ) : colegios.length === 0 ? (
                <div className="p-8 text-center text-red-500 font-bold">Sin resultados</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-line">
                    {colegios.map(col => (
                      <tr key={col.id} className={`hover:bg-emerald/5 cursor-pointer transition-colors ${selectedIds.includes(col.id) ? 'bg-emerald/10' : ''}`} onClick={() => toggleSelection(col.id)}>
                        <td className="p-4 w-12 text-center">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(col.id) ? 'bg-emerald border-emerald text-white' : 'border-slate-300 bg-white'}`}>
                            {selectedIds.includes(col.id) && <i className="fa-solid fa-check text-xs"></i>}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-ink">{col.nombre}</td>
                        <td className="p-4 text-slate-500">{col.distrito || col.ciudad}</td>
                        <td className="p-4 text-slate-500">{col.nivel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="flex justify-between pt-6">
              <button onClick={() => setStep(2)} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Atrás</button>
              <button onClick={() => setStep(4)} disabled={selectedIds.length === 0} className="bg-emerald text-white px-8 py-3 rounded-xl font-bold hover:bg-emeralddeep transition-colors disabled:opacity-50">Siguiente Paso</button>
            </div>
          </div>
        )}
        
        {step === 4 && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald/10 text-emerald rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                <i className="fa-solid fa-rocket"></i>
              </div>
              <h2 className="text-3xl font-bold text-ink mb-2">Resumen de la Campaña</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Estás a un paso de lanzar tu campaña. Revisá que todo esté correcto antes de enviar.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-slate-50 rounded-xl p-6 border border-line">
                <div className="flex items-center text-emerald font-bold mb-4">
                  <i className="fa-solid fa-envelope mr-3"></i> Mensaje
                </div>
                <p className="text-sm text-slate-600 mb-2"><strong className="text-ink">Asunto:</strong> {template.asunto}</p>
                <div className="bg-white p-3 rounded-lg border border-line text-xs font-mono text-slate-500 h-24 overflow-y-auto">
                  {template.cuerpo}
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6 border border-line">
                <div className="flex items-center text-emerald font-bold mb-4">
                  <i className="fa-solid fa-bullseye mr-3"></i> Destinatarios
                </div>
                <div className="text-4xl font-bold text-ink mb-1">{selectedIds.length}</div>
                <p className="text-sm text-slate-500 mb-4">colegios seleccionados</p>
                <div className="text-xs text-slate-400">
                  <i className="fa-solid fa-info-circle mr-1"></i> Se enviará de manera espaciada para evitar spam.
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6 border border-line md:col-span-2 flex items-center justify-between">
                <div className="flex items-center">
                  <i className="fa-solid fa-file-pdf text-3xl text-red-500 mr-4"></i>
                  <div>
                    <h3 className="font-bold text-ink">Currículum Adjunto</h3>
                    <p className="text-sm text-slate-500">{(perfil.cv_filename || cvFile?.name)}</p>
                  </div>
                </div>
                <span className="bg-emerald/10 text-emerald text-xs font-bold px-3 py-1 rounded-full"><i className="fa-solid fa-check mr-1"></i>Listo</span>
              </div>
            </div>
            
            <div className="flex justify-between pt-6 border-t border-line max-w-3xl mx-auto">
              <button onClick={() => setStep(3)} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Atrás</button>
              <button onClick={handleLaunch} disabled={loading} className="bg-emerald text-white px-8 py-3 rounded-xl font-bold hover:bg-emeralddeep shadow-lg shadow-emerald/30 transition-all transform hover:-translate-y-1">
                {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-paper-plane mr-2"></i>} 
                Lanzar Campaña
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
