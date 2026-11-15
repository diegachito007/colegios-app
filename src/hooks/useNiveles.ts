import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nivelesService } from "../services/nivelesService";
import type { Database } from "../types/database.types";
import toast from "react-hot-toast";

type NivelInsert = Database["public"]["Tables"]["niveles_educativos"]["Insert"];

export const useNiveles = (colegioId: string | null) => {
  const queryClient = useQueryClient();

  const { data: niveles, isLoading } = useQuery({
    queryKey: ["niveles", colegioId],
    queryFn: () => nivelesService.getNiveles(colegioId!),
    enabled: !!colegioId,
  });

  const createMutation = useMutation({
    mutationFn: (nuevosNiveles: NivelInsert[]) =>
      nivelesService.crearNivelesMasivos(nuevosNiveles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niveles", colegioId] });
      toast.success("Niveles configurados correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => nivelesService.eliminarNivel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niveles", colegioId] });
      toast.success("Nivel eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      nivelesService.toggleActivo(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niveles", colegioId] });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) =>
      nivelesService.actualizarNivel(id, nombre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niveles", colegioId] });
      toast.success("Nivel actualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    niveles,
    isLoading,
    crearNiveles: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    actualizarNivel: updateMutation.mutateAsync,
    borrarNivel: deleteMutation.mutateAsync,
    toggleActivo: toggleMutation.mutateAsync,
  };
};
