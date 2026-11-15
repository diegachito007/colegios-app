import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer 
      className="text-slate-400 py-12 border-t border-slate-800/60 relative z-10"
      style={{ backgroundColor: '#020617' }} // Mismo color base que el Contacto
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
              Pitey<span className="text-brand-orange">Pase</span>
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Desarrollo de aplicaciones web y móviles a medida. Transformamos
              ideas en soluciones tecnológicas escalables y seguras.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Contacto
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 group">
                <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-slate-800 transition-colors">
                  <Mail className="w-4 h-4 text-brand-orange" />
                </div>
                <a
                  href="mailto:difabians@gmail.com"
                  className="hover:text-white transition-colors text-sm"
                >
                  difabians@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-slate-800 transition-colors">
                  <Phone className="w-4 h-4 text-brand-orange" />
                </div>
                <a
                  href="tel:+593961023777"
                  className="hover:text-white transition-colors text-sm"
                >
                  096 102 3777
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-slate-800 transition-colors">
                  <MapPin className="w-4 h-4 text-brand-orange" />
                </div>
                <span className="text-sm">Ecuador - Andrade Marín</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Síguenos
            </h4>
            <a
              href="https://www.facebook.com/dieguitoyamberla/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 text-sm font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              Facebook
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800/60 mt-12 pt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PiteyPase. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}