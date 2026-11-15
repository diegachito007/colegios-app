import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formulariosService } from "../services/formulariosService";
import type { Database } from "../types/database.types";
import toast from "react-hot-toast";

type FormularioInsert =
  Database["public"]["Tables"]["formularios_colegio"]["Insert"];
type FormularioRow = Database["public"]["Tables"]["formularios_colegio"]["Row"];

export const useFormularios = (colegioId: string | null) => {
  const queryClient = useQueryClient();

  const { data: formularios, isLoading } = useQuery<FormularioRow[]>({
    queryKey: ["formularios", colegioId],
    queryFn: () => formulariosService.getFormularios(colegioId!),
    enabled: !!colegioId,
  });

  const createMutation = useMutation({
    mutationFn: (nuevo: FormularioInsert) =>
      formulariosService.crearFormulario(nuevo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formularios", colegioId] });
      toast.success("Formulario creado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  // ✅ NUEVA MUTACIÓN PARA ACTUALIZAR (Activar/Desactivar, Orden)
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      cambios,
    }: {
      id: string;
      cambios: Partial<FormularioInsert>;
    }) => formulariosService.actualizarFormulario(id, cambios),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formularios", colegioId] });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => formulariosService.eliminarFormulario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formularios", colegioId] });
      toast.success("Formulario eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    formularios,
    isLoading,
    crearFormulario: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    actualizarFormulario: (id: string, cambios: Partial<FormularioInsert>) =>
      updateMutation.mutateAsync({ id, cambios }),
    eliminarFormulario: deleteMutation.mutateAsync,
  };
};
