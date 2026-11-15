import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useEffect } from "react";

export interface PersonalRow {
  id: string;
  display_name: string | null;
  email: string;
  rol: string;
  status: string;
  cargo_especifico: string | null;
}

export const usePersonal = (colegioId: string | null) => {
  const queryClient = useQueryClient(); // ✅ Necesario para invalidar

  const { data: personal, isLoading } = useQuery<PersonalRow[]>({
    queryKey: ["personal", colegioId],
    queryFn: async () => {
      if (!colegioId) return [];
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("colegio_id", colegioId)
        .neq("rol", "super_admin")
        .order("display_name");
      if (error) throw error;
      return data as PersonalRow[];
    },
    enabled: !!colegioId,
  });

  // ✅ MAGIA EN TIEMPO REAL: Escuchamos cambios en la tabla usuarios
  useEffect(() => {
    if (!colegioId) return;

    const channel = supabase
      .channel("cambios-personal")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "usuarios",
          filter: `colegio_id=eq.${colegioId}`,
        },
        () => {
          // Si un docente se activa o cambia su rol, recargamos la tabla
          queryClient.invalidateQueries({ queryKey: ["personal", colegioId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [colegioId, queryClient]);

  return { personal, isLoading };
};
