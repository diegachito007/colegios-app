import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colegiosService } from "../services/colegiosService";
import type { Database } from "../types/database.types";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

type ColegioInsert = Database["public"]["Tables"]["colegios"]["Insert"];

export const useColegios = () => {
  const queryClient = useQueryClient();

  // 1. Obtener Colegios
  const {
    data: colegios,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["colegios"],
    queryFn: colegiosService.getColegios,
  });

  // 2. ✨ MAGIA EN TIEMPO REAL: Escuchamos cambios en Supabase
  useEffect(() => {
    const channel = supabase
      .channel("cambios-en-vivo")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "colegios" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["colegios"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usuarios" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["colegios"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 3. Mutación para crear un colegio
  const createMutation = useMutation({
    mutationFn: (nuevoColegio: ColegioInsert) =>
      colegiosService.createColegio(nuevoColegio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colegios"] });
      toast.success("Colegio creado exitosamente");
    },
    onError: (err) => toast.error(err.message),
  });

  // 4. Mutación para activar/desactivar
  const toggleActivoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      colegiosService.toggleActivo(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colegios"] });
      toast.success("Estado del colegio actualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    colegios,
    isLoading,
    error,
    crearColegio: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    toggleActivo: toggleActivoMutation.mutateAsync,
  };
};
