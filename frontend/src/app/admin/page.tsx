"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("db");
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [picture, setPicture] = useState<string | null>(null);

  const [colegios, setColegios] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState({ total: 0, con_mail: 0, sin_mail: 0, verificados: 0, rebotados: 0 });
  const [filters, setFilters] = useState({ estado: "", provincia: "", ciudad: "", distrito: "", nivel: "", q: "" });
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

  const [fuentes, setFuentes] = useState<any[]>([]);
  const [newFuente, setNewFuente] = useState("");
  const [huntStats, setHuntStats] = useState<any[]>([]);
  const [hunting, setHunting] = useState(false);
  const [extraColumns, setExtraColumns] = useState<string[]>([]);
  const [visibleExtraColumns, setVisibleExtraColumns] = useState<string[]>([]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  
  const rawUrl = '/backend';
  const apiUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

  const fetchOptions = async (endpoint: string, params: string = "") => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/${endpoint}${params}`, { credentials: "include" });
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  };

  useEffect(() => {
    fetch(`${apiUrl}/auth/me`, { credentials: "include", cache: "no-store" })
      .then(res => {
        if (!res.ok) throw new Error("No auth");
        return res.json();
      })
      .then(data => {
        if (!data.is_admin) {
          alert("Acceso denegado. Serás redirigido al inicio.");
          router.push("/dashboard");
          return;
        }
        setEmail(data.email);
        setPicture(data.foto_perfil || null);
        setToken("cookie"); // Simulamos el token para desbloquear la UI
      })
      .catch(() => {
        router.push("/");
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/backend/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    window.location.href = "/";
  };

  useEffect(() => {
    if (token) {
      fetchDbStats();
      fetchColegios(filters, 0, true);
      fetchTemplate();
      fetchSystemStats();
      fetchOptions("provincias").then(setProvinciasOpt);
      fetchOptions("niveles").then(setNivelesOpt);
      fetchFuentes();
      fetchHuntStats();
    }
  }, [token]);

  const fetchFuentes = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/fuentes`, { headers: getHeaders(), credentials: "include" });
      if (res.ok) setFuentes(await res.json());
    } catch(e) {}
  };

  const fetchHuntStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/hunt/stats`, { headers: getHeaders(), credentials: "include" });
      if (res.ok) setHuntStats(await res.json());
    } catch(e) {}
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

  const getHeaders = () => ({
    "Content-Type": "application/json"
  });

  const fetchDbStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: getHeaders(), credentials: "include" });
      if (res.ok) setDbStats(await res.json());
    } catch (e) {}
  };

  const fetchColegios = async (currentFilters: any, currentSkip: number, reset: boolean = false) => {
    try {
      setLoading(true);
      let query = `?limit=50&skip=${currentSkip}&admin_view=true`;
      if (currentFilters.q) query += `&q=${encodeURIComponent(currentFilters.q)}`;
      if (currentFilters.estado) query += `&estado=${encodeURIComponent(currentFilters.estado)}`;
      if (currentFilters.provincia) query += `&provincia=${encodeURIComponent(currentFilters.provincia)}`;
      if (currentFilters.ciudad) query += `&ciudad=${encodeURIComponent(currentFilters.ciudad)}`;
      if (currentFilters.distrito) query += `&distrito=${encodeURIComponent(currentFilters.distrito)}`;
      if (currentFilters.nivel) query += `&nivel=${encodeURIComponent(currentFilters.nivel)}`;
      
      const res = await fetch(`${apiUrl}/api/admin/colegios${query}`, { headers: getHeaders(), credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setColegios(data.colegios || []);
        } else {
          setColegios(prev => [...prev, ...(data.colegios || [])]);
        }
        setHasMore(data.colegios && data.colegios.length === 50);
        
        // Parse extra columns
        if (data.colegios) {
          const allExtras = new Set<string>();
          data.colegios.forEach((c: any) => {
            if (c.datos_extra) {
              try {
                const parsed = JSON.parse(c.datos_extra);
                c.parsed_extra = parsed;
                Object.keys(parsed).forEach(k => allExtras.add(k));
              } catch(e) {}
            }
          });
          const extrasArr = Array.from(allExtras);
          setExtraColumns(extrasArr);
        }

      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const newSkip = skip + 50;
    setSkip(newSkip);
    if (token) fetchColegios(filters, newSkip, false);
  };

  const toggleExtraColumn = (col: string) => {
    if (visibleExtraColumns.includes(col)) {
      setVisibleExtraColumns(visibleExtraColumns.filter(c => c !== col));
    } else {
      setVisibleExtraColumns([...visibleExtraColumns, col]);
    }
  };

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/template`, { headers: getHeaders(), credentials: "include" });
      if (res.ok) setTemplate(await res.json());
    } catch (e) {}
  };

  const fetchSystemStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/system_stats`, { headers: getHeaders(), credentials: "include" });
      if (res.ok) setSysStats(await res.json());
    } catch (e) {}
  };

  const handleFilterChange = (e: any) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    if (e.target.name === "provincia") { newFilters.ciudad = ""; newFilters.distrito = ""; }
    if (e.target.name === "ciudad") { newFilters.distrito = ""; }
    setFilters(newFilters);
    setSkip(0);
    if (token) fetchColegios(newFilters, 0, true);
  };

  const handleSaveTemplate = async () => {
    if (!token) return;
    setSavingTemplate(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/template`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
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

  const handleEditEmail = async (col: any) => {
    const newEmail = prompt(`Editar email para ${col.nombre}:`, col.email || "");
    if (newEmail !== null && newEmail !== col.email) {
      try {
        const res = await fetch(`${apiUrl}/api/admin/colegios/${col.id}`, {
          method: "PUT",
          headers: getHeaders(),
          credentials: "include",
          body: JSON.stringify({ email: newEmail.trim() })
        });
        if (res.ok) {
          fetchColegios(filters, 0, true);
        } else {
          alert("Error al actualizar email");
        }
      } catch(e) { alert("Error de red"); }
    }
  };

  const handleAddFuente = async () => {
    if (!newFuente.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/fuentes`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({ url: newFuente.trim() })
      });
      if (res.ok) {
        setNewFuente("");
        fetchFuentes();
      } else {
        alert("Error al agregar fuente");
      }
    } catch(e) {}
  };

  const handleDeleteFuente = async (id: number) => {
    if (!confirm("¿Eliminar fuente?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/fuentes/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) fetchFuentes();
    } catch(e) {}
  };

  const handleStartHunt = async () => {
    if (!confirm("¿Iniciar Cazador Web para buscar correos faltantes/rebotados? Esto correrá en segundo plano.")) return;
    setHunting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/hunt/start`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        alert("Cazador Web iniciado en segundo plano.");
        fetchHuntStats();
      } else {
        alert("Error al iniciar cazador");
      }
    } catch(e) {}
    setHunting(false);
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-slate-500">Solo visible para Master Admin ({email || "Admin"})</p>
            </div>
            
            {/* User Dropdown */}
            <div className="relative z-50">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-white border border-line hover:bg-slate-50 rounded-xl p-1.5 pr-4 transition-all cursor-pointer"
              >
                {picture ? (
                  <img src={picture} alt="Profile" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald/10 text-emerald flex items-center justify-center">
                    <i className="fa-solid fa-user"></i>
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-ink leading-tight">{email?.split("@")[0]}</span>
                  <span className="text-xs text-slate-400 leading-tight">Admin <i className="fa-solid fa-chevron-down ml-1 text-[10px]"></i></span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-line py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-line mb-2">
                    <p className="text-sm font-bold text-ink truncate">{email}</p>
                    <p className="text-xs text-slate-500">Master Admin</p>
                  </div>
                  <button 
                    onClick={() => { window.location.href = "/dashboard"; }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald transition-colors"
                  >
                    <i className="fa-solid fa-house w-5 text-center mr-1"></i> Ir al Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center mr-1"></i> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button onClick={() => setActiveTab("db")} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${activeTab === "db" ? "bg-emerald text-white" : "bg-paper border border-line hover:bg-slate-50"}`}>
              <i className="fa-solid fa-database mr-2"></i> Base de Datos
            </button>
            <button onClick={() => setActiveTab("template")} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${activeTab === "template" ? "bg-emerald text-white" : "bg-paper border border-line hover:bg-slate-50"}`}>
              <i className="fa-solid fa-envelope-open-text mr-2"></i> Plantilla Global
            </button>
            <button onClick={() => setActiveTab("cazador")} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${activeTab === "cazador" ? "bg-emerald text-white" : "bg-paper border border-line hover:bg-slate-50"}`}>
              <i className="fa-solid fa-spider mr-2"></i> Cazador Web
            </button>
            <button onClick={() => setActiveTab("stats")} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${activeTab === "stats" ? "bg-emerald text-white" : "bg-paper border border-line hover:bg-slate-50"}`}>
              <i className="fa-solid fa-chart-line mr-2"></i> Estadísticas
            </button>
          </div>
        </header>

        {activeTab === "db" && (
          <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-paper p-6 rounded-2xl border border-line">
                <h3 className="text-slate-500 text-xs font-semibold uppercase mb-2">Colegios Totales</h3>
                <p className="text-3xl font-bold text-ink">{dbStats.total.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-blue-500/30">
                <h3 className="text-blue-500 text-xs font-semibold uppercase mb-2">Con Mail (Existentes)</h3>
                <p className="text-3xl font-bold text-blue-500">{dbStats.con_mail.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-amber/30">
                <h3 className="text-amber-600 text-xs font-semibold uppercase mb-2">Sin Mail (Faltantes)</h3>
                <p className="text-3xl font-bold text-amber-600">{dbStats.sin_mail.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-emerald/30">
                <h3 className="text-emerald text-xs font-semibold uppercase mb-2">Mails Verificados</h3>
                <p className="text-3xl font-bold text-emerald">{dbStats.verificados.toLocaleString()}</p>
              </div>
              <div className="bg-paper p-6 rounded-2xl border border-red-500/30">
                <h3 className="text-red-500 text-xs font-semibold uppercase mb-2">Mails Rebotados</h3>
                <p className="text-3xl font-bold text-red-500">{dbStats.rebotados.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-paper rounded-2xl border border-line overflow-hidden">
              <div className="p-5 border-b border-line bg-slate-50 flex flex-col gap-4">
                <div className="w-full">
                  <input
                    type="text"
                    name="q"
                    value={filters.q}
                    onChange={handleFilterChange}
                    placeholder="Buscar colegio por nombre (ej. Sarmiento)..."
                    className="w-full border border-line rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all placeholder-slate-400"
                  />
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="font-semibold text-ink w-full md:w-auto">Filtros:</span>
                  <select name="estado" value={filters.estado} onChange={handleFilterChange} className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none flex-1 min-w-[150px]">
                    <option value="">Todos los Estados</option>
                    <option value="con_mail">Con Mail (Existentes)</option>
                    <option value="sin_mail">Sin Mail (Faltantes)</option>
                    <option value="sano">Verificados</option>
                    <option value="rebotado">Rebotados</option>
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
              <div className="flex justify-end pt-2 relative">
                  <button onClick={() => setShowColumnDropdown(!showColumnDropdown)} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-ink whitespace-nowrap">
                    <i className="fa-solid fa-table-columns mr-2"></i> Columnas Extra ({visibleExtraColumns.length})
                  </button>
                  {showColumnDropdown && (
                    <div className="absolute right-0 top-12 bg-white border border-line rounded-xl shadow-xl z-50 p-4 max-h-[400px] overflow-y-auto w-64 text-left">
                      <h4 className="font-bold text-ink mb-2 text-sm border-b pb-2">Mostrar Columnas</h4>
                      {extraColumns.map(col => (
                        <label key={col} className="flex items-center gap-2 py-1.5 hover:bg-slate-50 px-2 rounded cursor-pointer">
                          <input type="checkbox" checked={visibleExtraColumns.includes(col)} onChange={() => toggleExtraColumn(col)} className="text-emerald focus:ring-emerald rounded border-slate-300" />
                          <span className="text-sm text-slate-700 truncate" title={col}>{col}</span>
                        </label>
                      ))}
                      {extraColumns.length === 0 && <p className="text-xs text-slate-500">No hay datos extra cargados.</p>}
                    </div>
                  )}
              </div>
            </div>
            
            <div className="overflow-x-auto relative">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-400 bg-paper border-b border-line">
                      <th className="p-4 font-medium">Nombre</th>
                      <th className="p-4 font-medium">Ubicación</th>
                      <th className="p-4 font-medium">Nivel</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium min-w-[120px]">Estado</th>
                      {visibleExtraColumns.map(col => (
                        <th key={col} className="p-4 font-medium text-ink">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {colegios.map((col: any) => (
                      <tr key={col.id} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-ink min-w-[200px]" title={col.nombre}>
                          {col.nombre}
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {col.tiene_jardin && <span className="text-[9px] bg-pink-100 text-pink-600 px-1 rounded border border-pink-200">JARDIN</span>}
                            {col.tiene_primaria && <span className="text-[9px] bg-orange-100 text-orange-600 px-1 rounded border border-orange-200">PRIMARIA</span>}
                            {col.tiene_secundaria && <span className="text-[9px] bg-blue-100 text-blue-600 px-1 rounded border border-blue-200">SECUNDARIA</span>}
                            {col.es_tecnica && <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1 rounded border border-indigo-200">TECNICA</span>}
                            {col.es_especial && <span className="text-[9px] bg-purple-100 text-purple-600 px-1 rounded border border-purple-200">ESPECIAL</span>}
                          </div>
                        </td>
                        <td className="p-4 text-slate-500">{col.provincia}{col.ciudad ? ` - ${col.ciudad}` : ''}{col.distrito ? ` - ${col.distrito}` : ''}</td>
                        <td className="p-4 text-slate-500">
                          <div>{col.nivel}</div>
                          {col.cue && <div className="text-xs text-slate-400 mt-1">CUE: {col.cue}</div>}
                        </td>
                        <td className="p-4 text-slate-500">
                          <div className="flex items-center gap-2">
                            <span>{col.email || "Sin email"}</span>
                            <button onClick={() => handleEditEmail(col)} className="text-emerald hover:text-emeralddeep" title="Editar Email">
                              <i className="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                          </div>
                        </td>
                        <td className="p-4 min-w-[120px] flex flex-col items-start gap-1">
                          {col.estado === "verificado" || (col.estado === "sano" && col.email && col.email.includes("@")) ? (
                            <span className="bg-emerald/10 text-emerald px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">VERIFICADO</span>
                          ) : col.estado === "rebotado" ? (
                            <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">REBOTADO</span>
                          ) : col.email && col.email.includes("@") ? (
                            <span className="bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">EXISTENTE</span>
                          ) : (
                            <span className="bg-amber/10 text-amber-600 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">FALTANTE</span>
                          )}
                          {col.editado_manualmente && (
                            <span className="bg-purple-100 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide">MANUAL</span>
                          )}
                        </td>
                        {visibleExtraColumns.map(extraCol => (
                          <td key={extraCol} className="p-4 text-slate-500 text-xs whitespace-nowrap">
                            {col.parsed_extra?.[extraCol] || "-"}
                          </td>
                        ))}
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

        {activeTab === "cazador" && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center bg-paper p-6 rounded-2xl border border-line">
              <div>
                <h2 className="text-xl font-bold text-ink mb-1"><i className="fa-solid fa-spider mr-2 text-emerald"></i> Cazador Web</h2>
                <p className="text-sm text-slate-500">Busca automáticamente correos de colegios faltantes o rebotados en internet.</p>
              </div>
              <button 
                onClick={handleStartHunt}
                disabled={hunting}
                className="bg-emerald text-white px-6 py-3 rounded-xl font-bold hover:bg-emeralddeep transition-all shadow-lg shadow-emerald/20 disabled:opacity-50"
              >
                {hunting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Iniciando...</> : <><i className="fa-solid fa-play mr-2"></i>Iniciar Cacería Ahora</>}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-paper p-6 rounded-2xl border border-line">
                <h3 className="font-bold text-ink mb-4">Directorios de Confianza (Fuentes)</h3>
                <p className="text-sm text-slate-500 mb-4">El bot buscará primero en estas páginas web. Agrega las URLs sin https://</p>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newFuente}
                    onChange={(e) => setNewFuente(e.target.value)}
                    placeholder="ej: paginasamarillas.com.ar" 
                    className="flex-1 border border-line rounded-lg px-4 py-2 focus:outline-none focus:border-emerald"
                  />
                  <button onClick={handleAddFuente} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-ink">Agregar</button>
                </div>
                <div className="max-h-60 overflow-y-auto border border-line rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="p-3 font-medium text-slate-500">URL</th>
                        <th className="p-3 font-medium text-slate-500 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {fuentes.map(f => (
                        <tr key={f.id}>
                          <td className="p-3 font-medium text-ink">{f.url}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleDeleteFuente(f.id)} className="text-red-500 hover:text-red-700">
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {fuentes.length === 0 && (
                        <tr><td colSpan={2} className="p-4 text-center text-slate-500">No hay fuentes configuradas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-paper p-6 rounded-2xl border border-line">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-ink">Historial de Cacerías</h3>
                  <button onClick={fetchHuntStats} className="text-slate-400 hover:text-emerald"><i className="fa-solid fa-rotate-right"></i></button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {huntStats.map((stat, i) => (
                    <div key={i} className="border border-line rounded-xl p-4 bg-slate-50 flex flex-col gap-2 relative">
                      <div className="flex justify-between items-start">
                        <div className="text-xs text-slate-400 font-mono">
                          {new Date(stat.fecha_inicio).toLocaleString()}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.estado === 'completado' ? 'bg-emerald/10 text-emerald' : stat.estado === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {stat.estado.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-6 mt-1">
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Procesados</p>
                          <p className="text-xl font-bold text-ink">{stat.rebotados_procesados}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Nuevos Mails</p>
                          <p className="text-xl font-bold text-emerald">{stat.nuevos_encontrados}</p>
                        </div>
                      </div>
                      {stat.error_msg && <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">{stat.error_msg}</p>}
                    </div>
                  ))}
                  {huntStats.length === 0 && (
                    <div className="text-center p-8 text-slate-500">No hay historial de cacerías.</div>
                  )}
                </div>
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

