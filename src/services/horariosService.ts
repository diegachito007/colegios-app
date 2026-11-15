import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type GradoRow = Database["public"]["Tables"]["grados"]["Row"];
type HorarioRow = Database["public"]["Tables"]["horarios_docentes"]["Row"];

export const horariosService = {
  // 1. Obtener los grados que el Admin le asignó al docente
  async getGradosDocente(docenteId: string, anioLectivoId: string) {
    const { data, error } = await supabase
      .from("asignaciones_grados")
      .select(
        `
        grado_id,
        grados (*)
      `,
      )
      .eq("docente_id", docenteId)
      .eq("anio_lectivo_id", anioLectivoId);

    if (error) throw new Error(error.message);

    interface AsignacionConGrado {
      grado_id: string;
      grados: GradoRow | null;
    }

    const asignaciones = data as unknown as AsignacionConGrado[];

    return asignaciones
      .filter((a) => a.grados !== null)
      .map((a) => a.grados as GradoRow);
  },

  // ✅ NUEVA FUNCIÓN: Obtener grados asignados directamente por el ID del usuario logueado
  async getGradosPorUsuario(usuarioId: string, anioLectivoId: string) {
    // 1. Buscamos el ID del docente
    const { data: docente, error: errDocente } = await supabase
      .from("docentes")
      .select("id")
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (errDocente || !docente) return [];

    // 2. Buscamos sus asignaciones y hacemos JOIN con grados
    const { data, error } = await supabase
      .from("asignaciones_grados")
      .select(
        `
        grado_id,
        grados (*)
      `,
      )
      .eq("docente_id", (docente as { id: string }).id)
      .eq("anio_lectivo_id", anioLectivoId);

    if (error) throw new Error(error.message);

    interface AsignacionConGrado {
      grado_id: string;
      grados: GradoRow | null;
    }

    return (data as unknown as AsignacionConGrado[])
      .filter((a) => a.grados !== null)
      .map((a) => a.grados as GradoRow);
  },

  // 3. Obtener los horarios que el docente ya creó en un grado
  async getHorariosDocente(
    docenteId: string,
    gradoId: string,
    anioLectivoId: string,
  ) {
    const { data, error } = await supabase
      .from("horarios_docentes")
      .select("*")
      .eq("docente_id", docenteId)
      .eq("grado_id", gradoId)
      .eq("anio_lectivo_id", anioLectivoId);

    if (error) throw new Error(error.message);
    return data as HorarioRow[];
  },

  // 4. Crear/Actualizar un horario (Upsert)
  async guardarHorario(payload: {
    colegio_id: string;
    anio_lectivo_id: string;
    docente_id: string;
    grado_id: string;
    materia_id: string;
    horario: { dia: number; horas: number[] }[];
  }) {
    const { data, error } = await supabase
      .from("horarios_docentes")
      .upsert(payload as never, {
        onConflict: "docente_id, grado_id, materia_id, anio_lectivo_id",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as HorarioRow;
  },

  // 5. Eliminar un horario (quitar materia)
  async eliminarHorario(id: string) {
    const { error } = await supabase
      .from("horarios_docentes")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};