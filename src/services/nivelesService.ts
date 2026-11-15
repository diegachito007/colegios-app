import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type NivelRow = Database["public"]["Tables"]["niveles_educativos"]["Row"];
type NivelInsert = Database["public"]["Tables"]["niveles_educativos"]["Insert"];

export const nivelesService = {
  async getNiveles(colegioId: string) {
    const { data, error } = await supabase
      .from("niveles_educativos")
      .select("*")
      .eq("colegio_id", colegioId)
      .order("orden", { ascending: true });

    if (error) throw new Error(error.message);
    return data as NivelRow[];
  },

  async crearNivelesMasivos(niveles: NivelInsert[]) {
    const { data, error } = await supabase
      .from("niveles_educativos")
      .insert(niveles as unknown as never)
      .select();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Algunos de esos niveles ya están registrados.");
      }
      throw new Error(error.message);
    }
    return data as NivelRow[];
  },

  async actualizarNivel(id: string, nombre: string) {
    const { error } = await supabase
      .from("niveles_educativos")
      .update({ nombre } as unknown as never)
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async eliminarNivel(id: string) {
    const { error } = await supabase
      .from("niveles_educativos")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
  async toggleActivo(id: string, activo: boolean) {
    const { error } = await supabase
      .from("niveles_educativos")
      .update({ activo } as unknown as never)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
