import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

// Landing Pages
import Home from "./pages/landing/Home";

// Auth & Dashboard
import Login from "./pages/auth/Login";
import RegistroInvitado from "./pages/auth/RegistroInvitado";
import ActivarDocente from "./pages/auth/ActivarDocente";
import Layout from "./components/layout/Layout";

// Red Neuronal
import Neural from "./components/ui/Neural";

// Módulos Protegidos
import ListaColegios from "./pages/superadmin/colegios/ListaColegios";
import GestionAniosLectivos from "./pages/admin/aniosLectivos/GestionAniosLectivos";
import GestionGrados from "./pages/admin/grados/GestionGrados";
import GestionCurriculo from "./pages/admin/ambitosDestrezas/GestionCurriculo";
import GestionEstudiantes from "./pages/admin/estudiantes/GestionEstudiantes";
import DisenadorFormularios from "./pages/admin/formularios/DisenadorFormularios";
import GestionPersonal from "./pages/admin/personal/GestionPersonal";
import MiHorario from "./pages/docente/miHorario/MiHorario";

// Hooks e Iconos
import { useColegios } from "./hooks/useColegios";
import { useAniosLectivos } from "./hooks/useAniosLectivos";
import { useGrados } from "./hooks/useGrados";
import {
  Building2,
  Users,
  Activity,
  Calendar,
  BookOpen,
  Library,
  UserPlus,
  ClipboardList,
} from "lucide-react";

// --- DASHBOARD DEL SUPER ADMIN ---
function DashboardSuperAdmin() {
  const { profile } = useAuth();
  const { colegios, isLoading } = useColegios();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Neural />
      </div>

      <div className="relative z-10 p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              Hola, {profile?.display_name?.split(" ")[0] || "Usuario"} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Bienvenido a colegios
              <span className="text-brand-orange font-bold">X</span>. Aquí está
              el resumen global.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/superadmin/colegios"
              className="bg-brand-dark hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Building2 size={16} /> Gestionar Colegios
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Colegios
                </p>
                <p className="text-4xl font-extrabold text-brand-dark mt-2">
                  {isLoading ? (
                    <span className="animate-pulse bg-slate-200 text-transparent rounded">
                      00
                    </span>
                  ) : (
                    colegios?.length || 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-brand-blue">
                <Building2 size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Usuarios Totales
                </p>
                <p className="text-4xl font-extrabold text-brand-dark mt-2">
                  --
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl text-brand-orange">
                <Users size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Estado de la Red
                </p>
                <p className="text-xl font-bold text-emerald-500 flex items-center gap-2 mt-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
                  Óptimo
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
                <Activity size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD DEL ADMIN COLEGIO ---
function DashboardAdminColegio() {
  const { profile } = useAuth();
  const { anios, isLoading: isLoadingAnios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);
  const { grados, isLoading: isLoadingGrados } = useGrados(
    anioActivo?.id || null,
  );

  const [nombreColegio, setNombreColegio] = useState<string>("tu institución");

  useEffect(() => {
    if (profile?.colegio_id) {
      supabase
        .from("colegios")
        .select("nombre")
        .eq("id", profile.colegio_id)
        .single()
        .then(({ data }) => {
          if (data) setNombreColegio((data as { nombre: string }).nombre);
        });
    }
  }, [profile?.colegio_id]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Neural />
      </div>

      <div className="relative z-10 p-8 max-w-6xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-brand-blue px-3 py-1 rounded-full text-xs font-bold mb-3 border border-blue-100 uppercase tracking-wide">
          <Building2 size={14} />
          {nombreColegio}
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
            Hola,{" "}
            {profile?.display_name?.replace("Administrador: ", "") ||
              "Administrador"}{" "}
            👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Bienvenido al panel de gestión de tu institución.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Años Lectivos
                </p>
                <p className="text-4xl font-extrabold text-brand-dark mt-2">
                  {isLoadingAnios ? (
                    <span className="animate-pulse bg-slate-200 text-transparent rounded">
                      0
                    </span>
                  ) : (
                    anios?.length || 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-brand-blue">
                <Calendar size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Grados / Cursos
                </p>
                <p className="text-4xl font-extrabold text-brand-dark mt-2">
                  {isLoadingGrados ? (
                    <span className="animate-pulse bg-slate-200 text-transparent rounded">
                      0
                    </span>
                  ) : (
                    grados?.length || 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl text-brand-orange">
                <BookOpen size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Personal</p>
                <p className="text-4xl font-extrabold text-brand-dark mt-2">
                  --
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
                <Users size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ ACCESOS RÁPIDOS ACTUALIZADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-dark">Personal</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Gestiona directivos y docentes.
              </p>
            </div>
            <Link
              to="/admin/personal"
              className="bg-brand-blue hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Users size={14} /> Gestión de Personal
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-dark">
                Estudiantes
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Registra la nómina.
              </p>
            </div>
            <Link
              to="/admin/estudiantes"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <UserPlus size={14} /> Ir a Estudiantes
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-dark">Fichas</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Diseña los formularios.
              </p>
            </div>
            <Link
              to="/admin/formularios"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ClipboardList size={14} /> Diseñar Fichas
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-dark">Currículo</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Configura áreas y materias.
              </p>
            </div>
            <Link
              to="/admin/curriculo"
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Library size={14} /> Ir al Currículo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD DEL DOCENTE ---
function DashboardDocente() {
  const { profile } = useAuth();
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Neural />
      </div>
      <div className="relative z-10 p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
            Hola, {profile?.display_name || "Docente"} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Bienvenido a tu panel de gestión.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-bold text-brand-dark mb-2">
              Mi Horario
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Configura tus materias y horarios de clase.
            </p>
            <Link
              to="/docente/miHorario"
              className="inline-flex bg-brand-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md items-center gap-2"
            >
              <Calendar size={16} /> Ir a Mi Horario
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE QUE DECIDE QUÉ DASHBOARD MOSTRAR ---
function DashboardSelector() {
  const { profile } = useAuth();
  if (profile?.rol === "super_admin") return <DashboardSuperAdmin />;
  if (profile?.rol === "docente") return <DashboardDocente />;
  return <DashboardAdminColegio />;
}

// --- COMPONENTES DE PROTECCIÓN ---
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (profile.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Neural />
        </div>
        <div className="relative z-10 text-center p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border-l-4 border-brand-orange max-w-md mx-4">
          <h2 className="text-xl font-bold text-brand-orange mb-2">
            Cuenta no activada
          </h2>
          <p className="text-slate-600 mb-4">
            Tu cuenta está en revisión o ha sido bloqueada.
          </p>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.rol !== "super_admin")
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// --- COMPONENTE INTERNO PARA LAS RUTAS ---
function AppRoutes() {
  return (
    <Routes>
      {/* 🌐 RUTAS PÚBLICAS */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro-invitado" element={<RegistroInvitado />} />
      <Route path="/activar-docente" element={<ActivarDocente />} />

      {/* 🔒 RUTAS PROTEGIDAS */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardSelector />
          </ProtectedRoute>
        }
      />

      {/* Ruta exclusiva Super Admin */}
      <Route
        path="/superadmin/colegios"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <ListaColegios />
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Rutas Admin Colegio */}
      <Route
        path="/admin/aniosLectivos"
        element={
          <ProtectedRoute>
            <GestionAniosLectivos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/grados"
        element={
          <ProtectedRoute>
            <GestionGrados />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/curriculo"
        element={
          <ProtectedRoute>
            <GestionCurriculo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/estudiantes"
        element={
          <ProtectedRoute>
            <GestionEstudiantes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/formularios"
        element={
          <ProtectedRoute>
            <DisenadorFormularios />
          </ProtectedRoute>
        }
      />

      {/* ✅ RUTA UNIFICADA DE PERSONAL */}
      <Route
        path="/admin/personal"
        element={
          <ProtectedRoute>
            <GestionPersonal />
          </ProtectedRoute>
        }
      />

      {/* ✅ RUTA: MI HORARIO (Docente) */}
      <Route
        path="/docente/miHorario"
        element={
          <ProtectedRoute>
            <MiHorario />
          </ProtectedRoute>
        }
      />

      {/* ✅ NUEVA RUTA: MIS ESTUDIANTES (Docente) - usa el mismo componente */}
      <Route
        path="/docente/estudiantes"
        element={
          <ProtectedRoute>
            <GestionEstudiantes />
          </ProtectedRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
