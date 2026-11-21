import { useState, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useAniosLectivos } from "../../../hooks/useAniosLectivos";
import { useGrados } from "../../../hooks/useGrados";
import { useCurriculo } from "../../../hooks/useCurriculo";
import ExcelJS from "exceljs";
import Modal from "../../../components/ui/Modal";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import Neural from "../../../components/ui/Neural";
import {
  Plus,
  Trash2,
  ArrowLeft,
  FileSpreadsheet,
  Copy,
  Loader2,
  BookOpen,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { CATALOGO_CURRICULO } from "../../../utils/catalogoCurriculo";

export default function GestionCurriculo() {
  const { profile } = useAuth();
  const { anios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);

  const { grados, isLoading: isLoadingGrados } = useGrados(
    anioActivo?.id || null,
  );

  // Navegación
  const [selectedGradoId, setSelectedGradoId] = useState<string>("");

  const [openAreas, setOpenAreas] = useState<string[]>([]);
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);

  // Modales
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showMateriaModal, setShowMateriaModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  const [targetAreaId, setTargetAreaId] = useState<string | null>(null);

  // Confirmación de borrado
  const [areaAEliminar, setAreaAEliminar] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [materiaAEliminar, setMateriaAEliminar] = useState<{
    id: string;
    descripcion: string;
  } | null>(null);

  // Editor masivo y buscador
  const [massiveData, setMassiveData] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Copiar
  const [selectedDestGrados, setSelectedDestGrados] = useState<string[]>([]);

  const gradoActual = grados?.find((g) => g.id === selectedGradoId);

  const esInicial = useMemo(() => {
    if (!gradoActual) return true;
    const nombre = gradoActual.nivel.toLowerCase();
    return (
      nombre.includes("inicial 1") ||
      nombre.includes("inicial 2") ||
      nombre.includes("1ro egb")
    );
  }, [gradoActual]);

  const terminoPadre = esInicial ? "Ámbito" : "Área";
  const terminoHijo = esInicial ? "Destreza" : "Materia";

  const {
    areas,
    materias,
    isLoading: isLoadingCurriculo,
    crearAreas,
    isCreatingArea,
    crearMaterias,
    isCreatingMateria,
    eliminarArea,
    eliminarMateria,
    copiarCurriculo,
    isCopying,
  } = useCurriculo(
    selectedGradoId || null,
    profile?.colegio_id || null,
    anioActivo?.id || null,
  );

  const areaSeleccionada = areas?.find((a) => a.id === targetAreaId);
  const gradosDestino = grados?.filter((g) => g.id !== selectedGradoId) || [];

  // --- LÓGICA DE LÍNEAS (TEXTAREA) ---
  const getLineas = () =>
    massiveData
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

  const agregarLinea = (texto: string) => {
    const lineasActuales = getLineas();
    if (!lineasActuales.includes(texto)) {
      setMassiveData((prev) => (prev ? `${prev.trim()}\n${texto}` : texto));
    }
  };

  // --- ACCIONES DE GUARDADO ---
  const handleGuardarArea = async () => {
    const lineas = getLineas();
    if (lineas.length === 0) return toast.error("Ingresa al menos un nombre.");

    const nuevas = lineas.map((nombre, index) => ({
      colegio_id: profile!.colegio_id!,
      anio_lectivo_id: anioActivo!.id,
      grado_id: selectedGradoId,
      nombre: nombre,
      orden: (areas?.length || 0) + index + 1,
      activo: true,
    }));
    try {
      // ✅ AQUÍ EL "as never" PARA EVITAR EL ERROR DE TYPESCRIPT
      await crearAreas(nuevas as never);
      setShowAreaModal(false);
      setMassiveData("");
    } catch {
      /* Manejado por hook */
    }
  };

  const handleGuardarMateria = async () => {
    if (!targetAreaId) return;
    const lineas = getLineas();
    if (lineas.length === 0)
      return toast.error("Ingresa al menos una materia.");

    const materiasDeEstaArea =
      materias?.filter((m) => m.area_id === targetAreaId) || [];

    const nuevas = lineas.map((texto, index) => ({
      colegio_id: profile!.colegio_id!,
      grado_id: selectedGradoId,
      area_id: targetAreaId,
      nombre: texto.substring(0, 100),
      descripcion: texto,
      orden: materiasDeEstaArea.length + index + 1,
      activo: true,
    }));
    try {
      // ✅ AQUÍ EL "as never" PARA EVITAR EL ERROR DE TYPESCRIPT
      await crearMaterias(nuevas as never);

      if (!openAreas.includes(targetAreaId)) {
        setOpenAreas((prev) => [...prev, targetAreaId]);
      }

      setShowMateriaModal(false);
      setMassiveData("");
      setTargetAreaId(null);
    } catch {
      /* Manejado por hook */
    }
  };

  const handleCopy = async () => {
    if (selectedDestGrados.length === 0) return;
    try {
      await copiarCurriculo(selectedDestGrados);
      setShowCopyModal(false);
      setSelectedDestGrados([]);
    } catch {
      /* Manejado por hook */
    }
  };

  const toggleDestGrado = (id: string) => {
    setSelectedDestGrados((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const toggleArea = (id: string) => {
    setOpenAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  // --- EXPORTAR EXCEL ---
  const exportarAExcel = async () => {
    if (!gradoActual) return;

    const workbook = new ExcelJS.Workbook();
    const ws1 = workbook.addWorksheet(terminoPadre + "s");

    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF244563" },
      },
      alignment: { horizontal: "center" as const, vertical: "middle" as const },
    };

    ws1.columns = [
      { header: "N°", key: "num", width: 6 },
      { header: terminoPadre, key: "nombre", width: 40 },
      { header: "Grado", key: "grado", width: 15 },
      { header: "Paralelo", key: "paralelo", width: 10 },
    ];
    ws1.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
      cell.fill = headerStyle.fill;
      cell.alignment = headerStyle.alignment;
    });
    areas?.forEach((a, idx) => {
      ws1.addRow({
        num: idx + 1,
        nombre: a.nombre,
        grado: gradoActual.nivel,
        paralelo: gradoActual.paralelo,
      });
    });

    const ws2 = workbook.addWorksheet(terminoHijo + "s");
    ws2.columns = [
      { header: "N°", key: "num", width: 6 },
      { header: terminoPadre, key: "area", width: 30 },
      { header: terminoHijo, key: "materia", width: 80 },
      { header: "Grado", key: "grado", width: 15 },
      { header: "Paralelo", key: "paralelo", width: 10 },
    ];
    ws2.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
      cell.fill = headerStyle.fill;
      cell.alignment = headerStyle.alignment;
    });
    materias?.forEach((m, idx) => {
      const area = areas?.find((a) => a.id === m.area_id);
      ws2.addRow({
        num: idx + 1,
        area: area?.nombre || "Sin asignar",
        materia: m.descripcion,
        grado: gradoActual.nivel,
        paralelo: gradoActual.paralelo,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Curriculo_${gradoActual.nivel}_${gradoActual.paralelo}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // --- CATÁLOGOS FILTRADOS ---
  const listaCatalogoAreas = useMemo(() => {
    const base = esInicial
      ? CATALOGO_CURRICULO.INICIAL
      : CATALOGO_CURRICULO.EGB_BACHILLERATO.map((c) => c.area);
    const unicos = Array.from(new Set(base));
    return unicos.filter((a) =>
      a.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [esInicial, searchTerm]);

  const listaCatalogoMaterias = useMemo(() => {
    if (esInicial) {
      return [
        "ECA.1.6.1. Explorar las posibilidades sonoras de la voz...",
        "ECA.1.6.2. Utilizar la expresión gráfica o plástica...",
        "I.ECA.1.1.1. Explora y representa corporal, musical...",
      ].filter((m) => m.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const areaActual = areaSeleccionada?.nombre;
    const info = CATALOGO_CURRICULO.EGB_BACHILLERATO.filter(
      (c) => c.area === areaActual,
    );
    const base = info.flatMap((item) => item.materias);
    const unicos = Array.from(new Set(base));
    return unicos.filter((m) =>
      m.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [esInicial, areaSeleccionada, searchTerm]);

  const openAreaModal = () => {
    setMassiveData("");
    setSearchTerm("");
    setShowAreaModal(true);
  };
  const openMateriaModal = (areaId: string) => {
    setTargetAreaId(areaId);
    setMassiveData("");
    setSearchTerm("");
    setShowMateriaModal(true);
    if (!expandedAreas.includes(areaId)) {
      setExpandedAreas((prev) => [...prev, areaId]);
    }
  };

  if (isLoadingGrados || isLoadingCurriculo) {
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
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {selectedGradoId && (
              <button
                onClick={() => {
                  setSelectedGradoId("");
                  setOpenAreas([]);
                  setTargetAreaId(null);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-blue-800 mb-2 transition-colors"
              >
                <ArrowLeft size={16} /> Volver a Grados
              </button>
            )}
            <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              {selectedGradoId
                ? `${terminoPadre}s y ${terminoHijo}s`
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
        </div>

        {/* VISTA 1: GRILLA DE GRADOS */}
        {!selectedGradoId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {grados?.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGradoId(g.id)}
                className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-blue transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                    {g.paralelo}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-brand-dark leading-tight">
                  {g.nivel}
                </h3>
                <p className="text-sm text-slate-500 mt-2 group-hover:text-brand-blue font-medium flex items-center gap-1">
                  <Plus size={14} /> Configurar {terminoPadre}s
                </p>
              </button>
            ))}
          </div>
        )}

        {/* VISTA 2: ÁRBOL DE ÁREAS Y MATERIAS */}
        {selectedGradoId && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 p-4">
              <div>
                <h3 className="text-lg font-bold text-brand-dark">
                  Estructura Curricular
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Despliega un {terminoPadre.toLowerCase()} para ver sus{" "}
                  {terminoHijo.toLowerCase()}s.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCopyModal(true)}
                  disabled={!areas || areas.length === 0}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm hover:bg-slate-50 disabled:opacity-50 text-slate-700"
                >
                  <Copy size={16} /> Copiar
                </button>
                <button
                  onClick={exportarAExcel}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm hover:bg-slate-50 text-slate-700"
                >
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button
                  onClick={openAreaModal}
                  className="bg-brand-blue text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-md hover:bg-blue-700"
                >
                  <Plus size={16} /> Nuevo {terminoPadre}
                </button>
              </div>
            </div>

            <div className="p-4">
              {!areas || areas.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <FolderOpen
                    className="mx-auto text-slate-300 mb-2"
                    size={48}
                  />
                  <p className="text-slate-500 font-medium">
                    No hay {terminoPadre}s registrados
                  </p>
                  <p className="text-sm text-slate-400">
                    Crea el primer {terminoPadre.toLowerCase()} para empezar.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {areas.map((area) => {
                    const materiasDeArea =
                      materias?.filter((m) => m.area_id === area.id) || [];
                    const isOpen = openAreas.includes(area.id);

                    return (
                      <div
                        key={area.id}
                        className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all"
                      >
                        {/* Cabecera del Área */}
                        <div
                          className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isOpen ? "bg-blue-50/50 border-b border-slate-200" : "hover:bg-slate-50"}`}
                          onClick={() => toggleArea(area.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-500"}`}
                            >
                              {isOpen ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronRight size={18} />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-brand-dark flex items-center gap-2">
                                {area.nombre}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {materiasDeArea.length} {terminoHijo}(s)
                              </p>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => openMateriaModal(area.id)}
                              className="text-brand-blue text-xs font-bold bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                              <Plus size={14} /> Añadir {terminoHijo}
                            </button>
                            <button
                              onClick={() => setAreaAEliminar(area)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={`Eliminar ${terminoPadre}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Cuerpo (Materias) */}
                        {isOpen && (
                          <div className="p-4 bg-slate-50/50">
                            {materiasDeArea.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                                <p className="text-sm">
                                  No hay {terminoHijo}s en este{" "}
                                  {terminoPadre.toLowerCase()}.
                                </p>
                                <button
                                  onClick={() => openMateriaModal(area.id)}
                                  className="text-brand-blue text-xs font-semibold hover:underline mt-1"
                                >
                                  Agregar la primera {terminoHijo}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {materiasDeArea.map((m, index) => (
                                  <div
                                    key={m.id}
                                    className="flex justify-between items-start p-3 border border-slate-200 rounded-lg bg-white hover:border-brand-blue transition-colors group"
                                  >
                                    <div className="flex gap-3">
                                      <span className="font-bold text-slate-400 text-xs bg-slate-100 w-6 h-6 flex items-center justify-center rounded-md shrink-0 mt-0.5">
                                        {index + 1}
                                      </span>
                                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                                        {m.descripcion}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => setMateriaAEliminar(m)}
                                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                      title={`Eliminar ${terminoHijo}`}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREAR ÁREA / ÁMBITO */}
      <Modal
        isOpen={showAreaModal}
        onClose={() => setShowAreaModal(false)}
        title={`Configurar ${terminoPadre}s`}
        size="5xl"
      >
        <div className="w-full flex flex-col h-full max-h-[75vh]">
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
            <div className="flex flex-col h-full border-r border-slate-200 pr-4">
              <div className="mb-3">
                <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <BookOpen size={18} className="text-brand-blue" /> Catálogo
                  Sugerido
                </h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {listaCatalogoAreas.map((area) => {
                  const yaEnTexto = getLineas().includes(area);
                  const yaEnBd = areas?.some((a) => a.nombre === area);
                  return (
                    <button
                      key={area}
                      onClick={() => agregarLinea(area)}
                      disabled={yaEnTexto || yaEnBd}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${yaEnBd ? "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed" : yaEnTexto ? "bg-blue-50 border-brand-blue" : "bg-white border-slate-200 hover:border-brand-blue"}`}
                    >
                      <span
                        className={`text-sm ${yaEnTexto || yaEnBd ? "text-slate-500" : "text-slate-700 font-medium"}`}
                      >
                        {area}
                      </span>
                      {yaEnTexto ? (
                        <CheckCircle2
                          size={16}
                          className="text-brand-blue shrink-0"
                        />
                      ) : (
                        <Plus size={16} className="text-slate-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <h3 className="font-bold text-slate-700 mb-2">
                  Tus {terminoPadre}s
                </h3>
                <p className="text-xs text-slate-500">
                  Haz clic en el catálogo o escribe manualmente (uno por línea).
                </p>
              </div>
              <textarea
                value={massiveData}
                onChange={(e) => setMassiveData(e.target.value)}
                placeholder={`Ej:\nCiencias Naturales\nMatemática`}
                className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm font-mono resize-none"
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button
              onClick={() => setShowAreaModal(false)}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarArea}
              disabled={isCreatingArea || !massiveData.trim()}
              className="flex-1 px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 text-sm flex justify-center items-center gap-2"
            >
              {isCreatingArea ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Guardando...
                </>
              ) : (
                `Guardar ${terminoPadre}s`
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CREAR MATERIA / DESTREZA */}
      <Modal
        isOpen={showMateriaModal}
        onClose={() => setShowMateriaModal(false)}
        title={`Configurar ${terminoHijo}s de ${areaSeleccionada?.nombre}`}
        size="5xl"
      >
        <div className="w-full flex flex-col h-full max-h-[75vh]">
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
            <div className="flex flex-col h-full border-r border-slate-200 pr-4">
              <div className="mb-3">
                <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <BookOpen size={18} className="text-brand-blue" /> Catálogo
                  Sugerido
                </h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {listaCatalogoMaterias.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No hay sugerencias para esta área. Escribe a la derecha.
                  </p>
                ) : (
                  listaCatalogoMaterias.map((materia) => {
                    const yaEnTexto = getLineas().includes(materia);
                    const yaEnBd = materias?.some(
                      (m) =>
                        m.area_id === targetAreaId && m.descripcion === materia,
                    );
                    return (
                      <button
                        key={materia}
                        onClick={() => agregarLinea(materia)}
                        disabled={yaEnTexto || yaEnBd}
                        className={`w-full flex items-start gap-2 p-3 rounded-xl border text-left transition-colors ${yaEnBd ? "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed" : yaEnTexto ? "bg-blue-50 border-brand-blue" : "bg-white border-slate-200 hover:border-brand-blue"}`}
                      >
                        <div className="flex-1">
                          <span
                            className={`text-sm ${yaEnTexto || yaEnBd ? "text-slate-500" : "text-slate-700 font-medium"}`}
                          >
                            {materia}
                          </span>
                        </div>
                        {yaEnTexto ? (
                          <CheckCircle2
                            size={16}
                            className="text-brand-blue shrink-0 mt-0.5"
                          />
                        ) : (
                          <Plus
                            size={16}
                            className="text-slate-400 shrink-0 mt-0.5"
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <h3 className="font-bold text-slate-700 mb-2">
                  Tus {terminoHijo}s
                </h3>
                <p className="text-xs text-slate-500">
                  Haz clic en el catálogo o escribe manualmente (una por línea).
                </p>
              </div>
              <textarea
                value={massiveData}
                onChange={(e) => setMassiveData(e.target.value)}
                placeholder={
                  esInicial
                    ? `Ej:\nECA.1.6.1. Explorar...`
                    : `Ej:\nMatemática\nFísica`
                }
                className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm font-mono resize-none"
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button
              onClick={() => setShowMateriaModal(false)}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarMateria}
              disabled={isCreatingMateria || !massiveData.trim()}
              className="flex-1 px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 text-sm flex justify-center items-center gap-2"
            >
              {isCreatingMateria ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Guardando...
                </>
              ) : (
                `Guardar ${terminoHijo}s`
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: COPIAR CURRÍCULO */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        title="Copiar Currículo a otros grados"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Se copiarán todos los <strong>{terminoPadre}s</strong> y{" "}
            <strong>{terminoHijo}s</strong> del grado actual (
            <strong>
              {gradoActual?.nivel} - {gradoActual?.paralelo}
            </strong>
            ) a los grados que selecciones abajo.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <strong>Nota:</strong> Si el grado destino ya tiene un{" "}
            {terminoPadre.toLowerCase()} con el mismo nombre, no se duplicará
            (se omitirá).
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-500">
              {selectedDestGrados.length} seleccionado(s)
            </span>
            <button
              onClick={() =>
                setSelectedDestGrados(
                  selectedDestGrados.length === gradosDestino.length
                    ? []
                    : gradosDestino.map((g) => g.id),
                )
              }
              className="text-xs font-semibold text-brand-blue hover:underline"
            >
              {selectedDestGrados.length === gradosDestino.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
            {gradosDestino.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">
                No hay otros grados disponibles.
              </p>
            ) : (
              gradosDestino.map((g) => (
                <label
                  key={g.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${selectedDestGrados.includes(g.id) ? "bg-blue-50 border-brand-blue" : "bg-white border-slate-200 hover:bg-slate-100"}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDestGrados.includes(g.id)}
                    onChange={() => toggleDestGrado(g.id)}
                    className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {g.nivel} - {g.paralelo}
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="pt-4 flex gap-3 border-t">
            <button
              type="button"
              onClick={() => setShowCopyModal(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={isCopying || selectedDestGrados.length === 0}
              className="flex-1 px-4 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isCopying ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Copiando...
                </>
              ) : (
                <>
                  <Copy size={16} /> Copiar ahora
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFIRMACIONES DE BORRADO */}
      <ConfirmModal
        isOpen={!!areaAEliminar}
        onClose={() => setAreaAEliminar(null)}
        onConfirm={async () => {
          if (areaAEliminar) {
            await eliminarArea(areaAEliminar.id);
            setAreaAEliminar(null);
          }
        }}
        title={`¿Eliminar ${terminoPadre}?`}
        message={
          <>
            <p>
              Estás a punto de eliminar{" "}
              <strong>"{areaAEliminar?.nombre}"</strong>. Si tiene {terminoHijo}
              s asociadas, también se borrarán de forma permanente.
            </p>
            <br />
            <span className="text-red-500 font-semibold text-xs">
              Esta acción no se puede deshacer.
            </span>
          </>
        }
        confirmText="Sí, eliminar"
      />
      <ConfirmModal
        isOpen={!!materiaAEliminar}
        onClose={() => setMateriaAEliminar(null)}
        onConfirm={async () => {
          if (materiaAEliminar) {
            await eliminarMateria(materiaAEliminar.id);
            setMateriaAEliminar(null);
          }
        }}
        title={`¿Eliminar ${terminoHijo}?`}
        message={
          <>
            <p>¿Estás seguro de eliminar esta {terminoHijo.toLowerCase()}?</p>
            <span className="block mt-2 p-2 bg-slate-100 rounded text-xs italic text-slate-600 line-clamp-3">
              "{materiaAEliminar?.descripcion}"
            </span>
          </>
        }
        confirmText="Sí, eliminar"
      />
    </div>
  );
}
