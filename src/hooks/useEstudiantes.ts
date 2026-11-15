import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { estudiantesService } from "../services/estudiantesService";
import type { Database } from "../types/database.types";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

type EstudianteInsert = Database["public"]["Tables"]["estudiantes"]["Insert"];

type DatosEstudianteForm = Omit<EstudianteInsert, "colegio_id" | "codigo_interno"> & {
  cedula: string | null;
};

export const useEstudiantes = (
  gradoId: string | null,
  anioLectivoId: string | null,
) => {
  const queryClient = useQueryClient();

  // ✅ Consulta de estudiantes ACTIVOS
  const { data: estudiantes, isLoading } = useQuery({
    queryKey: ["estudiantes", gradoId, anioLectivoId],
    queryFn: () =>
      estudiantesService.getEstudiantesPorGrado(gradoId!, anioLectivoId!),
    enabled: !!gradoId && !!anioLectivoId,
  });

  // ✅ Consulta de estudiantes INACTIVOS (Retirados)
  const { data: estudiantesInactivos, isLoading: isLoadingInactivos } = useQuery({
    queryKey: ["estudiantes_inactivos", gradoId, anioLectivoId],
    queryFn: () =>
      estudiantesService.getEstudiantesInactivos(gradoId!, anioLectivoId!),
    enabled: !!gradoId && !!anioLectivoId,
  });

  // ✅ MAGIA EN TIEMPO REAL
  useEffect(() => {
    if (!gradoId || !anioLectivoId) return;

    const channel = supabase
      .channel("cambios-estudiantes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matriculas" },
        () => {
          // Si alguien matricula, retira o reintegra, recargamos AMBAS listas
          queryClient.invalidateQueries({
            queryKey: ["estudiantes", gradoId, anioLectivoId],
          });
          queryClient.invalidateQueries({
            queryKey: ["estudiantes_inactivos", gradoId, anioLectivoId],
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "estudiantes" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["estudiantes", gradoId, anioLectivoId],
          });
          queryClient.invalidateQueries({
            queryKey: ["estudiantes_inactivos", gradoId, anioLectivoId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gradoId, anioLectivoId, queryClient]);

  // Mutación: Crear individual
  const crearMutation = useMutation({
    mutationFn: ({
      estudiante,
      colegioId,
    }: {
      estudiante: DatosEstudianteForm;
      colegioId: string;
    }) => {
      const payloadCompleto = {
        ...estudiante,
        colegio_id: colegioId,
      } as Omit<EstudianteInsert, "codigo_interno" | "cedula"> & { cedula: string | null };

      return estudiantesService.crearEstudianteYMatricular(payloadCompleto, {
        colegio_id: colegioId,
        anio_lectivo_id: anioLectivoId!,
        grado_id: gradoId!,
        activo: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes", gradoId, anioLectivoId] });
      toast.success("Estudiante matriculado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  // Mutación: Carga Masiva
  const crearMasivoMutation = useMutation({
    mutationFn: ({
      estudiantes,
      colegioId,
    }: {
      estudiantes: DatosEstudianteForm[];
      colegioId: string;
    }) => {
      const payloadCompleto = estudiantes.map((est) => ({
        ...est,
        colegio_id: colegioId,
      })) as (Omit<EstudianteInsert, "codigo_interno" | "cedula"> & { cedula: string | null })[];

      return estudiantesService.crearEstudiantesMasivos(payloadCompleto, {
        colegio_id: colegioId,
        anio_lectivo_id: anioLectivoId!,
        grado_id: gradoId!,
        activo: true,
      });
    },
    onSuccess: (cantidad) => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes", gradoId, anioLectivoId] });
      toast.success(`${cantidad} estudiantes matriculados exitosamente.`);
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes", gradoId, anioLectivoId] });
      toast.error(err.message, { duration: 8000 });
    },
  });

  // Mutación: Editar
  const actualizarMutation = useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Partial<DatosEstudianteForm> }) =>
      estudiantesService.actualizarEstudiante(id, cambios),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes", gradoId, anioLectivoId] });
      toast.success("Estudiante actualizado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  // Mutación: Eliminar (Soft Delete)
  const eliminarMutation = useMutation({
    mutationFn: (matriculaId: string) => estudiantesService.eliminarEstudianteDeGrado(matriculaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes", gradoId, anioLectivoId] });
      queryClient.invalidateQueries({ queryKey: ["estudiantes_inactivos", gradoId, anioLectivoId] });
      toast.success("Estudiante retirado de la nómina");
    },
    onError: (err) => toast.error(err.message),
  });

  // ✅ Mutación: Reactivar
  const reactivarMutation = useMutation({
    mutationFn: (matriculaId: string) => estudiantesService.reactivarMatricula(matriculaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes", gradoId, anioLectivoId] });
      queryClient.invalidateQueries({ queryKey: ["estudiantes_inactivos", gradoId, anioLectivoId] });
      toast.success("Estudiante reintegrado a la nómina");
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    estudiantes,
    isLoading,
    estudiantesInactivos,
    isLoadingInactivos,
    crearEstudiante: crearMutation.mutateAsync,
    isCreating: crearMutation.isPending,
    crearMasivo: crearMasivoMutation.mutateAsync,
    isCreatingMasivo: crearMasivoMutation.isPending,
    actualizarEstudiante: actualizarMutation.mutateAsync,
    isUpdating: actualizarMutation.isPending,
    eliminarEstudiante: eliminarMutation.mutateAsync,
    isDeleting: eliminarMutation.isPending,
    reactivarEstudiante: reactivarMutation.mutateAsync,
    isReactivating: reactivarMutation.isPending,
  };
};