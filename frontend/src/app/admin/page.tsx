export default function AdminPanel() {
  return (
    <div className="bg-surface text-slate-800 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink">Panel de Administrador</h1>
            <p className="text-slate-500">Curación de la Base de Datos Global</p>
          </div>
          <div className="flex gap-4">
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <i className="fa-solid fa-broom mr-2"></i> Limpiar Rebotes
            </button>
            <button className="bg-emerald hover:bg-emeralddeep text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <i className="fa-solid fa-play mr-2"></i> Iniciar Campaña de Testeo
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-paper p-6 rounded-2xl border border-line">
            <h3 className="text-slate-500 text-sm font-semibold uppercase mb-2">Colegios Totales</h3>
            <p className="text-4xl font-bold text-ink">3,450</p>
          </div>
          <div className="bg-paper p-6 rounded-2xl border border-emerald/30">
            <h3 className="text-emerald text-sm font-semibold uppercase mb-2">Sanos (Verificados)</h3>
            <p className="text-4xl font-bold text-emerald">3,300</p>
          </div>
          <div className="bg-paper p-6 rounded-2xl border border-red-500/30">
            <h3 className="text-red-500 text-sm font-semibold uppercase mb-2">Rotos (Rebotados)</h3>
            <p className="text-4xl font-bold text-red-500">150</p>
          </div>
        </div>

        <div className="bg-paper rounded-2xl border border-line overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-slate-50">
            <h2 className="font-semibold text-ink">Últimos Colegios Procesados</h2>
            <select className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white outline-none">
              <option>Todos</option>
              <option>Solo Sanos</option>
              <option>Solo Rotos</option>
            </select>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400 bg-paper border-b border-line">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Distrito</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="hover:bg-slate-50">
                <td className="p-4 font-medium text-ink">EES N° 4</td>
                <td className="p-4 text-slate-500">Quilmes</td>
                <td className="p-4 text-slate-500">ees4quilmes@abc.gob.ar</td>
                <td className="p-4"><span className="bg-emerald/10 text-emerald px-2 py-1 rounded-full text-xs font-semibold">Sano</span></td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-4 font-medium text-ink">EEST N° 1</td>
                <td className="p-4 text-slate-500">Avellaneda</td>
                <td className="p-4 text-slate-500">tecnica1av@gmail.com</td>
                <td className="p-4"><span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-full text-xs font-semibold">Roto</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
