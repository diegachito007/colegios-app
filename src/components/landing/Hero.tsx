import { ArrowRight, Code, Smartphone, School, CheckCircle2 } from 'lucide-react';
import { useState, useRef } from 'react';
import NeuralBackground from '../ui/Neural';

// Componente para la tarjeta con efecto 3D
function Tarjeta3D({ children, className }: { children: React.ReactNode, className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculamos la rotación (entre -10 y 10 grados)
    const rotateX = ((y - rect.height / 2) / rect.height) * -15;
    const rotateY = ((x - rect.width / 2) / rect.width) * 15;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered 
          ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1.02, 1.02, 1.02)` 
          : 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`relative transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export default function Hero() {
  return (
    <section id="inicio" className="relative pt-32 pb-24 bg-brand-light overflow-hidden">
      
      {/* 🧠 RED NEURONAL DE FONDO */}
      <NeuralBackground />

      {/* Fondos decorativos (Blobs) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-orange-400/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Patrón de rejilla sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-blue-100 text-brand-blue px-5 py-2 rounded-full text-sm font-semibold mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-brand-blue animate-pulse"></span>
            Desarrollo de aplicaciones web & apps
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-brand-dark leading-[1.1] mb-8 tracking-tight">
            Tecnología que impulsa el <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              futuro
            </span> de tu institución
          </h1>
          
          <p className="text-xl text-brand-gray mb-12 leading-relaxed max-w-2xl mx-auto">
            Creamos software a medida, robusto y escalable. Conoce <strong className="text-brand-dark font-semibold">colegiosX</strong>, nuestra solución integral de gestión escolar diseñada para simplificar la administración educativa.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a 
              href="#servicios" 
              className="group bg-brand-blue hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              Ver Soluciones 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#contacto" 
              className="bg-white border border-slate-200 text-brand-dark hover:border-brand-blue hover:text-brand-blue px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center w-full sm:w-auto"
            >
              Contáctanos
            </a>
          </div>
        </div>

        {/* Features Grid 3D */}
        <div id="servicios" className="grid md:grid-cols-3 gap-8 mt-16" style={{ perspective: '1200px' }}>
          
          {/* Tarjeta 1 */}
          <Tarjeta3D className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 z-10">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Code className="w-7 h-7 text-brand-blue" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-3">Desarrollo Web</h3>
            <p className="text-brand-gray leading-relaxed">Aplicaciones modernas, rápidas y responsivas utilizando las últimas tecnologías (React, Supabase, Node.js).</p>
          </Tarjeta3D>

          {/* Tarjeta 2 */}
          <Tarjeta3D className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 z-10">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
              <Smartphone className="w-7 h-7 text-brand-orange" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-3">Aplicaciones Móviles</h3>
            <p className="text-brand-gray leading-relaxed">Apps nativas y multiplataforma que conecta a tu equipo y clientes en cualquier lugar.</p>
          </Tarjeta3D>

          {/* Tarjeta 3 (Destacada) */}
          <Tarjeta3D className="bg-brand-dark p-8 rounded-3xl shadow-2xl shadow-blue-900/20 border border-slate-700 relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/40 blur-3xl rounded-full"></div>
            <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-orange to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl z-20">ESTRELLA</div>
            
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10">
              <School className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">colegiosX: Gestión Escolar</h3>
            <p className="text-slate-300 leading-relaxed">Sistema completo para colegios: calificaciones, asistencias, PPE, refuerzos y comunicación con representantes.</p>
          </Tarjeta3D>
          
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 font-medium mt-16">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Soporte 24/7</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 100% Personalizado</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Seguridad de datos</div>
        </div>
      </div>
    </section>
  );
}