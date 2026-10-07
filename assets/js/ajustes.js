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
       lado    = dónde va en el inicio: "izquierda" o "derecha"
       enContact: false = no sale como filtro en la página Contact        */
  secciones: [
    { id: "films",      titulo: "Films",       pagina: "films.html",      lado: "izquierda" },
    { id: "series",     titulo: "Series",      pagina: "series.html",     lado: "izquierda" },
    { id: "comercials", titulo: "Commercials", pagina: "comercials.html", lado: "derecha" },
    { id: "videoclips", titulo: "Videoclips",  pagina: "videoclips.html", lado: "derecha", enContact: false },
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

  /* ---- ANIMACIONES (GSAP) -------------------------------------------
     nombre  → al entrar en la web, las letras del nombre suben de abajo
               arriba una detrás de otra (solo la primera página de cada
               visita; siempre: true para que sea en todas).
     menu    → WORK en el inicio: al abrir, cada opción se descubre con
               una máscara de arriba abajo; al cerrar, se desvanecen.
     Tiempos en milisegundos. Curvas: "power2.out" (suave), "power3.out",
     "power4.out" (arranca rápido y frena mucho), "expo.out"…           */
  animaciones: {
    nombre: {
      activo: true,
      siempre: false,
      retraso: 250,              // espera antes de empezar
      duracion: 1200,            // lo que tarda cada letra en subir
      escalon: 35,               // desfase entre letras
      curva: "power4.out",
    },
    menu: {
      abrir: 1100,               // lo que tarda cada opción en descubrirse
      escalon: 90,               // desfase entre opciones
      recorrido: "-0.6em",       // cuánto bajan mientras se descubren
      curvaAbrir: "power3.out",
      cerrar: 550,               // fundido al cerrar
    },
  },

  /* ---- CARTELES EN LAS REJILLAS ---------------------------------------
     Si un proyecto tiene cartel (gestor → editor → «Cartel»), en su
     rectángulo sale el cartel a la izquierda, encima de la portada.
     Al pasar el ratón el cartel se desvanece y la portada «se enciende».
     Tamaños, oscuridad y tiempos: ajustes.css sección 4b.
       paginas = en qué rejillas sale ("work" = la vista general)       */
  carteles: {
    activo: true,
    paginas: ["work", "films", "series", "comercials", "videoclips"],
    mostrarAno: true,            // el año abajo, separado del título
  },

  /* ---- Página de cada proyecto -------------------------------------- */
  proyecto: {
    autoplay: true,              // el vídeo de arriba empieza solo
    silencio: true,              // ...sin sonido (los navegadores lo exigen para el autoplay)
    bucle: false,                // repetir el vídeo al acabar
    controles: true,             // enseñar los controles del reproductor
  },

  /* ---- CONTRASTE DE LAS LETRAS EN FOTOS ------------------------------
     Como el modo «Diferencia» de Photoshop, pero solo donde hace falta:
     las letras son BLANCAS y únicamente los píxeles que caen sobre una
     zona tan clara que el blanco no se leería se vuelven NEGROS. Corte
     limpio, píxel a píxel, fiel a la foto. Sin grises ni difuminados.
       umbral  luz del fondo (0 = negro · 1 = blanco) a partir de la cual
               el blanco ya no se lee y esa parte pasa a negro.
               Más alto = cambia MENOS (solo sobre blancos muy claros).
               Más bajo = cambia antes.
       margen  pequeño margen alrededor del umbral para que los píxeles
               no parpadeen cuando la foto se mueve (0 = sin margen).
       grano   px: no hace caso a texturas más finas que esto (papel
               pintado, grano de película), para que no salgan motas
               sueltas dentro de las letras. 0 = píxel a píxel exacto.
       textos  qué letras de la web usan el efecto: todas las que pueden
               quedar encima de una foto.                                */
  diferencia: {
    activo: true,
    umbral: 0.32,
    margen: 0.04,
    grano: 1.5,
    textos: ".menu a, .menu button, .menu span, .pase__titulo, .pase__datos, .etiqueta-cursor, .celda-proyecto__txt, .boton-auto, [data-dif]",
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
