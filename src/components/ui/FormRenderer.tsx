import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export interface CampoEsquema {
  tipo: string;
  label: string;
  required: boolean;
  options?: string[];
}

export interface FilaEsquema {
  columnas: number;
  campos: CampoEsquema[];
}

interface FormRendererProps {
  esquema: FilaEsquema[];
  initialData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
}

export default function FormRenderer({ esquema, initialData, onSave, isSaving }: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData || {});

  const handleChange = (label: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const todosLosCampos = esquema.flatMap(fila => fila.campos);
    const missingFields = todosLosCampos
      .filter(c => c.required && (!formData[c.label] || formData[c.label] === ""))
      .map(c => c.label);

    if (missingFields.length > 0) {
      return toast.error(`Faltan campos obligatorios: ${missingFields.slice(0, 3).join(", ")}...`);
    }

    await onSave(formData);
  };

  const renderInput = (campo: CampoEsquema) => {
    const val = (formData[campo.label] as string | boolean | number) || "";
    
    switch (campo.tipo) {
      case "text":
        return <input type="text" value={val as string} onChange={e => handleChange(campo.label, e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" />;
      case "number":
        return <input type="number" value={val as number} onChange={e => handleChange(campo.label, e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" />;
      case "date":
        return <input type="date" value={val as string} onChange={e => handleChange(campo.label, e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" />;
      case "textarea":
        return <textarea rows={3} value={val as string} onChange={e => handleChange(campo.label, e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" />;
      case "select":
        return (
          <select value={val as string} onChange={e => handleChange(campo.label, e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all">
            <option value="">Selecciona...</option>
            {campo.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case "checkbox":
        return (
          <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-lg border border-slate-200 h-full mt-1">
            <input type="checkbox" checked={!!formData[campo.label]} onChange={e => handleChange(campo.label, e.target.checked)} className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue" />
            <span className="text-sm text-slate-700 font-medium">{campo.label}</span>
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {esquema.map((fila, rowIndex) => {
        const gridClass = 
          fila.columnas === 3 ? "md:grid-cols-3" : 
          fila.columnas === 2 ? "md:grid-cols-2" : 
          "md:grid-cols-1";

        return (
          <div key={rowIndex} className={`grid grid-cols-1 ${gridClass} gap-4`}>
            {fila.campos.map((campo, colIndex) => (
              <div key={colIndex} className={campo.tipo === "textarea" ? "md:col-span-full" : ""}>
                {campo.tipo !== "checkbox" && (
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {campo.label} {campo.required && <span className="text-red-500">*</span>}
                  </label>
                )}
                {renderInput(campo)}
              </div>
            ))}
          </div>
        );
      })}

      <div className="pt-6 border-t border-slate-200 flex justify-end">
        <button type="submit" disabled={isSaving} className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md disabled:opacity-50 flex items-center gap-2">
          <CheckCircle2 size={18} />
          {isSaving ? "Guardando..." : "Guardar Ficha"}
        </button>
      </div>
    </form>
  );
}