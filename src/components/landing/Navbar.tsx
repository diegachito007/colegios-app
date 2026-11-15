import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Monitor } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-white/70 backdrop-blur-lg border-b border-slate-200/50 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-brand-dark">
              Pitey<span className="text-brand-orange">Pase</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#inicio" className="text-slate-600 hover:text-brand-blue font-medium transition-colors">Inicio</a>
            <a href="#servicios" className="text-slate-600 hover:text-brand-blue font-medium transition-colors">Servicios</a>
            <a href="#contacto" className="text-slate-600 hover:text-brand-blue font-medium transition-colors">Contacto</a>
            
            <Link 
              to="/login" 
              className="bg-brand-dark hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
            >
              Acceso colegiosX
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-4 space-y-3 shadow-2xl absolute w-full">
          <a href="#inicio" onClick={() => setIsOpen(false)} className="block text-slate-600 font-medium">Inicio</a>
          <a href="#servicios" onClick={() => setIsOpen(false)} className="block text-slate-600 font-medium">Servicios</a>
          <a href="#contacto" onClick={() => setIsOpen(false)} className="block text-slate-600 font-medium">Contacto</a>
          <Link to="/login" className="block w-full text-center bg-brand-dark text-white px-5 py-3 rounded-lg font-semibold mt-4">
            Acceso colegiosX
          </Link>
        </div>
      )}
    </nav>
  );
}