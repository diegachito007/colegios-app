import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type FormularioInsert = Database["public"]["Tables"]["formularios_colegio"]["Insert"];

export const formulariosService = {
  async getFormularios(colegioId: string) {
    const { data, error } = await supabase
      .from("formularios_colegio")
      .select("*")
      .eq("colegio_id", colegioId)
      .order("orden", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  async crearFormulario(formulario: FormularioInsert) {
    const { data, error } = await supabase
      .from("formularios_colegio")
      .insert(formulario as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async actualizarFormulario(id: string, cambios: Partial<FormularioInsert>) {
    const { error } = await supabase
      .from("formularios_colegio")
      .update(cambios as never)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async eliminarFormulario(id: string) {
    const { error } = await supabase
      .from("formularios_colegio")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
};