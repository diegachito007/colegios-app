import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { horariosService } from "../services/horariosService";
import { docentesService } from "../services/docentesService";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export interface BloqueHorario {
  dia: number;
  horas: number[];
}

export interface HorarioConRelaciones {
  id: string;
  colegio_id: string;
  anio_lectivo_id: string;
  docente_id: string;
  grado_id: string;
  materia_id: string;
  horario: BloqueHorario[];
  created_at: string | null;
  grados?: { nivel: string; paralelo: string } | null;
  docentes?: { nombres: string; apellidos: string } | null;
  materias_destrezas?: { nombre: string; descripcion: string } | null;
}

export const useHorarios = (
  usuarioId: string | null,
  gradoId: string | null,
  anioLectivoId: string | null,
) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // 1. ID real del docente
  const { data: docenteId, isLoading: isLoadingDocente } = useQuery({
    queryKey: ["docente_id", usuarioId],
    queryFn: () => docentesService.getDocenteIdPorUsuario(usuarioId!),
    enabled: !!usuarioId,
  });

  // 2. Grados asignados
  const { data: gradosAsignados, isLoading: isLoadingGrados } = useQuery({
    queryKey: ["grados_docente", docenteId, anioLectivoId],
    queryFn: () => horariosService.getGradosDocente(docenteId!, anioLectivoId!),
    enabled: !!docenteId && !!anioLectivoId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 3. Horarios de TODOS los docentes en ESTE grado
  const { data: horariosDelGrado, isLoading: isLoadingHorariosGrado } =
    useQuery({
      queryKey: ["horarios_grado_completo", gradoId, anioLectivoId],
      queryFn: async () => {
        if (!gradoId || !anioLectivoId) return [];
        const { data, error } = await supabase
          .from("horarios_docentes")
          .select(
            "*, docentes(nombres, apellidos), materias_destrezas(nombre, descripcion)",
          )
          .eq("grado_id", gradoId)
          .eq("anio_lectivo_id", anioLectivoId);
        if (error) throw error;
        return data as unknown as HorarioConRelaciones[];
      },
      enabled: !!gradoId && !!anioLectivoId,
      staleTime: 0,
      refetchOnWindowFocus: true,
    });

  // 4. MIS horarios en TODOS los grados
  const { data: horariosDelDocente, isLoading: isLoadingHorariosDocente } =
    useQuery({
      queryKey: ["horarios_docente_todos", docenteId, anioLectivoId],
      queryFn: async () => {
        if (!docenteId || !anioLectivoId) return [];
        const { data, error } = await supabase
          .from("horarios_docentes")
          .select(
            "*, grados(nivel, paralelo), materias_destrezas(nombre, descripcion)",
          )
          .eq("docente_id", docenteId)
          .eq("anio_lectivo_id", anioLectivoId);
        if (error) throw error;
        return data as unknown as HorarioConRelaciones[];
      },
      enabled: !!docenteId && !!anioLectivoId,
      staleTime: 0,
      refetchOnWindowFocus: true,
    });

  const invalidarTodo = () => {
    queryClient.invalidateQueries({
      queryKey: ["horarios_grado_completo", gradoId, anioLectivoId],
    });
    queryClient.invalidateQueries({
      queryKey: ["horarios_docente_todos", docenteId, anioLectivoId],
    });
  };

  const guardarMutation = useMutation({
    mutationFn: (payload: {
      colegio_id: string;
      anio_lectivo_id: string;
      docente_id: string;
      grado_id: string;
      materia_id: string;
      horario: BloqueHorario[];
    }) => horariosService.guardarHorario(payload),
    onSuccess: () => {
      invalidarTodo();
      toast.success("Horario actualizado");
    },
    onError: (err) => {
      console.error("Error del trigger:", err); // ✅ Para depurar
      const message =
        err instanceof Error ? err.message : "Error al guardar el horario";
      toast.error(message, { duration: 6000 });
      invalidarTodo();
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => horariosService.eliminarHorario(id),
    onSuccess: () => {
      invalidarTodo();
      toast.success("Materia eliminada del horario");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Error al eliminar";
      toast.error(message, { duration: 6000 });
      invalidarTodo();
    },
  });

  // Realtime
  useEffect(() => {
    if (!docenteId) return;
    const channelGrados = supabase
      .channel(`rt-grados-${docenteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "asignaciones_grados" },
        (payload) => {
          const nuevo = payload.new as { docente_id?: string } | null;
          const viejo = payload.old as { docente_id?: string } | null;
          const afectado = nuevo?.docente_id ?? viejo?.docente_id;
          if (afectado && afectado !== docenteId) return;
          queryClient.invalidateQueries({
            queryKey: ["grados_docente", docenteId, anioLectivoId],
          });
        },
      )
      .subscribe();

    const channelHorarios = supabase
      .channel(`rt-horarios-${docenteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "horarios_docentes" },
        () => {
          invalidarTodo();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelGrados);
      supabase.removeChannel(channelHorarios);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docenteId, gradoId, anioLectivoId, queryClient]);

  return {
    gradosAsignados,
    horariosDelGrado,
    horariosDelDocente,
    isLoading:
      isLoadingDocente ||
      isLoadingGrados ||
      isLoadingHorariosGrado ||
      isLoadingHorariosDocente,
    colegioId: profile?.colegio_id,
    docenteId,
    guardarHorario: guardarMutation.mutateAsync,
    eliminarHorario: eliminarMutation.mutateAsync,
    isSaving: guardarMutation.isPending || eliminarMutation.isPending,
  };
};
