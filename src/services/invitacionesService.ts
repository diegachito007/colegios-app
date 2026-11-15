import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type InvitacionInsert =
  Database["public"]["Tables"]["invitaciones_usuarios"]["Insert"];
type InvitacionRow =
  Database["public"]["Tables"]["invitaciones_usuarios"]["Row"];

// Función auxiliar para hashear el token (SHA-256)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const invitacionesService = {
  async crearInvitacion(data: {
    colegio_id: string;
    email: string;
    nombre: string;
    rol: string;
    cargo_especifico: string;
    invitado_por: string;
  }) {
    const token = crypto.randomUUID();
    const tokenHash = await hashToken(token);

    // Revocar invitaciones anteriores
    const { error: revokeError } = await supabase
      .from("invitaciones_usuarios")
      .update({ estado: "revocada" } as unknown as never)
      .eq("colegio_id", data.colegio_id)
      .eq("email", data.email)
      .eq("estado", "pendiente");

    if (revokeError) throw new Error(revokeError.message);

    const payload: InvitacionInsert = {
      colegio_id: data.colegio_id,
      email: data.email,
      nombre: data.nombre,
      // ✅ SOLUCIÓN: Ampliamos el tipo para aceptar todos los roles
      rol: data.rol as "admin_colegio" | "vicerrector" | "inspector" | "docente",
      cargo_especifico: data.cargo_especifico,
      token_hash: tokenHash,
      estado: "pendiente",
      invitado_por: data.invitado_por,
    };

    const { data: result, error } = await supabase
      .from("invitaciones_usuarios")
      .insert(payload as unknown as never)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return { id: (result as InvitacionRow).id, token };
  },

  async getInvitacionPendiente(colegio_id: string) {
    const { data, error } = await supabase
      .from("invitaciones_usuarios")
      .select("*")
      .eq("colegio_id", colegio_id)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as InvitacionRow | null;
  },

  async revocarInvitacion(id: string) {
    const { error } = await supabase
      .from("invitaciones_usuarios")
      .update({ estado: "revocada" } as unknown as never)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};