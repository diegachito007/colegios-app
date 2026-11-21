import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  configuracionService,
  type BloqueEvaluacionInsert,
} from "../services/configuracionService";
import toast from "react-hot-toast";

export const useConfiguracion = (
  colegioId: string | null,
  anioId: string | null,
) => {
  const queryClient = useQueryClient();

  // 1. Obtener bloques
  const { data: bloques, isLoading } = useQuery({
    queryKey: ["bloques_evaluacion", colegioId, anioId],
    queryFn: () => configuracionService.getBloques(colegioId!, anioId!),
    enabled: !!colegioId && !!anioId,
  });

  // 2. Guardar bloques
  const guardarMutation = useMutation({
    mutationFn: (nuevosBloques: BloqueEvaluacionInsert[]) =>
      configuracionService.guardarBloques(nuevosBloques),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bloques_evaluacion", colegioId, anioId],
      });
      toast.success("Configuración guardada correctamente");
    },
    onError: (err) => {
      console.error(err);
      toast.error("No se pudo guardar la configuración");
    },
  });

  return {
    bloques,
    isLoading,
    guardarBloques: guardarMutation.mutateAsync,
    isSaving: guardarMutation.isPending,
  };
};
