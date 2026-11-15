# 🏫 Documentación Técnica Completa: Plataforma colegiosX

Este documento contiene toda la arquitectura, configuración de base de datos, seguridad (RLS), triggers y código Frontend para replicar el proyecto desde cero o migrarlo a un nuevo entorno de Supabase.

---

## 🛠️ 1. Stack Tecnológico
- **Frontend:** React (Vite) + TypeScript.
- **Estilos:** Tailwind CSS (Diseño Premium, Glassmorphism).
- **Backend & Auth:** Supabase (Plan Free).
- **Manejo de Estado (Servidor):** TanStack Query (React Query).
- **Notificaciones:** React Hot Toast.
- **Iconos:** Lucide React.
- **Animaciones:** Canvas API (Red Neuronal custom).

---

## 🔒 2. Configuración de Supabase (Paso a Paso para Migración)

Si vas a crear un nuevo proyecto en Supabase (Free o de Pago), debes seguir estos pasos exactos en el **SQL Editor** para que el sistema funcione igual.

### PASO 2.1: Extensiones y Tablas Maestras (Fase 1)
```sql
-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLAS MAESTRAS
CREATE TABLE colegios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL,
  codigo_amie VARCHAR(20) UNIQUE,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(150),
  logo_url TEXT,
  configuracion JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  colegio_id UUID REFERENCES colegios(id) ON DELETE CASCADE,
  email VARCHAR(150) UNIQUE NOT NULL,
  nombre_documento VARCHAR(100),
  display_name VARCHAR(150),
  photo_url TEXT,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('super_admin', 'admin_colegio', 'docente')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked', 'rejected', 'deleted')),
  cargo_especifico VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_usuario_rol_colegio CHECK (
    (rol = 'super_admin' AND colegio_id IS NULL)
    OR (rol IN ('admin_colegio', 'docente') AND colegio_id IS NOT NULL)
  )
);

CREATE TABLE invitaciones_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
  email VARCHAR(150) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin_colegio', 'docente')),
  cargo_especifico VARCHAR(150),
  token_hash TEXT NOT NULL UNIQUE,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'revocada', 'expirada')),
  invitado_por UUID REFERENCES usuarios(id),
  aceptado_por UUID REFERENCES usuarios(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

### PASO 2.2: Triggers de Actualización Automática (updated_at)

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_colegios_updated_at BEFORE UPDATE ON colegios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_invitaciones_updated_at BEFORE UPDATE ON invitaciones_usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

PASO 2.3: Seguridad (RLS) y Permisos Base

-- Activar RLS en todas las tablas
ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitaciones_usuarios ENABLE ROW LEVEL SECURITY;

-- OTORGAR PERMISOS BASE (Crucial para evitar errores "Permission Denied")
GRANT ALL PRIVILEGES ON TABLE public.colegios TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.usuarios TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.invitaciones_usuarios TO authenticated;

PASO 2.4: Políticas RLS Definitivas (A prueba de balas)

-- POLÍTICAS PARA COLEGIOS
CREATE POLICY "Super admin puede gestionar colegios" ON public.colegios
FOR ALL TO authenticated 
USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'super_admin')
WITH CHECK ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'super_admin');

-- POLÍTICAS PARA INVITACIONES
CREATE POLICY "Super admin puede gestionar invitaciones" ON public.invitaciones_usuarios
FOR ALL TO authenticated 
USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'super_admin')
WITH CHECK ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'super_admin');

PASO 2.5: TRIGGER CRÍTICO - Creación automática de perfil al invitar
Este trigger es la joya de la corona. Permite que cuando una persona acepte la invitación, se cree su usuario en public.usuarios sin chocar con el RLS, usando permisos de administrador (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (
    id, email, colegio_id, display_name, rol, status, cargo_especifico
  )
  VALUES (
    NEW.id,
    NEW.email,
    (NEW.raw_user_meta_data->>'colegio_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Administrador'),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'admin_colegio'),
    'active',
    NEW.raw_user_meta_data->>'cargo_especifico'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

  💻 3. Arquitectura del Frontend
Estructura de Carpetas Clave
/src/services/: Lógica pura de conexión a Supabase (ej. colegiosService.ts, invitacionesService.ts).

/src/hooks/: Hooks de TanStack Query para manejar caché y estados de carga (useColegios.ts, etc.).

/src/pages/superadmin/: Vistas exclusivas del Super Admin (ej. ListaColegios.tsx).

/src/pages/auth/: Login y Registro de Invitados.

/src/components/ui/: Componentes compartidos (Modal, Red Neuronal Neural.tsx).

Flujo de Datos y Caché
Usamos TanStack Query para mantener los datos frescos. Cuando se crea un colegio, la mutación invalida la caché (queryKey: ['colegios']) y la tabla se actualiza automáticamente sin recargar la página.

🔐 4. Flujo de Autenticación e Invitaciones
Super Admin: Crea un colegio en la vista /superadmin/colegios.

Generación de Invitación: El Super Admin hace clic en "Usuario +", ingresa el correo del rector. El frontend inserta un registro en invitaciones_usuarios con un token_hash único y devuelve un enlace tipo: http://localhost:5173/registro-invitado?token=XYZ.

El Invitado: Abre el enlace, el sistema valida el token en la base de datos, le pide una contraseña y ejecuta supabase.auth.signUp().

La Magia del Trigger: Al ejecutarse el signUp, el trigger on_auth_user_created en Supabase lee los metadatos y crea el registro en public.usuarios con el colegio_id y rol admin_colegio correctos.

Redirección: El invitado es enviado al Login, entra con su nueva cuenta y su Sidebar se adapta a su nuevo rol.

🎨 5. Identidad Visual (Diseño Premium)
Colores:

Azul Brand: #2563eb

Naranja Brand: #f97316

Fondo Oscuro: #020617

Efectos: Uso intensivo de backdrop-blur-xl, bg-white/80 (Glassmorphism) y sombras suaves (shadow-[0_8px_30px_rgb(0,0,0,0.06)]).

Animaciones: Red neuronal animada en el fondo del Login y Dashboard (Canvas API), y efecto 3D en las tarjetas del Landing Page.

⚠️ 6. Notas sobre Supabase Free Tier
Confirmación de Email: En el Dashboard de Supabase, fue necesario ir a Authentication -> Providers -> Email y desactivar "Confirm email" para que los invitados puedan entrar inmediatamente después de registrarse.

RLS: Las políticas deben usar consultas SELECT ... EXISTS en lugar de funciones complejas para evitar problemas de caché en el plan gratuito.

🚦 7. Próximos Pasos (Roadmap)
□ Módulo de Años Lectivos y Grados.
□ Módulo de Estudiantes (con Matrículas).
□ Módulo de Asignaturas y Docentes.
□ Módulo de Calificaciones y Asistencias.
□ Generación de Reportes PDF.