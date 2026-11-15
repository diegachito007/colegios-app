import { useState } from "react";
import { useColegios } from "../../../hooks/useColegios";
import { useAuth } from "../../../hooks/useAuth";
import {
  Plus,
  Building2,
  Power,
  Mail,
  UserPlus,
  Copy,
  CheckCircle2,
  Users,
  RefreshCw,
} from "lucide-react";
import Modal from "../../../components/ui/Modal";
import type { ColegioConAdmin } from "../../../services/colegiosService";
import Neural from "../../../components/ui/Neural";
import { invitacionesService } from "../../../services/invitacionesService";
import toast from "react-hot-toast";

export default function ListaColegios() {
  const { colegios, isLoading, crearColegio, isCreating, toggleActivo } =
    useColegios();
  const { profile } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    codigo_amie: "",
  });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedColegio, setSelectedColegio] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [inviteData, setInviteData] = useState({
    email: "",
    nombre: "",
    cargo: "Rector(a)",
  });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(
    null,
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitColegio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearColegio({
        nombre: formData.nombre,
        codigo_amie: formData.codigo_amie || null,
      });
      setIsModalOpen(false);
      setFormData({
        nombre: "",
        codigo_amie: "",
      });
    } catch {
      /* empty */
    }
  };

  const openInviteModal = (colegio: ColegioConAdmin) => {
    setSelectedColegio({ id: colegio.id, nombre: colegio.nombre });
    setInviteData({ email: "", nombre: "", cargo: "Rector(a)" });
    setInviteLink(null);
    setInvitationToRevoke(null);
    setIsInviteModalOpen(true);
  };

  const handleResendInvite = async (colegio: ColegioConAdmin) => {
    try {
      const pendiente = await invitacionesService.getInvitacionPendiente(
        colegio.id,
      );

      setSelectedColegio({ id: colegio.id, nombre: colegio.nombre });

      if (pendiente) {
        setInviteData({
          email: pendiente.email,
          nombre: pendiente.nombre || "",
          cargo: pendiente.cargo_especifico || "Rector(a)",
        });
        setInvitationToRevoke(pendiente.id);
        toast.success(
          "Datos cargados. Corrige si es necesario y genera un nuevo enlace.",
        );
      } else {
        setInviteData({ email: "", nombre: "", cargo: "Rector(a)" });
        setInvitationToRevoke(null);
        toast("No hay invitaciones pendientes. Genera una nueva.");
      }

      setInviteLink(null);
      setIsInviteModalOpen(true);
    } catch {
      toast.error("No se pudo cargar la invitación anterior");
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColegio || !profile?.id) return;
    setIsInviting(true);

    try {
      if (invitationToRevoke) {
        await invitacionesService.revocarInvitacion(invitationToRevoke);
      }

      const { token } = await invitacionesService.crearInvitacion({
        colegio_id: selectedColegio.id,
        email: inviteData.email,
        nombre: inviteData.nombre,
        rol: "admin_colegio",
        cargo_especifico: inviteData.cargo,
        invitado_por: profile.id,
      });

      const link = `${window.location.origin}/registro-invitado?token=${token}`;
      setInviteLink(link);
      setInvitationToRevoke(null);
      toast.success(
        invitationToRevoke
          ? "Enlace anterior revocado y nuevo enlace generado"
          : "Invitación generada correctamente",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al generar la invitación";
      toast.error(message);
    } finally {
      setIsInviting(false);
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
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <Neural />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              Gestión de Colegios
            </h1>
            <p className="text-slate-500 mt-1">
              Administra las instituciones y sus administradores.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg font-semibold"
          >
            <Plus size={20} /> Nuevo Colegio
          </button>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-sm text-slate-500">
                  <th className="p-5 font-semibold">Institución</th>
                  <th className="p-5 font-semibold">Código AMIE</th>
                  <th className="p-5 font-semibold">Administrador</th>
                  <th className="p-5 font-semibold text-center">Estado</th>
                  <th className="p-5 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {colegios?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Building2 size={48} className="text-slate-300" />
                        <p className="text-lg font-medium text-slate-600">
                          No hay colegios registrados
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  colegios?.map((colegio: ColegioConAdmin) => {
                    const admin = colegio.usuarios?.find(
                      (u) => u.rol === "admin_colegio",
                    );
                    return (
                      <tr
                        key={colegio.id}
                        className="hover:bg-white/50 transition-colors group"
                      >
                        <td className="p-5">
                          <div className="font-bold text-brand-dark text-base">
                            {colegio.nombre}
                          </div>
                        </td>

                        <td className="p-5">
                          <span className="font-mono text-sm bg-slate-100/80 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/50">
                            {colegio.codigo_amie || "N/A"}
                          </span>
                        </td>

                        <td className="p-5">
                          {admin ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-brand-dark text-sm">
                                {admin.display_name || "Sin nombre"}
                              </span>
                              <span className="text-xs text-brand-blue flex items-center gap-1 mt-0.5">
                                <Mail size={12} /> {admin.email}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-xs font-medium border border-orange-200">
                              <Users size={14} /> Sin asignar
                            </span>
                          )}
                        </td>

                        <td className="p-5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colegio.activo ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${colegio.activo ? "bg-emerald-500" : "bg-red-500"}`}
                            ></span>
                            {colegio.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!admin ? (
                              <>
                                <button
                                  onClick={() => openInviteModal(colegio)}
                                  className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-brand-blue hover:bg-blue-50"
                                  title="Asignar Administrador"
                                >
                                  <UserPlus size={20} />
                                </button>
                                <button
                                  onClick={() => handleResendInvite(colegio)}
                                  className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                                  title="Reenviar / Generar nuevo enlace"
                                >
                                  <RefreshCw size={20} />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium px-2">
                                Admin Activo
                              </span>
                            )}
                            <button
                              onClick={() =>
                                toggleActivo({
                                  id: colegio.id,
                                  activo: !colegio.activo,
                                })
                              }
                              className={`p-2.5 rounded-xl transition-all ${colegio.activo ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                              title={
                                colegio.activo
                                  ? "Desactivar Colegio"
                                  : "Activar Colegio"
                              }
                            >
                              <Power size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CREAR COLEGIO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Colegio"
      >
        <form onSubmit={handleSubmitColegio} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nombre de la Institución *
            </label>
            <input
              type="text"
              required
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
              placeholder="Ej. Unidad Educativa San José"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Código AMIE
            </label>
            <input
              type="text"
              name="codigo_amie"
              value={formData.codigo_amie}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
              placeholder="Ej. 17H01234"
            />
          </div>
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
              disabled={isCreating}
              className="flex-1 px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>{" "}
                  Guardando...
                </>
              ) : (
                "Guardar Colegio"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE INVITACIÓN */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={`Invitar Administrador a ${selectedColegio?.nombre}`}
      >
        {!inviteLink ? (
          <form onSubmit={handleInviteSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nombre del Administrador *
              </label>
              <input
                type="text"
                required
                value={inviteData.nombre}
                onChange={(e) =>
                  setInviteData({ ...inviteData, nombre: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
                placeholder="Ej. Maritza Nazate"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={inviteData.email}
                onChange={(e) =>
                  setInviteData({ ...inviteData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
                placeholder="rector@colegio.edu.ec"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Cargo
              </label>
              <input
                type="text"
                value={inviteData.cargo}
                onChange={(e) =>
                  setInviteData({ ...inviteData, cargo: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isInviting}
              className="w-full px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isInviting
                ? "Generando enlace..."
                : "Generar Enlace de Invitación"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">
              ¡Invitación Generada!
            </h3>
            <p className="text-sm text-slate-500">
              Copia este enlace y envíalo al administrador por correo o WhatsApp.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 overflow-hidden mt-4">
              <span className="text-sm text-slate-600 truncate font-mono">
                {inviteLink}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  toast.success("Enlace copiado");
                }}
                className="p-2 bg-white rounded-lg shadow-sm text-brand-blue hover:bg-blue-50 transition-colors shrink-0"
              >
                <Copy size={18} />
              </button>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="mt-6 w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}