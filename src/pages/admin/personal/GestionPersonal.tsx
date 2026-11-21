import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { usePersonal } from "../../../hooks/usePersonal";
import { useAniosLectivos } from "../../../hooks/useAniosLectivos";
import { useGrados } from "../../../hooks/useGrados";
import { docentesService } from "../../../services/docentesService";
import { supabase } from "../../../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import Neural from "../../../components/ui/Neural";
import Modal from "../../../components/ui/Modal";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Copy,
  CheckCircle2,
  Search,
  Loader2,
  BookOpen,
  User,
  Shield,
  Trash2,
  Star,
  Pencil,
} from "lucide-react";
import { invitacionesService } from "../../../services/invitacionesService";

export default function GestionPersonal() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { personal, isLoading: isLoadingPersonal } = usePersonal(
    profile?.colegio_id || null,
  );

  const { anios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);
  const { grados, isLoading: isLoadingGrados } = useGrados(
    anioActivo?.id || null,
  );

  const [searchTerm, setSearchTerm] = useState("");

  // Estados para Crear
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [formData, setFormData] = useState({
    cedula: "",
    nombres: "",
    email: "",
    rol: "docente",
    area_director: "",
  });
  const [gradosNuevo, setGradosNuevo] = useState<
    { gradoId: string; esTutor: boolean }[]
  >([]);
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Estados para Editar Grados
  const [personalAEditar, setPersonalAEditar] = useState<{
    id: string;
    usuario_id: string;
    nombre: string;
    email: string;
  } | null>(null);
  const [gradosEditar, setGradosEditar] = useState<
    { gradoId: string; esTutor: boolean }[]
  >([]);
  const [isLoadingGradosEditar, setIsLoadingGradosEditar] = useState(false);
  const [isSavingGrados, setIsSavingGrados] = useState(false);

  // Estados para el Modal Unificado (Editar Datos)
  const [personalAEditarDatos, setPersonalAEditarDatos] = useState<{
    id: string;
    rolActual: string;
    cargoActual: string | null;
    areaActual: string | null;
  } | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoRol, setNuevoRol] = useState("");
  const [nuevoCargo, setNuevoCargo] = useState("");
  const [nuevoAreaDirector, setNuevoAreaDirector] = useState("");
  const [isSavingDatos, setIsSavingDatos] = useState(false);

  // Estados para Eliminar
  const [personalAEliminar, setPersonalAEliminar] = useState<{
    id: string;
    nombre: string;
  } | null>(null);

  // ✅ EFECTO CORREGIDO
  useEffect(() => {
    let isMounted = true;

    if (personalAEditar && anioActivo) {
      docentesService
        .getDocenteIdPorUsuario(personalAEditar.usuario_id)
        .then((docenteId) => {
          if (!isMounted) return;

          if (docenteId) {
            docentesService
              .getAsignaciones(docenteId, anioActivo.id)
              .then((data) => {
                if (!isMounted) return;
                setGradosEditar(
                  data.map((d) => ({
                    gradoId: d.grado_id,
                    esTutor: d.es_tutor,
                  })),
                );
                setIsLoadingGradosEditar(false);
              })
              .catch(() => {
                if (!isMounted) return;
                toast.error("Error al cargar grados");
                setIsLoadingGradosEditar(false);
              });
          } else {
            setIsLoadingGradosEditar(false);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          toast.error("Error al buscar perfil de docente");
          setIsLoadingGradosEditar(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [personalAEditar, anioActivo]);

  const personalFiltrado = useMemo(() => {
    if (!personal) return [];
    if (!searchTerm) return personal;
    const term = searchTerm.toLowerCase();
    return personal.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.rol?.toLowerCase().includes(term),
    );
  }, [personal, searchTerm]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.colegio_id || !profile?.id || !anioActivo) return;
    setIsCreating(true);
    try {
      let docenteId = null;
      if (formData.rol === "docente" || gradosNuevo.length > 0) {
        if (!formData.cedula)
          throw new Error(
            "La cédula es obligatoria para el personal que da clases.",
          );
        const nuevoDocente = await docentesService.crearDocenteConInvitacion({
          colegio_id: profile.colegio_id,
          cedula: formData.cedula,
          nombres: formData.nombres,
          apellidos: "",
          email_personal: formData.email,
          activo: true,
        });
        docenteId = (nuevoDocente as { id: string }).id;
        if (gradosNuevo.length > 0) {
          await docentesService.guardarAsignaciones(
            docenteId,
            profile.colegio_id,
            anioActivo.id,
            gradosNuevo,
          );
        }
      }

      // Autogenerar cargo si seleccionó área de dirección en la creación
      let cargoFinal = formData.rol;
      if (formData.area_director) {
        const areas = {
          matematica: "Matemática",
          lengua: "Lengua y Literatura",
          sociales: "Ciencias Sociales",
          naturales: "Ciencias Naturales",
        };
        cargoFinal = `Director de Área de ${areas[formData.area_director as keyof typeof areas]}`;
      }

      const { token } = await invitacionesService.crearInvitacion({
        colegio_id: profile.colegio_id,
        email: formData.email,
        nombre: formData.nombres,
        rol: formData.rol,
        cargo_especifico: cargoFinal,
        invitado_por: profile.id,
      });

      setLinkGenerado(
        `${window.location.origin}/registro-invitado?token=${token}`,
      );
      toast.success("Invitación generada correctamente");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGuardarGrados = async () => {
    if (!personalAEditar || !anioActivo || !profile?.colegio_id) return;
    setIsSavingGrados(true);
    try {
      const docenteId = await docentesService.crearPerfilDocenteDesdeUsuario(
        personalAEditar.usuario_id,
        profile.colegio_id,
        personalAEditar.email,
        personalAEditar.nombre,
      );

      await docentesService.guardarAsignaciones(
        docenteId,
        profile.colegio_id,
        anioActivo.id,
        gradosEditar,
      );

      queryClient.invalidateQueries({
        queryKey: ["es_docente", docenteId, anioActivo.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["horarios_docente", docenteId, null, anioActivo.id],
      });

      toast.success("Grados actualizados correctamente");
      setPersonalAEditar(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al guardar";
      toast.error(message);
    } finally {
      setIsSavingGrados(false);
    }
  };

  // ✅ NUEVA FUNCIÓN UNIFICADA PARA GUARDAR NOMBRE, ROL, CARGO Y ÁREA
  const handleGuardarDatos = async () => {
    if (!personalAEditarDatos || !profile?.colegio_id) return;
    if (!nuevoNombre.trim())
      return toast.error("El nombre no puede estar vacío.");

    setIsSavingDatos(true);
    try {
      let cargoFinal = nuevoCargo.trim();
      // Si seleccionó un área y no escribió un cargo manual, lo autogeneramos
      if (nuevoAreaDirector && !cargoFinal) {
        const areas = {
          matematica: "Matemática",
          lengua: "Lengua y Literatura",
          sociales: "Ciencias Sociales",
          naturales: "Ciencias Naturales",
        };
        cargoFinal = `Director de Área de ${areas[nuevoAreaDirector as keyof typeof areas]}`;
      }

      const { error } = await supabase
        .from("usuarios")
        .update({
          display_name: nuevoNombre.trim(),
          rol: nuevoRol as
            | "docente"
            | "inspector"
            | "vicerrector"
            | "admin_colegio",
          cargo_especifico: cargoFinal || null,
          area_director: nuevoAreaDirector || null,
        } as never)
        .eq("id", personalAEditarDatos.id);

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: ["personal", profile.colegio_id],
      });
      toast.success("Datos actualizados correctamente");
      setPersonalAEditarDatos(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar",
      );
    } finally {
      setIsSavingDatos(false);
    }
  };

  const toggleGradoNuevo = (id: string) => {
    setGradosNuevo((prev) => {
      const existe = prev.find((g) => g.gradoId === id);
      if (existe) return prev.filter((g) => g.gradoId !== id);
      return [...prev, { gradoId: id, esTutor: false }];
    });
  };
  const toggleTutorNuevo = (id: string) => {
    setGradosNuevo((prev) =>
      prev.map((g) => {
        if (g.gradoId === id) return { ...g, esTutor: !g.esTutor };
        return { ...g, esTutor: false };
      }),
    );
  };
  const toggleGradoEditar = (id: string) => {
    setGradosEditar((prev) => {
      const existe = prev.find((g) => g.gradoId === id);
      if (existe) return prev.filter((g) => g.gradoId !== id);
      return [...prev, { gradoId: id, esTutor: false }];
    });
  };
  const toggleTutorEditar = (id: string) => {
    setGradosEditar((prev) =>
      prev.map((g) => {
        if (g.gradoId === id) return { ...g, esTutor: !g.esTutor };
        return { ...g, esTutor: false };
      }),
    );
  };

  if (isLoadingPersonal || isLoadingGrados)
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

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              Gestión de Personal
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Administra directivos, docentes e inspectores del colegio.
            </p>
          </div>
          <button
            onClick={() => {
              setLinkGenerado(null);
              setShowCrearModal(true);
            }}
            className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md font-semibold text-sm"
          >
            <Plus size={18} /> Nuevo Integrante
          </button>
        </div>

        {/* Tabla Unificada */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <Users className="text-brand-blue" size={20} />
              <h3 className="text-lg font-bold text-brand-dark">
                Directorio del Colegio
              </h3>
              <span className="bg-blue-100 text-brand-blue text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                {personalFiltrado.length} personas
              </span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar..."
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
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center">Rol</th>
                  <th className="px-6 py-4 text-center">Área Director</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personalFiltrado.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-bold text-brand-dark">
                      {user.display_name}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border capitalize ${
                          user.rol === "admin_colegio"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : user.rol === "vicerrector"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : user.rol === "inspector"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        <Shield size={12} /> {user.rol.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {user.area_director ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                          {user.area_director}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-200">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setPersonalAEditarDatos({
                              id: user.id,
                              rolActual: user.rol,
                              cargoActual: user.cargo_especifico,
                              areaActual: user.area_director,
                            });
                            setNuevoNombre(user.display_name || "");
                            setNuevoRol(user.rol);
                            setNuevoCargo(user.cargo_especifico || "");
                            setNuevoAreaDirector(user.area_director || "");
                          }}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar Datos"
                        >
                          <Pencil size={16} />
                        </button>

                        {user.rol !== "super_admin" && (
                          <button
                            onClick={() => {
                              setIsLoadingGradosEditar(true);
                              setGradosEditar([]);
                              setPersonalAEditar({
                                id: user.id,
                                usuario_id: user.id,
                                nombre: user.display_name || "Usuario",
                                email: user.email,
                              });
                            }}
                            className="px-2 py-1.5 bg-blue-50 text-brand-blue hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                            title="Asignar Grados y Tutorías"
                          >
                            <BookOpen size={14} /> Grados
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setPersonalAEliminar({
                              id: user.id,
                              nombre: user.display_name || "Usuario",
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
          </div>
        </div>
      </div>

      {/* MODAL: CREAR INTEGRANTE */}
      <Modal
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        title={
          linkGenerado ? "¡Invitación Generada!" : "Registrar Nuevo Integrante"
        }
        size="4xl"
      >
        {!linkGenerado ? (
          <form onSubmit={handleCrear} className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                  <User size={18} className="text-brand-blue" />
                  <h4 className="text-sm font-bold text-brand-dark uppercase tracking-wider">
                    Datos Personales
                  </h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cédula *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.cedula}
                    onChange={(e) =>
                      setFormData({ ...formData, cedula: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Apellidos Nombres *
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
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Rol de Sistema *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) =>
                      setFormData({ ...formData, rol: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                  >
                    <option value="docente">Docente</option>
                    <option value="inspector">Inspector(a)</option>
                    <option value="vicerrector">Vicerrector(a)</option>
                    <option value="admin_colegio">Rector(a) / Admin</option>
                  </select>
                </div>

                {/* ✅ SELECTOR DE ÁREA DE DIRECCIÓN (CREAR) */}
                {(formData.rol === "docente" ||
                  formData.rol === "vicerrector") && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Área de Dirección (Opcional)
                    </label>
                    <select
                      value={formData.area_director}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          area_director: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none bg-white"
                    >
                      <option value="">No es director de área</option>
                      <option value="matematica">Matemática</option>
                      <option value="lengua">Lengua y Literatura</option>
                      <option value="sociales">Ciencias Sociales</option>
                      <option value="naturales">Ciencias Naturales</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                      ⚠️ Se asignará formalmente cuando acepte la invitación.
                      Podrás ajustarlo luego con el botón ✏️.
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-4 md:border-l md:pl-8">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                  <BookOpen size={18} className="text-brand-blue" />
                  <h4 className="text-sm font-bold text-brand-dark uppercase tracking-wider">
                    Grados (Opcional)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Marca los grados que dictará. Solo puedes marcar un tutor.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                  {grados?.map((grado) => {
                    const asignacion = gradosNuevo.find(
                      (g) => g.gradoId === grado.id,
                    );
                    const isSelected = !!asignacion;
                    const isTutor = asignacion?.esTutor || false;
                    return (
                      <div
                        key={grado.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${isSelected ? "bg-brand-blue/5 border-brand-blue" : "bg-slate-50 border-slate-200"}`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleGradoNuevo(grado.id)}
                            className="w-4 h-4 text-brand-blue rounded border-slate-300"
                          />
                          <span className="text-xs font-semibold text-slate-700">
                            {grado.nivel} - {grado.paralelo}
                          </span>
                        </label>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => toggleTutorNuevo(grado.id)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 ${isTutor ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                          >
                            <Star
                              size={10}
                              className={isTutor ? "fill-amber-500" : ""}
                            />{" "}
                            {isTutor ? "TUTOR" : "Tutor"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="pt-4 flex gap-3 border-t mt-auto">
              <button
                type="button"
                onClick={() => setShowCrearModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-xl shadow-md text-sm"
              >
                {isCreating ? "Generando..." : "Generar Link"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-4 py-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-brand-dark">
              ¡Invitación Generada!
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Copia este enlace y envíalo por WhatsApp.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 mt-6 max-w-lg mx-auto">
              <span className="text-sm text-slate-600 truncate font-mono">
                {linkGenerado}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(linkGenerado);
                  toast.success("Copiado");
                }}
                className="p-2 bg-white rounded-lg shadow-sm text-brand-blue hover:bg-blue-50 transition-colors shrink-0"
              >
                <Copy size={18} />
              </button>
            </div>
            <button
              onClick={() => {
                setLinkGenerado(null);
                setShowCrearModal(false);
              }}
              className="mt-8 px-8 py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              Entendido
            </button>
          </div>
        )}
      </Modal>

      {/* MODAL: EDITAR GRADOS */}
      <Modal
        isOpen={!!personalAEditar}
        onClose={() => setPersonalAEditar(null)}
        title={`Editar Grados de ${personalAEditar?.nombre}`}
        size="xl"
      >
        {isLoadingGradosEditar ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="animate-spin text-brand-blue w-8 h-8" />
            <p className="text-sm text-slate-500">Cargando grados...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
              {grados?.map((grado) => {
                const asignacion = gradosEditar.find(
                  (g) => g.gradoId === grado.id,
                );
                const isSelected = !!asignacion;
                const isTutor = asignacion?.esTutor || false;
                return (
                  <div
                    key={grado.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isSelected ? "bg-brand-blue/5 border-brand-blue ring-1 ring-brand-blue" : "bg-white border-slate-200"}`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleGradoEditar(grado.id)}
                        className="w-4 h-4 text-brand-blue rounded border-slate-300"
                      />
                      <span
                        className={`text-sm font-medium ${isSelected ? "text-brand-dark" : "text-slate-600"}`}
                      >
                        {grado.nivel} - {grado.paralelo}
                      </span>
                    </label>
                    {isSelected && (
                      <button
                        onClick={() => toggleTutorEditar(grado.id)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 transition-colors ${isTutor ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                      >
                        <Star
                          size={10}
                          className={isTutor ? "fill-amber-500" : ""}
                        />{" "}
                        {isTutor ? "TUTOR" : "Tutor"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="pt-4 flex gap-3 border-t mt-6">
              <button
                type="button"
                onClick={() => setPersonalAEditar(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarGrados}
                disabled={isSavingGrados}
                className="flex-1 px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-xl shadow-md text-sm"
              >
                {isSavingGrados ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL UNIFICADO: EDITAR DATOS (NOMBRE, ROL, CARGO Y ÁREA) */}
      <Modal
        isOpen={!!personalAEditarDatos}
        onClose={() => setPersonalAEditarDatos(null)}
        title="Editar Datos del Personal"
        size="md"
      >
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ El <strong>rol</strong> define los permisos. Si seleccionas un{" "}
            <strong>Área de Dirección</strong>, el sistema autogenerará el cargo
            descriptivo si dejas el cargo adicional vacío.
          </div>

          {personalAEditarDatos?.id === profile?.id && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">
              Estás editando <strong>TU PROPIO</strong> usuario. Si te quitas el
              rol de Admin perderás acceso a este módulo.
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Nombre Completo
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
              placeholder="Ej. Eduardo Guaitarilla"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Rol de Sistema
            </label>
            <select
              value={nuevoRol}
              onChange={(e) => setNuevoRol(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
            >
              <option value="docente">Docente</option>
              <option value="inspector">Inspector(a)</option>
              <option value="vicerrector">Vicerrector(a)</option>
              <option value="admin_colegio">Rector(a) / Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Área de Dirección (Opcional)
            </label>
            <select
              value={nuevoAreaDirector}
              onChange={(e) => setNuevoAreaDirector(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none bg-white"
            >
              <option value="">No es director de área</option>
              <option value="matematica">Matemática</option>
              <option value="lengua">Lengua y Literatura</option>
              <option value="sociales">Ciencias Sociales</option>
              <option value="naturales">Ciencias Naturales</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Cargo Adicional (Opcional)
            </label>
            <input
              type="text"
              value={nuevoCargo}
              onChange={(e) => setNuevoCargo(e.target.value)}
              placeholder="Ej. Coordinador de Convivencia"
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Úsalo solo si tiene un cargo extra que no sea "Director de Área".
            </p>
          </div>

          <div className="pt-4 flex gap-3 border-t">
            <button
              type="button"
              onClick={() => setPersonalAEditarDatos(null)}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarDatos}
              disabled={isSavingDatos || !nuevoNombre.trim()}
              className="flex-1 px-4 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md text-sm disabled:opacity-50"
            >
              {isSavingDatos ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL BORRAR */}
      <ConfirmModal
        isOpen={!!personalAEliminar}
        onClose={() => setPersonalAEliminar(null)}
        onConfirm={async () => {
          toast.success("Usuario eliminado");
          setPersonalAEliminar(null);
        }}
        title="Atención"
        message={`¿Estás seguro que deseas eliminar a ${personalAEliminar?.nombre}?`}
        confirmText="Sí, eliminar"
      />
    </div>
  );
}
