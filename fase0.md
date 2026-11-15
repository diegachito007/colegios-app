# Documentación de Desarrollo: PiteyPase & colegiosX

Este documento centraliza la arquitectura, el diseño y las decisiones técnicas tomadas para la plataforma **colegiosX** (Landing Page y Sistema de Login).

---

## 🎨 1. Identidad Visual y Paleta de Colores

Para mantener la coherencia en toda la plataforma, usamos una paleta basada en tecnología, confianza y modernidad.

| Elemento | Clase Tailwind | Color HEX | Uso |
| :--- | :--- | :--- | :--- |
| **Azul Brand** | `brand-blue` | `#2563eb` | Botones principales, enlaces y acentos. |
| **Azul Oscuro** | `brand-dark` | `#0f172a` | Textos principales, tarjetas destacadas y fondos oscuros. |
| **Naranja Brand** | `brand-orange` | `#f97316` | Botón "Acceso colegiosX", logo y acentos de contraste. |
| **Gris Slate** | `brand-gray` | `#64748b` | Textos secundarios y párrafos. |
| **Fondo Claro** | `brand-light` | `#f8fafc` | Fondo base de la Landing y del Login. |
| **Fondo Oscuro** | `slate-950` | `#020617` | Fondo de la sección de contacto y footer final. |

---

## 🏗️ 2. Estructura de Componentes

### A. Landing Page (`src/pages/landing/Home.tsx`)
La página se compone de los siguientes módulos, importados secuencialmente:

1. **`Navbar.tsx`**: Menú fijo superior con efecto de cristal (`backdrop-blur-lg`). Contiene el logo PiteyPase y el botón de "Acceso colegiosX".
2. **`Hero.tsx`**: Sección principal.
   - **Red Neuronal:** Animación Canvas en el fondo (`NeuralBackground.tsx`) con partículas conectadas que reaccionan al mouse.
   - **Texto Degradado:** Título con efecto gradient (Azul a Púrpura).
   - **Tarjetas 3D:** Grid de 3 tarjetas (Desarrollo Web, Apps Móviles, colegiosX) con efecto `perspective` y seguimiento del mouse (`Tarjeta3D`).
3. **`Contacto.tsx`**: Sección oscura con fondo degradado radial (luces azules/púrpuras) y botones de acción (Email y WhatsApp verde esmeralda).
4. **`Footer.tsx`**: Pie de página blanco radiante con información de contacto, redes sociales y derechos reservados.

### B. Autenticación (`src/pages/auth/Login.tsx`)
Pantalla de inicio de sesión diseñada para sentirse como la entrada a un sistema de alta seguridad.
- **Fondo:** Usa la misma Red Neuronal (`NeuralBackground.tsx`) y los blobs de luz de la Landing.
- **Tarjeta Central:** Efecto Glassmorphism (`bg-white/90`, `backdrop-blur-2xl`).
- **Marca:** Logo del monitor y el texto "colegiosX".

---

## 🔒 3. Seguridad Implementada

Gracias a **Supabase**, el sistema cuenta con seguridad de nivel bancario por defecto:

1. **Cifrado de Contraseñas:** Supabase usa bcrypt. Las contraseñas nunca se guardan en texto plano.
2. **Protección contra Fuerza Bruta (Rate Limiting):** Límite de 30 intentos de login por IP cada 5 minutos.
3. **JWT (JSON Web Tokens):** Manejo automático de sesiones seguras con `autoRefreshToken`.
4. **Rol de Usuario (`super_admin`):** El usuario actual está vinculado a la tabla `usuarios` con acceso global.
5. **Inyección SQL:** Prevenida automáticamente por el SDK de Supabase (consultas parametrizadas).

*Nota: Para producción final, evaluaremos activar CAPTCHA (Cloudflare Turnstile) y forzar contraseñas más complejas.*

---

## 🛠️ 4. Stack Tecnológico

- **Frontend:** React (Vite) + TypeScript.
- **Estilos:** Tailwind CSS.
- **Animaciones:** Framer Motion, Canvas HTML5 (Red Neuronal), CSS Perspective (Tarjetas 3D).
- **Iconos:** Lucide React.
- **Backend:** Supabase (PostgreSQL + Auth).
- **Manejo de Estado Global:** React Context (`AuthContext`).

---

## 🚦 5. Estado Actual y Próximos Pasos

✅ **Completado:**
- Configuración de Vite, Tailwind y Supabase.
- Landing Page (Hero 3D, Red Neuronal, Contacto, Footer).
- Login funcional conectado a Supabase.
- Protección de rutas (redirección al Dashboard si el estado es `active`).

⏳ **En Proceso (Siguiente Paso):**
- Configurar `main.tsx` con `QueryClientProvider` y `Toaster`.
- Crear el módulo de **Gestión de Colegios** (Servicio, Hook y Vista de Tabla).
- Crear el **Dashboard** básico para el `super_admin`.

---

*Documento generado para el proyecto colegiosX. Actualizar a medida que avancen los módulos.*