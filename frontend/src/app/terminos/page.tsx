export default function Terminos() {
  return (
    <div className="bg-surface text-slate-800 min-h-screen p-8 lg:p-24">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl border border-line shadow-sm">
        <h1 className="text-3xl font-bold text-ink mb-6">Términos y Condiciones</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="mb-4">Última actualización: 27 de Julio de 2026</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">1. Uso del Servicio</h2>
          <p className="mb-4">
            Távika provee una herramienta de automatización de correos. El usuario entiende y acepta que Távika actúa 
            únicamente como un vehículo tecnológico. <strong>El usuario es el único responsable legal del contenido 
            enviado</strong> y de los documentos adjuntos.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. Propiedad Intelectual y Veracidad</h2>
          <p className="mb-4">
            Al subir un Curriculum Vitae (PDF), el usuario declara bajo juramento que los datos allí contenidos son 
            estrictamente personales, veraces, y que no se está suplantando la identidad de terceros ni violando derechos 
            de autor. Távika se reserva el derecho de suspender cuentas que incumplan esta cláusula.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. Política Anti-Spam</h2>
          <p className="mb-4">
            Queda terminantemente prohibido utilizar el servicio para acosar instituciones, enviar material ofensivo 
            o realizar cadenas de spam. Los envíos se realizan desde la cuenta de Gmail autorizada por el usuario, por lo 
            que Google también aplicará sus propias políticas de uso.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Política de Reembolso (Botón de Arrepentimiento)</h2>
          <p className="mb-4">
            De acuerdo a las leyes de Defensa del Consumidor de la República Argentina, el usuario tiene derecho a 
            revocar la contratación del servicio dentro de los diez (10) días corridos contados a partir de la fecha de 
            suscripción, siempre y cuando no haya consumido más del 10% de su cuota de envíos de la campaña.
          </p>
        </div>
      </div>
    </div>
  );
}
