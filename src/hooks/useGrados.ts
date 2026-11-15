import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradosService } from "../services/gradosService";
import type { Database } from "../types/database.types";
import toast from "react-hot-toast";

type GradoInsert = Database["public"]["Tables"]["grados"]["Insert"];

export const useGrados = (anioLectivoId: string | null) => {
  const queryClient = useQueryClient();

  const { data: grados, isLoading } = useQuery({
    queryKey: ["grados", anioLectivoId],
    queryFn: () => gradosService.getGrados(anioLectivoId!),
    enabled: !!anioLectivoId,
  });

  const createMutation = useMutation({
    mutationFn: (nuevosGrados: GradoInsert[]) =>
      gradosService.crearGradosMultiples(nuevosGrados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grados", anioLectivoId] });
      toast.success("Grados creados correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      gradosService.toggleActivo(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grados", anioLectivoId] });
      toast.success("Estado actualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradosService.deleteGrado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grados", anioLectivoId] });
      toast.success("Grado eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    grados,
    isLoading,
    crearGrados: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    toggleActivo: toggleMutation.mutateAsync,
    borrarGrado: deleteMutation.mutateAsync,
  };
};
