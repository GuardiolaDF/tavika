"use client";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userEmail = params.get("email");
    
    if (token && userEmail) {
      localStorage.setItem("token", token);
      localStorage.setItem("email", userEmail);
      // Limpiar la URL para que no quede el token expuesto
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    setEmail(localStorage.getItem("email"));
  }, []);

  return (
    <div className="bg-surface text-slate-800 flex min-h-screen">
      {/* SIDEBAR */}
      <aside className="w-64 min-h-screen bg-ink flex flex-col fixed left-0 top-0 z-40">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-xl font-bold text-white tracking-tight">Távika<span className="text-emerald">Pro</span></span>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          <a href="/dashboard" className="sidebar-link active flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-emerald/12 text-emerald font-semibold">
            <i className="fa-solid fa-house w-5 text-center"></i> Inicio
          </a>
          <a href="#" className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-emerald/10 hover:text-emerald transition-colors">
            <i className="fa-solid fa-magnifying-glass w-5 text-center"></i> Buscar Colegios
          </a>
          <a href="#" className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-emerald/10 hover:text-emerald transition-colors">
            <i className="fa-solid fa-paper-plane w-5 text-center"></i> Mis Postulaciones
            <span className="ml-auto bg-emerald text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
          </a>
          <div className="mt-auto px-4 pb-6">
            <button 
              onClick={async () => {
                try {
                  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  const apiUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
                  const res = await fetch(`${apiUrl}/api/payments/create_preference`, { method: 'POST' });
                  const data = await res.json();
                  if (data.init_point) {
                    window.location.href = data.init_point;
                  } else {
                    console.error("MP Error:", data);
                    alert("Error de MercadoPago: " + (data.error || "Revisa la consola"));
                  }
                } catch (error) {
                  console.error("Error creating payment:", error);
                  alert("Error de red al conectar con el backend");
                }
              }}
              className="w-full bg-emerald text-white rounded-xl py-3 font-semibold hover:bg-emeralddeep transition-colors"
            >
              <i className="fa-solid fa-bolt w-5 text-center"></i> Comprar Pase
            </button>
          </div>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header className="bg-paper border-b border-line px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold text-ink">Bienvenido 👋</h1>
            <p className="text-xs text-slate-400">Dashboard Principal</p>
          </div>
          <div className="flex items-center gap-4">
            {email ? (
              <div className="flex items-center gap-4">
                {email === "tavika.app@gmail.com" && (
                  <a href="/admin" className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <i className="fa-solid fa-lock"></i> Panel Admin
                  </a>
                )}
                <div className="flex items-center gap-2 bg-slate-100 border border-line text-slate-700 rounded-xl px-4 py-2 text-sm font-medium">
                  <i className="fa-brands fa-google text-slate-400"></i>
                  <span>{email}</span>
                </div>
              </div>
            ) : (
              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`} className="flex items-center gap-2 bg-amber/10 border border-amber/30 text-amber-700 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer hover:bg-amber/15 transition-colors">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Gmail no vinculado</span>
                <span className="underline text-xs">Vincular ahora</span>
              </a>
            )}
            <div className="bg-navy/5 border border-navy/15 rounded-xl px-4 py-2 text-sm">
              <span className="text-slate-500">Plan:</span>
              <span className="font-semibold text-ink ml-1">Freemium</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 px-8 py-8 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
