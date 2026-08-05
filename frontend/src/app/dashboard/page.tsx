"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    mails_enviados: 0,
    mails_exitosos: 0,
    colegios_base: 0,
    envios_restantes: 10
  });

  useEffect(() => {
    fetch(`/backend/api/dashboard/stats`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => setStats(data))
      .catch(() => {});
  }, []);
  return (
    <>
      <div id="info-banner" className="flex items-start gap-4 bg-navy/5 border border-navy/15 rounded-2xl p-5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-robot text-navy"></i>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-ink text-sm">Nuestros servidores trabajan por vos</p>
          <p className="text-slate-500 text-sm mt-0.5">Los envíos se realizan de fondo con pausas de 20 a 45 segundos para proteger tu cuenta de Spam. Podés cerrar el navegador y los mails seguirán saliendo.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-paper rounded-2xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mails Enviados</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <i className="fa-solid fa-envelope text-blue-500 text-sm"></i>
            </div>
          </div>
          <p className="text-3xl font-bold text-ink">{stats.mails_enviados}</p>
        </div>
        
        <div className="bg-paper rounded-2xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mails Exitosos</span>
            <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-emerald text-sm"></i>
            </div>
          </div>
          <p className="text-3xl font-bold text-ink">{stats.mails_exitosos}</p>
        </div>

        <div className="bg-paper rounded-2xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Colegios en Base</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <i className="fa-solid fa-school text-purple-500 text-sm"></i>
            </div>
          </div>
          <p className="text-3xl font-bold text-ink">{(stats.colegios_base || 0).toLocaleString()}</p>
        </div>

        <div className="bg-paper rounded-2xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Envíos Restantes</span>
            <div className="w-9 h-9 rounded-xl bg-amber/10 flex items-center justify-center">
              <i className="fa-solid fa-bolt text-amber text-sm"></i>
            </div>
          </div>
          <p className="text-3xl font-bold text-ink">{stats.envios_restantes}</p>
        </div>
      </div>

      <div className="bg-paper rounded-2xl border border-line p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ink">Postulaciones recientes</h2>
        </div>
        <div className="text-center py-12 text-slate-400">
          <i className="fa-solid fa-inbox text-4xl mb-4 opacity-50"></i>
          <p>Aún no realizaste ninguna postulación.</p>
          
          <div className="max-w-md mx-auto mt-8 bg-slate-50 p-4 rounded-xl border border-line text-left">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 text-emerald rounded border-slate-300 focus:ring-emerald" />
              <span className="text-xs text-slate-600">
                Declaro bajo juramento que los documentos adjuntos a mi campaña contienen 
                exclusivamente mis propios datos profesionales, no suplantan la identidad de terceros 
                y acepto los <a href="/terminos" className="text-navy hover:underline">Términos y condiciones</a>.
              </span>
            </label>
          </div>

          <button className="mt-6 bg-emerald text-white px-6 py-2 rounded-xl font-medium hover:bg-emeralddeep transition-colors">
            Crear nueva campaña
          </button>
        </div>
      </div>
    </>
  );
}

