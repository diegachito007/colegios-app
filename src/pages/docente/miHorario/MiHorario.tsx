import { useState, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useAniosLectivos } from "../../../hooks/useAniosLectivos";
import { useHorarios } from "../../../hooks/useHorarios";
import type {
  BloqueHorario,
  HorarioConRelaciones,
} from "../../../hooks/useHorarios";
import { useCurriculo } from "../../../hooks/useCurriculo";
import Neural from "../../../components/ui/Neural";
import {
  BookOpen,
  Loader2,
  Trash2,
  CheckCircle2,
  Plus,
  Lock,
  AlertTriangle,
} from "lucide-react";
import type { Database } from "../../../types/database.types";
import toast from "react-hot-toast";
import Modal from "../../../components/ui/Modal";

type GradoRow = Database["public"]["Tables"]["grados"]["Row"];

const DIAS_SEMANA = [
  { id: 1, nombre: "Lun" },
  { id: 2, nombre: "Mar" },
  { id: 3, nombre: "Mié" },
  { id: 4, nombre: "Jue" },
  { id: 5, nombre: "Vie" },
];

const HORAS_DIA = 7;

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

// ✅ Estado visual de cada celda
type EstadoCelda =
  | { tipo: "libre" }
  | { tipo: "mia"; asignacion: HorarioConRelaciones; nombreMateria: string }
  | { tipo: "otro_docente"; nombreMateria: string; nombreDocente: string }
  | { tipo: "mio_otro_grado"; nombreMateria: string; etiquetaGrado: string };

export default function MiHorario() {
  const { user } = useAuth();
  const { anios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);

  const usuarioId = user?.id || null;

  const [selectedGradoId, setSelectedGradoId] = useState<string>("");
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{
    dia: number;
    hora: number;
  } | null>(null);

  const {
    gradosAsignados,
    horariosDelGrado,
    horariosDelDocente,
    isLoading,
    guardarHorario,
    eliminarHorario,
    isSaving,
    colegioId,
    docenteId: docenteIdReal,
  } = useHorarios(usuarioId, selectedGradoId || null, anioActivo?.id || null);

  const { materias, isLoading: isLoadingCurriculo } = useCurriculo(
    selectedGradoId || null,
    colegioId || null,
    anioActivo?.id || null,
  );

  const gradosOrdenados = useMemo(() => {
    if (!gradosAsignados) return [];
    return [...gradosAsignados].sort((a, b) => {
      const pesoA = getOrdenNivel(a.nivel);
      const pesoB = getOrdenNivel(b.nivel);
      if (pesoA !== pesoB) return pesoA - pesoB;
      return a.paralelo.localeCompare(b.paralelo);
    });
  }, [gradosAsignados]);

  // ✅ Mapa de bloques ocupados por MÍ en TODOS los grados
  const ocupacionDocente = useMemo(() => {
    const mapa = new Map<
      string,
      {
        materiaId: string;
        gradoId: string;
        nombreMateria: string;
        etiquetaGrado: string;
      }
    >();
    (horariosDelDocente ?? []).forEach((h) => {
      const etiquetaGrado = h.grados
        ? `${h.grados.nivel} - ${h.grados.paralelo}`
        : "otro grado";
      const nombreMateria = h.materias_destrezas?.nombre || "Materia";
      ((h.horario || []) as BloqueHorario[]).forEach((b) => {
        b.horas.forEach((hora) => {
          mapa.set(`${b.dia}-${hora}`, {
            materiaId: h.materia_id,
            gradoId: h.grado_id,
            nombreMateria,
            etiquetaGrado,
          });
        });
      });
    });
    return mapa;
  }, [horariosDelDocente]);

  // ✅ Mapa de bloques ocupados en el GRADO actual (por cualquier docente)
  const ocupacionGrado = useMemo(() => {
    const mapa = new Map<
      string,
      {
        materiaId: string;
        docenteId: string;
        nombreMateria: string;
        nombreDocente: string;
      }
    >();
    (horariosDelGrado ?? []).forEach((h) => {
      const nombreDocente = h.docentes
        ? `${h.docentes.nombres} ${h.docentes.apellidos}`.trim()
        : "otro docente";
      const nombreMateria = h.materias_destrezas?.nombre || "Materia";
      ((h.horario || []) as BloqueHorario[]).forEach((b) => {
        b.horas.forEach((hora) => {
          mapa.set(`${b.dia}-${hora}`, {
            materiaId: h.materia_id,
            docenteId: h.docente_id,
            nombreMateria,
            nombreDocente,
          });
        });
      });
    });
    return mapa;
  }, [horariosDelGrado]);

  const misMaterias = useMemo(() => {
    if (!horariosDelGrado || !docenteIdReal) return [];
    return horariosDelGrado.filter((h) => h.docente_id === docenteIdReal);
  }, [horariosDelGrado, docenteIdReal]);

  const materiasDisponibles = useMemo(() => {
    if (!materias || !horariosDelGrado) return [];
    const tomadasIds = new Set(horariosDelGrado.map((h) => h.materia_id));
    return materias.filter((m) => !tomadasIds.has(m.id));
  }, [materias, horariosDelGrado]);

  const cargaTotal = useMemo(() => {
    return (horariosDelDocente ?? []).reduce(
      (acc, h) =>
        acc +
        ((h.horario || []) as BloqueHorario[]).reduce(
          (a, b) => a + b.horas.length,
          0,
        ),
      0,
    );
  }, [horariosDelDocente]);

  const getEstadoCelda = (dia: number, hora: number): EstadoCelda => {
    const clave = `${dia}-${hora}`;
    const mia = misMaterias.find((h) =>
      ((h.horario || []) as BloqueHorario[]).some(
        (b) => b.dia === dia && b.horas.includes(hora),
      ),
    );
    if (mia)
      return {
        tipo: "mia",
        asignacion: mia,
        nombreMateria: mia.materias_destrezas?.nombre || "Materia",
      };

    const delGrado = ocupacionGrado.get(clave);
    if (delGrado && delGrado.docenteId !== docenteIdReal)
      return {
        tipo: "otro_docente",
        nombreMateria: delGrado.nombreMateria,
        nombreDocente: delGrado.nombreDocente,
      };

    const miaOtroGrado = ocupacionDocente.get(clave);
    if (miaOtroGrado && miaOtroGrado.gradoId !== selectedGradoId)
      return {
        tipo: "mio_otro_grado",
        nombreMateria: miaOtroGrado.nombreMateria,
        etiquetaGrado: miaOtroGrado.etiquetaGrado,
      };

    return { tipo: "libre" };
  };

  const asignarMateria = async (materiaId: string) => {
    if (!docenteIdReal || !selectedGradoId || !anioActivo || !colegioId) return;
    await guardarHorario({
      colegio_id: colegioId,
      anio_lectivo_id: anioActivo.id,
      docente_id: docenteIdReal,
      grado_id: selectedGradoId,
      materia_id: materiaId,
      horario: [],
    });
  };

  const handleAsignarHora = async (
    materiaId: string,
    dia: number,
    hora: number,
  ) => {
    if (!docenteIdReal || !selectedGradoId || !anioActivo || !colegioId) return;
    const asignacion = misMaterias.find((a) => a.materia_id === materiaId);
    if (!asignacion) return;
    const clave = `${dia}-${hora}`;

    const ocupadoDocente = ocupacionDocente.get(clave);
    if (ocupadoDocente && ocupadoDocente.materiaId !== materiaId) {
      toast.error(
        `Ya dictas "${ocupadoDocente.nombreMateria}" en ${ocupadoDocente.etiquetaGrado} en este bloque.`,
        { duration: 5000 },
      );
      return;
    }
    const ocupadoGrado = ocupacionGrado.get(clave);
    if (ocupadoGrado && ocupadoGrado.materiaId !== materiaId) {
      toast.error(
        `Este grado ya tiene "${ocupadoGrado.nombreMateria}" con ${ocupadoGrado.nombreDocente} en este bloque.`,
        { duration: 5000 },
      );
      return;
    }

    const horarioActual = (asignacion.horario || []) as BloqueHorario[];
    const bloqueDia = horarioActual.find((b) => b.dia === dia);
    if (bloqueDia?.horas.includes(hora)) return;

    const nuevoHorario = bloqueDia
      ? horarioActual.map((b) =>
          b.dia === dia
            ? { ...b, horas: [...b.horas, hora].sort((x, y) => x - y) }
            : b,
        )
      : [...horarioActual, { dia, horas: [hora] }].sort(
          (a, b) => a.dia - b.dia,
        );

    await guardarHorario({
      colegio_id: colegioId,
      anio_lectivo_id: anioActivo.id,
      docente_id: docenteIdReal,
      grado_id: selectedGradoId,
      materia_id: asignacion.materia_id,
      horario: nuevoHorario,
    });
    setCeldaSeleccionada(null);
  };

  const handleQuitarHora = async (
    materiaId: string,
    dia: number,
    hora: number,
  ) => {
    if (!docenteIdReal || !selectedGradoId || !anioActivo || !colegioId) return;
    const asignacion = misMaterias.find((a) => a.materia_id === materiaId);
    if (!asignacion) return;
    const horarioActual = (asignacion.horario || []) as BloqueHorario[];
    const nuevoHorario = horarioActual
      .map((b) =>
        b.dia === dia ? { ...b, horas: b.horas.filter((h) => h !== hora) } : b,
      )
      .filter((b) => b.horas.length > 0);
    await guardarHorario({
      colegio_id: colegioId,
      anio_lectivo_id: anioActivo.id,
      docente_id: docenteIdReal,
      grado_id: selectedGradoId,
      materia_id: asignacion.materia_id,
      horario: nuevoHorario,
    });
    setCeldaSeleccionada(null);
  };

  // ✅ VALIDACIÓN AL HACER CLIC EN UNA CELDA
  const handleClickCelda = (dia: number, hora: number) => {
    const estado = getEstadoCelda(dia, hora);

    if (estado.tipo === "mio_otro_grado") {
      toast.error(
        `Bloque ocupado: dictas "${estado.nombreMateria}" en ${estado.etiquetaGrado}.`,
        { duration: 5000 },
      );
      return;
    }
    if (estado.tipo === "otro_docente") {
      toast.error(
        `Bloque ocupado: "${estado.nombreMateria}" con ${estado.nombreDocente}.`,
        { duration: 5000 },
      );
      return;
    }
    // Solo abrimos el modal si la celda es MÍA o LIBRE
    setCeldaSeleccionada({ dia, hora });
  };

  if (isLoading || isLoadingCurriculo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden p-8">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Neural />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <div className="bg-white/80 p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <BookOpen size={18} className="text-brand-blue" /> Mis Grados
              Asignados
            </h3>
            <span className="text-xs font-bold bg-blue-50 text-brand-blue px-3 py-1 rounded-full border border-blue-100">
              Carga total: {cargaTotal} h/semana
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gradosOrdenados.map((grado: GradoRow) => (
              <button
                key={grado.id}
                onClick={() => setSelectedGradoId(grado.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  selectedGradoId === grado.id
                    ? "bg-brand-blue text-white border-brand-blue shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-blue"
                }`}
              >
                {grado.nivel} - {grado.paralelo}
              </button>
            ))}
            {!gradosAsignados?.length && (
              <p className="text-sm text-slate-500">
                No tienes grados asignados aún.
              </p>
            )}
          </div>
        </div>

        {selectedGradoId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Mis
                  Materias Asignadas
                </h3>
                <div className="space-y-2">
                  {misMaterias.map((asignacion) => {
                    const horasAsignadas = (
                      (asignacion.horario || []) as BloqueHorario[]
                    ).reduce((acc, b) => acc + b.horas.length, 0);
                    return (
                      <div
                        key={asignacion.id}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-700 text-sm truncate">
                            {asignacion.materias_destrezas?.nombre || "Materia"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {horasAsignadas} h/sem
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarHorario(asignacion.id)}
                          disabled={isSaving}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md shrink-0"
                          title="Quitar materia"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                  {misMaterias.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No tienes materias asignadas.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2 text-sm">
                  <Plus size={16} className="text-brand-blue" /> Agregar
                  Materias
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {materiasDisponibles.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span className="text-sm font-medium text-slate-700 truncate mr-2">
                        {m.descripcion}
                      </span>
                      <button
                        onClick={() => asignarMateria(m.id)}
                        disabled={isSaving}
                        className="bg-brand-blue text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm shrink-0 disabled:opacity-50"
                      >
                        Agregar
                      </button>
                    </div>
                  ))}
                  {materiasDisponibles.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No hay materias disponibles.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                  <h3 className="font-bold text-brand-dark flex items-center gap-2">
                    <BookOpen size={18} className="text-brand-blue" /> Mi
                    Horario Semanal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Clic en celda libre para asignar. Clic en tu materia para
                    quitarla. Las celdas bloqueadas ya están ocupadas.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-brand-blue"></span> Mi
                      materia
                    </span>
                    <span className="flex items-center gap-1 text-amber-700">
                      <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>{" "}
                      Ocupado en otro grado
                    </span>
                    <span className="flex items-center gap-1 text-purple-700">
                      <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></span>{" "}
                      Otro docente
                    </span>
                  </div>
                </div>

                <div className="p-4 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    <div className="flex flex-col gap-2 pt-6">
                      {Array.from({ length: HORAS_DIA }).map((_, i) => (
                        <div
                          key={i}
                          className="h-14 flex items-center justify-center text-xs font-bold text-slate-400 w-10"
                        >
                          {i + 1}ª
                        </div>
                      ))}
                    </div>

                    {DIAS_SEMANA.map((dia) => (
                      <div
                        key={dia.id}
                        className="flex flex-col gap-2 min-w-[92px]"
                      >
                        <div className="h-6 text-center text-xs font-bold text-slate-600 uppercase">
                          {dia.nombre}
                        </div>
                        {Array.from({ length: HORAS_DIA }).map((_, i) => {
                          const hora = i + 1;
                          const estado = getEstadoCelda(dia.id, hora);
                          const base =
                            "h-14 rounded-lg border transition-all text-[10px] font-bold flex flex-col items-center justify-center p-1 leading-tight";

                          if (estado.tipo === "mia") {
                            return (
                              <button
                                key={hora}
                                onClick={() => handleClickCelda(dia.id, hora)}
                                disabled={isSaving}
                                className={`${base} bg-brand-blue text-white border-brand-blue shadow-sm hover:bg-blue-700`}
                                title={`${estado.nombreMateria} — Clic para quitar`}
                              >
                                <span className="line-clamp-2 w-full text-center px-0.5">
                                  {estado.nombreMateria}
                                </span>
                              </button>
                            );
                          }
                          if (estado.tipo === "mio_otro_grado") {
                            return (
                              <button
                                key={hora}
                                onClick={() => handleClickCelda(dia.id, hora)}
                                className={`${base} bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed`}
                                title={`Ocupado: ${estado.nombreMateria} en ${estado.etiquetaGrado}`}
                              >
                                <Lock size={11} className="mb-0.5" />
                                <span className="line-clamp-2 w-full text-center px-0.5">
                                  {estado.etiquetaGrado}
                                </span>
                              </button>
                            );
                          }
                          if (estado.tipo === "otro_docente") {
                            return (
                              <button
                                key={hora}
                                onClick={() => handleClickCelda(dia.id, hora)}
                                className={`${base} bg-purple-50 text-purple-700 border-purple-200 cursor-not-allowed`}
                                title={`${estado.nombreMateria} — ${estado.nombreDocente}`}
                              >
                                <Lock size={11} className="mb-0.5" />
                                <span className="line-clamp-2 w-full text-center px-0.5">
                                  {estado.nombreMateria}
                                </span>
                              </button>
                            );
                          }
                          return (
                            <button
                              key={hora}
                              onClick={() => handleClickCelda(dia.id, hora)}
                              disabled={isSaving}
                              className={`${base} bg-slate-50 text-slate-300 border-slate-200 hover:border-brand-blue hover:bg-blue-50`}
                              title="Clic para asignar"
                            >
                              <Plus size={16} />
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!celdaSeleccionada}
        onClose={() => setCeldaSeleccionada(null)}
        title="Asignar Materia"
        size="md"
      >
        <div className="space-y-4">
          {celdaSeleccionada &&
            (() => {
              const estado = getEstadoCelda(
                celdaSeleccionada.dia,
                celdaSeleccionada.hora,
              );
              const etiquetaBloque = `${DIAS_SEMANA.find((d) => d.id === celdaSeleccionada.dia)?.nombre} ${celdaSeleccionada.hora}ª hora`;

              if (estado.tipo === "mia") {
                return (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-blue-100 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark">
                      {estado.nombreMateria}
                    </h3>
                    <p className="text-sm text-slate-500">{etiquetaBloque}</p>
                    <div className="pt-4 flex flex-col gap-2">
                      <button
                        onClick={() =>
                          handleQuitarHora(
                            estado.asignacion.materia_id,
                            celdaSeleccionada.dia,
                            celdaSeleccionada.hora,
                          )
                        }
                        disabled={isSaving}
                        className="w-full px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {isSaving
                          ? "Procesando..."
                          : "Quitar esta materia de la celda"}
                      </button>
                      <button
                        onClick={() => setCeldaSeleccionada(null)}
                        className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              }

              if (estado.tipo !== "libre") {
                return (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark">
                      Bloque no disponible
                    </h3>
                    <p className="text-sm text-slate-500">
                      {estado.tipo === "mio_otro_grado"
                        ? `Ya dictas "${estado.nombreMateria}" en ${estado.etiquetaGrado} (${etiquetaBloque}).`
                        : `"${estado.nombreMateria}" ya está asignada a ${estado.nombreDocente} (${etiquetaBloque}).`}
                    </p>
                    <button
                      onClick={() => setCeldaSeleccionada(null)}
                      className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Entendido
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 text-center">
                    Selecciona la materia para el bloque{" "}
                    <strong>{etiquetaBloque}</strong>.
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {misMaterias.map((asignacion) => (
                      <button
                        key={asignacion.id}
                        onClick={() =>
                          handleAsignarHora(
                            asignacion.materia_id,
                            celdaSeleccionada.dia,
                            celdaSeleccionada.hora,
                          )
                        }
                        disabled={isSaving}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-brand-blue hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                      >
                        <span className="font-semibold text-slate-700">
                          {asignacion.materias_destrezas?.nombre || "Materia"}
                        </span>
                        <Plus size={16} className="text-brand-blue" />
                      </button>
                    ))}
                    {misMaterias.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No tienes materias asignadas. Agrega una desde el panel
                        izquierdo.
                      </p>
                    )}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setCeldaSeleccionada(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })()}
        </div>
      </Modal>
    </div>
  );
}
