import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { curriculoService } from "../services/curriculoService";
import type { Database } from "../types/database.types";
import toast from "react-hot-toast";

type AreaInsert = Database["public"]["Tables"]["areas"]["Insert"];
type MateriaInsert = Database["public"]["Tables"]["materias_destrezas"]["Insert"];

export const useCurriculo = (gradoId: string | null, colegioId: string | null, anioLectivoId: string | null) => {
  const queryClient = useQueryClient();

  const { data: areas, isLoading: isLoadingAreas } = useQuery({
    queryKey: ["areas", gradoId],
    queryFn: () => curriculoService.getAreasPorGrado(gradoId!),
    enabled: !!gradoId,
  });

  const { data: materias, isLoading: isLoadingMaterias } = useQuery({
    queryKey: ["materias_destrezas", gradoId],
    queryFn: () => curriculoService.getMateriasPorGrado(gradoId!),
    enabled: !!gradoId,
  });

  const createAreaMutation = useMutation({
    mutationFn: (nuevasAreas: AreaInsert[]) => curriculoService.crearAreasMasivas(nuevasAreas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas", gradoId] });
      toast.success("Áreas/Ámbitos creados correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const createMateriaMutation = useMutation({
    mutationFn: (nuevasMaterias: MateriaInsert[]) => curriculoService.crearMateriasMasivas(nuevasMaterias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materias_destrezas", gradoId] });
      toast.success("Materias/Destrezas creadas correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => curriculoService.eliminarArea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas", gradoId] });
      queryClient.invalidateQueries({ queryKey: ["materias_destrezas", gradoId] });
      toast.success("Área/Ámbito eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMateriaMutation = useMutation({
    mutationFn: (id: string) => curriculoService.eliminarMateria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materias_destrezas", gradoId] });
      toast.success("Materia/Destreza eliminada");
    },
    onError: (err) => toast.error(err.message),
  });

  const copyMutation = useMutation({
    mutationFn: (gradosDestinoIds: string[]) => {
      if (!gradoId || !colegioId || !anioLectivoId) throw new Error("Faltan datos");
      return curriculoService.copiarCurriculo(gradoId, gradosDestinoIds, colegioId, anioLectivoId);
    },
    onSuccess: () => {
      toast.success("Currículo copiado exitosamente");
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    areas,
    materias,
    isLoading: isLoadingAreas || isLoadingMaterias,
    crearAreas: createAreaMutation.mutateAsync,
    isCreatingArea: createAreaMutation.isPending,
    crearMaterias: createMateriaMutation.mutateAsync,
    isCreatingMateria: createMateriaMutation.isPending,
    eliminarArea: deleteAreaMutation.mutateAsync,
    eliminarMateria: deleteMateriaMutation.mutateAsync,
    copiarCurriculo: copyMutation.mutateAsync,
    isCopying: copyMutation.isPending,
  };
};