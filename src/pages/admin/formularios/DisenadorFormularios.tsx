import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useFormularios } from "../../../hooks/useFormularios";
import Neural from "../../../components/ui/Neural";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import Modal from "../../../components/ui/Modal";
import {
  Plus,
  Trash2,
  Type,
  List,
  CheckSquare,
  AlignLeft,
  Calendar,
  ArrowLeft,
  Loader2,
  Save,
  FileText,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  LayoutTemplate,
  Power,
  Pencil,
  Columns,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { PLANTILLAS_FORMULARIOS } from "../../../utils/plantillasFormularios";
import type { Database } from "../../../types/database.types";

type FormularioRow = Database["public"]["Tables"]["formularios_colegio"]["Row"];
type TipoCampo =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "number";

interface CampoFormulario {
  id: string;
  tipo: TipoCampo;
  label: string;
  required: boolean;
  options?: string[];
}

interface FilaFormulario {
  id: string;
  columnas: number;
  campos: CampoFormulario[];
}

export default function DisenadorFormularios() {
  const { profile } = useAuth();
  const {
    formularios,
    isLoading,
    crearFormulario,
    actualizarFormulario,
    isCreating,
    eliminarFormulario,
  } = useFormularios(profile?.colegio_id || null);

  const [view, setView] = useState<"LISTA" | "CREAR">("LISTA");
  const [showPlantillasModal, setShowPlantillasModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [filas, setFilas] = useState<FilaFormulario[]>([]);

  const [formularioAEliminar, setFormularioAEliminar] = useState<{
    id: string;
    nombre: string;
  } | null>(null);

  // --- LÓGICA DE PLANTILLAS Y EDICIÓN ---
  const cargarPlantilla = (plantilla: (typeof PLANTILLAS_FORMULARIOS)[0]) => {
    // ✅ SOLUCIÓN: Tipamos el map con 'typeof plantilla.esquema[0]' en lugar de 'any'
    const filasConId = plantilla.esquema.map(
      (fila: (typeof plantilla.esquema)[0]) => ({
        id: Math.random().toString(36).substring(2, 9),
        columnas: fila.columnas,
        campos: fila.campos.map((c: (typeof fila.campos)[0]) => ({
          ...c,
          tipo: c.tipo as TipoCampo, // Aseguramos el tipo
          id: Math.random().toString(36).substring(2, 9),
        })),
      }),
    );

    setEditingId(null);
    setNombre(plantilla.nombre);
    setDescripcion(plantilla.descripcion);
    setFilas(filasConId);
    setShowPlantillasModal(false);
    setView("CREAR");
  };

  const editarFormulario = (form: FormularioRow) => {
    setEditingId(form.id);
    setNombre(form.nombre);
    setDescripcion(form.descripcion || "");
    const esquemaGuardado = form.esquema as unknown as Omit<
      FilaFormulario,
      "id"
    >[];
    const filasConId = esquemaGuardado.map((fila) => ({
      ...fila,
      id: Math.random().toString(36).substring(2, 9),
      campos: fila.campos.map((c) => ({
        ...c,
        tipo: c.tipo as TipoCampo,
        id: Math.random().toString(36).substring(2, 9),
      })),
    }));
    setFilas(filasConId);
    setView("CREAR");
  };

  // --- ACCIONES DE LA LISTA ---
  const toggleActivo = async (id: string, activoActual: boolean) => {
    await actualizarFormulario(id, { activo: !activoActual });
  };

  const moverOrden = async (
    form: FormularioRow,
    direccion: "arriba" | "abajo",
  ) => {
    if (!formularios) return;
    const index = formularios.findIndex((f) => f.id === form.id);
    if (direccion === "arriba" && index > 0) {
      const anterior = formularios[index - 1];
      await actualizarFormulario(form.id, { orden: anterior.orden });
      await actualizarFormulario(anterior.id, { orden: form.orden });
    }
    if (direccion === "abajo" && index < formularios.length - 1) {
      const siguiente = formularios[index + 1];
      await actualizarFormulario(form.id, { orden: siguiente.orden });
      await actualizarFormulario(siguiente.id, { orden: form.orden });
    }
  };

  // --- CONSTRUCTOR ---
  const agregarFila = () => {
    setFilas([
      ...filas,
      {
        id: Math.random().toString(36).substring(2, 9),
        columnas: 2,
        campos: [],
      },
    ]);
  };

  const eliminarFila = (filaId: string) => {
    setFilas(filas.filter((f) => f.id !== filaId));
  };

  const cambiarColumnas = (filaId: string, num: number) => {
    setFilas(filas.map((f) => (f.id === filaId ? { ...f, columnas: num } : f)));
  };

  const agregarCampoAFila = (filaId: string, tipo: TipoCampo) => {
    setFilas(
      filas.map((f) => {
        if (f.id !== filaId) return f;
        if (f.campos.length >= f.columnas) {
          toast.error(
            "Esta fila ya está llena. Agrega otra fila o cambia el número de columnas.",
          );
          return f;
        }
        return {
          ...f,
          campos: [
            ...f.campos,
            {
              id: Math.random().toString(36).substring(2, 9),
              tipo,
              label: "",
              required: false,
              options: tipo === "select" ? ["Opción 1", "Opción 2"] : undefined,
            },
          ],
        };
      }),
    );
  };

  const actualizarCampo = (
    filaId: string,
    campoId: string,
    cambios: Partial<CampoFormulario>,
  ) => {
    setFilas(
      filas.map((f) => {
        if (f.id !== filaId) return f;
        return {
          ...f,
          campos: f.campos.map((c) =>
            c.id === campoId ? { ...c, ...cambios } : c,
          ),
        };
      }),
    );
  };

  const eliminarCampo = (filaId: string, campoId: string) => {
    setFilas(
      filas.map((f) => {
        if (f.id !== filaId) return f;
        return { ...f, campos: f.campos.filter((c) => c.id !== campoId) };
      }),
    );
  };

  const guardarFormulario = async () => {
    if (!nombre.trim())
      return toast.error("El nombre del formulario es obligatorio.");
    if (filas.length === 0)
      return toast.error("Agrega al menos una fila al formulario.");

    for (const fila of filas) {
      const campoVacio = fila.campos.find((c) => !c.label.trim());
      if (campoVacio)
        return toast.error("Todos los campos deben tener una etiqueta.");
    }

    if (!profile?.colegio_id) return;

    const esquemaLimpio = filas.map((f) => ({
      columnas: f.columnas,
      campos: f.campos.map((c) => ({
        tipo: c.tipo,
        label: c.label,
        required: c.required,
        options: c.options,
      })),
    }));

    if (editingId) {
      await actualizarFormulario(editingId, {
        nombre,
        descripcion,
        esquema: esquemaLimpio,
      });
      toast.success("Formulario actualizado correctamente");
    } else {
      await crearFormulario({
        colegio_id: profile.colegio_id,
        nombre,
        descripcion,
        esquema: esquemaLimpio,
        activo: true,
        orden: (formularios?.length || 0) + 1,
      });
    }

    setView("LISTA");
    setEditingId(null);
    setNombre("");
    setDescripcion("");
    setFilas([]);
  };

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue w-10 h-10" />
      </div>
    );

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden p-8">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Neural />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {view === "CREAR" && (
              <button
                onClick={() => {
                  setView("LISTA");
                  setEditingId(null);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-blue-800 mb-2"
              >
                <ArrowLeft size={16} /> Volver a mis Formularios
              </button>
            )}
            <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              {view === "LISTA"
                ? "Diseño de Fichas"
                : editingId
                  ? "Editar Formulario"
                  : "Crear Nuevo Formulario"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {view === "LISTA"
                ? "Activa, ordena y gestiona las fichas que los padres deberán llenar."
                : "Diseña la estructura de tu ficha agregando filas y columnas."}
            </p>
          </div>

          {view === "LISTA" && (
            <button
              onClick={() => setShowPlantillasModal(true)}
              className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md font-semibold text-sm"
            >
              <Plus size={18} /> Agregar Ficha
            </button>
          )}
          {view === "CREAR" && (
            <button
              onClick={guardarFormulario}
              disabled={isCreating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md font-semibold text-sm disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />{" "}
                  {editingId ? "Actualizar Formulario" : "Guardar Formulario"}
                </>
              )}
            </button>
          )}
        </div>

        {/* VISTA 1: LISTA */}
        {view === "LISTA" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {!formularios || formularios.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  No has creado ningún formulario
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-center w-16">Orden</th>
                    <th className="px-4 py-3">Nombre de la Ficha</th>
                    <th className="px-4 py-3 text-center w-24">Filas</th>
                    <th className="px-4 py-3 text-center w-32">Estado</th>
                    <th className="px-4 py-3 text-center w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formularios.map((form, index) => (
                    <tr
                      key={form.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => moverOrden(form, "arriba")}
                            disabled={index === 0}
                            className="text-slate-400 hover:text-brand-blue disabled:opacity-20"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {form.orden}
                          </span>
                          <button
                            onClick={() => moverOrden(form, "abajo")}
                            disabled={index === formularios.length - 1}
                            className="text-slate-400 hover:text-brand-blue disabled:opacity-20"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-brand-dark">
                          {form.nombre}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {form.descripcion || "Sin descripción"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-semibold bg-blue-50 text-brand-blue px-2 py-1 rounded-md">
                          {Array.isArray(form.esquema)
                            ? form.esquema.length
                            : 0}{" "}
                          filas
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActivo(form.id, form.activo)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${form.activo ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                        >
                          <Power size={12} />{" "}
                          {form.activo ? "Activa" : "Inactiva"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => editarFormulario(form)}
                            className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setFormularioAEliminar({
                                id: form.id,
                                nombre: form.nombre,
                              })
                            }
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VISTA 2: CONSTRUCTOR POR FILAS */}
        {view === "CREAR" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">
                  Datos del Formulario
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nombre de la Ficha *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={agregarFila}
                className="w-full bg-brand-blue hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-md font-bold text-sm"
              >
                <Plus size={18} /> Agregar Nueva Fila
              </button>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {filas.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
                  <Columns size={48} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    El formulario está vacío
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Haz clic en "Agregar Nueva Fila" para empezar a diseñar.
                  </p>
                </div>
              ) : (
                filas.map((fila, filaIndex) => (
                  <div
                    key={fila.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative group"
                  >
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Fila {filaIndex + 1}
                        </span>
                        <div className="flex bg-slate-100 rounded-lg p-0.5 ml-2">
                          {[1, 2, 3].map((num) => (
                            <button
                              key={num}
                              onClick={() => cambiarColumnas(fila.id, num)}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${fila.columnas === num ? "bg-white text-brand-blue shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                              {num} Col
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarFila(fila.id)}
                        className="text-slate-300 hover:text-red-500 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div
                      className={`grid grid-cols-1 ${fila.columnas === 3 ? "md:grid-cols-3" : fila.columnas === 2 ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4`}
                    >
                      {fila.campos.map((campo) => (
                        <div
                          key={campo.id}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative group/campo"
                        >
                          <div className="absolute -right-2 -top-2 opacity-0 group-hover/campo:opacity-100 transition-opacity">
                            <button
                              onClick={() => eliminarCampo(fila.id, campo.id)}
                              className="bg-white border border-slate-200 text-red-500 rounded-full p-1 shadow-sm hover:bg-red-50"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          <label className="text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1 block">
                            Etiqueta
                          </label>
                          <input
                            type="text"
                            value={campo.label}
                            onChange={(e) =>
                              actualizarCampo(fila.id, campo.id, {
                                label: e.target.value,
                              })
                            }
                            placeholder="Ej: Nombres completos"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none mb-2 font-medium"
                          />

                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={campo.required}
                                onChange={(e) =>
                                  actualizarCampo(fila.id, campo.id, {
                                    required: e.target.checked,
                                  })
                                }
                                className="w-3.5 h-3.5 rounded border-slate-300 text-brand-blue"
                              />
                              Obligatorio
                            </label>
                            <span className="text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">
                              {campo.tipo}
                            </span>
                          </div>

                          {campo.tipo === "select" && (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={campo.options?.join(", ")}
                                onChange={(e) =>
                                  actualizarCampo(fila.id, campo.id, {
                                    options: e.target.value
                                      .split(",")
                                      .map((o) => o.trim()),
                                  })
                                }
                                placeholder="Opciones separadas por coma"
                                className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-brand-blue/50 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {fila.campos.length < fila.columnas && (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 min-h-[120px]">
                          <p className="text-xs font-semibold text-slate-400 mb-2">
                            Agregar campo
                          </p>
                          <div className="flex gap-1 flex-wrap justify-center">
                            <button
                              onClick={() => agregarCampoAFila(fila.id, "text")}
                              className="p-2 bg-white border border-slate-200 rounded-lg hover:text-brand-blue hover:border-brand-blue shadow-sm"
                              title="Texto Corto"
                            >
                              <Type size={14} />
                            </button>
                            <button
                              onClick={() =>
                                agregarCampoAFila(fila.id, "textarea")
                              }
                              className="p-2 bg-white border border-slate-200 rounded-lg hover:text-brand-blue hover:border-brand-blue shadow-sm"
                              title="Texto Largo"
                            >
                              <AlignLeft size={14} />
                            </button>
                            <button
                              onClick={() =>
                                agregarCampoAFila(fila.id, "select")
                              }
                              className="p-2 bg-white border border-slate-200 rounded-lg hover:text-brand-blue hover:border-brand-blue shadow-sm"
                              title="Selector"
                            >
                              <List size={14} />
                            </button>
                            <button
                              onClick={() =>
                                agregarCampoAFila(fila.id, "number")
                              }
                              className="p-2 bg-white border border-slate-200 rounded-lg hover:text-brand-blue hover:border-brand-blue shadow-sm"
                              title="Número"
                            >
                              <Type size={14} />
                            </button>
                            <button
                              onClick={() => agregarCampoAFila(fila.id, "date")}
                              className="p-2 bg-white border border-slate-200 rounded-lg hover:text-brand-blue hover:border-brand-blue shadow-sm"
                              title="Fecha"
                            >
                              <Calendar size={14} />
                            </button>
                            <button
                              onClick={() =>
                                agregarCampoAFila(fila.id, "checkbox")
                              }
                              className="p-2 bg-white border border-slate-200 rounded-lg hover:text-brand-blue hover:border-brand-blue shadow-sm"
                              title="Checkbox"
                            >
                              <CheckSquare size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {fila.campos.length === fila.columnas && (
                      <p className="text-[11px] text-amber-600 text-center mt-2 bg-amber-50 py-1 rounded-md">
                        Fila llena ({fila.columnas}/{fila.columnas}). Agrega
                        otra fila si necesitas más campos.
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL PLANTILLAS */}
      <Modal
        isOpen={showPlantillasModal}
        onClose={() => setShowPlantillasModal(false)}
        title="Catálogo de Plantillas"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Selecciona una plantilla base para cargar sus campos y luego
            editarla a tu gusto.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {PLANTILLAS_FORMULARIOS.map((plantilla) => (
              <button
                key={plantilla.id}
                onClick={() => cargarPlantilla(plantilla)}
                className="flex flex-col text-left p-4 rounded-xl border border-slate-200 hover:border-brand-blue hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <LayoutTemplate size={18} className="text-brand-blue" />
                  <span className="font-bold text-slate-700 group-hover:text-brand-blue">
                    {plantilla.nombre}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {plantilla.descripcion}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-blue">
                  <CheckCircle2 size={14} /> {plantilla.esquema.length} filas
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL BORRAR */}
      <ConfirmModal
        isOpen={!!formularioAEliminar}
        onClose={() => setFormularioAEliminar(null)}
        onConfirm={async () => {
          if (formularioAEliminar) {
            await eliminarFormulario(formularioAEliminar.id);
            setFormularioAEliminar(null);
          }
        }}
        title={`¿Eliminar "${formularioAEliminar?.nombre}"?`}
        message="Se borrarán las respuestas guardadas. Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
      />
    </div>
  );
}
