import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type AnioLectivoRow = Database["public"]["Tables"]["anios_lectivos"]["Row"];
type AnioLectivoInsert = Database["public"]["Tables"]["anios_lectivos"]["Insert"];
type AnioLectivoUpdate = Database["public"]["Tables"]["anios_lectivos"]["Update"];
type PeriodoEvaluacionInsert = Database["public"]["Tables"]["periodos_evaluacion"]["Insert"];
type PeriodoEvaluacionRow = Database["public"]["Tables"]["periodos_evaluacion"]["Row"];

export const aniosLectivosService = {
  async getAniosLectivos() {
    const { data, error } = await supabase
      .from("anios_lectivos")
      .select("*, periodos_evaluacion(*)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as unknown as (AnioLectivoRow & { periodos_evaluacion: PeriodoEvaluacionRow[] })[];
  },

  async createAnioLectivo(
    anio: AnioLectivoInsert,
    periodos: Omit<PeriodoEvaluacionInsert, "anio_lectivo_id">[],
  ) {
    const { data: nuevoAnio, error: anioError } = await supabase
      .from("anios_lectivos")
      .insert(anio as unknown as never) // <-- Casteo doble
      .select()
      .single();

    if (anioError) throw new Error(anioError.message);

    if (periodos.length > 0) {
      const periodosConId = periodos.map((p) => ({
        ...p,
        anio_lectivo_id: (nuevoAnio as AnioLectivoRow).id,
      }));

      const { error: periodosError } = await supabase
        .from("periodos_evaluacion")
        .insert(periodosConId as unknown as never); // <-- Casteo doble

      if (periodosError) throw new Error(periodosError.message);
    }

    return nuevoAnio;
  },

  async updateAnioLectivo(
    id: string,
    anio: AnioLectivoUpdate,
    periodos: Omit<PeriodoEvaluacionInsert, "anio_lectivo_id">[],
  ) {
    const { error: anioError } = await supabase
      .from("anios_lectivos")
      .update(anio as unknown as never) // <-- Casteo doble
      .eq("id", id);

    if (anioError) throw new Error(anioError.message);

    const { error: deleteError } = await supabase
      .from("periodos_evaluacion")
      .delete()
      .eq("anio_lectivo_id", id);

    if (deleteError) throw new Error(deleteError.message);

    if (periodos.length > 0) {
      const periodosConId = periodos.map((p) => ({
        ...p,
        anio_lectivo_id: id,
      }));
      const { error: periodosError } = await supabase
        .from("periodos_evaluacion")
        .insert(periodosConId as unknown as never); // <-- Casteo doble

      if (periodosError) throw new Error(periodosError.message);
    }
  },

  async deleteAnioLectivo(id: string) {
    const { error } = await supabase
      .from("anios_lectivos")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async activarAnio(id: string, colegioId: string) {
    const { error: err1 } = await supabase
      .from("anios_lectivos")
      .update({ es_actual: false } as unknown as never) // <-- Casteo doble
      .eq("colegio_id", colegioId);

    if (err1) throw new Error(err1.message);

    const { error: err2 } = await supabase
      .from("anios_lectivos")
      .update({ es_actual: true } as unknown as never) // <-- Casteo doble
      .eq("id", id);

    if (err2) throw new Error(err2.message);
  },
};