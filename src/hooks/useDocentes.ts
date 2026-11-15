import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docentesService } from "../services/docentesService";
import type { Database } from "../types/database.types";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAniosLectivos } from "./useAniosLectivos";

type DocenteInsert = Database["public"]["Tables"]["docentes"]["Insert"];

// ==========================================
// HOOK 1: Lista de Docentes (Para el Admin)
// ==========================================
export const useDocentes = (colegioId: string | null) => {
  const queryClient = useQueryClient();

  const { data: docentes, isLoading } = useQuery({
    queryKey: ["docentes", colegioId],
    queryFn: () => docentesService.getDocentes(colegioId!),
    enabled: !!colegioId,
  });

  // Realtime para que el admin vea cambios (ej. activaciones)
  useEffect(() => {
    if (!colegioId) return;
    const channel = supabase
      .channel("cambios-docentes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "docentes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["docentes", colegioId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [colegioId, queryClient]);

  const crearMutation = useMutation({
    mutationFn: (
      nuevo: Omit<DocenteInsert, "token_invitacion" | "invitacion_aceptada">,
    ) => docentesService.crearDocenteConInvitacion(nuevo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docentes", colegioId] });
      toast.success("Docente registrado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => docentesService.eliminarDocente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docentes", colegioId] });
      toast.success("Docente eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  const guardarAsignacionesMutation = useMutation({
    mutationFn: ({
      docenteId,
      colegioId,
      anioLectivoId,
      gradosIds,
    }: {
      docenteId: string;
      colegioId: string;
      anioLectivoId: string;
      gradosIds: { gradoId: string; esTutor: boolean }[];
    }) =>
      docentesService.guardarAsignaciones(
        docenteId,
        colegioId,
        anioLectivoId,
        gradosIds,
      ),
    onSuccess: () => {
      toast.success("Grados asignados correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    docentes,
    isLoading,
    crearDocente: crearMutation.mutateAsync,
    isCreating: crearMutation.isPending,
    eliminarDocente: eliminarMutation.mutateAsync,
    guardarAsignaciones: guardarAsignacionesMutation.mutateAsync,
    isSavingAsignaciones: guardarAsignacionesMutation.isPending,
  };
};

// ==========================================
// ✅ HOOK 2: ¿El usuario tiene grados asignados?
// ==========================================
export const useEsDocente = (usuarioId: string | null) => {
  const queryClient = useQueryClient();
  const { anios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);

  // 1. Obtenemos el ID del docente a partir del usuario logueado
  const { data: docenteId } = useQuery({
    queryKey: ["docente_id_es_docente", usuarioId],
    queryFn: () => docentesService.getDocenteIdPorUsuario(usuarioId!),
    enabled: !!usuarioId,
  });

  // 2. Verificamos si tiene al menos una asignación de grado
  const { data: esDocente, isLoading } = useQuery({
    queryKey: ["es_docente", docenteId, anioActivo?.id],
    queryFn: async () => {
      if (!docenteId || !anioActivo?.id) return false;
      const { data, error } = await supabase
        .from("asignaciones_grados")
        .select("id")
        .eq("docente_id", docenteId)
        .eq("anio_lectivo_id", anioActivo.id)
        .limit(1);
      if (error) return false;
      return data && data.length > 0;
    },
    enabled: !!docenteId && !!anioActivo?.id,
    staleTime: 0,
    refetchOnWindowFocus: true, // ✅ AGREGA ESTA LÍNEA
  });

  // 3. Realtime para actualizar el Sidebar con un pequeño delay
  useEffect(() => {
    if (!docenteId || !anioActivo?.id) return;
    const channel = supabase
      .channel("cambios-es-docente")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "asignaciones_grados",
          // ✅ SIN filter: los DELETE no traen registro nuevo y el filter los descartaba
        },
        (payload) => {
          // Filtrado en cliente: solo reaccionar si el cambio es de ESTE docente
          const nuevo = payload.new as { docente_id?: string } | null;
          const viejo = payload.old as { docente_id?: string } | null;
          const afectado = nuevo?.docente_id ?? viejo?.docente_id;
          if (afectado && afectado !== docenteId) return;

          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ["es_docente", docenteId, anioActivo.id],
            });
          }, 800);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [docenteId, anioActivo?.id, queryClient]);

  return { esDocente: !!esDocente, isLoading };
};
