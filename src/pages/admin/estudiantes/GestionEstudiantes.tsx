import { useState, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useAniosLectivos } from "../../../hooks/useAniosLectivos";
import { useGrados } from "../../../hooks/useGrados";
import { useEstudiantes } from "../../../hooks/useEstudiantes";
import { useEsTutor } from "../../../hooks/useEsTutor";
import { useGradosDocente } from "../../../hooks/useGradosDocente";
import Modal from "../../../components/ui/Modal";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import Neural from "../../../components/ui/Neural";
import {
  Users,
  Search,
  Plus,
  Upload,
  GraduationCap,
  Loader2,
  AlertCircle,
  ArrowLeft,
  UserPlus,
  Lock,
  Pencil,
  Trash2,
  History, // ✅ Icono para el botón de Retirados
} from "lucide-react";
import toast from "react-hot-toast";

const getOrdenNivel = (nombreNivel: string): number => {
  const n = nombreNivel.toLowerCase();
  if (n.includes("inicial 1")) return 1;
  if (n.includes("inicial 2")) return 2;
  if (n.includes("1ro egb")) return 10;
  if (n.includes("2do egb")) return 11;
  if (n.includes("3ro egb")) return 12;
  if (n.includes("4to egb")) return 13;
  if (n.includes("5to egb")) return 14;
  if (n.includes("6to egb")) return 15;
  if (n.includes("7mo egb")) return 16;
  if (n.includes("8vo egb")) return 17;
  if (n.includes("9no egb")) return 18;
  if (n.includes("10mo egb")) return 19;
  if (n.includes("1ro bc")) return 20;
  if (n.includes("2do bc")) return 21;
  if (n.includes("3ro bc")) return 22;
  if (n.includes("1ro bt")) return 30;
  if (n.includes("2do bt")) return 31;
  if (n.includes("3ro bt")) return 32;
  return 99;
};

export default function GestionEstudiantes() {
  const { profile } = useAuth();
  const { anios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);

  const esDocente = profile?.rol === "docente";

  const { grados: todosLosGrados, isLoading: isLoadingGrados } = useGrados(
    anioActivo?.id || null,
  );

  const { data: gradosDocente, isLoading: isLoadingAsignaciones } =
    useGradosDocente(profile?.id || null, anioActivo?.id || null, esDocente);

  const gradosAMostrar = useMemo(() => {
    const listaBase = esDocente ? gradosDocente : todosLosGrados;
    if (!listaBase) return [];

    return [...listaBase].sort((a, b) => {
      const pesoA = getOrdenNivel(a.nivel);
      const pesoB = getOrdenNivel(b.nivel);
      if (pesoA !== pesoB) return pesoA - pesoB;
      return a.paralelo.localeCompare(b.paralelo);
    });
  }, [esDocente, gradosDocente, todosLosGrados]);

  const cargandoGrados = esDocente ? isLoadingAsignaciones : isLoadingGrados;

  const [selectedGradoId, setSelectedGradoId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const gradoActual = gradosAMostrar?.find((g) => g.id === selectedGradoId);

  const { esTutor, isLoading: isLoadingTutor } = useEsTutor(
    esDocente ? profile?.id || null : null,
    selectedGradoId || null,
  );

  const puedeGestionar = !esDocente || esTutor;

  const {
    estudiantes,
    isLoading,
    crearEstudiante,
    isCreating,
    crearMasivo,
    isCreatingMasivo,
    actualizarEstudiante,
    eliminarEstudiante,
    estudiantesInactivos, // ✅
    reactivarEstudiante, // ✅
  } = useEstudiantes(selectedGradoId || null, anioActivo?.id || null);

  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [showMasivoModal, setShowMasivoModal] = useState(false);
  const [showInactivosModal, setShowInactivosModal] = useState(false); // ✅

  const [formData, setFormData] = useState({
    cedula: "",
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    sexo: "",
  });

  const [massiveData, setMassiveData] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [estudianteAEditar, setEstudianteAEditar] = useState<any | null>(null);
  const [estudianteAEliminar, setEstudianteAEliminar] = useState<{
    id: string;
    matriculaId: string;
    nombre: string;
  } | null>(null);

  const estudiantesFiltrados = useMemo(() => {
    if (!estudiantes) return [];
    if (!searchTerm) return estudiantes;
    const term = searchTerm.toLowerCase();
    return estudiantes.filter(
      (e) =>
        e.nombres.toLowerCase().includes(term) ||
        e.apellidos.toLowerCase().includes(term) ||
        (e.cedula && e.cedula.includes(term)) ||
        e.codigo_interno?.toLowerCase().includes(term),
    );
  }, [estudiantes, searchTerm]);

  const handleSaveIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradoId || !profile?.colegio_id) return;

    await crearEstudiante({
      estudiante: {
        ...formData,
        cedula: formData.cedula.trim() === "" ? null : formData.cedula,
      },
      colegioId: profile.colegio_id,
    });

    setShowIndividualModal(false);
    setFormData({
      cedula: "",
      nombres: "",
      apellidos: "",
      fecha_nacimiento: "",
      sexo: "",
    });
  };

  const handleEditarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudianteAEditar) return;

    await actualizarEstudiante({
      id: estudianteAEditar.id,
      cambios: {
        nombres: estudianteAEditar.nombres,
        apellidos: estudianteAEditar.apellidos,
        cedula:
          estudianteAEditar.cedula?.trim() === ""
            ? null
            : estudianteAEditar.cedula,
        fecha_nacimiento: estudianteAEditar.fecha_nacimiento,
        sexo: estudianteAEditar.sexo,
      },
    });

    setEstudianteAEditar(null);
  };

  const handleSaveMasivo = async () => {
    if (!massiveData.trim() || !selectedGradoId || !profile?.colegio_id) return;

    const lines = massiveData.trim().split("\n");
    const nuevosEstudiantes = lines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 4) return null;
        return {
          cedula: parts[0] ? parts[0] : null,
          apellidos: parts[1],
          nombres: parts[2],
          fecha_nacimiento: parts[3],
          sexo: parts[4] === "M" || parts[4] === "F" ? parts[4] : null,
        };
      })
      .filter(Boolean) as Array<{
      cedula: string | null;
      apellidos: string;
      nombres: string;
      fecha_nacimiento: string;
      sexo: "M" | "F" | null;
    }>;

    if (nuevosEstudiantes.length === 0) {
      toast.error("Formato inválido. Revisa las instrucciones.");
      return;
    }

    await crearMasivo({
      estudiantes: nuevosEstudiantes,
      colegioId: profile.colegio_id,
    });

    setShowMasivoModal(false);
    setMassiveData("");
  };

  if (cargandoGrados || isLoadingTutor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!anioActivo) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] p-8">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <Neural />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto mt-20 bg-white/80 p-8 rounded-2xl text-center shadow-sm border border-slate-200">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-dark mb-2">
            No hay año lectivo activo
          </h2>
          <p className="text-slate-500">
            Debes crear y activar un año lectivo primero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden p-8">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Neural />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {selectedGradoId && (
              <button
                onClick={() => {
                  setSelectedGradoId("");
                  setSearchTerm("");
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-blue-800 mb-2 transition-colors"
              >
                <ArrowLeft size={16} /> Volver a Grados
              </button>
            )}
            <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              {selectedGradoId
                ? "Nómina de Estudiantes"
                : "Selecciona un Grado"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Año lectivo:{" "}
              <span className="font-semibold text-brand-blue">
                {anioActivo.nombre}
              </span>
              {selectedGradoId && gradoActual && (
                <>
                  {" "}
                  | Grado:{" "}
                  <span className="font-semibold text-brand-dark">
                    {gradoActual.nivel} - {gradoActual.paralelo}
                  </span>
                </>
              )}
            </p>
          </div>

          {selectedGradoId && puedeGestionar && (
            <div className="flex gap-2">
              {/* ✅ BOTÓN DE RETIRADOS */}
              <button
                onClick={() => setShowInactivosModal(true)}
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:bg-slate-50 font-semibold text-sm"
                title="Ver estudiantes retirados"
              >
                <History size={18} /> Retirados
              </button>

              <button
                onClick={() => setShowMasivoModal(true)}
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:bg-slate-50 font-semibold text-sm"
              >
                <Upload size={18} /> Carga Masiva
              </button>
              <button
                onClick={() => setShowIndividualModal(true)}
                className="bg-brand-blue hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md font-semibold text-sm"
              >
                <Plus size={18} /> Nuevo Estudiante
              </button>
            </div>
          )}

          {selectedGradoId && !puedeGestionar && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-amber-700 font-semibold">
              <Lock size={16} /> Solo lectura (no eres tutor de este grado)
            </div>
          )}
        </div>

        {!selectedGradoId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gradosAMostrar?.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGradoId(g.id)}
                className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-blue transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors">
                    <Users size={20} />
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                    {g.paralelo}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-brand-dark leading-tight">
                  {g.nivel}
                </h3>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                  <UserPlus size={14} />{" "}
                  {puedeGestionar ? "Gestionar nómina" : "Ver nómina"}
                </p>
              </button>
            ))}

            {esDocente && gradosAMostrar?.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white/50 rounded-2xl border border-slate-200 mt-4">
                <Lock className="mx-auto text-slate-300 mb-3" size={40} />
                <h3 className="text-lg font-bold text-slate-700">
                  Sin grados asignados
                </h3>
                <p className="text-sm text-slate-500">
                  Aún no tienes grados asignados para este año lectivo. Contacta
                  al administrador.
                </p>
              </div>
            )}
          </div>
        )}

        {selectedGradoId && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-brand-dark">
                  {gradoActual?.nivel} - {gradoActual?.paralelo}
                </h3>
                <span className="bg-blue-100 text-brand-blue text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {estudiantesFiltrados.length} alumnos
                </span>
              </div>
              <div className="relative w-full sm:w-72">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-4">Código / Cédula</th>
                    <th className="px-6 py-4">Apellidos y Nombres</th>
                    <th className="px-6 py-4 text-center">Género</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10">
                        <Loader2 className="animate-spin mx-auto text-brand-blue mb-2" />
                        <p className="text-sm text-slate-500">
                          Cargando nómina...
                        </p>
                      </td>
                    </tr>
                  ) : estudiantesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <GraduationCap
                          className="text-slate-300 mx-auto mb-3"
                          size={40}
                        />
                        <p className="text-slate-500 font-medium">
                          No hay estudiantes registrados
                        </p>
                        <p className="text-xs text-slate-400">
                          {puedeGestionar
                            ? "Usa el botón 'Nuevo Estudiante' para agregar."
                            : "Solo lectura."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    estudiantesFiltrados.map((est) => (
                      <tr
                        key={est.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="font-mono text-sm font-bold text-brand-blue">
                            {est.codigo_interno}
                          </div>
                          {est.cedula && (
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              C.I: {est.cedula}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 font-bold text-brand-dark">
                          {est.apellidos} {est.nombres}
                        </td>
                        <td className="px-6 py-3 text-center text-sm">
                          {est.sexo === "M"
                            ? "Masculino"
                            : est.sexo === "F"
                              ? "Femenino"
                              : "-"}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">
                            Matriculado
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          {puedeGestionar && (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEstudianteAEditar(est)}
                                className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar estudiante"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  setEstudianteAEliminar({
                                    id: est.id,
                                    matriculaId: est.matriculaId!,
                                    nombre: `${est.apellidos} ${est.nombres}`,
                                  })
                                }
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Retirar de la nómina"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: NUEVO ESTUDIANTE */}
      <Modal
        isOpen={showIndividualModal}
        onClose={() => setShowIndividualModal(false)}
        title="Registrar Estudiante"
      >
        <form onSubmit={handleSaveIndividual} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cédula (Opcional)
              </label>
              <input
                type="text"
                value={formData.cedula}
                onChange={(e) =>
                  setFormData({ ...formData, cedula: e.target.value })
                }
                placeholder="Ej. 1712345678"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Fecha de Nacimiento *
              </label>
              <input
                required
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_nacimiento: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Apellidos *
              </label>
              <input
                required
                type="text"
                value={formData.apellidos}
                onChange={(e) =>
                  setFormData({ ...formData, apellidos: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nombres *
              </label>
              <input
                required
                type="text"
                value={formData.nombres}
                onChange={(e) =>
                  setFormData({ ...formData, nombres: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Género
            </label>
            <select
              value={formData.sexo}
              onChange={(e) =>
                setFormData({ ...formData, sexo: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
            >
              <option value="">Selecciona...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3 border-t mt-6">
            <button
              type="button"
              onClick={() => setShowIndividualModal(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-xl shadow-md disabled:opacity-50 text-sm"
            >
              {isCreating ? "Guardando..." : "Guardar Estudiante"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDITAR ESTUDIANTE */}
      <Modal
        isOpen={!!estudianteAEditar}
        onClose={() => setEstudianteAEditar(null)}
        title="Editar Estudiante"
      >
        {estudianteAEditar && (
          <form onSubmit={handleEditarSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Cédula (Opcional)
                </label>
                <input
                  type="text"
                  value={estudianteAEditar.cedula || ""}
                  onChange={(e) =>
                    setEstudianteAEditar({
                      ...estudianteAEditar,
                      cedula: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  required
                  type="date"
                  value={estudianteAEditar.fecha_nacimiento}
                  onChange={(e) =>
                    setEstudianteAEditar({
                      ...estudianteAEditar,
                      fecha_nacimiento: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Apellidos *
                </label>
                <input
                  required
                  type="text"
                  value={estudianteAEditar.apellidos}
                  onChange={(e) =>
                    setEstudianteAEditar({
                      ...estudianteAEditar,
                      apellidos: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombres *
                </label>
                <input
                  required
                  type="text"
                  value={estudianteAEditar.nombres}
                  onChange={(e) =>
                    setEstudianteAEditar({
                      ...estudianteAEditar,
                      nombres: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Género
              </label>
              <select
                value={estudianteAEditar.sexo || ""}
                onChange={(e) =>
                  setEstudianteAEditar({
                    ...estudianteAEditar,
                    sexo: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
              >
                <option value="">Selecciona...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className="pt-4 flex gap-3 border-t mt-6">
              <button
                type="button"
                onClick={() => setEstudianteAEditar(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-xl shadow-md text-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: CARGA MASIVA */}
      <Modal
        isOpen={showMasivoModal}
        onClose={() => setShowMasivoModal(false)}
        title="Carga Masiva de Estudiantes"
        size="5xl"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-brand-blue">
            <p className="font-bold mb-1">
              Formato requerido (separado por comas):
            </p>
            <p className="font-mono bg-white/50 p-2 rounded">
              Cédula (Opcional), Apellidos, Nombres,
              FechaNacimiento(YYYY-MM-DD), Género(M/F)
            </p>
            <p className="mt-2 text-slate-500">Ejemplo con cédula:</p>
            <p className="font-mono text-slate-600">
              1712345678, PEREZ GARCIA, JUAN CARLOS, 2010-05-14, M
            </p>
            <p className="mt-1 text-slate-500">
              Ejemplo sin cédula (dejar vacío el primer campo):
            </p>
            <p className="font-mono text-slate-600">
              , PEREZ GARCIA, JUAN CARLOS, 2010-05-14, M
            </p>
          </div>
          <textarea
            rows={15}
            value={massiveData}
            onChange={(e) => setMassiveData(e.target.value)}
            placeholder="Pega tu lista aquí..."
            className="w-full px-3 py-2 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-blue/50 outline-none"
          />
          <div className="pt-4 flex gap-3 border-t">
            <button
              onClick={() => setShowMasivoModal(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveMasivo}
              disabled={isCreatingMasivo || !massiveData.trim()}
              className="flex-1 px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-xl shadow-md disabled:opacity-50 text-sm flex justify-center items-center gap-2"
            >
              {isCreatingMasivo ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Procesando...
                </>
              ) : (
                "Procesar y Guardar"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ✅ MODAL: ESTUDIANTES RETIRADOS (INACTIVOS) */}
      <Modal
        isOpen={showInactivosModal}
        onClose={() => setShowInactivosModal(false)}
        title={`Estudiantes Retirados - ${gradoActual?.nivel} ${gradoActual?.paralelo}`}
        size="4xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Aquí puedes ver a los estudiantes que fueron retirados de esta
            nómina. Puedes reintegrarlos si fue un error.
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Código / Cédula</th>
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estudiantesInactivos?.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-400">
                      No hay estudiantes retirados en este grado.
                    </td>
                  </tr>
                ) : (
                  estudiantesInactivos?.map((est) => (
                    <tr key={est.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-bold text-slate-700">
                          {est.codigo_interno}
                        </div>
                        {est.cedula && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            C.I: {est.cedula}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">
                        {est.apellidos} {est.nombres}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            reactivarEstudiante(est.matriculaId);
                          }}
                          className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Reintegrar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setShowInactivosModal(false)}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmModal
        isOpen={!!estudianteAEliminar}
        onClose={() => setEstudianteAEliminar(null)}
        onConfirm={async () => {
          if (estudianteAEliminar) {
            await eliminarEstudiante(estudianteAEliminar.matriculaId);
            setEstudianteAEliminar(null);
          }
        }}
        title={`¿Retirar a ${estudianteAEliminar?.nombre}?`}
        message="El estudiante desaparecerá de la nómina actual, pero sus datos se conservarán en el sistema por si vuelve a matricularse en el futuro."
        confirmText="Sí, retirar"
      />
    </div>
  );
}
