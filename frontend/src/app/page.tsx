"use client";

import Link from 'next/link';
import { useState } from "react";

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto bg-ink/95 backdrop-blur-md rounded-full px-6 py-3 flex items-center justify-between shadow-lg shadow-black/10 border border-white/10">
          <div className="flex items-center space-x-8">
            <Link href="#" className="text-xl font-bold tracking-tight text-white">
              Távika
            </Link>
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="#features" className="nav-link-underline relative text-sm font-medium text-white/70 hover:text-white px-3 py-2 transition-colors">
                Características
              </Link>
              <Link href="#how" className="nav-link-underline relative text-sm font-medium text-white/70 hover:text-white px-3 py-2 transition-colors">
                Cómo funciona
              </Link>
              <Link href="#pricing" className="active-link-bg text-sm font-medium">
                Precios
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`} className="hidden sm:inline-block text-sm font-medium text-white/70 hover:text-white px-3 py-2 transition-colors">
              Iniciar Sesión
            </a>
            <Link href="#pricing" className="bg-emerald hover:bg-emeralddeep text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 shadow-md shadow-emerald/20">
              Probar Gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen pt-32 pb-20 overflow-hidden hero-gradient">
          <div className="absolute inset-0 dot-grid"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center space-x-2 bg-emerald/10 border border-emerald/20 rounded-full px-4 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
                  <span className="text-xs font-semibold text-emerald uppercase tracking-wider">La base de datos más actualizada del país</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                  Consigue horas docentes sin el estrés de buscar correos
                </h1>
                <p className="text-xl text-slate-300 max-w-lg leading-relaxed">
                  Conectamos tu Gmail con más de 3.000 colegios verificados. Postúlate de forma masiva, inteligente y segura en minutos.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="#pricing" className="bg-emerald hover:bg-emeralddeep text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-emerald/20 flex items-center group">
                    Probar Gratis
                    <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </Link>
                  <Link href="#pricing" className="border border-white/20 text-white text-lg font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-300">
                    Ver Planes
                  </Link>
                </div>
                <p className="text-sm text-slate-400">Sin tarjeta de crédito · Cancela cuando quieras</p>
              </div>

              {/* Stats mockup */}
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald/20 blur-3xl rounded-full opacity-30"></div>
                <div className="relative bg-ink border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs text-slate-400">Panel de envío en vivo</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface/5 rounded-xl border border-white/5">
                      <span className="text-slate-300">Mails enviados</span>
                      <span className="text-2xl font-bold text-white">847</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface/5 rounded-xl border border-white/5">
                      <span className="text-slate-300">Tasa de entrega</span>
                      <span className="text-2xl font-bold text-emerald">98.2%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface/5 rounded-xl border border-white/5">
                      <span className="text-slate-300">Distritos cubiertos</span>
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <div className="pt-2">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald w-[72%] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee Section */}
        <section className="py-12 border-b border-line bg-paper overflow-hidden">
          <div className="overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-scroll">
              <span className="text-4xl font-light text-ink/10 mr-12">Consigue horas docentes</span>
              <span className="text-4xl font-light text-ink/10 mr-12">Consigue horas docentes</span>
              <span className="text-4xl font-light text-ink/10 mr-12">Consigue horas docentes</span>
              <span className="text-4xl font-light text-ink/10 mr-12">Consigue horas docentes</span>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-8 flex justify-center">
            <div className="w-24 h-1 bg-emerald rounded-full"></div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-paper">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-emerald font-semibold uppercase tracking-wider text-sm">Por qué Távika?</span>
              <h2 className="text-4xl md:text-5xl font-bold text-ink mt-4">Todo lo que necesitás para postularte sin perder el tiempo</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-2xl border border-line hover:border-emerald/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-3">
                  <i className="fa-solid fa-shield-heart text-emerald text-xl"></i>
                  <h3 className="text-xl font-bold text-ink">Base de Datos Curada</h3>
                </div>
                <p className="text-slate-600">Más de 3.000 direcciones verificadas de colegios de Buenos Aires, Córdoba y Mendoza. Actualizada semanalmente.</p>
              </div>
              <div className="group p-8 rounded-2xl border border-line hover:border-emerald/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-3">
                  <i className="fa-solid fa-bolt text-blue-600 text-xl"></i>
                  <h3 className="text-xl font-bold text-ink">Envío Inteligente y Seguro</h3>
                </div>
                <p className="text-slate-600">Espaciamiento orgánico entre envíos para proteger tu reputación como remitente y evitar spam.</p>
              </div>
              <div className="group p-8 rounded-2xl border border-line hover:border-emerald/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-3">
                  <i className="fa-solid fa-filter text-purple-600 text-xl"></i>
                  <h3 className="text-xl font-bold text-ink">Filtros por Distrito y Nivel</h3>
                </div>
                <p className="text-slate-600">Seleccioná exactamente dónde querés trabajar: primaria, secundaria o terciario, por barrio o localidad.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-ink">En 3 pasos, ya estás postulado</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-line border-t-2 border-dashed border-navy/20"></div>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-navy text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto relative z-10">1</div>
                <h3 className="text-xl font-bold text-ink">Vinculá tu Gmail</h3>
                <p className="text-slate-600">Conectamos tu cuenta de forma segura vía OAuth. Nunca pedimos tu contraseña.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-navy text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto relative z-10">2</div>
                <h3 className="text-xl font-bold text-ink">Seleccioná los colegios</h3>
                <p className="text-slate-600">Filtrá por distrito, nivel educativo y tipo de institución. Vos decidís a quién escribir.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-navy text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto relative z-10">3</div>
                <h3 className="text-xl font-bold text-ink">Enviamos por vos</h3>
                <p className="text-slate-600">Nuestro motor envía tus cartas con espaciamiento humano. Solo esperá las respuestas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-paper">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-ink">Precios simples, sin sorpresas</h2>
              <p className="text-xl text-slate-600 mt-4">Sin renovación automática. Pagás solo cuando querés.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-8 rounded-2xl border border-line bg-surface flex flex-col">
                <h3 className="text-2xl font-bold text-ink">Prueba Gratuita</h3>
                <div className="my-6">
                  <span className="text-5xl font-bold text-ink">$0</span>
                  <span className="text-slate-500">/gratis</span>
                </div>
                <p className="text-slate-600 mb-8">Para empezar a conocer la herramienta</p>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center text-slate-700"><i className="fa-solid fa-check text-emerald mr-3"></i>Hasta 50 envíos</li>
                  <li className="flex items-center text-slate-700"><i className="fa-solid fa-check text-emerald mr-3"></i>Base de datos completa</li>
                  <li className="flex items-center text-slate-700"><i className="fa-solid fa-check text-emerald mr-3"></i>Filtros básicos</li>
                </ul>
                <Link href="/dashboard" className="block w-full py-4 border-2 border-emerald text-emerald font-semibold rounded-xl text-center hover:bg-emerald hover:text-white transition-all">
                  Empezar Gratis
                </Link>
              </div>
              <div className="p-8 rounded-2xl border-2 border-emerald bg-ink text-white flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald text-white text-xs font-bold px-4 py-1 rounded-bl-xl">RECOMENDADO</div>
                <h3 className="text-2xl font-bold">Pase Mensual</h3>
                <div className="my-6">
                  <span className="text-5xl font-bold">$4.999</span>
                  <span className="text-slate-400">/mes</span>
                </div>
                <p className="text-slate-300 mb-8">Pago único · Sin renovación automática</p>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center"><i className="fa-solid fa-check text-emerald mr-3"></i>Envíos ilimitados</li>
                  <li className="flex items-center"><i className="fa-solid fa-check text-emerald mr-3"></i>Todos los filtros avanzados</li>
                  <li className="flex items-center"><i className="fa-solid fa-check text-emerald mr-3"></i>Soporte prioritario</li>
                </ul>
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
                  className="block w-full py-4 bg-emerald text-white font-semibold rounded-xl text-center hover:bg-emeralddeep transition-all"
                >
                  Comprar Pase
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-ink text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <span className="text-2xl font-bold tracking-tight">Távika</span>
              <p className="text-slate-400 mt-4 max-w-sm">Automatizamos la búsqueda de horas docentes para que puedas concentrarte en lo que importa: enseñar.</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>© 2026 Távika. Todos los derechos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="/privacidad" className="hover:text-white transition-colors">Privacidad</a>
              <a href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</a>
              <a href="/imprint" className="hover:text-white transition-colors">Aviso Legal</a>
            </div>
            <p className="mt-4 md:mt-0">Hecho con <i className="fa-solid fa-heart text-emerald mx-1"></i> para docentes argentinos.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
