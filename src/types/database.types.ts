// src/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      colegios: {
        Row: {
          id: string;
          nombre: string;
          codigo_amie: string | null;
          direccion: string | null;
          telefono: string | null;
          email: string | null;
          logo_url: string | null;
          configuracion: Json;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          codigo_amie?: string | null;
          direccion?: string | null;
          telefono?: string | null;
          email?: string | null;
          logo_url?: string | null;
          configuracion?: Json;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          codigo_amie?: string | null;
          direccion?: string | null;
          telefono?: string | null;
          email?: string | null;
          logo_url?: string | null;
          configuracion?: Json;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      usuarios: {
        Row: {
          id: string;
          colegio_id: string | null;
          email: string;
          nombre_documento: string | null;
          display_name: string | null;
          photo_url: string | null;
          rol:
            | "super_admin"
            | "admin_colegio"
            | "docente"
            | "vicerrector"
            | "inspector";
          status: "pending" | "active" | "blocked" | "rejected" | "deleted";
          cargo_especifico: string | null;
          area_director: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          colegio_id?: string | null;
          email: string;
          nombre_documento?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          rol:
            | "super_admin"
            | "admin_colegio"
            | "docente"
            | "vicerrector"
            | "inspector";
          status?: "pending" | "active" | "blocked" | "rejected" | "deleted";
          cargo_especifico?: string | null;
          area_director?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string | null;
          email?: string;
          nombre_documento?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          rol?:
            | "super_admin"
            | "admin_colegio"
            | "docente"
            | "vicerrector"
            | "inspector";
          status?: "pending" | "active" | "blocked" | "rejected" | "deleted";
          cargo_especifico?: string | null;
          area_director?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      invitaciones_usuarios: {
        Row: {
          id: string;
          colegio_id: string;
          email: string;
          nombre: string | null;
          rol: "admin_colegio" | "docente";
          cargo_especifico: string | null;
          token_hash: string;
          estado: "pendiente" | "aceptada" | "revocada" | "expirada";
          invitado_por: string | null;
          aceptado_por: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          email: string;
          nombre?: string | null;
          rol: "admin_colegio" | "docente" | "vicerrector" | "inspector";
          cargo_especifico?: string | null;
          token_hash: string;
          estado?: "pendiente" | "aceptada" | "revocada" | "expirada";
          invitado_por?: string | null;
          aceptado_por?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          email?: string;
          nombre?: string | null;
          rol?: "admin_colegio" | "docente";
          cargo_especifico?: string | null;
          token_hash?: string;
          estado?: "pendiente" | "aceptada" | "revocada" | "expirada";
          invitado_por?: string | null;
          aceptado_por?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      anios_lectivos: {
        Row: {
          id: string;
          colegio_id: string;
          nombre: string;
          fecha_inicio: string;
          fecha_fin: string;
          tipo_evaluacion: string | null;
          es_actual: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          nombre: string;
          fecha_inicio: string;
          fecha_fin: string;
          tipo_evaluacion?: string | null;
          es_actual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          nombre?: string;
          fecha_inicio?: string;
          fecha_fin?: string;
          tipo_evaluacion?: string | null;
          es_actual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      periodos_evaluacion: {
        Row: {
          id: string;
          anio_lectivo_id: string;
          nombre: string;
          fecha_inicio: string;
          fecha_fin: string;
          orden: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          anio_lectivo_id: string;
          nombre: string;
          fecha_inicio: string;
          fecha_fin: string;
          orden?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          anio_lectivo_id?: string;
          nombre?: string;
          fecha_inicio?: string;
          fecha_fin?: string;
          orden?: number;
          created_at?: string;
        };
      };

      grados: {
        Row: {
          id: string;
          colegio_id: string;
          anio_lectivo_id: string;
          nivel: string;
          paralelo: string;
          activo: boolean;
          orden: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          anio_lectivo_id: string;
          nivel: string;
          paralelo: string;
          activo?: boolean;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          anio_lectivo_id?: string;
          nivel?: string;
          paralelo?: string;
          activo?: boolean;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
      };

      niveles_educativos: {
        Row: {
          id: string;
          colegio_id: string;
          nombre: string;
          activo: boolean;
          orden: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          nombre: string;
          activo?: boolean;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          nombre?: string;
          activo?: boolean;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
      };

      areas: {
        Row: {
          id: string;
          colegio_id: string;
          anio_lectivo_id: string;
          grado_id: string;
          nombre: string;
          orden: number;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          anio_lectivo_id: string;
          grado_id: string;
          nombre: string;
          orden?: number;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          anio_lectivo_id?: string;
          grado_id?: string;
          nombre?: string;
          orden?: number;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      materias_destrezas: {
        Row: {
          id: string;
          colegio_id: string;
          grado_id: string;
          area_id: string;
          nombre: string;
          descripcion: string;
          orden: number;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          grado_id: string;
          area_id: string;
          nombre: string;
          descripcion: string;
          orden?: number;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          grado_id?: string;
          area_id?: string;
          nombre?: string;
          descripcion?: string;
          orden?: number;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      estudiantes: {
        Row: {
          id: string;
          colegio_id: string;
          codigo_interno: string;
          cedula: string | null;
          nombres: string;
          apellidos: string;
          fecha_nacimiento: string;
          sexo: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          codigo_interno?: string;
          cedula?: string | null;
          nombres: string;
          apellidos: string;
          fecha_nacimiento: string;
          sexo?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          codigo_interno?: string;
          cedula?: string | null;
          nombres?: string;
          apellidos?: string;
          fecha_nacimiento?: string;
          sexo?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      matriculas: {
        Row: {
          id: string;
          colegio_id: string;
          estudiante_id: string;
          anio_lectivo_id: string;
          grado_id: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          estudiante_id: string;
          anio_lectivo_id: string;
          grado_id: string;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          estudiante_id?: string;
          anio_lectivo_id?: string;
          grado_id?: string;
          activo?: boolean;
          created_at?: string;
        };
      };
      representantes: {
        Row: {
          id: string;
          colegio_id: string;
          estudiante_id: string;
          tipo: string;
          nombres_completos: string;
          cedula: string | null;
          celular: string | null;
          email: string | null;
          es_representante_principal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          estudiante_id: string;
          tipo: string;
          nombres_completos: string;
          cedula?: string | null;
          celular?: string | null;
          email?: string | null;
          es_representante_principal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          estudiante_id?: string;
          tipo?: string;
          nombres_completos?: string;
          cedula?: string | null;
          celular?: string | null;
          email?: string | null;
          es_representante_principal?: boolean;
          created_at?: string;
        };
      };
      formularios_colegio: {
        Row: {
          id: string;
          colegio_id: string;
          nombre: string;
          descripcion: string | null;
          esquema: Json;
          activo: boolean;
          orden: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          nombre: string;
          descripcion?: string | null;
          esquema?: Json;
          activo?: boolean;
          orden?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          nombre?: string;
          descripcion?: string | null;
          esquema?: Json;
          activo?: boolean;
          orden?: number;
          created_at?: string;
        };
      };
      respuestas_formularios: {
        Row: {
          id: string;
          colegio_id: string;
          formulario_id: string;
          estudiante_id: string;
          anio_lectivo_id: string;
          datos: Json;
          completado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          formulario_id: string;
          estudiante_id: string;
          anio_lectivo_id: string;
          datos?: Json;
          completado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          formulario_id?: string;
          estudiante_id?: string;
          anio_lectivo_id?: string;
          datos?: Json;
          completado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      docentes: {
        Row: {
          id: string;
          colegio_id: string;
          usuario_id: string | null;
          cedula: string;
          nombres: string;
          apellidos: string;
          email_personal: string;
          celular: string | null;
          especialidad: string | null;
          token_invitacion: string | null;
          invitacion_aceptada: boolean | null;
          activo: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          usuario_id?: string | null;
          cedula: string;
          nombres: string;
          apellidos: string;
          email_personal: string;
          celular?: string | null;
          especialidad?: string | null;
          token_invitacion?: string | null;
          invitacion_aceptada?: boolean | null;
          activo?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          usuario_id?: string | null;
          cedula?: string;
          nombres?: string;
          apellidos?: string;
          email_personal?: string;
          celular?: string | null;
          especialidad?: string | null;
          token_invitacion?: string | null;
          invitacion_aceptada?: boolean | null;
          activo?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      asignaciones_grados: {
        Row: {
          id: string;
          colegio_id: string;
          anio_lectivo_id: string;
          docente_id: string;
          grado_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          anio_lectivo_id: string;
          docente_id: string;
          grado_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          anio_lectivo_id?: string;
          docente_id?: string;
          grado_id?: string;
          created_at?: string | null;
        };
      };

      horarios_docentes: {
        Row: {
          id: string;
          colegio_id: string;
          anio_lectivo_id: string;
          docente_id: string;
          grado_id: string;
          materia_id: string;
          horario: Json; // [{dia: 1, horas: [1,2]}]
          created_at: string | null;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          anio_lectivo_id: string;
          docente_id: string;
          grado_id: string;
          materia_id: string;
          horario?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          anio_lectivo_id?: string;
          docente_id?: string;
          grado_id?: string;
          materia_id?: string;
          horario?: Json;
          created_at?: string | null;
        };
      };

      // ✅ NUEVA TABLA: Configuración de Bloques de Evaluación
      bloques_evaluacion: {
        Row: {
          id: string;
          colegio_id: string;
          anio_lectivo_id: string;
          nombre: string;
          porcentaje: number;
          orden: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          anio_lectivo_id: string;
          nombre: string;
          porcentaje: number;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          anio_lectivo_id?: string;
          nombre?: string;
          porcentaje?: number;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ✅ NUEVA TABLA: Tipos de Actividad
      tipos_actividad: {
        Row: {
          id: string;
          colegio_id: string;
          nombre: string;
          peso: number;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          nombre: string;
          peso?: number;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          nombre?: string;
          peso?: number;
          activo?: boolean;
          created_at?: string;
        };
      };

      // ✅ NUEVA TABLA: Actividades
      actividades: {
        Row: {
          id: string;
          colegio_id: string;
          anio_lectivo_id: string;
          periodo_id: string;
          grado_id: string;
          materia_id: string;
          docente_id: string | null;
          categoria: string; // 'actividad' | 'proyecto' | 'examen'
          tipo_id: string | null;
          detalle: string;
          fecha: string;
          estrategia_nota: string;
          dirigida_a: string;
          estudiante_ids: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          colegio_id: string;
          anio_lectivo_id: string;
          periodo_id: string;
          grado_id: string;
          materia_id: string;
          docente_id?: string | null;
          categoria: string;
          tipo_id?: string | null;
          detalle: string;
          fecha: string;
          estrategia_nota?: string;
          dirigida_a?: string;
          estudiante_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          colegio_id?: string;
          anio_lectivo_id?: string;
          periodo_id?: string;
          grado_id?: string;
          materia_id?: string;
          docente_id?: string | null;
          categoria?: string;
          tipo_id?: string | null;
          detalle?: string;
          fecha?: string;
          estrategia_nota?: string;
          dirigida_a?: string;
          estudiante_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ✅ NUEVA TABLA: Calificaciones
      calificaciones: {
        Row: {
          id: string;
          actividad_id: string;
          estudiante_id: string;
          nota: number;
          observacion: string | null;
          refuerzo: Json | null;
          docente_id: string | null;
          editado_por: string | null;
          editado_el: string | null;
          nota_original: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          actividad_id: string;
          estudiante_id: string;
          nota: number;
          observacion?: string | null;
          refuerzo?: Json | null;
          docente_id?: string | null;
          editado_por?: string | null;
          editado_el?: string | null;
          nota_original?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          actividad_id?: string;
          estudiante_id?: string;
          nota?: number;
          observacion?: string | null;
          refuerzo?: Json | null;
          docente_id?: string | null;
          editado_por?: string | null;
          editado_el?: string | null;
          nota_original?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    // ✨ DEFINICIÓN DE FUNCIONES RPC
    Functions: {
      validar_invitacion: {
        Args: {
          p_token_hash: string;
        };
        Returns: {
          id: string;
          colegio_id: string;
          email: string;
          nombre: string | null;
          cargo_especifico: string | null;
          colegio_nombre: string;
        }[];
      };
      validar_invitacion_docente: {
        Args: {
          p_token: string;
        };
        Returns: {
          docente_id: string;
          email: string;
          nombres: string;
          apellidos: string;
          colegio_id: string;
        }[];
      };
    };
  };
}
