// src/utils/plantillasFormularios.ts

export const PLANTILLAS_FORMULARIOS = [
  {
    id: "ficha_1_matricula",
    nombre: "1. Ficha Complementaria del Estudiante",
    descripcion: "Lugar de nacimiento, identidad, contacto, familia y salud.",
    esquema: [
      // 🎂 FILA 1 — Lugar de Nacimiento
      {
        columnas: 3,
        campos: [
          { 
            tipo: "select", 
            label: "Provincia de Nacimiento", 
            required: true, 
            options: ["Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena", "Santo Domingo", "Sucumbíos", "Tungurahua", "Zamora Chinchipe"] 
          },
          { tipo: "text", label: "Cantón de Nacimiento", required: true },
          { tipo: "text", label: "Parroquia de Nacimiento", required: true }
        ]
      },
      // 🧑 FILA 2 — Identidad y Origen
      {
        columnas: 3,
        campos: [
          { tipo: "select", label: "Nacionalidad", required: true, options: ["Ecuatoriana", "Colombiana", "Venezolana", "Peruana", "Estadounidense", "Otra"] },
          { tipo: "select", label: "Etnia", required: true, options: ["Mestiza", "Afroecuatoriana", "Indígena", "Blanco", "Montubio", "Otro"] },
          { tipo: "checkbox", label: "¿Posee Pasaporte?", required: false }
        ]
      },
      // 📞 FILA 3 — Contacto Personal
      {
        columnas: 2,
        campos: [
          { tipo: "text", label: "Número de Celular", required: false },
          { tipo: "text", label: "Correo Electrónico", required: false }
        ]
      },
      // 🏫 FILA 4 — Institución de Procedencia
      {
        columnas: 1,
        campos: [
          { tipo: "text", label: "Institución que procede", required: false }
        ]
      },
      // 🏠 FILA 5 — Convivencia del Estudiante
      {
        columnas: 3,
        campos: [
          { tipo: "checkbox", label: "Vive con: Padre", required: false },
          { tipo: "checkbox", label: "Vive con: Madre", required: false },
          { tipo: "checkbox", label: "Vive con: Abuelos", required: false }
        ]
      },
      {
        columnas: 1,
        campos: [
          { tipo: "text", label: "Otras personas con las que vive", required: false }
        ]
      },
      // 📊 FILA 7 — Datos Familiares Generales
      {
        columnas: 3,
        campos: [
          { tipo: "select", label: "Estado Civil de los Padres", required: false, options: ["Casados", "Unión Libre", "Divorciados", "Viudo/a", "Soltero/a"] },
          { tipo: "number", label: "Número total de Hermanos", required: false },
          { tipo: "select", label: "Aspecto Socioeconómico", required: true, options: ["Baja", "Media", "Alta"] }
        ]
      },
      // ⚠️ FILA 8 — Situación Especial
      {
        columnas: 2,
        campos: [
          { tipo: "checkbox", label: "Huérfano de Padre", required: false },
          { tipo: "checkbox", label: "Huérfano de Madre", required: false }
        ]
      },
      // 🩺 FILA 9 — Salud
      {
        columnas: 1,
        campos: [
          { tipo: "select", label: "Tipo de Sangre", required: true, options: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] }
        ]
      }
    ]
  },
  // ✅ NUEVA FICHA EXCLUSIVA PARA HERMANOS (REPETIBLE)
  {
    id: "ficha_1_1_hermanos",
    nombre: "1.1 Registro de Hermanos en la Institución",
    descripcion: "Llena este formulario por cada hermano que estudie en el colegio.",
    esquema: [
      {
        columnas: 2,
        campos: [
          { tipo: "text", label: "Nombre del Hermano", required: true },
          { tipo: "number", label: "Edad", required: true }
        ]
      },
      {
        columnas: 3,
        campos: [
          { tipo: "text", label: "Lugar que ocupa (Ej: 4to hijo)", required: false },
          { tipo: "text", label: "Institución Educativa", required: true },
          { tipo: "text", label: "Curso / Nivel", required: true }
        ]
      }
    ]
  },
  // ... (Fichas 2 a 7 se mantienen igual que en el mensaje anterior)
  {
    id: "ficha_2_dece",
    nombre: "2. Ficha DECE (Registro Acumulativo)",
    descripcion: "Salud, historia vital, rendimiento y entorno familiar.",
    esquema: [
      {
        columnas: 2,
        campos: [
          { tipo: "select", label: "¿El estudiante tiene discapacidad?", required: true, options: ["SI", "NO"] },
          { tipo: "text", label: "Indique cuál (discapacidad)", required: false }
        ]
      },
      {
        columnas: 2,
        campos: [
          { tipo: "select", label: "¿Tiene diagnóstico o enfermedad?", required: true, options: ["SI", "NO"] },
          { tipo: "text", label: "Indique cuál (enfermedad)", required: false }
        ]
      },
      {
        columnas: 1,
        campos: [
          { tipo: "textarea", label: "Enfermedades desde la infancia hasta la actualidad", required: false }
        ]
      },
      {
        columnas: 1,
        campos: [
          { tipo: "textarea", label: "Accidentes, Alergias, Cirugías, Pérdida de conocimiento, Otros", required: false }
        ]
      },
      {
        columnas: 2,
        campos: [
          { tipo: "text", label: "Medicamento que debe tomar", required: false },
          { tipo: "text", label: "Nombre del médico que atiende", required: false }
        ]
      },
      {
        columnas: 2,
        campos: [
          { tipo: "number", label: "Edad de la madre al embarazo", required: false },
          { tipo: "select", label: "Tipo de Parto", required: false, options: ["Normal", "Prematuro", "Cesárea", "Otro"] }
        ]
      },
      {
        columnas: 2,
        campos: [
          { tipo: "date", label: "Fecha de ingreso a la institución", required: false },
          { tipo: "select", label: "¿Ha repetido algún año?", required: false, options: ["SI", "NO"] }
        ]
      },
      {
        columnas: 2,
        campos: [
          { tipo: "text", label: "¿Qué año repitió?", required: false },
          { tipo: "text", label: "Asignatura de preferencia", required: false }
        ]
      },
      {
        columnas: 3,
        campos: [
          { tipo: "number", label: "Comunicación (1-10)", required: true },
          { tipo: "number", label: "Confianza (1-10)", required: true },
          { tipo: "number", label: "Resolución de Conflictos (1-10)", required: true }
        ]
      },
      {
        columnas: 3,
        campos: [
          { tipo: "number", label: "Afectividad (1-10)", required: true },
          { tipo: "number", label: "Respeto (1-10)", required: true },
          { tipo: "number", label: "Tiempo de Calidad (1-10)", required: true }
        ]
      }
    ]
  },
  {
    id: "ficha_3_retiro",
    nombre: "3. Autorización de Retiro",
    descripcion: "Personas autorizadas para retirar al estudiante.",
    esquema: [
      {
        columnas: 2,
        campos: [
          { tipo: "text", label: "Nombre Autorizado 1", required: true },
          { tipo: "text", label: "Cédula Autorizado 1", required: true }
        ]
      },
      {
        columnas: 2,
        campos: [
          { tipo: "text", label: "Nombre Autorizado 2", required: false },
          { tipo: "text", label: "Cédula Autorizado 2", required: false }
        ]
      },
      {
        columnas: 2,
        campos: [
          { tipo: "text", label: "Nombre Autorizado 3", required: false },
          { tipo: "text", label: "Cédula Autorizado 3", required: false }
        ]
      },
      {
        columnas: 2,
        campos: [
          { tipo: "text", label: "Nombre Autorizado 4", required: false },
          { tipo: "text", label: "Cédula Autorizado 4", required: false }
        ]
      }
    ]
  },
  {
    id: "ficha_4_dece_consentimiento",
    nombre: "4. Consentimiento Informado DECE",
    descripcion: "Autorización para atención psicosocial.",
    esquema: [
      {
        columnas: 1,
        campos: [
          { tipo: "checkbox", label: "AUTORIZO que mi representado reciba atención del DECE", required: true }
        ]
      },
      {
        columnas: 1,
        campos: [
          { tipo: "checkbox", label: "NO AUTORIZO que mi representado reciba atención del DECE", required: false }
        ]
      },
      {
        columnas: 1,
        campos: [
          { tipo: "textarea", label: "Motivo en caso de no autorizar", required: false }
        ]
      }
    ]
  },
  {
    id: "ficha_5_imagen",
    nombre: "5. Permiso de Difusión de Imagen y Voz",
    descripcion: "Autorización legal para difusión de imagen y voz.",
    esquema: [
      {
        columnas: 1,
        campos: [
          { tipo: "checkbox", label: "AUTORIZO el uso de imagen y voz de mi representado/a", required: true }
        ]
      },
      {
        columnas: 1,
        campos: [
          { tipo: "checkbox", label: "NO AUTORIZO el uso de imagen y voz", required: false }
        ]
      }
    ]
  },
  {
    id: "ficha_6_compromiso",
    nombre: "6. Acta de Acuerdos y Compromiso",
    descripcion: "Aceptación del Código de Convivencia.",
    esquema: [
      {
        columnas: 1,
        campos: [
          { tipo: "checkbox", label: "He leído y acepto el Código de Convivencia Institucional", required: true }
        ]
      },
      {
        columnas: 1,
        campos: [
          { tipo: "checkbox", label: "Me comprometo a cumplir con los deberes y obligaciones", required: true }
        ]
      }
    ]
  },
  {
    id: "ficha_7_salud",
    nombre: "7. Ficha de Autorización de Salud",
    descripcion: "Seguro médico, grupo sanguíneo y autorización de atención.",
    esquema: [
      {
        columnas: 2,
        campos: [
          { tipo: "select", label: "¿El estudiante tiene seguro médico?", required: false, options: ["SI", "NO"] },
          { tipo: "text", label: "Nombre del seguro", required: false }
        ]
      },
      {
        columnas: 3,
        campos: [
          { tipo: "select", label: "¿Sabe nadar?", required: false, options: ["SI", "NO"] },
          { tipo: "select", label: "Grupo sanguíneo y RH", required: true, options: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] },
          { tipo: "text", label: "Establecimiento de salud al que acude", required: false }
        ]
      },
      {
        columnas: 3,
        campos: [
          { tipo: "text", label: "Emergencia 1 - Nombre", required: true },
          { tipo: "text", label: "Emergencia 1 - Parentesco", required: true },
          { tipo: "text", label: "Emergencia 1 - Teléfono", required: true }
        ]
      },
      {
        columnas: 1,
        campos: [
          { tipo: "checkbox", label: "Autorizo que mi representado reciba atención médica escolar y esquema de vacunación.", required: true }
        ]
      }
    ]
  }
];