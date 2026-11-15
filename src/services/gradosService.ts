import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type GradoRow = Database["public"]["Tables"]["grados"]["Row"];
type GradoInsert = Database["public"]["Tables"]["grados"]["Insert"];

export const gradosService = {
  async getGrados(anioLectivoId: string) {
    const { data, error } = await supabase
      .from("grados")
      .select("*")
      .eq("anio_lectivo_id", anioLectivoId)
      .order("orden", { ascending: true });

    if (error) throw new Error(error.message);
    return data as GradoRow[];
  },

  async crearGradosMultiples(grados: GradoInsert[]) {
    const { data, error } = await supabase
      .from("grados")
      .insert(grados as unknown as never) // <-- Casteo doble
      .select();

    if (error) {
      // Si hay error de duplicado, lo manejamos
      if (error.code === "23505") {
        throw new Error(
          "Ya existen grados con esos niveles y paralelos para este año lectivo.",
        );
      }
      throw new Error(error.message);
    }
    return data as GradoRow[];
  },

  async toggleActivo(id: string, activo: boolean) {
    const { error } = await supabase
      .from("grados")
      .update({ activo } as unknown as never) // <-- Casteo doble
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async deleteGrado(id: string) {
    const { error } = await supabase.from("grados").delete().eq("id", id);

    if (error) throw new Error(error.message);
  },
};
