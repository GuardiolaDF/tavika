"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      const token = localStorage.getItem('token');
      fetch(`${apiUrl}/api/campaigns/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setCampaigns(data.campanas || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink mb-2">Mis Campañas</h1>
          <p className="text-slate-500">Monitoreá el progreso de tus postulaciones en tiempo real.</p>
        </div>
        <Link href="/dashboard/campaigns/new" className="bg-emerald text-white px-6 py-3 rounded-xl font-bold hover:bg-emeralddeep transition-all shadow-lg shadow-emerald/20 flex items-center">
          <i className="fa-solid fa-plus mr-2"></i> Nueva Campaña
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <i className="fa-solid fa-spinner fa-spin text-3xl mb-4 text-emerald"></i>
          <p>Cargando campañas...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-paper rounded-2xl border border-line p-12 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-emerald/10 text-emerald rounded-full flex items-center justify-center text-3xl mb-4">
            <i className="fa-solid fa-paper-plane"></i>
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">Aún no lanzaste ninguna campaña</h3>
          <p className="text-slate-500 mb-6 max-w-sm">Creá tu primera campaña seleccionando escuelas y adjuntando tu currículum.</p>
          <Link href="/dashboard/campaigns/new" className="bg-emerald text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emeralddeep transition-all">
            Empezar ahora
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map(camp => {
            const progreso = camp.total > 0 ? Math.round(((camp.enviados + camp.rebotados) / camp.total) * 100) : 0;
            const statusColor = camp.estado === "completado" ? "text-blue-500 bg-blue-50" : camp.estado === "en_progreso" ? "text-emerald bg-emerald/10" : "text-amber-600 bg-amber-50";
            
            return (
              <div key={camp.id} className="bg-paper rounded-2xl border border-line p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-ink">{camp.nombre}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${statusColor}`}>
                        {camp.estado.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Creada el {new Date(camp.fecha_creacion).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Colegios</p>
                      <p className="text-xl font-bold text-ink">{camp.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Enviados</p>
                      <p className="text-xl font-bold text-emerald">{camp.enviados}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Rebotados</p>
                      <p className="text-xl font-bold text-red-500">{camp.rebotados}</p>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar Animada */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-emerald">
                        Progreso del envío
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-emerald">
                        {progreso}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100">
                    <div style={{ width: `${progreso}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald transition-all duration-1000 ease-out"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
