import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

type AreaRow = Database["public"]["Tables"]["areas"]["Row"];
type AreaInsert = Database["public"]["Tables"]["areas"]["Insert"];
type MateriaRow = Database["public"]["Tables"]["materias_destrezas"]["Row"];
type MateriaInsert = Database["public"]["Tables"]["materias_destrezas"]["Insert"];

export const curriculoService = {
  async getAreasPorGrado(gradoId: string) {
    const { data, error } = await supabase
      .from("areas")
      .select("*")
      .eq("grado_id", gradoId)
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) throw new Error(error.message);
    return data as AreaRow[];
  },

  async getMateriasPorGrado(gradoId: string) {
    const { data, error } = await supabase
      .from("materias_destrezas")
      .select("*")
      .eq("grado_id", gradoId)
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) throw new Error(error.message);
    return data as MateriaRow[];
  },

  async crearAreasMasivas(areas: AreaInsert[]) {
    const { data, error } = await supabase
      .from("areas")
      .insert(areas as unknown as never)
      .select();

    if (error) throw new Error(error.message);
    return data as AreaRow[];
  },

  async crearMateriasMasivas(materias: MateriaInsert[]) {
    const { data, error } = await supabase
      .from("materias_destrezas")
      .insert(materias as unknown as never)
      .select();

    if (error) throw new Error(error.message);
    return data as MateriaRow[];
  },

  async eliminarArea(id: string) {
    const { error } = await supabase.from("areas").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async eliminarMateria(id: string) {
    const { error } = await supabase.from("materias_destrezas").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async copiarCurriculo(gradoOrigenId: string, gradosDestinoIds: string[], colegioId: string, anioLectivoId: string) {
    const areasOrigen = await this.getAreasPorGrado(gradoOrigenId);
    if (areasOrigen.length === 0) return;

    for (const destGradoId of gradosDestinoIds) {
      const areasDestino = await this.getAreasPorGrado(destGradoId);
      const nombresAreasDest = new Set(areasDestino.map(a => a.nombre.toLowerCase()));

      for (const area of areasOrigen) {
        if (!nombresAreasDest.has(area.nombre.toLowerCase())) {
          // Insertar Área
          const { data: nuevaArea, error: errArea } = await supabase
            .from("areas")
            .insert({
              colegio_id: colegioId,
              anio_lectivo_id: anioLectivoId,
              grado_id: destGradoId,
              nombre: area.nombre,
              orden: area.orden,
              activo: true,
            } as unknown as never)
            .select()
            .single();

          if (errArea || !nuevaArea) continue;

          // Traer materias del área origen
          const { data: materiasOrigen } = await supabase
            .from("materias_destrezas")
            .select("*")
            .eq("area_id", area.id);
            
          if (materiasOrigen && materiasOrigen.length > 0) {
            const nuevasMaterias = materiasOrigen.map((m: MateriaRow) => ({
              colegio_id: colegioId,
              grado_id: destGradoId,
              area_id: (nuevaArea as AreaRow).id,
              nombre: m.nombre,
              descripcion: m.descripcion,
              orden: m.orden,
              activo: true,
            }));
            await supabase.from("materias_destrezas").insert(nuevasMaterias as unknown as never);
          }
        }
      }
    }
  }
};