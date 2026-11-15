import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type ColegioRow = Database["public"]["Tables"]["colegios"]["Row"];
type ColegioInsert = Database["public"]["Tables"]["colegios"]["Insert"];
type ColegioUpdate = Database["public"]["Tables"]["colegios"]["Update"];

export type ColegioConAdmin = ColegioRow & {
  usuarios:
    | { display_name: string | null; email: string; rol: string }[]
    | null;
};

export const colegiosService = {
  async getColegios(): Promise<ColegioConAdmin[]> {
    const { data, error } = await supabase
      .from("colegios")
      .select(
        `
        *,
        usuarios (
          display_name,
          email,
          rol
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as unknown as ColegioConAdmin[];
  },

  async createColegio(colegio: ColegioInsert): Promise<ColegioRow> {
    const { data, error } = await supabase
      .from("colegios")
      .insert(colegio as unknown as never) // <-- Casteo doble
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ColegioRow;
  },

  async updateColegio(id: string, updates: ColegioUpdate): Promise<ColegioRow> {
    const { data, error } = await supabase
      .from("colegios")
      .update(updates as unknown as never) // <-- Casteo doble
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ColegioRow;
  },

  async toggleActivo(id: string, activo: boolean): Promise<ColegioRow> {
    const { data, error } = await supabase
      .from("colegios")
      .update({ activo } as unknown as never) // <-- Casteo doble
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ColegioRow;
  },
};
