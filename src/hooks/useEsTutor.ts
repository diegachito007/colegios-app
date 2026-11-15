import { useQuery } from "@tanstack/react-query";
import { docentesService } from "../services/docentesService";
import { useAniosLectivos } from "./useAniosLectivos";

export const useEsTutor = (
  usuarioId: string | null,
  gradoId: string | null,
) => {
  const { anios } = useAniosLectivos();
  const anioActivo = anios?.find((a) => a.es_actual);

  const { data: docenteId } = useQuery({
    queryKey: ["docente_id_tutor", usuarioId],
    queryFn: () => docentesService.getDocenteIdPorUsuario(usuarioId!),
    enabled: !!usuarioId,
  });

  const { data: esTutor, isLoading } = useQuery({
    queryKey: ["es_tutor", docenteId, gradoId, anioActivo?.id],
    queryFn: async () => {
      if (!docenteId || !gradoId || !anioActivo?.id) return false;
      const gradoTutor = await docentesService.getGradoTutor(
        docenteId,
        anioActivo.id,
      );
      return gradoTutor === gradoId;
    },
    enabled: !!docenteId && !!gradoId && !!anioActivo?.id,
    staleTime: 0,
  });

  return { esTutor: !!esTutor, isLoading };
};
