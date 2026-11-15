import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Building2, Lock, Mail, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface DatosDocente {
  docente_id: string;
  email: string;
  nombres: string;
  apellidos: string;
  colegio_id: string;
}

export default function ActivarDocente() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docente, setDocente] = useState<DatosDocente | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Enlace inválido: falta el token.");
        setLoading(false);
        return;
      }

      try {
        // ✅ SOLUCIÓN TYPESCRIPT: Casteo para evitar errores de 'never'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (supabase.rpc as any)(
          "validar_invitacion_docente",
          {
            p_token: token,
          },
        );

        const { data, error: rpcError } = response;

        if (rpcError) throw rpcError;

        if (!data || data.length === 0) {
          setError("El enlace es inválido, ya fue usado o ha expirado.");
        } else {
          // Casteamos el resultado
          const inv = (data as unknown as DatosDocente[])[0];
          setDocente(inv);
        }
      } catch (err) {
        console.error(err);
        setError("Error al validar el enlace.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docente) return;

    if (password !== confirmPassword)
      return setError("Las contraseñas no coinciden.");
    if (password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.");

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Crear el usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: docente.email,
        password: password,
        options: {
          data: {
            display_name: `${docente.nombres} ${docente.apellidos}`,
            rol: "docente",
            colegio_id: docente.colegio_id,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      // 2. Quemar el token y vincular el usuario_id
      // ✅ SOLUCIÓN TYPESCRIPT: 'as never' para actualizar sin error de tipos
      const { error: updateError } = await supabase
        .from("docentes")
        .update({
          invitacion_aceptada: true,
          token_invitacion: null,
          usuario_id: authData.user.id,
        } as never)
        .eq("id", docente.docente_id);

      if (updateError) throw updateError;

      toast.success("¡Cuenta creada exitosamente!");
      setExito(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear la cuenta.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-brand-blue w-10 h-10" />
      </div>
    );
  }

  if (exito) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-dark mb-2">
            ¡Cuenta Activada!
          </h1>
          <p className="text-slate-500 mb-6">
            Tu contraseña ha sido configurada correctamente. Ya puedes iniciar
            sesión.
          </p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full bg-brand-blue hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md"
          >
            Ir al Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  if (error && !docente) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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
            Hola, {docente?.nombres}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Has sido invitado como <strong>Docente</strong>. Configura tu
            contraseña para activar tu cuenta.
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
                value={docente?.email || ""}
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
            {isSubmitting ? "Activando cuenta..." : "Guardar y Activar Cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
