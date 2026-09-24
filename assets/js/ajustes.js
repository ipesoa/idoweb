/* =====================================================================
   AJUSTES DE COMPORTAMIENTO  ·  secciones, textos, tiempos
   ---------------------------------------------------------------------
   Números en milisegundos (1000 = 1 segundo).
   Tamaños, fuentes y cuadrículas: assets/css/ajustes.css
   ===================================================================== */
window.AJUSTES = {

  /* ---- SECCIONES DE LA WEB ------------------------------------------
     Orden: como se ven en el menú y en los filtros de WORK.
       id      = carpeta dentro de /contenido  (no cambiar: ahí van las fotos)
       titulo  = lo que se lee en la web       (esto sí se puede cambiar)
       pagina  = archivo .html de esa sección
       lado    = dónde va en el inicio: "izquierda" o "derecha"          */
  secciones: [
    { id: "films",      titulo: "Films",       pagina: "films.html",      lado: "izquierda" },
    { id: "series",     titulo: "Series",      pagina: "series.html",     lado: "izquierda" },
    { id: "comercials", titulo: "Commercials", pagina: "comercials.html", lado: "derecha" },
    { id: "videoclips", titulo: "Videoclips",  pagina: "videoclips.html", lado: "derecha" },
  ],

  /* ---- Textos de la web (por si quieres cambiarlos o traducirlos) --- */
  textos: {
    labor: "production designer",   // debajo del nombre, en el inicio
    work: "Work",                   // todos los trabajos juntos (work.html)
    todo: "All",                    // primer filtro de work
    contacto: "Contact",            // menú y botón de la página de proyecto
    conversacion: "Start a conversation",   // botón al final de cada proyecto
    dirigido: "directed by",        // ficha y texto que sigue al ratón
    producido: "produced by",
    // (nombres antiguos, por compatibilidad)
    films: "Films",
    comercials: "Commercials",
  },

  /* ---- Pase de imágenes del INICIO --------------------------------- */
  inicio: {
    orden: "aleatorio",          // "aleatorio" | "cronologico"
    secciones: "todas",          // "todas" = films, series, commercials y videoclips
                                 // o una lista: ["films", "series"]
    mostrarTitulos: false,       // false = solo la imagen (sin título ni año)

    entradaImagen: 2200,         // la foto aparece (desenfocada → nítida)
    esperaTexto:    700,         // pausa antes de que salga el texto
    entradaTexto:  1400,         // aparición del texto letra a letra
    retrasoLetra:    35,         // desfase entre letras
    textoVisible:  3200,         // tiempo de cada foto (con los títulos quitados, lo que dura)
    salidaTexto:   1100,
    esperaSiguiente: 300,

    desenfoque: 28,              // px de desenfoque al entrar/salir la foto
    zoom: 1.07,                  // escala de la foto al empezar (1 = sin zoom)
    zoomLento: true,             // la foto se acerca muy despacio mientras está
    zoomFinal: 1.06,

    incluirComercials: true,     // (antiguo, ya manda "secciones")
  },

  /* ---- Página de cada proyecto -------------------------------------- */
  proyecto: {
    autoplay: true,              // el vídeo de arriba empieza solo
    silencio: true,              // ...sin sonido (los navegadores lo exigen para el autoplay)
    bucle: false,                // repetir el vídeo al acabar
    controles: true,             // enseñar los controles del reproductor
  },

  /* ---- COLOR DE LAS LETRAS (Difference dirigido) ---------------------
     La fórmula y las boyas están en assets/js/diferencia-modelo.js
     (se prueban en laboratorio.html). Aquí solo:
       activo: true  → letras pintadas píxel a píxel con el modelo
       textos: qué textos se pintan con el modelo                        */
  diferencia: {
    activo: true,
    textos: ".menu a, .menu__labor, .filtros-work button, .pase__titulo, .pase__datos, .etiqueta-cursor, .celda-proyecto__txt, [data-dif]",
  },

  /* ---- Scroll automático -------------------------------------------- */
  autoScroll: {
    mostrarBoton: false,         // botón "auto" (true = se ve abajo a la derecha)
    velocidad: 42,               // píxeles por segundo
    empezarSolo: false,
    volverArriba: true,
  },

  cortina: 650,                  // fundido entre páginas (igual que --t-cortina)
};
