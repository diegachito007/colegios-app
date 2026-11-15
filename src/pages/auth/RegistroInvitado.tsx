import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Building2, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";

interface InvitacionData {
  id: string;
  colegio_id: string;
  email: string;
  nombre: string | null;
  cargo_especifico: string | null;
  colegios: { nombre: string } | null;
}

// Función auxiliar para hashear el token (SHA-256)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function RegistroInvitado() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate(); // <-- IMPORTANTE: Hook de navegación

  const [error, setError] = useState<string>(
    token ? "" : "Enlace inválido: falta el token.",
  );
  const [loading, setLoading] = useState<boolean>(!!token);
  const [invitacion, setInvitacion] = useState<InvitacionData | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const checkToken = async () => {
      try {
        // 1. Hasheamos el token
        const tokenHash = await hashToken(token);

        // 2. Llamamos a la RPC con un casteo agresivo
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (supabase.rpc as any)("validar_invitacion", {
          p_token_hash: tokenHash,
        });

        const { data, error: dbError } = response;

        if (dbError || !data || data.length === 0) {
          setError("La invitación es inválida, ya fue usada o ha expirado.");
        } else {
          // 3. Forzamos el tipo de la respuesta
          interface RpcResponse {
            id: string;
            colegio_id: string;
            email: string;
            nombre: string | null;
            cargo_especifico: string | null;
            colegio_nombre: string;
          }

          const inv = (data as unknown as RpcResponse[])[0];

          setInvitacion({
            id: inv.id,
            colegio_id: inv.colegio_id,
            email: inv.email,
            nombre: inv.nombre,
            cargo_especifico: inv.cargo_especifico,
            colegios: { nombre: inv.colegio_nombre },
          });
        }
      } catch (err) {
        console.error("Error en checkToken:", err);
        setError("Error al validar el enlace.");
      }
      setLoading(false);
    };

    checkToken();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitacion) return;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Crear el usuario en Auth.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitacion.email,
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      toast.success("¡Cuenta creada exitosamente! Redirigiendo al login...");

      // 2. Cerrar sesión para forzar un login limpio
      await supabase.auth.signOut();

      // 3. Redirigir al login reemplazando la entrada en el historial
      // Esto evita que el usuario pueda volver atrás con el botón del navegador
      navigate("/login", { replace: true });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear la cuenta.";
      setError(errorMessage);
      console.error("Error completo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (error && !invitacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center border border-red-100">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Enlace Inválido
          </h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-brand-blue" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-dark">
            Únete a {invitacion?.colegios?.nombre}
          </h1>
          <p className="text-slate-500 mt-2">
            Has sido invitado como <strong>Administrador</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                disabled
                value={invitacion?.email || ""}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Crea tu Contraseña
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Confirma tu Contraseña
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                placeholder="Repite tu contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-blue hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50 mt-4"
          >
            {isSubmitting
              ? "Creando cuenta..."
              : "Aceptar Invitación y Crear Cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
