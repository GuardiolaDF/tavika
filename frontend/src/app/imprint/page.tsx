export default function Imprint() {
  return (
    <div className="bg-surface text-slate-800 min-h-screen p-8 lg:p-24">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl border border-line shadow-sm">
        <h1 className="text-3xl font-bold text-ink mb-6">Aviso Legal (Imprint)</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="mb-4">Información provista de acuerdo a las regulaciones internacionales de comercio electrónico.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Responsable de la Plataforma</h2>
          <p className="mb-4">
            <strong>Távika - Buscador Automático de Empleo Docente</strong><br/>
            Desarrollado y operado de manera independiente en la República Argentina.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Contacto</h2>
          <p className="mb-4">
            Para consultas generales, de soporte técnico, o de ejercicio de derechos ARCO (Protección de Datos), 
            puedes comunicarte a través del correo electrónico provisto al momento del alta en el sistema.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Uso de Inteligencia Artificial</h2>
          <p className="mb-4">
            Távika declara explícitamente que <strong>NO utiliza Inteligencia Artificial Generativa ni Machine Learning</strong> 
            para el análisis, modificación o calificación de los Curriculum Vitae subidos por los usuarios. El sistema 
            solamente opera como un vehículo de automatización de correos electrónicos.
          </p>
        </div>
      </div>
    </div>
  );
}
