export default function Privacidad() {
  return (
    <div className="bg-surface text-slate-800 min-h-screen p-8 lg:p-24">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl border border-line shadow-sm">
        <h1 className="text-3xl font-bold text-ink mb-6">Política de Privacidad</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="mb-4">Última actualización: 27 de Julio de 2026</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">1. Identidad del Responsable</h2>
          <p className="mb-4">
            Távika (en adelante, "la Plataforma") está comprometida con la protección de los datos personales 
            de nuestros usuarios en cumplimiento con la Ley de Protección de Datos Personales de la República Argentina (Ley 25.326).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. Datos que Recolectamos</h2>
          <p className="mb-4">
            Recolectamos tu dirección de correo electrónico a través del inicio de sesión con Google (OAuth 2.0). 
            También procesamos temporalmente los archivos PDF (Curriculum Vitae) que subes a nuestra plataforma con 
            el único fin de enviarlos a las instituciones educativas seleccionadas.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. Finalidad del Tratamiento</h2>
          <p className="mb-4">
            Los CVs subidos <strong>no se utilizan para entrenar modelos de Inteligencia Artificial</strong>, 
            ni son vendidos ni compartidos con terceros ajenos al proceso de envío. El único destino del documento 
            son los correos electrónicos oficiales de las instituciones educativas del padrón nacional.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Derechos ARCO</h2>
          <p className="mb-4">
            El titular de los datos personales tiene la facultad de ejercer el derecho de acceso, rectificación, 
            actualización y supresión de sus datos en forma gratuita a intervalos no inferiores a seis meses.
            Para ejercer estos derechos, podés contactarnos a través del panel de soporte.
          </p>
        </div>
      </div>
    </div>
  );
}
