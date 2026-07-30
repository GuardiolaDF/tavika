"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [picture, setPicture] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("pro"); // default to prevent flicker if pro
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userEmail = params.get("email");
    const userPicture = params.get("picture");
    
    if (token && userEmail) {
      localStorage.setItem("token", token);
      localStorage.setItem("email", userEmail);
      if (userPicture) localStorage.setItem("picture", decodeURIComponent(userPicture));
      // Limpiar la URL para que no quede el token expuesto
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    const adminEmail = "tavika.app@gmail.com";
    if (localStorage.getItem("email") === adminEmail && window.location.pathname === "/dashboard") {
      window.location.href = "/admin";
      return;
    }

    setEmail(localStorage.getItem("email"));
    setPicture(localStorage.getItem("picture"));
    setPlan(localStorage.getItem("plan") || "freemium");
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="bg-surface text-slate-800 flex min-h-screen">
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-ink/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside className={`w-64 min-h-screen bg-ink flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white tracking-tight block">Távika<span className="text-emerald">Pro</span></a>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          <a href="/dashboard" className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${pathname === '/dashboard' ? 'bg-emerald/12 text-emerald font-semibold active' : 'text-slate-400 hover:bg-emerald/10 hover:text-emerald'}`}>
            <i className="fa-solid fa-house w-5 text-center"></i> Inicio
          </a>
          <a href="/dashboard/search" className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${pathname.startsWith('/dashboard/search') ? 'bg-emerald/12 text-emerald font-semibold active' : 'text-slate-400 hover:bg-emerald/10 hover:text-emerald'}`}>
            <i className="fa-solid fa-magnifying-glass w-5 text-center"></i> Buscar Colegios
          </a>
          <a href="/dashboard/campaigns" className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${pathname.startsWith('/dashboard/campaigns') ? 'bg-emerald/12 text-emerald font-semibold active' : 'text-slate-400 hover:bg-emerald/10 hover:text-emerald'}`}>
            <i className="fa-solid fa-paper-plane w-5 text-center"></i> Mis Campañas
          </a>
          <a href="/dashboard/profile" className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${pathname.startsWith('/dashboard/profile') ? 'bg-emerald/12 text-emerald font-semibold active' : 'text-slate-400 hover:bg-emerald/10 hover:text-emerald'}`}>
            <i className="fa-solid fa-address-card w-5 text-center"></i> Mis Datos
          </a>
          {mounted && plan !== "pro" && (
            <div className="mt-auto px-4 pb-6">
              <button 
                onClick={async () => {
                  try {
                    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    const apiUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
                    const res = await fetch(`${apiUrl}/api/payments/create_preference`, { 
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
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
          )}
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header className="bg-paper border-b border-line px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-ink text-xl" onClick={() => setMobileMenuOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <div>
              <h1 className="text-lg font-bold text-ink">Bienvenido 👋</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Dashboard Principal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {email ? (
              <div className="flex items-center gap-4 relative">
                {email === "tavika.app@gmail.com" && (
                  <a href="/admin" className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <i className="fa-solid fa-lock"></i> Panel Admin
                  </a>
                )}
                
                {/* User Dropdown */}
                <div className="relative">
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
                      <span className="text-sm font-bold text-ink leading-tight">{email.split("@")[0]}</span>
                      <span className="text-xs text-slate-400 leading-tight">Ver Perfil <i className="fa-solid fa-chevron-down ml-1 text-[10px]"></i></span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-line py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-line mb-2">
                        <p className="text-sm font-bold text-ink truncate">{email}</p>
                        <p className="text-xs text-slate-500">{email === "tavika.app@gmail.com" ? "Master Admin" : `Plan ${plan === "pro" ? "Pro" : "Freemium"}`}</p>
                      </div>
                      <a href="#" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald transition-colors">
                        <i className="fa-solid fa-gear w-5 text-center mr-1"></i> Configuración
                      </a>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center mr-1"></i> Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`} className="flex items-center gap-2 bg-amber/10 border border-amber/30 text-amber-700 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer hover:bg-amber/15 transition-colors">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Gmail no vinculado</span>
                <span className="underline text-xs">Vincular ahora</span>
              </a>
            )}
            {mounted && plan === "pro" ? (
              <div className="bg-emerald/10 border border-emerald/20 rounded-xl px-2 md:px-4 py-2 text-sm hidden sm:block">
                <span className="text-emerald font-bold"><i className="fa-solid fa-crown mr-1"></i> PRO</span>
              </div>
            ) : mounted && email !== "tavika.app@gmail.com" ? (
              <div className="bg-navy/5 border border-navy/15 rounded-xl px-2 md:px-4 py-2 text-sm hidden sm:block">
                <span className="text-slate-500 hidden md:inline">Plan:</span>
                <span className="font-semibold text-ink ml-1">Freemium</span>
              </div>
            ) : null}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 space-y-8 w-full max-w-full overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
