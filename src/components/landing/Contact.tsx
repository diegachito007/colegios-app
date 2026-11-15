import { Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Contacto() {
  return (
    <div 
      id="contacto" 
      className="relative py-28 overflow-hidden"
      style={{
        // Degradado radial: Negro profundo en las orillas, azul marino en el centro
        backgroundColor: '#020617', 
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1e3a8a 0%, #020617 70%)'
      }}
    >
      
      {/* Luces desenfocadas para dar profundidad 3D */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-600 opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600 opacity-20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Patrón de puntos sutil */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      ></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md"
        >
          ¿Listo para digitalizar tu institución?
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-slate-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Hablemos sobre cómo <strong className="text-white">PiteyPase</strong> puede desarrollar la solución exacta que necesitas para llevar tu colegio al siguiente nivel.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center"
        >
          {/* Botón de Correo */}
          <a 
            href="mailto:difabians@gmail.com" 
            className="group relative w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] hover:-translate-y-1 flex items-center justify-center gap-2 overflow-hidden border border-blue-400/30"
          >
            <Mail className="w-5 h-5" />
            Enviar un correo
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </a>
          
          {/* Botón de WhatsApp */}
          <a 
            href="https://wa.me/593961023777" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_rgba(5,150,105,0.7)] hover:-translate-y-1 flex items-center justify-center gap-2 border border-emerald-400/30"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp: 096 102 3777
          </a>
        </motion.div>
      </div>
    </div>
  );
}