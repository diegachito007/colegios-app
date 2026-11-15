import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean; // Para cuando la petición a la BD está en curso
  variant?: "danger" | "warning" | "primary";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Sí, confirmar",
  cancelText = "Cancelar",
  isLoading = false,
  variant = "danger",
}: ConfirmModalProps) {
  
  // Colores según la variante
  const variantClasses = {
    danger: {
      iconBg: "bg-red-50 text-red-500",
      btnBg: "bg-red-600 hover:bg-red-700 shadow-red-500/20",
    },
    warning: {
      iconBg: "bg-amber-50 text-amber-500",
      btnBg: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
    },
    primary: {
      iconBg: "bg-blue-50 text-brand-blue",
      btnBg: "bg-brand-blue hover:bg-blue-700 shadow-blue-500/20",
    },
  };

  const currentVariant = variantClasses[variant];

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title={title} size="md">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${currentVariant.iconBg}`}>
          <AlertTriangle size={32} />
        </div>

        <div>
          <h3 className="text-lg font-bold text-brand-dark mb-2">{title}</h3>
          <div className="text-slate-500 text-sm leading-relaxed">
            {message}
          </div>
        </div>

        <div className="flex gap-3 w-full pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${currentVariant.btnBg}`}
          >
            {isLoading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}