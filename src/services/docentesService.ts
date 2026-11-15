import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type DocenteRow = Database["public"]["Tables"]["docentes"]["Row"];
type DocenteInsert = Database["public"]["Tables"]["docentes"]["Insert"];

export const docentesService = {
  async getDocentes(colegioId: string) {
    const { data, error } = await supabase
      .from("docentes")
      .select("*")
      .eq("colegio_id", colegioId)
      .order("apellidos", { ascending: true });

    if (error) throw new Error(error.message);
    return data as DocenteRow[];
  },

  async crearDocenteConInvitacion(
    docente: Omit<DocenteInsert, "token_invitacion" | "invitacion_aceptada">,
  ) {
    const token = crypto.randomUUID();

    const { data, error } = await supabase
      .from("docentes")
      .insert({
        ...docente,
        token_invitacion: token,
        invitacion_aceptada: false,
      } as never)
      .select()
      .single();

    if (error) {
      if (error.code === "23505")
        throw new Error("Esta cédula ya está registrada.");
      throw new Error(error.message);
    }
    return data as DocenteRow;
  },

  async eliminarDocente(id: string) {
    const { error } = await supabase.from("docentes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getAsignaciones(docenteId: string, anioLectivoId: string) {
    const { data, error } = await supabase
      .from("asignaciones_grados")
      .select("grado_id, es_tutor")
      .eq("docente_id", docenteId)
      .eq("anio_lectivo_id", anioLectivoId);

    if (error) throw new Error(error.message);
    return data as { grado_id: string; es_tutor: boolean }[];
  },

  // ✅ FIX 1: tolerante a perfiles duplicados (ya no usa .single() estricto)
  async getDocenteIdPorUsuario(usuarioId: string) {
    const { data, error } = await supabase
      .from("docentes")
      .select("id")
      .eq("usuario_id", usuarioId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { id: string }).id;
  },

  async guardarAsignaciones(
    docenteId: string,
    colegioId: string,
    anioLectivoId: string,
    asignaciones: { gradoId: string; esTutor: boolean }[],
  ) {
    await supabase
      .from("asignaciones_grados")
      .delete()
      .eq("docente_id", docenteId)
      .eq("anio_lectivo_id", anioLectivoId);

    if (asignaciones.length > 0) {
      const nuevas = asignaciones.map((a) => ({
        colegio_id: colegioId,
        anio_lectivo_id: anioLectivoId,
        docente_id: docenteId,
        grado_id: a.gradoId,
        es_tutor: a.esTutor,
      }));

      const { error } = await supabase
        .from("asignaciones_grados")
        .insert(nuevas as never);

      if (error) {
        if (error.code === "23505")
          throw new Error(
            "Este docente ya es tutor de otro grado o el grado ya tiene tutor.",
          );
        throw new Error(error.message);
      }
    }
  },

  async getGradoTutor(docenteId: string, anioLectivoId: string) {
    const { data, error } = await supabase
      .from("asignaciones_grados")
      .select("grado_id")
      .eq("docente_id", docenteId)
      .eq("anio_lectivo_id", anioLectivoId)
      .eq("es_tutor", true)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { grado_id: string }).grado_id;
  },

  // ✅ FIX 2: vincula el perfil existente en vez de duplicar + cédula única
  async crearPerfilDocenteDesdeUsuario(
    usuarioId: string,
    colegioId: string,
    email: string,
    nombre: string,
  ) {
    // PASO 1: ¿Ya tiene perfil docente vinculado a su cuenta?
    const existente = await this.getDocenteIdPorUsuario(usuarioId);
    if (existente) return existente;

    // PASO 2: ¿Existe un perfil docente con ese email (creado por "Nuevo Integrante")?
    //         Lo reutilizamos y lo vinculamos a su cuenta.
    const { data: porEmail, error: errBusqueda } = await supabase
      .from("docentes")
      .select("id, usuario_id")
      .eq("colegio_id", colegioId)
      .ilike("email_personal", email)
      .limit(1)
      .maybeSingle();

    if (errBusqueda) throw new Error(errBusqueda.message);

    if (porEmail) {
      const perfil = porEmail as { id: string; usuario_id: string | null };

      if (!perfil.usuario_id) {
        const { error: errVincular } = await supabase
          .from("docentes")
          .update({
            usuario_id: usuarioId,
            invitacion_aceptada: true,
            token_invitacion: null,
          } as never)
          .eq("id", perfil.id);

        if (errVincular) throw new Error(errVincular.message);
      }
      return perfil.id;
    }

    // PASO 3: No existe ningún perfil → creamos uno con cédula temporal ÚNICA
    const cedulaTemporal = `PEND-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const partes = nombre.trim().split(/\s+/);

    const { data, error } = await supabase
      .from("docentes")
      .insert({
        colegio_id: colegioId,
        usuario_id: usuarioId,
        cedula: cedulaTemporal,
        nombres: partes[0] || nombre,
        apellidos: partes.slice(1).join(" ") || "",
        email_personal: email,
        invitacion_aceptada: true,
        activo: true,
      } as never)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return (data as { id: string }).id;
  },
};
