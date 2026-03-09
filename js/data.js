// js/data.js
// Fuente única de proyectos
// Prioridad: lo guardado desde el panel (localStorage)

(() => {
  const LS_KEY = "proyectos_admin";

  // 1) Si hay proyectos guardados desde el panel, usamos esos
  const guardados = localStorage.getItem(LS_KEY);

  if (guardados) {
    try {
      window.PROYECTOS = JSON.parse(guardados) || [];
    } catch (e) {
      console.warn("Error leyendo proyectos guardados, usando defaults");
    }
  }

  // 2) Si NO hay nada guardado, usamos estos proyectos por defecto
  if (!window.PROYECTOS || !Array.isArray(window.PROYECTOS) || window.PROYECTOS.length === 0) {
    window.PROYECTOS = [
      {
        id: "costa-azul",
        nombre: "Edificio Costa Azul",
        ubicacion: "Cerca del mar y del centro",
        descripcion: "Un proyecto pensado para quienes buscan tranquilidad, naturaleza y una ubicación estratégica.",
        whatsapp: "5491122334455",
        mensajeWpp: "Hola! Quiero info sobre el proyecto Edificio Costa Azul.",
        fotos: ["assets/proyecto01.jpg", "assets/proyecto2.jpg", "assets/proyecto3.jpg"],
        unidades: [
          { nombre: "Unidad A", info: "2 ambientes • 55 m²", estado: "disponible" },
          { nombre: "Unidad B", info: "3 ambientes • 72 m²", estado: "reservada" },
          { nombre: "Unidad C", info: "1 ambiente • 38 m²", estado: "vendida" }
        ]
      },
      {
        id: "bosque",
        nombre: "Residencias del Bosque",
        ubicacion: "Entorno natural y silencioso",
        descripcion: "Arquitectura moderna y funcional integrada al paisaje.",
        whatsapp: "5491122334455",
        mensajeWpp: "Hola! Quiero info sobre el proyecto Residencias del Bosque.",
        fotos: ["assets/proyecto01.jpg", "assets/proyecto2.jpg", "assets/proyecto3.jpg"],
        unidades: [
          { nombre: "Unidad 1", info: "2 ambientes • 58 m²", estado: "disponible" },
          { nombre: "Unidad 2", info: "3 ambientes • 75 m²", estado: "disponible" }
        ]
      }
    ];
  }
})();
