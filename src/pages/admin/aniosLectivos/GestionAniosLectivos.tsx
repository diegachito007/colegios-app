import { useState, useMemo } from "react";
import { useAniosLectivos } from "../../../hooks/useAniosLectivos";
import { useAuth } from "../../../hooks/useAuth";
import {
  Calendar,
  Plus,
  Info,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Power,
} from "lucide-react";
import Modal from "../../../components/ui/Modal";
import ConfirmModal from "../../../components/ui/ConfirmModal"; // <-- NUEVO IMPORT
import Neural from "../../../components/ui/Neural";
import type { Database } from "../../../types/database.types";

type AnioLectivoRow = Database["public"]["Tables"]["anios_lectivos"]["Row"];
type PeriodoEvaluacionRow =
  Database["public"]["Tables"]["periodos_evaluacion"]["Row"];

interface PeriodoCalculado {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  orden: number;
}

export default function GestionAniosLectivos() {
  const { profile } = useAuth();
  const {
    anios,
    isLoading,
    crearAnio,
    actualizarAnio,
    borrarAnio,
    activarAnio,
    isCreating,
  } = useAniosLectivos();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado para el modal de confirmación
  const [anioAEliminar, setAnioAEliminar] = useState<{
    id: string;
    nombre: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    tipo_evaluacion: "trimestral" as "trimestral" | "quimestral",
  });

  const [periodos, setPeriodos] = useState<PeriodoCalculado[]>([]);

  // Lógica 1: Nombre autogenerado (Ej. 2026-2027)
  const nombreGenerado = useMemo(() => {
    if (!formData.fecha_inicio || !formData.fecha_fin) return "";
    const yearInicio = new Date(formData.fecha_inicio).getFullYear();
    const yearFin = new Date(formData.fecha_fin).getFullYear();
    return `${yearInicio}-${yearFin}`;
  }, [formData.fecha_inicio, formData.fecha_fin]);

  // Lógica 2: División automática de períodos
  const calcularPeriodos = (
    inicio: string,
    fin: string,
    tipo: "trimestral" | "quimestral",
  ) => {
    if (!inicio || !fin) return [];
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const totalDias = Math.ceil(
      (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24),
    );
    const numPeriodos = tipo === "trimestral" ? 3 : 2;
    const diasPorPeriodo = Math.floor(totalDias / numPeriodos);

    const nuevosPeriodos: PeriodoCalculado[] = [];

    for (let i = 0; i < numPeriodos; i++) {
      const pInicio = new Date(
        fechaInicio.getTime() + i * diasPorPeriodo * 24 * 60 * 60 * 1000,
      );
      const pFin =
        i === numPeriodos - 1
          ? fechaFin
          : new Date(
              pInicio.getTime() + diasPorPeriodo * 24 * 60 * 60 * 1000 - 1,
            );

      const formatDate = (d: Date) => {
        const offset = d.getTimezoneOffset();
        return new Date(d.getTime() - offset * 60 * 1000)
          .toISOString()
          .split("T")[0];
      };

      nuevosPeriodos.push({
        nombre:
          tipo === "trimestral" ? `Trimestre ${i + 1}` : `Quimestre ${i + 1}`,
        fecha_inicio: formatDate(pInicio),
        fecha_fin: formatDate(pFin),
        orden: i + 1,
      });
    }
    return nuevosPeriodos;
  };

  const handleFechasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nuevosDatos = { ...formData, [name]: value };
    setFormData(nuevosDatos);
    if (nuevosDatos.fecha_inicio && nuevosDatos.fecha_fin) {
      setPeriodos(
        calcularPeriodos(
          nuevosDatos.fecha_inicio,
          nuevosDatos.fecha_fin,
          nuevosDatos.tipo_evaluacion,
        ),
      );
    }
  };

  const handleTipoChange = (tipo: "trimestral" | "quimestral") => {
    setFormData({ ...formData, tipo_evaluacion: tipo });
    if (formData.fecha_inicio && formData.fecha_fin) {
      setPeriodos(
        calcularPeriodos(formData.fecha_inicio, formData.fecha_fin, tipo),
      );
    }
  };

  const handlePeriodoManualChange = (
    index: number,
    campo: "fecha_inicio" | "fecha_fin",
    valor: string,
  ) => {
    const nuevos = [...periodos];
    nuevos[index][campo] = valor;
    setPeriodos(nuevos);
  };

  // Abrir modal para CREAR
  const handleCreateClick = () => {
    setEditingId(null);
    setFormData({
      fecha_inicio: "",
      fecha_fin: "",
      tipo_evaluacion: "trimestral",
    });
    setPeriodos([]);
    setIsModalOpen(true);
  };

  // Abrir modal para EDITAR
  const handleEditClick = (
    anio: AnioLectivoRow & { periodos_evaluacion: PeriodoEvaluacionRow[] },
  ) => {
    setEditingId(anio.id);
    setFormData({
      fecha_inicio: anio.fecha_inicio,
      fecha_fin: anio.fecha_fin,
      tipo_evaluacion:
        (anio.tipo_evaluacion as "trimestral" | "quimestral") || "trimestral",
    });

    // Cargamos los períodos existentes
    if (anio.periodos_evaluacion && anio.periodos_evaluacion.length > 0) {
      setPeriodos(
        anio.periodos_evaluacion.map((p) => ({
          nombre: p.nombre,
          fecha_inicio: p.fecha_inicio,
          fecha_fin: p.fecha_fin,
          orden: p.orden,
        })),
      );
    } else {
      setPeriodos([]);
    }

    setIsModalOpen(true);
  };

  // Activar un año lectivo
  const handleActivar = async (id: string) => {
    if (!profile?.colegio_id) return;
    try {
      await activarAnio({ id, colegioId: profile.colegio_id });
    } catch {
      // Manejado por el hook
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.colegio_id || !nombreGenerado) return;

    try {
      if (editingId) {
        // MODO EDICIÓN
        await actualizarAnio({
          id: editingId,
          anio: {
            nombre: nombreGenerado,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            tipo_evaluacion: formData.tipo_evaluacion,
          },
          periodos: periodos,
        });
      } else {
        // MODO CREACIÓN
        await crearAnio({
          anio: {
            colegio_id: profile.colegio_id,
            nombre: nombreGenerado,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            tipo_evaluacion: formData.tipo_evaluacion,
            es_actual: anios?.length === 0,
          },
          periodos: periodos,
        });
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        fecha_inicio: "",
        fecha_fin: "",
        tipo_evaluacion: "trimestral",
      });
      setPeriodos([]);
    } catch {
      // Manejado por el hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      {/* 🧠 RED NEURONAL DE FONDO */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Neural />
      </div>

      {/* Contenido con z-10 para que esté por encima */}
      <div className="relative z-10 p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
              Años Lectivos
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Configura los periodos académicos de tu institución.
            </p>
          </div>
          <button
            onClick={handleCreateClick}
            className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md font-semibold text-sm"
          >
            <Plus size={18} /> Nuevo Año Lectivo
          </button>
        </div>

        <div className="grid gap-4">
          {anios?.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">
                No hay años lectivos
              </h3>
              <p className="text-slate-500 mb-6">
                Crea tu primer año lectivo para empezar a configurar grados y
                materias.
              </p>
            </div>
          ) : (
            anios?.map(
              (
                anio: AnioLectivoRow & {
                  periodos_evaluacion: PeriodoEvaluacionRow[];
                },
              ) => (
                <div
                  key={anio.id}
                  className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-brand-blue">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                          {anio.nombre}
                          {anio.es_actual && (
                            <span className="bg-emerald-100 text-emerald-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={12} /> Actual
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Desde{" "}
                          {new Date(anio.fecha_inicio).toLocaleDateString()}{" "}
                          hasta {new Date(anio.fecha_fin).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-lg capitalize mr-2">
                        {anio.tipo_evaluacion}
                      </div>

                      {/* BOTÓN DE ACTIVAR (Solo si NO es el actual) */}
                      {!anio.es_actual && (
                        <button
                          onClick={() => handleActivar(anio.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-brand-blue hover:bg-blue-100 rounded-lg transition-colors text-xs font-semibold"
                          title="Marcar como año actual"
                        >
                          <Power size={14} /> Activar
                        </button>
                      )}

                      <button
                        onClick={() => handleEditClick(anio)}
                        className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar año lectivo"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setAnioAEliminar({ id: anio.id, nombre: anio.nombre })
                        } // <-- Abre el modal
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar año lectivo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>

      {/* MODAL CREAR / EDITAR AÑO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Año Lectivo" : "Crear Año Lectivo"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {nombreGenerado && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-sm text-brand-blue">
              <Info size={16} />
              <span>
                Año lectivo: <strong>{nombreGenerado}</strong>
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                required
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleFechasChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Fecha de Fin *
              </label>
              <input
                type="date"
                required
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleFechasChange}
                min={formData.fecha_inicio}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tipo de Evaluación *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTipoChange("trimestral")}
                className={`p-3 border rounded-xl transition-all text-left ${formData.tipo_evaluacion === "trimestral" ? "border-brand-blue bg-blue-50 ring-1 ring-brand-blue" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
              >
                <div className="font-bold text-brand-dark text-sm">
                  Trimestral
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  3 períodos de evaluación
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange("quimestral")}
                className={`p-3 border rounded-xl transition-all text-left ${formData.tipo_evaluacion === "quimestral" ? "border-brand-blue bg-blue-50 ring-1 ring-brand-blue" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
              >
                <div className="font-bold text-brand-dark text-sm">
                  Quimestral
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  2 períodos de evaluación
                </div>
              </button>
            </div>
          </div>

          {periodos.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-brand-dark mb-3 flex items-center gap-2">
                <Clock size={16} className="text-brand-blue" /> Períodos
                calculados (editable)
              </h4>
              <div className="space-y-3">
                {periodos.map((periodo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-brand-blue text-xs font-bold flex items-center justify-center shrink-0">
                      {periodo.orden}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={periodo.fecha_inicio}
                        onChange={(e) =>
                          handlePeriodoManualChange(
                            idx,
                            "fecha_inicio",
                            e.target.value,
                          )
                        }
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-brand-blue outline-none"
                      />
                      <input
                        type="date"
                        value={periodo.fecha_fin}
                        onChange={(e) =>
                          handlePeriodoManualChange(
                            idx,
                            "fecha_fin",
                            e.target.value,
                          )
                        }
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-brand-blue outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !nombreGenerado}
              className="flex-1 px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating
                ? "Guardando..."
                : editingId
                  ? "Actualizar Año"
                  : "Guardar Año"}
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================
          MODAL DE CONFIRMACIÓN DE BORRADO 
      ========================================= */}
      <ConfirmModal
        isOpen={!!anioAEliminar}
        onClose={() => setAnioAEliminar(null)}
        onConfirm={async () => {
          if (anioAEliminar) {
            await borrarAnio(anioAEliminar.id);
            setAnioAEliminar(null);
          }
        }}
        title={`¿Eliminar el año lectivo ${anioAEliminar?.nombre}?`}
        message={
          <>
            Estás a punto de eliminar el año lectivo. Se borrarán{" "}
            <strong>todos los períodos de evaluación</strong>{" "}
            (trimestres/quimestres) asociados.
            <br />
            <br />
            <span className="text-red-500 font-semibold text-xs">
              Esta acción no se puede deshacer.
            </span>
          </>
        }
        confirmText="Sí, eliminar"
      />
    </div>
  );
}
