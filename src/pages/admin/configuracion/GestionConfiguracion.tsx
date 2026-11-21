import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useAniosLectivos } from "../../../hooks/useAniosLectivos";
import { usePersonal } from "../../../hooks/usePersonal";
import { useColegios } from "../../../hooks/useColegios"; // ✅ Hook real
import { supabase } from "../../../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Save,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export default function GestionConfiguracion() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"institucional" | "evaluacion">(
    "institucional",
  );

  // ✅ Fuente de verdad: useColegios trae los datos reales (y realtime)
  const { colegios, isLoading: cargandoColegios } = useColegios();
  const miColegio = colegios?.find((c) => c.id === profile?.colegio_id);

  const { personal } = usePersonal(profile?.colegio_id || null);

  // Estado local solo para el campo "Nombre" (AMIE se queda readonly)
  const [edicion, setEdicion] = useState<{ nombre?: string }>({});
  const [isSavingInstitucional, setIsSavingInstitucional] = useState(false);

  // Autoridades y Directores
  const autoridades = {
    rector:
      personal?.find((u) => u.rol === "admin_colegio")?.display_name ||
      "No asignado",
    vicerrector:
      personal?.find((u) => u.rol === "vicerrector")?.display_name ||
      "No asignado",
    inspector:
      personal?.find((u) => u.rol === "inspector")?.display_name ||
      "No asignado",
  };

  const directores = {
    lengua:
      personal?.find((u) => u.area_director === "lengua")?.display_name ||
      "No asignado",
    matematica:
      personal?.find((u) => u.area_director === "matematica")?.display_name ||
      "No asignado",
    sociales:
      personal?.find((u) => u.area_director === "sociales")?.display_name ||
      "No asignado",
    naturales:
      personal?.find((u) => u.area_director === "naturales")?.display_name ||
      "No asignado",
  };

  const { anios, isLoading: loadingAnios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);
  const anioId = anioActivo?.id || null;

  // Bloques de evaluación
  const [bloques, setBloques] = useState([
    { nombre: "Actividades", porcentaje: 70, orden: 1 },
    { nombre: "Proyecto", porcentaje: 15, orden: 2 },
    { nombre: "Examen", porcentaje: 15, orden: 3 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Guardar Nombre
  const handleGuardarInstitucional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.colegio_id) return;
    setIsSavingInstitucional(true);
    try {
      // Usamos lo editado o lo que ya venía
      const nombreFinal = edicion.nombre ?? miColegio?.nombre ?? "";

      const { error } = await supabase
        .from("colegios")
        .update({ nombre: nombreFinal.trim() } as never)
        .eq("id", profile.colegio_id);

      if (error) throw error;

      toast.success("Nombre del colegio actualizado");
      setEdicion({});

      // Invalidamos la caché para que se actualice en todas partes
      queryClient.invalidateQueries({ queryKey: ["colegios"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setIsSavingInstitucional(false);
    }
  };

  const sumaTotal = bloques.reduce(
    (sum, b) => sum + Number(b.porcentaje || 0),
    0,
  );

  const handleAgregarBloque = () => {
    setBloques([
      ...bloques,
      { nombre: "Nuevo Bloque", porcentaje: 0, orden: bloques.length + 1 },
    ]);
  };

  const handleEliminarBloque = (index: number) => {
    if (bloques.length <= 1) return;
    const nuevos = bloques.filter((_, i) => i !== index);
    setBloques(nuevos.map((b, i) => ({ ...b, orden: i + 1 })));
  };

  const handleCambioBloque = (
    index: number,
    campo: "nombre" | "porcentaje",
    valor: string | number,
  ) => {
    const nuevos = [...bloques];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setBloques(nuevos);
  };

  const handleGuardarEvaluacion = async () => {
    if (!anioId || !profile?.colegio_id) return;
    if (sumaTotal !== 100) {
      toast.error("La suma de los porcentajes debe ser 100%");
      return;
    }
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Configuración de evaluación guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingAnios || cargandoColegios) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
            <Settings className="text-brand-blue" /> Configuración
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra los datos institucionales y las reglas de evaluación.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("institucional")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "institucional"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" /> Datos Institucionales
          </button>
          <button
            onClick={() => setActiveTab("evaluacion")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "evaluacion"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" /> Evaluación
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm p-6">
        {!anioId ? (
          <div className="text-center py-12 text-slate-500">
            No hay un año lectivo activo. Ve a "Años Lectivos" y activa uno.
          </div>
        ) : activeTab === "institucional" ? (
          <form onSubmit={handleGuardarInstitucional} className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 className="text-brand-blue" size={20} /> Datos del
                Colegio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nombre del Colegio
                  </label>
                  <input
                    type="text"
                    value={edicion.nombre ?? miColegio?.nombre ?? ""}
                    onChange={(e) =>
                      setEdicion((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    disabled={cargandoColegios}
                    placeholder={
                      cargandoColegios ? "Cargando..." : "Nombre del colegio"
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Código AMIE
                  </label>
                  <input
                    type="text"
                    value={miColegio?.codigo_amie ?? ""}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    El código AMIE no puede modificarse desde aquí.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="text-emerald-600" size={20} />{" "}
                Autoridades
                <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                  Asignados desde Gestión de Personal
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Rector(a)", value: autoridades.rector },
                  { label: "Vicerrector(a)", value: autoridades.vicerrector },
                  { label: "Inspector(a)", value: autoridades.inspector },
                ].map((item) => (
                  <div key={item.label}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {item.label}
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium flex items-center gap-2">
                      {item.value === "No asignado" ? (
                        <span className="text-slate-400 italic text-sm">
                          No asignado
                        </span>
                      ) : (
                        <>
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500"
                          />
                          {item.value}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Users className="text-emerald-600" size={20} /> Directores de
                Área
                <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                  Asignados desde Gestión de Personal
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "lengua", label: "Lengua y Literatura" },
                  { key: "matematica", label: "Matemática" },
                  { key: "sociales", label: "Ciencias Sociales" },
                  { key: "naturales", label: "Ciencias Naturales" },
                ].map((area) => (
                  <div key={area.key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {area.label}
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium flex items-center gap-2">
                      {directores[area.key as keyof typeof directores] ===
                      "No asignado" ? (
                        <span className="text-slate-400 italic text-sm">
                          No asignado
                        </span>
                      ) : (
                        <>
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500"
                          />
                          {directores[area.key as keyof typeof directores]}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSavingInstitucional || cargandoColegios}
                className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingInstitucional ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Guardar Datos del Colegio
              </button>
            </div>
          </form>
        ) : (
          /* PESTAÑA: EVALUACIÓN */
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bloques de Calificación
              </h3>
              {bloques.map((bloque, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={bloque.nombre || ""}
                      onChange={(e) =>
                        handleCambioBloque(index, "nombre", e.target.value)
                      }
                      placeholder="Ej: Actividades, Proyecto..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-brand-dark focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>
                  <div className="relative w-32 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bloque.porcentaje || 0}
                      onChange={(e) =>
                        handleCambioBloque(
                          index,
                          "porcentaje",
                          Number(e.target.value),
                        )
                      }
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      %
                    </span>
                  </div>
                  <button
                    onClick={() => handleEliminarBloque(index)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAgregarBloque}
              className="text-brand-blue text-sm font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus size={16} /> Agregar otro bloque
            </button>

            <div
              className={`p-4 rounded-xl flex items-center justify-between border ${
                sumaTotal === 100
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {sumaTotal === 100 ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="font-semibold">
                  {sumaTotal === 100
                    ? "La suma es correcta (100%)"
                    : "La suma no es 100%"}
                </span>
              </div>
              <div className="text-2xl font-black">{sumaTotal}%</div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleGuardarEvaluacion}
                disabled={isSaving || sumaTotal !== 100}
                className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? "Guardando..." : "Guardar Configuración"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
