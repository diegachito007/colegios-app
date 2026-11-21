import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

// Extraemos los tipos directamente de Supabase
export type BloqueEvaluacion =
  Database["public"]["Tables"]["bloques_evaluacion"]["Row"];
export type BloqueEvaluacionInsert =
  Database["public"]["Tables"]["bloques_evaluacion"]["Insert"];

export const configuracionService = {
  getBloques: async (colegioId: string, anioId: string) => {
    const { data, error } = await supabase
      .from("bloques_evaluacion")
      .select("*")
      .eq("colegio_id", colegioId)
      .eq("anio_lectivo_id", anioId)
      .order("orden", { ascending: true });

    if (error) throw error;
    return data as BloqueEvaluacion[];
  },

  guardarBloques: async (bloques: BloqueEvaluacionInsert[]) => {
    if (bloques.length === 0) return;

    const colegio_id = bloques[0].colegio_id;
    const anio_lectivo_id = bloques[0].anio_lectivo_id;

    // 1. Eliminar configuración anterior
    const { error: deleteError } = await supabase
      .from("bloques_evaluacion")
      .delete()
      .eq("colegio_id", colegio_id)
      .eq("anio_lectivo_id", anio_lectivo_id);

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("bloques_evaluacion")
      .insert(bloques as never[]); // El 'as never[]' quita el error, ya que la validación real la hace el tipo de arriba

    if (insertError) throw insertError;
  },
};
