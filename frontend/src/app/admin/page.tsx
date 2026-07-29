"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("db");
  
  const [token, setToken] = useState<string | null>(null);

  const [colegios, setColegios] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState({ total: 0, con_mail: 0, sin_mail: 0, verificados: 0, rebotados: 0 });
  const [filters, setFilters] = useState({ estado: "", provincia: "", ciudad: "", distrito: "", nivel: "" });
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [provinciasOpt, setProvinciasOpt] = useState<string[]>([]);
  const [ciudadesOpt, setCiudadesOpt] = useState<string[]>([]);
  const [distritosOpt, setDistritosOpt] = useState<string[]>([]);
  const [nivelesOpt, setNivelesOpt] = useState<string[]>([]);
  
  const [template, setTemplate] = useState({ asunto: "", cuerpo: "" });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [sysStats, setSysStats] = useState({
    usuarios_totales: 0, usuarios_pro: 0, campanas_totales: 0, emails_enviados: 0
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchOptions = async (endpoint: string, params: string = "") => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/${endpoint}${params}`);
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  };

  useEffect(() => {
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

    const localToken = localStorage.getItem("token");
    const localEmail = localStorage.getItem("email");
    
    if (localEmail !== "tavika.app@gmail.com") {
      alert("Acceso denegado. Serás redirigido al inicio.");
      router.push("/dashboard");
      return;
    }
    setToken(localToken);
  }, []);

  useEffect(() => {
    if (token) {
      fetchDbStats(token);
      fetchColegios(token, filters, 0, true);
      fetchTemplate(token);
      fetchSystemStats(token);
      fetchOptions("provincias").then(setProvinciasOpt);
      fetchOptions("niveles").then(setNivelesOpt);
    }
  }, [token]);

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

  const fetchColegios = async (t: string, currentFilters: any, currentSkip: number, reset: boolean = false) => {
    try {
      setLoading(true);
      let query = `?limit=50&skip=${currentSkip}&admin_view=true`;
      if (currentFilters.estado) query += `&estado=${encodeURIComponent(currentFilters.estado)}`;
      if (currentFilters.provincia) query += `&provincia=${encodeURIComponent(currentFilters.provincia)}`;
      if (currentFilters.ciudad) query += `&ciudad=${encodeURIComponent(currentFilters.ciudad)}`;
      if (currentFilters.distrito) query += `&distrito=${encodeURIComponent(currentFilters.distrito)}`;
      if (currentFilters.nivel) query += `&nivel=${encodeURIComponent(currentFilters.nivel)}`;
      
      const res = await fetch(`${apiUrl}/api/admin/colegios${query}`, { headers: getHeaders(t) });
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setColegios(data.colegios || []);
        } else {
          setColegios(prev => [...prev, ...(data.colegios || [])]);
        }
        setHasMore(data.colegios && data.colegios.length === 50);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const newSkip = skip + 50;
    setSkip(newSkip);
    if (token) fetchColegios(token, filters, newSkip, false);
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
    if (e.target.name === "provincia") { newFilters.ciudad = ""; newFilters.distrito = ""; }
    if (e.target.name === "ciudad") { newFilters.distrito = ""; }
    setFilters(newFilters);
    setSkip(0);
    if (token) fetchColegios(token, newFilters, 0, true);
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
    { name: 'Verificados', value: dbStats.verificados, color: '#10b981' },
    { name: 'Rebotados', value: dbStats.rebotados, color: '#ef4444' },
    { name: 'Faltantes', value: dbStats.sin_mail, color: '#f59e0b' },
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

        {activeTab === "db" && (
          <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-paper p-6 rounded-2xl border border-line">
                <h3 className="text-slate-500 text-xs font-semibold uppercase mb-2">Colegios Totales</h3>
                <p className="text-3xl font-bold text-ink">{dbStats.total.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-emerald/30">
                <h3 className="text-emerald text-xs font-semibold uppercase mb-2">Con Mail (Existentes)</h3>
                <p className="text-3xl font-bold text-emerald">{dbStats.con_mail.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-amber/30">
                <h3 className="text-amber-600 text-xs font-semibold uppercase mb-2">Sin Mail (Faltantes)</h3>
                <p className="text-3xl font-bold text-amber-600">{dbStats.sin_mail.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-blue-500/30">
                <h3 className="text-blue-500 text-xs font-semibold uppercase mb-2">Mails Verificados</h3>
                <p className="text-3xl font-bold text-blue-500">{dbStats.verificados.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-paper rounded-2xl border border-line overflow-hidden">
              <div className="p-5 border-b border-line bg-slate-50 flex flex-wrap gap-4 items-center">
                <span className="font-semibold text-ink w-full md:w-auto">Filtros:</span>
                <select name="estado" value={filters.estado} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none flex-1 min-w-[150px]">
                  <option value="">Todos los Estados</option>
                  <option value="con_mail">Con Mail (Existentes)</option>
                  <option value="sin_mail">Sin Mail (Faltantes)</option>
                  <option value="verificado">Verificados</option>
                  <option value="roto">Rebotados (Rotos)</option>
                </select>
                <select name="provincia" value={filters.provincia} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none flex-1 min-w-[150px]">
                  <option value="">Todas las Provincias</option>
                  {provinciasOpt.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select name="distrito" value={filters.distrito} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none flex-1 min-w-[150px]" disabled={!filters.provincia || distritosOpt.length === 0}>
                  <option value="">Todos los Distritos</option>
                  {distritosOpt.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select name="ciudad" value={filters.ciudad} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none flex-1 min-w-[150px]" disabled={!filters.provincia || ciudadesOpt.length === 0}>
                  <option value="">Todas las Ciudades</option>
                  {ciudadesOpt.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="nivel" value={filters.nivel} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none flex-1 min-w-[150px]">
                  <option value="">Todos los Niveles</option>
                  {nivelesOpt.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-400 bg-paper border-b border-line">
                      <th className="p-4 font-medium">Nombre</th>
                      <th className="p-4 font-medium">Ubicación</th>
                      <th className="p-4 font-medium">Nivel</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium min-w-[120px]">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {colegios.map((col: any) => (
                      <tr key={col.id} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-ink max-w-[200px] truncate" title={col.nombre}>{col.nombre}</td>
                        <td className="p-4 text-slate-500">{col.provincia}{col.ciudad ? ` - ${col.ciudad}` : ''}{col.distrito ? ` - ${col.distrito}` : ''}</td>
                        <td className="p-4 text-slate-500">{col.nivel}</td>
                        <td className="p-4 text-slate-500">{col.email || "Sin email"}</td>
                        <td className="p-4 min-w-[120px]">
                          {col.estado === "verificado" ? (
                            <span className="bg-emerald/10 text-emerald px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">VERIFICADO</span>
                          ) : col.estado === "roto" ? (
                            <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">REBOTADO</span>
                          ) : col.email ? (
                            <span className="bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">PENDIENTE</span>
                          ) : (
                            <span className="bg-slate-200 text-slate-500 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">FALTANTE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loading && (
                  <div className="p-8 text-center text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Cargando...</div>
                )}
                {!loading && colegios.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No se encontraron resultados.</div>
                )}
                {!loading && hasMore && colegios.length > 0 && (
                  <div className="p-4 flex justify-center border-t border-line">
                    <button onClick={loadMore} className="bg-emerald/10 text-emerald font-semibold px-6 py-2 rounded-xl hover:bg-emerald/20 transition-colors">
                      Cargar más resultados...
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                {["{{nombre_colegio}}", "{{provincia}}", "{{ciudad}}", "{{distrito}}", "{{nivel}}", "{{sector}}"].map(v => (
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
                    <Tooltip formatter={(value: any) => value ? value.toLocaleString() : ''} />
                  </PieChart>
                </ResponsiveContainer>
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
