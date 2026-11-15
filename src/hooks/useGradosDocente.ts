import { useQuery } from "@tanstack/react-query";
import { horariosService } from "../services/horariosService";
import type { Database } from "../types/database.types";

type GradoRow = Database["public"]["Tables"]["grados"]["Row"];

export const useGradosDocente = (
  usuarioId: string | null,
  anioLectivoId: string | null,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["grados_docente_asignados", usuarioId, anioLectivoId],
    queryFn: async () => {
      if (!usuarioId || !anioLectivoId) return [];
      const data = await horariosService.getGradosPorUsuario(
        usuarioId,
        anioLectivoId,
      );
      return data as GradoRow[];
    },
    enabled: !!usuarioId && !!anioLectivoId && enabled,
  });
};
