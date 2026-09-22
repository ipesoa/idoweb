/* =====================================================================
   AJUSTES DE COMPORTAMIENTO  ·  tiempos, textos, color de las letras
   ---------------------------------------------------------------------
   Números en milisegundos (1000 = 1 segundo).
   Tamaños, fuentes y cuadrículas: assets/css/ajustes.css
   ===================================================================== */
window.AJUSTES = {

  /* ---- Pase de imágenes del INICIO --------------------------------- */
  inicio: {
    orden: "aleatorio",          // "aleatorio" | "cronologico"
    incluirComercials: true,     // ¿salen también los comercials con "mostrar_en_inicio: si"?

    entradaImagen: 2200,         // la foto aparece (desenfocada → nítida)
    esperaTexto:    700,         // pausa antes de que salga el texto
    entradaTexto:  1400,         // aparición del texto letra a letra
    retrasoLetra:    35,         // desfase entre letras
    textoVisible:  3200,         // tiempo que el texto se queda quieto
    salidaTexto:   1100,         // el texto se disuelve
    esperaSiguiente: 300,        // pausa antes de la siguiente foto

    desenfoque: 28,              // px de desenfoque al entrar/salir la foto
    zoom: 1.07,                  // escala de la foto al empezar (1 = sin zoom)
    zoomLento: true,             // la foto se acerca muy despacio mientras está
    zoomFinal: 1.06,             // cuánto se acerca la foto mientras está (lento y continuo)
  },

  /* ---- COLOR DE LAS LETRAS (Difference dirigido) ---------------------
     La fórmula y las boyas están en assets/js/diferencia-modelo.js
     (se prueban en laboratorio.html). Aquí solo:
       activo: true  → letras pintadas píxel a píxel con el modelo
               false → Difference base con CSS (sin correcciones)
       textos: qué textos se pintan con el modelo                        */
  diferencia: {
    activo: true,
    textos: ".menu a, .pase__titulo, .pase__datos, .etiqueta-cursor, .celda-proyecto__txt, [data-dif]",
  },

  /* ---- Textos de la web (por si quieres cambiarlos o traducirlos) --- */
  textos: {
    films: "Films",
    comercials: "Comercials",
    todo: "Todo",
    contacto: "Contact",
  },

  /* ---- Scroll automático (films, comercials, proyecto) -------------- */
  autoScroll: {
    mostrarBoton: false,         // botón "auto" (true = se ve abajo a la derecha)
    velocidad: 42,               // píxeles por segundo
    empezarSolo: false,          // true = empieza solo al entrar en la página
    volverArriba: true,          // al llegar al final vuelve arriba
  },

  cortina: 650,                  // fundido entre páginas (igual que --t-cortina)
};
