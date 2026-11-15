import { useState, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useGrados } from "../../../hooks/useGrados";
import { useAniosLectivos } from "../../../hooks/useAniosLectivos";
import { useNiveles } from "../../../hooks/useNiveles";
import { CATALOGO_NIVELES } from "../../../utils/catalogoNiveles";
import {
  Plus,
  Trash2,
  Power,
  GraduationCap,
  Settings,
  Search,
  CheckCircle2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import Modal from "../../../components/ui/Modal";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import Neural from "../../../components/ui/Neural";
import toast from "react-hot-toast";

const PARALELOS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export default function GestionGrados() {
  const { profile } = useAuth();
  const { anios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);

  const {
    niveles,
    isLoading: isLoadingNiveles,
    crearNiveles,
    borrarNivel,
    toggleActivo: toggleNivelActivo,
    actualizarNivel,
  } = useNiveles(profile?.colegio_id || null);

  const {
    grados,
    isLoading,
    crearGrados,
    toggleActivo,
    borrarGrado,
    isCreating,
  } = useGrados(anioActivo?.id || null);

  const [isGradoModalOpen, setIsGradoModalOpen] = useState(false);
  const [isNivelModalOpen, setIsNivelModalOpen] = useState(false);

  // Estados para Grados
  const [selectedNiveles, setSelectedNiveles] = useState<string[]>([]);
  const [selectedParalelos, setSelectedParalelos] = useState<string[]>([]);

  // Estados para Niveles (Catálogo)
  const [tabCatalogo, setTabCatalogo] = useState<
    "MIS_NIVELES" | "EGB" | "BC" | "BT"
  >("MIS_NIVELES");
  const [selectedCatalogo, setSelectedCatalogo] = useState<string[]>([]);
  const [nivelPersonalizado, setNivelPersonalizado] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para edición de carreras técnicas
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");

  // Estados para los modales de confirmación
  const [gradoAEliminar, setGradoAEliminar] = useState<{
    id: string;
    nivel: string;
    paralelo: string;
  } | null>(null);
  const [nivelAEliminar, setNivelAEliminar] = useState<{
    id: string;
    nombre: string;
    gradosAsociados: number;
  } | null>(null);

  // --- Valores derivados ---
  const combinaciones = selectedNiveles.flatMap((nivel) =>
    selectedParalelos.map((paralelo) => ({ nivel, paralelo })),
  );

  const nivelesActivos = niveles?.filter((n) => n.activo) || [];

  const carrerasTecnicasAgregadas =
    niveles?.filter((n) => n.nombre.includes("BT")) || [];

  // ✅ Lógica dinámica para el mensaje de eliminación
  const terminosGradoAEliminar = useMemo(() => {
    if (!gradoAEliminar) return { padre: "", hijo: "" };

    const nombre = gradoAEliminar.nivel.toLowerCase();
    const esInicial =
      nombre.includes("inicial 1") ||
      nombre.includes("inicial 2") ||
      nombre.includes("1ro egb");

    return {
      padre: esInicial ? "Ámbitos" : "Áreas",
      hijo: esInicial ? "Destrezas" : "Materias",
    };
  }, [gradoAEliminar]);

  const getCatalogoFiltrado = () => {
    let lista: string[] = [];
    if (tabCatalogo === "EGB") lista = [...CATALOGO_NIVELES.EGB];
    else if (tabCatalogo === "BC")
      lista = [...CATALOGO_NIVELES.BACHILLERATO_CIENCIAS];
    else if (tabCatalogo === "BT") {
      lista = [...CATALOGO_NIVELES.BACHILLERATO_TECNICO];
      lista.sort((a, b) => a.localeCompare(b));
    }

    if (!searchTerm) return lista;
    return lista.filter((n) =>
      n.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  // --- Handlers de selección ---
  const handleToggleNivel = (nivel: string) => {
    setSelectedNiveles((prev) =>
      prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel],
    );
  };

  const handleToggleParalelo = (paralelo: string) => {
    setSelectedParalelos((prev) =>
      prev.includes(paralelo)
        ? prev.filter((p) => p !== paralelo)
        : [...prev, paralelo],
    );
  };

  const handleToggleCatalogo = (nivel: string) => {
    setSelectedCatalogo((prev) =>
      prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel],
    );
  };

  const handleSelectAll = () => {
    const nivelesDisponibles = getCatalogoFiltrado().filter(
      (n) => !niveles?.some((existente) => existente.nombre === n),
    );
    const allSelected = nivelesDisponibles.every((n) =>
      selectedCatalogo.includes(n),
    );
    if (allSelected) {
      setSelectedCatalogo((prev) =>
        prev.filter((n) => !nivelesDisponibles.includes(n)),
      );
    } else {
      setSelectedCatalogo((prev) => [
        ...new Set([...prev, ...nivelesDisponibles]),
      ]);
    }
  };

  // --- Guardar niveles desde el catálogo ---
  const handleGuardarNiveles = async () => {
    if (!profile?.colegio_id || selectedCatalogo.length === 0) return;
    const cantidad = selectedCatalogo.length;

    try {
      const nivelesAInsertar = selectedCatalogo.map((nombre, index) => ({
        colegio_id: profile.colegio_id!,
        nombre,
        activo: true,
        orden: (niveles?.length || 0) + index + 1,
      }));
      await crearNiveles(nivelesAInsertar);
      setSelectedCatalogo([]);
      setSearchTerm("");
      setTabCatalogo("MIS_NIVELES");
      toast.success(`${cantidad} nivel(es) agregado(s) a tu catálogo`);
    } catch {
      // Manejado por el hook
    }
  };

  // --- Agregar especialidad técnica personalizada ---
  const handleAgregarPersonalizado = async () => {
    if (!nivelPersonalizado.trim() || !profile?.colegio_id) return;
    const nuevoNivel = nivelPersonalizado.trim();
    const nombreFinal = nuevoNivel.includes("BT")
      ? nuevoNivel
      : `1ro BT - ${nuevoNivel}`;

    try {
      await crearNiveles([
        {
          colegio_id: profile.colegio_id,
          nombre: nombreFinal,
          activo: true,
          orden: 999,
        },
      ]);
      setNivelPersonalizado("");
      toast.success("Especialidad agregada a tu catálogo");
      setTabCatalogo("MIS_NIVELES");
    } catch {
      // Manejado por el hook
    }
  };

  // --- Edición de carreras técnicas ---
  const handleStartEdit = (id: string, nombre: string) => {
    setEditingId(id);
    setEditNombre(nombre);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editNombre.trim()) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }
    try {
      await actualizarNivel({ id: editingId, nombre: editNombre.trim() });
      setEditingId(null);
      setEditNombre("");
    } catch {
      // Manejado por el hook
    }
  };

  // --- Abrir modal de eliminación de nivel ---
  const handleEliminarNivelClick = (nivelId: string, nivelNombre: string) => {
    const gradosAsociados =
      grados?.filter((g) => g.nivel === nivelNombre) || [];
    setNivelAEliminar({
      id: nivelId,
      nombre: nivelNombre,
      gradosAsociados: gradosAsociados.length,
    });
  };

  // --- Crear grados ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anioActivo) {
      toast.error("No hay año lectivo activo.");
      return;
    }
    if (combinaciones.length === 0) {
      toast.error("Selecciona al menos un nivel y un paralelo.");
      return;
    }

    try {
      const nuevosGrados = combinaciones.map((comb, index) => ({
        colegio_id: profile!.colegio_id!,
        anio_lectivo_id: anioActivo.id,
        nivel: comb.nivel,
        paralelo: comb.paralelo,
        activo: true,
        orden: index + 1,
      }));

      await crearGrados(nuevosGrados);
      setIsGradoModalOpen(false);
      setSelectedNiveles([]);
      setSelectedParalelos([]);
    } catch {
      // Manejado por el hook
    }
  };

  if (isLoading || isLoadingNiveles) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!anioActivo) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden p-8">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <Neural />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto mt-20 bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Settings size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-dark mb-2">
            No hay año lectivo activo
          </h2>
          <p className="text-slate-500">
            Debes crear y activar un año lectivo primero en el módulo de Años
            Lectivos.
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

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              Grados
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Año lectivo:{" "}
              <span className="font-semibold text-brand-blue">
                {anioActivo.nombre}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsNivelModalOpen(true)}
              className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:bg-slate-50 font-semibold text-sm"
            >
              <Settings size={18} /> Configurar Niveles
            </button>
            <button
              onClick={() => setIsGradoModalOpen(true)}
              className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md font-semibold text-sm"
            >
              <Plus size={18} /> Nuevo Grado
            </button>
          </div>
        </div>

        {/* Tabla de Grados */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                <th className="p-4 font-semibold">Nivel</th>
                <th className="p-4 font-semibold">Paralelo</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grados?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    <GraduationCap
                      size={48}
                      className="text-slate-300 mx-auto mb-4"
                    />
                    <p className="text-lg font-medium">
                      No hay grados registrados
                    </p>
                    <p className="text-sm">
                      Crea el primer grado para empezar.
                    </p>
                  </td>
                </tr>
              ) : (
                grados?.map((grado) => (
                  <tr
                    key={grado.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-bold text-brand-dark">
                      {grado.nivel}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm bg-slate-100 px-2.5 py-1 rounded-md">
                        {grado.paralelo}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() =>
                          toggleActivo({ id: grado.id, activo: !grado.activo })
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          grado.activo
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                      >
                        <Power size={12} />
                        {grado.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setGradoAEliminar(grado)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar grado"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Configurar Niveles */}
      <Modal
        isOpen={isNivelModalOpen}
        onClose={() => setIsNivelModalOpen(false)}
        title="Configurar Niveles Educativos"
        size="5xl"
      >
        <div className="w-full flex flex-col h-full max-h-[85vh]">
          <div className="flex-1 overflow-y-auto space-y-5 pb-6">
            {/* Pestañas */}
            <div className="flex gap-2 border-b overflow-x-auto sticky top-0 bg-white z-10">
              <button
                onClick={() => setTabCatalogo("MIS_NIVELES")}
                className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap ${
                  tabCatalogo === "MIS_NIVELES"
                    ? "text-brand-blue border-b-2 border-brand-blue"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Mis Niveles ({niveles?.length || 0})
              </button>
              <button
                onClick={() => setTabCatalogo("EGB")}
                className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap ${
                  tabCatalogo === "EGB"
                    ? "text-brand-blue border-b-2 border-brand-blue"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                + Agregar EGB
              </button>
              <button
                onClick={() => setTabCatalogo("BC")}
                className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap ${
                  tabCatalogo === "BC"
                    ? "text-brand-blue border-b-2 border-brand-blue"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                + Bach. Ciencias
              </button>
              <button
                onClick={() => setTabCatalogo("BT")}
                className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap ${
                  tabCatalogo === "BT"
                    ? "text-brand-blue border-b-2 border-brand-blue"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                + Bach. Técnico
              </button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar nivel o especialidad..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm"
              />
            </div>

            {/* Contenido según pestaña */}
            {tabCatalogo === "MIS_NIVELES" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {niveles?.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <GraduationCap
                      size={48}
                      className="text-slate-300 mx-auto mb-3"
                    />
                    <p className="text-slate-500 mb-4">
                      No tienes niveles configurados.
                    </p>
                    <button
                      onClick={() => setTabCatalogo("EGB")}
                      className="text-sm text-brand-blue font-semibold hover:underline"
                    >
                      Agregar niveles desde el catálogo →
                    </button>
                  </div>
                ) : (
                  niveles
                    ?.filter((n) =>
                      n.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((nivel) => {
                      const gradosAsociados =
                        grados?.filter((g) => g.nivel === nivel.nombre) || [];
                      return (
                        <div
                          key={nivel.id}
                          className={`flex flex-col p-3 bg-white rounded-xl border shadow-sm transition-all ${
                            nivel.activo
                              ? "border-slate-200"
                              : "border-red-200 opacity-75"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden mb-2">
                            <input
                              type="checkbox"
                              checked={nivel.activo}
                              onChange={() =>
                                toggleNivelActivo({
                                  id: nivel.id,
                                  activo: !nivel.activo,
                                })
                              }
                              className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue shrink-0"
                            />
                            <span
                              className={`text-sm font-medium truncate ${
                                nivel.activo
                                  ? "text-slate-700"
                                  : "text-slate-400 line-through"
                              }`}
                              title={nivel.nombre}
                            >
                              {nivel.nombre}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 mb-2">
                            {gradosAsociados.length} grado(s) creado(s)
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-2 border-t border-slate-100">
                            <button
                              onClick={() =>
                                toggleNivelActivo({
                                  id: nivel.id,
                                  activo: !nivel.activo,
                                })
                              }
                              className={`flex-1 p-1.5 rounded-md transition-colors text-xs font-medium ${
                                nivel.activo
                                  ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                  : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={
                                nivel.activo
                                  ? "Desactivar nivel"
                                  : "Activar nivel"
                              }
                            >
                              {nivel.activo ? "Desactivar" : "Activar"}
                            </button>
                            <button
                              onClick={() =>
                                handleEliminarNivelClick(nivel.id, nivel.nombre)
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                              title="Eliminar nivel"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            ) : (
              <div
                className={
                  tabCatalogo === "BT"
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-8"
                    : "grid grid-cols-1"
                }
              >
                {/* Columna Catálogo */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center pr-2">
                    <p className="text-sm font-bold text-slate-700">
                      Catálogo Oficial
                    </p>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-semibold text-brand-blue hover:underline"
                    >
                      {getCatalogoFiltrado()
                        .filter(
                          (n) =>
                            !niveles?.some(
                              (existente) => existente.nombre === n,
                            ),
                        )
                        .every((n) => selectedCatalogo.includes(n))
                        ? "Deseleccionar todos"
                        : "Seleccionar todos"}
                    </button>
                  </div>
                  <div
                    className={`grid gap-2 ${
                      tabCatalogo === "BT"
                        ? "grid-cols-1"
                        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                    }`}
                  >
                    {getCatalogoFiltrado().length === 0 ? (
                      <p className="col-span-full text-center text-sm text-slate-500 py-4">
                        No se encontraron resultados.
                      </p>
                    ) : (
                      getCatalogoFiltrado().map((nivel) => {
                        const yaExiste = niveles?.some(
                          (n) => n.nombre === nivel,
                        );
                        return (
                          <label
                            key={nivel}
                            className={`flex items-center gap-3 p-2.5 bg-white rounded-xl border cursor-pointer transition-colors shadow-sm ${
                              yaExiste
                                ? "border-slate-200 opacity-50 cursor-not-allowed"
                                : selectedCatalogo.includes(nivel)
                                  ? "border-brand-blue bg-blue-50"
                                  : "border-slate-200 hover:border-brand-blue/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCatalogo.includes(nivel)}
                              onChange={() => handleToggleCatalogo(nivel)}
                              disabled={yaExiste}
                              className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue shrink-0"
                            />
                            <span
                              className="text-sm text-slate-700 truncate"
                              title={nivel}
                            >
                              {nivel}
                            </span>
                            {yaExiste && (
                              <span className="ml-auto text-xs text-slate-400 shrink-0">
                                ✓ Ya existe
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Columna Derecha: SOLO EN BT */}
                {tabCatalogo === "BT" && (
                  <div className="border-l border-slate-200 pl-8 flex flex-col space-y-4">
                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-brand-blue" />
                        Carreras Agregadas
                      </p>
                      <div className="max-h-[350px] overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                        {carrerasTecnicasAgregadas.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-sm text-slate-400">
                              No has agregado carreras técnicas aún.
                            </p>
                          </div>
                        ) : (
                          carrerasTecnicasAgregadas.map((carrera) => (
                            <div
                              key={carrera.id}
                              className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm"
                            >
                              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <input
                                  type="checkbox"
                                  checked={carrera.activo}
                                  onChange={() =>
                                    toggleNivelActivo({
                                      id: carrera.id,
                                      activo: !carrera.activo,
                                    })
                                  }
                                  className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue shrink-0"
                                />
                                {editingId === carrera.id ? (
                                  <input
                                    autoFocus
                                    value={editNombre}
                                    onChange={(e) =>
                                      setEditNombre(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEdit();
                                      if (e.key === "Escape")
                                        setEditingId(null);
                                    }}
                                    className="flex-1 px-2 py-1 text-sm border border-brand-blue rounded-md outline-none focus:ring-2 focus:ring-brand-blue/30"
                                  />
                                ) : (
                                  <span
                                    className={`text-sm font-medium truncate ${
                                      carrera.activo
                                        ? "text-slate-700"
                                        : "text-slate-400 line-through"
                                    }`}
                                    title={carrera.nombre}
                                  >
                                    {carrera.nombre}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {editingId === carrera.id ? (
                                  <>
                                    <button
                                      onClick={handleSaveEdit}
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                      title="Guardar cambios"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                                      title="Cancelar"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleStartEdit(
                                        carrera.id,
                                        carrera.nombre,
                                      )
                                    }
                                    className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-md transition-colors"
                                    title="Editar carrera"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleEliminarNivelClick(
                                      carrera.id,
                                      carrera.nombre,
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  title="Eliminar carrera del catálogo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        ¿Falta alguna especialidad técnica?
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nivelPersonalizado}
                          onChange={(e) =>
                            setNivelPersonalizado(e.target.value)
                          }
                          placeholder="Ej. 1ro BT - Gastronomía"
                          className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAgregarPersonalizado}
                          disabled={!nivelPersonalizado.trim()}
                          className="px-5 py-2.5 bg-brand-dark text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors hover:bg-slate-800"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer del modal */}
          <div className="pt-4 flex gap-3 border-t bg-white sticky bottom-0">
            <button
              onClick={() => setIsNivelModalOpen(false)}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cerrar
            </button>
            {tabCatalogo !== "MIS_NIVELES" && (
              <button
                onClick={handleGuardarNiveles}
                disabled={selectedCatalogo.length === 0}
                className="flex-1 px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                Agregar {selectedCatalogo.length} Nivel(es)
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL: Crear Grados */}
      <Modal
        isOpen={isGradoModalOpen}
        onClose={() => setIsGradoModalOpen(false)}
        title="Crear Grados"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              1. Selecciona los Niveles Activos
            </label>
            {nivelesActivos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {nivelesActivos.map((nivel) => (
                  <button
                    key={nivel.id}
                    type="button"
                    onClick={() => handleToggleNivel(nivel.nombre)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors border text-left ${
                      selectedNiveles.includes(nivel.nombre)
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-blue"
                    }`}
                  >
                    {nivel.nombre}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                No hay niveles activos. Configúralos primero.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              2. Selecciona los Paralelos
            </label>
            <div className="flex gap-2 flex-wrap">
              {PARALELOS.map((paralelo) => (
                <button
                  key={paralelo}
                  type="button"
                  onClick={() => handleToggleParalelo(paralelo)}
                  className={`w-12 h-12 rounded-lg text-lg font-bold transition-colors border ${
                    selectedParalelos.includes(paralelo)
                      ? "bg-brand-blue text-white border-brand-blue"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-blue"
                  }`}
                >
                  {paralelo}
                </button>
              ))}
            </div>
          </div>

          {combinaciones.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-brand-blue mb-2">
                Se crearán {combinaciones.length} grado(s):
              </p>
              <div className="flex flex-wrap gap-2">
                {combinaciones.map((comb, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-blue-100 px-2 py-1 rounded-md text-xs font-medium"
                  >
                    {comb.nivel} - {comb.paralelo}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsGradoModalOpen(false)}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || combinaciones.length === 0}
              className="flex-1 px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {isCreating
                ? "Creando..."
                : `Crear ${combinaciones.length} Grado(s)`}
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================
          MODALES DE CONFIRMACIÓN DE BORRADO 
      ========================================= */}
      <ConfirmModal
        isOpen={!!gradoAEliminar}
        onClose={() => setGradoAEliminar(null)}
        onConfirm={async () => {
          if (gradoAEliminar) {
            await borrarGrado(gradoAEliminar.id);
            setGradoAEliminar(null);
          }
        }}
        title={`¿Eliminar "${gradoAEliminar?.nivel} - ${gradoAEliminar?.paralelo}"?`}
        message={
          <>
            Estás a punto de eliminar este grado. Si tiene{" "}
            <strong>{terminosGradoAEliminar.padre}</strong> y{" "}
            <strong>{terminosGradoAEliminar.hijo}</strong> configurados, todos
            se borrarán de forma permanente.
            <br />
            <br />
            <span className="text-red-500 font-semibold text-xs">
              Esta acción no se puede deshacer.
            </span>
          </>
        }
        confirmText="Sí, eliminar"
      />

      <ConfirmModal
        isOpen={!!nivelAEliminar}
        onClose={() => setNivelAEliminar(null)}
        onConfirm={async () => {
          if (nivelAEliminar) {
            await borrarNivel(nivelAEliminar.id);
            setNivelAEliminar(null);
          }
        }}
        title={`¿Eliminar "${nivelAEliminar?.nombre}"?`}
        message={
          nivelAEliminar?.gradosAsociados &&
          nivelAEliminar.gradosAsociados > 0 ? (
            <>
              ⚠️ Este nivel tiene{" "}
              <strong>
                {nivelAEliminar.gradosAsociados} grado(s) asociado(s)
              </strong>{" "}
              en el año lectivo actual.
              <br />
              <br />
              Si lo eliminas, esos grados quedarán sin nivel en el catálogo.
            </>
          ) : (
            "¿Estás seguro de eliminar este nivel del catálogo?"
          )
        }
        confirmText="Sí, eliminar"
      />
    </div>
  );
}
