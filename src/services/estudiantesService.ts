import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type EstudianteRow = Database["public"]["Tables"]["estudiantes"]["Row"];
type EstudianteInsert = Database["public"]["Tables"]["estudiantes"]["Insert"];
type EstudianteUpdate = Database["public"]["Tables"]["estudiantes"]["Update"];
type MatriculaInsert = Database["public"]["Tables"]["matriculas"]["Insert"];

export const estudiantesService = {
  // 1. Obtener estudiantes activos de un grado y año (JOIN)
  async getEstudiantesPorGrado(gradoId: string, anioLectivoId: string) {
    const { data, error } = await supabase
      .from("matriculas")
      .select(`
        id,
        activo,
        estudiantes (
          id, cedula, codigo_interno, nombres, apellidos, fecha_nacimiento, sexo, activo
        )
      `)
      .eq("grado_id", gradoId)
      .eq("anio_lectivo_id", anioLectivoId)
      .eq("activo", true)
      .order("apellidos", { referencedTable: "estudiantes", ascending: true });

    if (error) throw new Error(error.message);

    interface MatriculaConEstudiante {
      id: string;
      activo: boolean;
      estudiantes: EstudianteRow | null;
    }

    const matriculas = data as unknown as MatriculaConEstudiante[];

    return matriculas
      .filter((m) => m.estudiantes !== null)
      .map((m) => ({
        matriculaId: m.id,
        ...m.estudiantes!,
        activoEnGrado: m.activo,
      }));
  },

  // 2. Obtener estudiantes INACTIVOS (retirados) de un grado
  async getEstudiantesInactivos(gradoId: string, anioLectivoId: string) {
    const { data, error } = await supabase
      .from("matriculas")
      .select(`
        id,
        estudiantes (
          id, cedula, codigo_interno, nombres, apellidos
        )
      `)
      .eq("grado_id", gradoId)
      .eq("anio_lectivo_id", anioLectivoId)
      .eq("activo", false); // ✅ Buscamos los inactivos

    if (error) throw new Error(error.message);

    interface MatriculaInactiva {
      id: string;
      estudiantes: EstudianteRow | null;
    }

    return (data as unknown as MatriculaInactiva[])
      .filter((m) => m.estudiantes !== null)
      .map((m) => ({
        matriculaId: m.id,
        ...m.estudiantes!,
      }));
  },

  // 3. Crear un estudiante nuevo y matricularlo
  async crearEstudianteYMatricular(
    nuevoEstudiante: Omit<EstudianteInsert, "codigo_interno" | "cedula"> & {
      cedula: string | null;
    },
    matricula: Omit<MatriculaInsert, "estudiante_id">,
  ) {
    // A. Generar código interno (Ej: EST20270001)
    const { count } = await supabase
      .from("estudiantes")
      .select("*", { count: "exact", head: true })
      .eq("colegio_id", nuevoEstudiante.colegio_id);

    const correlativo = (count || 0) + 1;
    const year = new Date().getFullYear();
    const codigoInterno = `EST${year}${correlativo.toString().padStart(4, "0")}`;

    // B. Insertar en la tabla estudiantes
    const { data: estudiante, error: errEst } = await supabase
      .from("estudiantes")
      .insert({
        ...nuevoEstudiante,
        codigo_interno: codigoInterno,
      } as never)
      .select()
      .single();

    if (errEst) {
      if (errEst.code === "23505")
        throw new Error(`La cédula ${nuevoEstudiante.cedula || "ingresada"} ya está registrada.`);
      throw new Error(errEst.message);
    }

    const nuevoEst = estudiante as unknown as EstudianteRow;

    // C. Insertar la matrícula
    const { colegio_id, anio_lectivo_id, grado_id, activo } = matricula;

    const { error: errMat } = await supabase.from("matriculas").insert({
      colegio_id,
      anio_lectivo_id,
      grado_id,
      activo,
      estudiante_id: nuevoEst.id,
    } as never);

    if (errMat) {
      throw new Error(`Error al matricular a ${nuevoEst.apellidos}: ${errMat.message}`);
    }

    return nuevoEst;
  },

  // 4. Carga Masiva
  async crearEstudiantesMasivos(
    estudiantes: (Omit<EstudianteInsert, "codigo_interno" | "cedula"> & {
      cedula: string | null;
    })[],
    matriculaBase: Omit<MatriculaInsert, "estudiante_id">,
  ) {
    let exitosos = 0;
    const errores: string[] = [];

    for (const est of estudiantes) {
      try {
        await this.crearEstudianteYMatricular(est, matriculaBase);
        exitosos++;
      } catch (error) {
        console.warn(`Error con estudiante ${est.apellidos}:`, error);
        if (error instanceof Error) {
          errores.push(error.message);
        }
      }
    }

    if (errores.length > 0) {
      throw new Error(`${exitosos} guardados. Errores: ${errores.join(" | ")}`);
    }

    return exitosos;
  },

  // 5. Actualizar datos del estudiante
  async actualizarEstudiante(id: string, cambios: EstudianteUpdate) {
    const { data, error } = await supabase
      .from("estudiantes")
      .update(cambios as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") throw new Error("La cédula ya está registrada en otro estudiante.");
      throw new Error(error.message);
    }
    return data as EstudianteRow;
  },

  // 6. Eliminar (Inactivar matrícula / Enviar a papelera)
  async eliminarEstudianteDeGrado(matriculaId: string) {
    const { error } = await supabase
      .from("matriculas")
      .update({ activo: false } as never)
      .eq("id", matriculaId);

    if (error) throw new Error(error.message);
  },

  // 7. Reactivar matrícula (Reintegrar)
  async reactivarMatricula(matriculaId: string) {
    const { error } = await supabase
      .from("matriculas")
      .update({ activo: true } as never)
      .eq("id", matriculaId);

    if (error) throw new Error(error.message);
  },
};