import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useEffect, useRef } from "react";

export interface PersonalRow {
  id: string;
  display_name: string | null;
  email: string;
  rol: string;
  status: string;
  cargo_especifico: string | null;
  area_director: string | null;
}

// ✅ Contador para nombres únicos (GestionPersonal y GestionConfiguracion
// usan este hook a la vez; con nombre fijo habría colisión de canal)
let personalChannelSeq = 0;

export const usePersonal = (colegioId: string | null) => {
  const queryClient = useQueryClient();
  const channelIdRef = useRef(`cambios-personal-${++personalChannelSeq}`);

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
      .channel(channelIdRef.current) // ✅ nombre único por componente
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "usuarios",
          filter: `colegio_id=eq.${colegioId}`,
        },
        () => {
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