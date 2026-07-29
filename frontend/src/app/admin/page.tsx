"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("db"); // db, template, stats
  
  // Auth state
  const [token, setToken] = useState<string | null>(null);

  // DB State
  const [colegios, setColegios] = useState([]);
  const [dbStats, setDbStats] = useState({ total: 0, sanos: 0, rotos: 0 });
  const [filters, setFilters] = useState({ estado: "", provincia: "", nivel: "" });
  
  // Template State
  const [template, setTemplate] = useState({ asunto: "", cuerpo: "" });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // System Stats State
  const [sysStats, setSysStats] = useState({
    usuarios_totales: 0, usuarios_pro: 0, campanas_totales: 0, emails_enviados: 0
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Capturar de la URL si venimos del login
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlEmail = params.get("email");
    const urlPicture = params.get("picture");
    
    if (urlToken && urlEmail) {
      localStorage.setItem("token", urlToken);
      localStorage.setItem("email", urlEmail);
      if (urlPicture) localStorage.setItem("picture", decodeURIComponent(urlPicture));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Basic Auth Check
    const localToken = localStorage.getItem("token");
    const localEmail = localStorage.getItem("email");
    
    if (localEmail !== "tavika.app@gmail.com") {
      alert("Acceso denegado. Serás redirigido al inicio.");
      router.push("/dashboard");
      return;
    }
    setToken(localToken);
    
    if (localToken) {
      fetchDbStats(localToken);
      fetchColegios(localToken, filters);
      fetchTemplate(localToken);
      fetchSystemStats(localToken);
    }
  }, []);

  const getHeaders = (t: string) => ({
    "Authorization": `Bearer ${t}`,
    "Content-Type": "application/json"
  });

  const fetchDbStats = async (t: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: getHeaders(t) });
      if (res.ok) setDbStats(await res.json());
    } catch (e) {}
  };

  const fetchColegios = async (t: string, currentFilters: any) => {
    try {
      setLoading(true);
      let query = `?limit=50`;
      if (currentFilters.estado) query += `&estado=${currentFilters.estado}`;
      if (currentFilters.provincia) query += `&provincia=${currentFilters.provincia}`;
      if (currentFilters.nivel) query += `&nivel=${currentFilters.nivel}`;
      
      const res = await fetch(`${apiUrl}/api/admin/colegios${query}`, { headers: getHeaders(t) });
      if (res.ok) {
        const data = await res.json();
        setColegios(data.colegios || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplate = async (t: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/template`, { headers: getHeaders(t) });
      if (res.ok) setTemplate(await res.json());
    } catch (e) {}
  };

  const fetchSystemStats = async (t: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/system_stats`, { headers: getHeaders(t) });
      if (res.ok) setSysStats(await res.json());
    } catch (e) {}
  };

  const handleFilterChange = (e: any) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    if (token) fetchColegios(token, newFilters);
  };

  const handleSaveTemplate = async () => {
    if (!token) return;
    setSavingTemplate(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/template`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(template)
      });
      if (res.ok) alert("Plantilla guardada con éxito!");
      else alert("Error al guardar plantilla");
    } catch (e) {
      alert("Error de red");
    } finally {
      setSavingTemplate(false);
    }
  };

  if (!token) return <div className="p-10 text-center">Verificando seguridad...</div>;

  const pieData = [
    { name: 'Sanos', value: dbStats.sanos, color: '#10b981' },
    { name: 'Rotos', value: dbStats.rotos, color: '#ef4444' },
  ];
  const barData = [
    { name: 'Total Registrados', usuarios: sysStats.usuarios_totales },
    { name: 'Suscritos (Pro)', usuarios: sysStats.usuarios_pro },
  ];

  return (
    <div className="bg-surface text-slate-800 min-h-screen p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-b border-line pb-6">
          <h1 className="text-3xl font-bold text-ink">Centro de Comando ⚡</h1>
          <p className="text-slate-500">Solo visible para Master Admin (tavika.app@gmail.com)</p>
          
          <div className="flex gap-4 mt-6">
            <button onClick={() => setActiveTab("db")} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${activeTab === "db" ? "bg-emerald text-white" : "bg-paper border border-line hover:bg-slate-50"}`}>
              <i className="fa-solid fa-database mr-2"></i> Base de Datos
            </button>
            <button onClick={() => setActiveTab("template")} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${activeTab === "template" ? "bg-emerald text-white" : "bg-paper border border-line hover:bg-slate-50"}`}>
              <i className="fa-solid fa-envelope-open-text mr-2"></i> Plantilla Global
            </button>
            <button onClick={() => setActiveTab("stats")} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${activeTab === "stats" ? "bg-emerald text-white" : "bg-paper border border-line hover:bg-slate-50"}`}>
              <i className="fa-solid fa-chart-line mr-2"></i> Estadísticas
            </button>
          </div>
        </header>

        {/* TAB 1: BASE DE DATOS */}
        {activeTab === "db" && (
          <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-paper p-6 rounded-2xl border border-line">
                <h3 className="text-slate-500 text-sm font-semibold uppercase mb-2">Colegios Totales</h3>
                <p className="text-4xl font-bold text-ink">{dbStats.total.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-emerald/30">
                <h3 className="text-emerald text-sm font-semibold uppercase mb-2">Sanos (Verificados)</h3>
                <p className="text-4xl font-bold text-emerald">{dbStats.sanos.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-red-500/30">
                <h3 className="text-red-500 text-sm font-semibold uppercase mb-2">Rotos (Rebotados)</h3>
                <p className="text-4xl font-bold text-red-500">{dbStats.rotos.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-paper rounded-2xl border border-line overflow-hidden">
              <div className="p-5 border-b border-line bg-slate-50 flex gap-4 items-center">
                <span className="font-semibold text-ink">Filtros:</span>
                <select name="estado" value={filters.estado} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none">
                  <option value="">Todos los Estados</option>
                  <option value="sano">Solo Sanos</option>
                  <option value="roto">Solo Rotos</option>
                </select>
                <select name="provincia" value={filters.provincia} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none">
                  <option value="">Todas las Provincias</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="CABA">CABA</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Santa Fe">Santa Fe</option>
                </select>
                <select name="nivel" value={filters.nivel} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none">
                  <option value="">Todos los Niveles</option>
                  <option value="Primario">Primario</option>
                  <option value="Secundario">Secundario</option>
                  <option value="Jardín">Jardín</option>
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-400 bg-paper border-b border-line">
                      <th className="p-4 font-medium">Nombre</th>
                      <th className="p-4 font-medium">Provincia/Distrito</th>
                      <th className="p-4 font-medium">Nivel</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {loading ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Buscando...</td></tr>
                    ) : colegios.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No se encontraron resultados para estos filtros.</td></tr>
                    ) : (
                      colegios.map((col: any) => (
                        <tr key={col.id} className="hover:bg-slate-50">
                          <td className="p-4 font-medium text-ink max-w-[200px] truncate" title={col.nombre}>{col.nombre}</td>
                          <td className="p-4 text-slate-500">{col.provincia} - {col.distrito}</td>
                          <td className="p-4 text-slate-500">{col.nivel}</td>
                          <td className="p-4 text-slate-500">{col.email || "Sin email"}</td>
                          <td className="p-4">
                            {col.estado === "sano" ? (
                              <span className="bg-emerald/10 text-emerald px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">SANO</span>
                            ) : (
                              <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">ROTO</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLANTILLA */}
        {activeTab === "template" && (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-paper rounded-2xl border border-line p-6 shadow-sm">
              <h2 className="text-lg font-bold text-ink mb-4">Editor de Plantilla Global</h2>
              <p className="text-sm text-slate-500 mb-6">Esta plantilla se usará como base para enviar correos a las escuelas.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">Asunto del Correo</label>
                  <input 
                    type="text" 
                    value={template.asunto}
                    onChange={(e) => setTemplate({...template, asunto: e.target.value})}
                    className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                    placeholder="Ej: Propuesta Laboral - {{nombre_colegio}}"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">Cuerpo del Correo</label>
                  <textarea 
                    value={template.cuerpo}
                    onChange={(e) => setTemplate({...template, cuerpo: e.target.value})}
                    rows={12}
                    className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all resize-y font-mono text-sm leading-relaxed"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="bg-emerald text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emeralddeep transition-all disabled:opacity-50"
                  >
                    {savingTemplate ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-floppy-disk mr-2"></i> Guardar Plantilla</>}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-2xl border border-line p-6 h-fit">
              <h3 className="font-bold text-ink mb-3"><i className="fa-solid fa-code mr-2 text-emerald"></i>Variables Disponibles</h3>
              <p className="text-sm text-slate-500 mb-4">Hacé clic en una variable para insertarla en tu correo automáticamente. Nuestro sistema la reemplazará por los datos reales de cada escuela.</p>
              
              <div className="flex flex-wrap gap-2">
                {["{{nombre_colegio}}", "{{provincia}}", "{{distrito}}", "{{nivel}}", "{{sector}}"].map(v => (
                  <button 
                    key={v}
                    onClick={() => setTemplate({...template, cuerpo: template.cuerpo + " " + v})}
                    className="bg-white border border-line text-navy hover:border-emerald hover:text-emerald px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ESTADISTICAS */}
        {activeTab === "stats" && (
          <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-paper p-6 rounded-2xl border border-line">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4"><i className="fa-solid fa-users"></i></div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">Usuarios (Gmail)</h3>
                <p className="text-3xl font-bold text-ink">{sysStats.usuarios_totales}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-line">
                <div className="w-10 h-10 rounded-xl bg-emerald/10 text-emerald flex items-center justify-center mb-4"><i className="fa-solid fa-crown"></i></div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">Suscripciones Pro</h3>
                <p className="text-3xl font-bold text-ink">{sysStats.usuarios_pro}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-line">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mb-4"><i className="fa-solid fa-bullhorn"></i></div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">Campañas Activas</h3>
                <p className="text-3xl font-bold text-ink">{sysStats.campanas_totales}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-line">
                <div className="w-10 h-10 rounded-xl bg-amber/10 text-amber-600 flex items-center justify-center mb-4"><i className="fa-solid fa-paper-plane"></i></div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">Emails Despachados</h3>
                <p className="text-3xl font-bold text-ink">{sysStats.emails_enviados}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-paper p-6 rounded-2xl border border-line h-[400px]">
                <h3 className="font-bold text-ink mb-6">Salud de la Base de Datos</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 text-sm font-medium">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald"></div> Sanos</span>
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Rotos</span>
                </div>
              </div>
              
              <div className="bg-paper p-6 rounded-2xl border border-line h-[400px]">
                <h3 className="font-bold text-ink mb-6">Conversión a Pro</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="usuarios" fill="#10b981" radius={[8, 8, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
