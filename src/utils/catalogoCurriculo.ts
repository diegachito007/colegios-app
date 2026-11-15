// src/utils/catalogoCurriculo.ts

export const CATALOGO_CURRICULO = {
  // ==========================================
  // INICIAL / PREPARATORIA
  // ==========================================
  INICIAL: [
    "Descubrimiento y comprensión del medio natural y cultural",
    "Identidad y autonomía",
    "Convivencia",
    "Relaciones lógico-matemáticas",
    "Comprensión y expresión oral y escrita",
    "Comprensión y expresión artística",
    "Expresión corporal y motricidad",
  ],

  // ==========================================
  // EGB Y BACHILLERATO
  // ==========================================
  EGB_BACHILLERATO: [
    {
      area: "Lengua y Literatura",
      materias: ["Lengua y Literatura"],
    },
    {
      area: "Matemática",
      materias: ["Matemática"],
    },
    {
      area: "Lengua Extranjera",
      materias: ["Inglés"],
    },
    {
      area: "Educación Física",
      materias: ["Educación Física"],
    },
    {
      area: "Educación Cultural y Artística",
      materias: ["Educación Cultural y Artística (ECA)"],
    },
    {
      area: "Complementarias y Formación Integral",
      materias: [
        "Acompañamiento Integral en el Aula",
        "Animación a la Lectura", // Típico de EGB
        "Orientación Vocacional y Profesional (OVP)", // Típico de EGB
        "Investigación", // Típico de 3ro BC
        "Lectura Crítica", // Típico de 3ro BC
        "Razonamiento Lógico", // Típico de 3ro BC
      ],
    },
    // ---- EGB ----
    {
      area: "Ciencias Naturales",
      materias: ["Ciencias Naturales"], // EGB
    },
    {
      area: "Ciencias Sociales",
      materias: ["Estudios Sociales"], // EGB
    },
    // ---- BACHILLERATO EN CIENCIAS (BC) ----
    {
      area: "Ciencias Naturales",
      materias: ["Biología", "Física", "Química"], // Específicas de BC
    },
    {
      area: "Ciencias Sociales",
      materias: [
        "Historia",
        "Filosofía",
        "Educación para la Ciudadanía",
        "Emprendimiento y Gestión",
      ], // Específicas de BC
    },
  ],
};
