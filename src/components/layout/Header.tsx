export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-10">
      
      {/* Lado Izquierdo: Título de la sección (Opcional, pero le da contexto) */}
      <div className="flex items-center">
        <h2 className="text-sm font-medium text-slate-500">
          Plataforma de Gestión Escolar
        </h2>
      </div>

      {/* Lado Derecho: Solo el rol, como pediste */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-brand-blue bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-wide">
          Super Admin
        </span>
      </div>
      
    </header>
  );
}