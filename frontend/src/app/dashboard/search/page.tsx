"use client";
import { useEffect, useState } from "react";

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [colegios, setColegios] = useState<any[]>([]);
  const [filters, setFilters] = useState({ provincia: "", ciudad: "", distrito: "", nivel: "" });
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [provinciasOpt, setProvinciasOpt] = useState<string[]>([]);
  const [ciudadesOpt, setCiudadesOpt] = useState<string[]>([]);
  const [distritosOpt, setDistritosOpt] = useState<string[]>([]);
  const [nivelesOpt, setNivelesOpt] = useState<string[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchOptions = async (endpoint: string, params: string = "") => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/${endpoint}${params}`);
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  };

  useEffect(() => {
    fetchOptions("provincias").then(setProvinciasOpt);
    fetchOptions("niveles").then(setNivelesOpt);
    // Initial fetch
    fetchColegios(filters, 0, true);
  }, []);

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

  const fetchColegios = async (currentFilters: any, currentSkip: number, reset: boolean = false) => {
    try {
      setLoading(true);
      let query = `?limit=50&skip=${currentSkip}`;
      if (currentFilters.provincia) query += `&provincia=${encodeURIComponent(currentFilters.provincia)}`;
      if (currentFilters.ciudad) query += `&ciudad=${encodeURIComponent(currentFilters.ciudad)}`;
      if (currentFilters.distrito) query += `&distrito=${encodeURIComponent(currentFilters.distrito)}`;
      if (currentFilters.nivel) query += `&nivel=${encodeURIComponent(currentFilters.nivel)}`;
      
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${apiUrl}/api/admin/colegios${query}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
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

  const handleFilterChange = (e: any) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    if (e.target.name === "provincia") { newFilters.ciudad = ""; newFilters.distrito = ""; }
    if (e.target.name === "ciudad") { newFilters.distrito = ""; }
    setFilters(newFilters);
    setSkip(0);
    fetchColegios(newFilters, 0, true);
  };

  const loadMore = () => {
    const newSkip = skip + 50;
    setSkip(newSkip);
    fetchColegios(filters, newSkip, false);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink mb-2">Buscador de Colegios</h1>
        <p className="text-slate-500">Explorá nuestra base de datos nacional y prepará tu próxima campaña.</p>
      </div>

      <div className="bg-paper rounded-2xl border border-line overflow-hidden shadow-sm">
        <div className="p-5 border-b border-line bg-slate-50">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <span className="font-semibold text-ink w-full md:w-auto"><i className="fa-solid fa-filter mr-2 text-emerald"></i>Filtros:</span>
            
            <select name="provincia" value={filters.provincia} onChange={handleFilterChange} className="border border-line rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald/20 transition-all flex-1 w-full md:w-auto">
              <option value="">Todas las Provincias</option>
              {provinciasOpt.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select name="distrito" value={filters.distrito} onChange={handleFilterChange} className="border border-line rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald/20 transition-all flex-1 w-full md:w-auto" disabled={!filters.provincia || distritosOpt.length === 0}>
              <option value="">Todos los Distritos</option>
              {distritosOpt.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select name="ciudad" value={filters.ciudad} onChange={handleFilterChange} className="border border-line rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald/20 transition-all flex-1 w-full md:w-auto" disabled={!filters.provincia || ciudadesOpt.length === 0}>
              <option value="">Todas las Ciudades</option>
              {ciudadesOpt.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="nivel" value={filters.nivel} onChange={handleFilterChange} className="border border-line rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald/20 transition-all flex-1 w-full md:w-auto">
              <option value="">Todos los Niveles</option>
              {nivelesOpt.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 bg-paper border-b border-line">
                <th className="p-5 font-semibold">Institución</th>
                <th className="p-5 font-semibold">Ubicación</th>
                <th className="p-5 font-semibold">Nivel Educativo</th>
                <th className="p-5 font-semibold">Disponibilidad de Contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {colegios.map((col: any) => (
                <tr key={col.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-5">
                    <p className="font-bold text-ink max-w-[250px] truncate" title={col.nombre}>{col.nombre}</p>
                    <p className="text-xs text-slate-400 mt-1">{col.sector || 'Gestión Mixta'}</p>
                  </td>
                  <td className="p-5">
                    <p className="text-slate-700 font-medium">{col.distrito || col.ciudad || 'No especificada'}</p>
                    <p className="text-xs text-slate-400 mt-1">{col.provincia}</p>
                  </td>
                  <td className="p-5">
                    <span className="bg-navy/5 text-navy px-3 py-1 rounded-lg text-xs font-semibold">
                      {col.nivel || 'Multinivel'}
                    </span>
                  </td>
                  <td className="p-5">
                    {col.estado === "verificado" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald"></div>
                        <span className="text-emerald font-semibold">Email Verificado</span>
                      </div>
                    ) : col.estado === "roto" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-red-500 font-semibold">Email Inválido</span>
                      </div>
                    ) : col.email ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-blue-500 font-semibold">Email Disponible</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-amber-600 font-semibold">Email Faltante</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
            <div className="p-12 text-center text-slate-500">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-emerald mb-4"></i>
              <p className="font-medium">Buscando instituciones...</p>
            </div>
          )}
          
          {!loading && colegios.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-magnifying-glass text-slate-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-ink mb-1">No hay resultados</h3>
              <p className="text-slate-500">Intentá modificar los filtros de búsqueda.</p>
            </div>
          )}
          
          {!loading && hasMore && colegios.length > 0 && (
            <div className="p-6 flex justify-center border-t border-line bg-slate-50">
              <button 
                onClick={loadMore} 
                className="bg-white border border-line text-ink font-bold px-8 py-2.5 rounded-xl hover:border-emerald hover:text-emerald transition-all shadow-sm"
              >
                Cargar más colegios
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
