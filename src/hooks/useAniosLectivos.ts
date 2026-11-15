import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aniosLectivosService } from "../services/aniosLectivosService";
import type { Database } from "../types/database.types";
import toast from "react-hot-toast";

type AnioLectivoInsert =
  Database["public"]["Tables"]["anios_lectivos"]["Insert"];
type AnioLectivoUpdate =
  Database["public"]["Tables"]["anios_lectivos"]["Update"];
type PeriodoEvaluacionInsert =
  Database["public"]["Tables"]["periodos_evaluacion"]["Insert"];

export const useAniosLectivos = () => {
  const queryClient = useQueryClient();

  const { data: anios, isLoading } = useQuery({
    queryKey: ["anios_lectivos"],
    queryFn: aniosLectivosService.getAniosLectivos,
  });

  const createMutation = useMutation({
    mutationFn: ({
      anio,
      periodos,
    }: {
      anio: AnioLectivoInsert;
      periodos: Omit<PeriodoEvaluacionInsert, "anio_lectivo_id">[];
    }) => aniosLectivosService.createAnioLectivo(anio, periodos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anios_lectivos"] });
      toast.success("Año lectivo creado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      anio,
      periodos,
    }: {
      id: string;
      anio: AnioLectivoUpdate;
      periodos: Omit<PeriodoEvaluacionInsert, "anio_lectivo_id">[];
    }) => aniosLectivosService.updateAnioLectivo(id, anio, periodos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anios_lectivos"] });
      toast.success("Año lectivo actualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aniosLectivosService.deleteAnioLectivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anios_lectivos"] });
      toast.success("Año lectivo eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  const activarMutation = useMutation({
    mutationFn: ({ id, colegioId }: { id: string; colegioId: string }) =>
      aniosLectivosService.activarAnio(id, colegioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anios_lectivos"] });
      toast.success("Año lectivo activado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    anios,
    isLoading,
    crearAnio: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    actualizarAnio: updateMutation.mutateAsync,
    borrarAnio: deleteMutation.mutateAsync,
    activarAnio: activarMutation.mutateAsync,
  };
};
