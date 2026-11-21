import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Monitor, ArrowRight } from "lucide-react";
// Importamos la red neuronal (asegúrate de que la ruta sea correcta)
import NeuralBackground from "../../components/ui/Neural";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile?.status === "active") {
      navigate("/dashboard", { replace: true });
    }
  }, [profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      // Mostramos el error en el recuadro rojo
      setError(error.message || "Credenciales incorrectas.");

      // Mostramos una alerta flotante (Toast) bien visible
      toast.error(error.message || "Error de acceso", {
        duration: 5000,
        position: "top-center",
      });

      setIsLoading(false);
    }
    // Si no hay error, el AuthContext y el useEffect harán la redirección.
    // Nota: El AuthContext ya se encarga de hacer signOut si el colegio está inactivo.
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 🧠 RED NEURONAL DE FONDO */}
      <div className="absolute inset-0 z-0">
        <NeuralBackground />
      </div>

      {/* Fondos decorativos (Blobs) para dar color */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-400/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Contenedor principal (Efecto Glass) */}
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.12)] border border-white/60 p-8 sm:p-10 z-10">
        {/* Botón para volver al inicio */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 text-slate-400 hover:text-brand-blue transition-colors flex items-center gap-1 text-sm font-medium z-20"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Volver
        </button>

        {/* Logo y Título */}
        <div className="text-center mb-10 mt-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
            colegios<span className="text-brand-orange">X</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Ingresa a tu institución
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all placeholder:text-slate-400"
              placeholder="tu@colegio.edu.ec"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Contraseña
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all placeholder:text-slate-400"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-blue hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none mt-2 flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Ingresando...
              </>
            ) : (
              <>
                Iniciar Sesión
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
