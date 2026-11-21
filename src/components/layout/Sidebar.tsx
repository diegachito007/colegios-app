import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useEsDocente } from "../../hooks/useDocentes";
import { useColegios } from "../../hooks/useColegios"; // ✅ Realtime incluido
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Settings,
  Calendar,
  BookOpen,
  FileText,
  LogOut,
  UserCircle,
  Library,
  UserPlus,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const { esDocente } = useEsDocente(profile?.id || null);
  const location = useLocation();

  // ✅ Fuente única de verdad + realtime (useColegios invalida en UPDATE de colegios)
  const { colegios } = useColegios();
  const miColegio = colegios?.find((c) => c.id === profile?.colegio_id);
  const nombreColegio = miColegio?.nombre ?? "";

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard",
      roles: [
        "super_admin",
        "admin_colegio",
        "docente",
        "vicerrector",
        "inspector",
      ],
    },
  ];

  const superAdminItems = [
    {
      icon: Building2,
      label: "Colegios",
      path: "/superadmin/colegios",
      roles: ["super_admin"],
    },
  ];

  const adminColegioItems = [
    {
      icon: Settings,
      label: "Configuración",
      path: "/admin/configuracion",
      roles: ["admin_colegio"],
    },
    {
      icon: Calendar,
      label: "Años Lectivos",
      path: "/admin/aniosLectivos",
      roles: ["admin_colegio", "vicerrector"],
    },
    {
      icon: BookOpen,
      label: "Grados",
      path: "/admin/grados",
      roles: ["admin_colegio", "vicerrector"],
    },
    {
      icon: Library,
      label: "Currículo",
      path: "/admin/curriculo",
      roles: ["admin_colegio", "vicerrector"],
    },
    {
      icon: UserPlus,
      label: "Estudiantes",
      path: "/admin/estudiantes",
      roles: ["admin_colegio", "vicerrector", "inspector"],
    },
    {
      icon: ClipboardList,
      label: "Diseñar Fichas",
      path: "/admin/formularios",
      roles: ["admin_colegio"],
    },
    {
      icon: Users,
      label: "Personal",
      path: "/admin/personal",
      roles: ["admin_colegio", "vicerrector", "inspector"],
    },
  ];

  const docenteItems = [
    {
      icon: Users,
      label: "Mis Estudiantes",
      path: "/docente/estudiantes",
      roles: ["docente", "vicerrector", "inspector", "admin_colegio"],
    },
    {
      icon: FileText,
      label: "Calificaciones",
      path: "/docente/calificaciones",
      roles: ["docente", "vicerrector", "inspector", "admin_colegio"],
    },
    {
      icon: Calendar,
      label: "Mi Horario",
      path: "/docente/miHorario",
      roles: ["docente", "vicerrector", "inspector", "admin_colegio"],
    },
  ].filter(() => esDocente);

  const allItems = [
    ...menuItems,
    ...superAdminItems,
    ...adminColegioItems,
    ...docenteItems,
  ];

  const visibleItems = allItems.filter((item) =>
    item.roles.includes(profile?.rol || ""),
  );

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-white border-r border-slate-200 flex flex-col min-h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out relative`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1.5 text-slate-500 hover:text-brand-blue hover:border-brand-blue shadow-sm z-50 transition-colors"
        title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div
        className={`h-16 flex items-center border-b border-slate-100 ${
          isCollapsed ? "justify-center px-0" : "px-6"
        }`}
      >
        <h1 className="text-xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-sm">
            <Building2 size={18} />
          </div>
          {!isCollapsed && (
            <span>
              colegios<span className="text-brand-orange">X</span>
            </span>
          )}
        </h1>
      </div>

      {/* ✅ NOMBRE DEL COLEGIO (realtime, sin useEffect manual) */}
      {!isCollapsed && nombreColegio && (
        <div className="px-4 py-3 bg-blue-50/50 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Institución
          </p>
          <p
            className="text-xs font-bold text-brand-blue truncate"
            title={nombreColegio}
          >
            {nombreColegio}
          </p>
        </div>
      )}

      <div
        className={`p-4 border-b border-slate-100 bg-slate-50/50 flex ${
          isCollapsed ? "justify-center" : "items-center gap-3"
        }`}
      >
        <div
          className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-brand-blue shrink-0 border border-blue-200"
          title={profile?.display_name || "Usuario"}
        >
          <UserCircle className="w-6 h-6" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-brand-dark truncate">
              {profile?.display_name || "Usuario"}
            </p>
            <p className="text-xs text-slate-500 capitalize truncate font-medium">
              {profile?.rol.replace("_", " ")}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && (
          <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2 whitespace-nowrap">
            Menú Principal
          </p>
        )}
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
              } ${
                isActive
                  ? "bg-blue-50 text-brand-blue"
                  : "text-slate-600 hover:bg-slate-50 hover:text-brand-dark"
              }`}
            >
              <item.icon
                className={`w-5 h-5 shrink-0 ${isActive ? "text-brand-blue" : "text-slate-400"}`}
              />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={signOut}
          title={isCollapsed ? "Cerrar Sesión" : undefined}
          className={`flex items-center w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group ${
            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
          }`}
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </aside>
  );
}
