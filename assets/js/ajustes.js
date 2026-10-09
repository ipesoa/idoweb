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
     ¡Ojo! Si se cambian en el gestor (pestaña Cabecera), mandan las del
     gestor. Estos son los valores por defecto.
     nombre → MASK REVEAL vertical de IDOIA ESTEBAN GALVÁN: el texto sube
              desde debajo de su máscara hasta su sitio.
        efecto: "subir" (de abajo arriba) · "bajar" · "fundido" · "ninguno"
        cuando: "inicio" (cada vez que se entra al inicio)
                "visita" (solo la primera página de cada visita)
                "siempre" (en todas las páginas)
     menu → opciones de WORK en el inicio
        abrir:  "mascara-abajo" (mask reveal de arriba abajo)
                "mascara-arriba" (de abajo arriba) · "fundido"
        cerrar: "difuminar" (fundido con un desenfoque suave) · "fundido"
     Tiempos en milisegundos.                                           */
  animaciones: {
    nombre: {
      efecto: "subir",
      cuando: "inicio",
      retraso: 500,              // espera antes de empezar (deja pasar el fundido de entrada)
      nunca: ["contact"],        // páginas donde el nombre es siempre fijo, sin animación
      duracion: 1000,            // lo que tarda en subir
    },
    menu: {
      abrir: "mascara-abajo",
      duracion: 1000,            // lo que tarda cada opción en entrar
      escalon: 100,              // desfase entre opciones (0.08–0.12 s queda bien)
      cerrar: "difuminar",
      duracionCerrar: 600,
    },
  },

  /* ---- DELFINES (la broma) --------------------------------------------
     Salen chorros de delfines de la I y de la N del nombre, caen, se
     amontonan abajo, se quedan unos segundos y se desvanecen.
     Lo hace assets/js/delfines.js (física: vendor/matter.min.js).
     ¡Ojo! Si se cambia en el gestor (pestaña Delfines), manda el gestor.
       inicio / contact   true = sale en esa página
       cuandoInicio / cuandoContact
                "entrar" (al entrar en la página) · "pulsar" (al pulsar
                el nombre) · "las-dos"
       En Contact sale solo de la I y queda DEBAJO del texto.
       imagen   PNG con fondo transparente (unos 160 × 275 px)           */
  delfines: {
    inicio: true,
    contact: true,
    cuandoInicio: "las-dos",
    cuandoContact: "entrar",
    imagen: "assets/img/delfin.png",
    espera: 1700,                // ms desde que se entra (deja acabar la animación del nombre)
    duracion: 2.75,              // segundos echando delfines
    quedarse: 3,                 // segundos amontonados antes de desvanecerse
    fundido: 0.65,               // segundos que tarda en desvanecerse
    cantidad: 45,                // delfines por segundo (entre los dos chorros)
    tamano: 56,                  // px de largo de cada delfín (±25 % al azar)
    potencia: 200,               // px/s de salida
    angulo: 26,                  // grados hacia abajo
    apertura: 26,                // grados de abanico del chorro
    giro: 600,                   // grados por segundo
    gravedad: 450,               // px/s²
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

  /* ---- COLOR DE LAS LETRAS SOBRE FOTOS -------------------------------
     Las letras son BLANCAS; donde caen sobre un color claro (donde el
     blanco no se leería) pasan a NEGRO. Siempre blanco o negro puros.
     Si se cambia en el gestor (Cabecera → Color de las letras), manda el gestor.
       umbral   TOLERANCIA: lo claro que tiene que ser el fondo para que
                pase a negro (0 = negro · 1 = blanco). 0.5 = solo sobre
                colores claros de verdad. Más alto = cambia MENOS.
       decidir  "pixel"   según la imagen, como «Diferencia» de Photoshop
                          pero solo en las zonas claras (el corte sigue
                          a la foto)
                "palabra" / "letra" / "texto": cada uno entero de un color
       grano    (pixel) px de textura fina que se ignora, para que no
                salgan motas sueltas (0 = exacto, píxel a píxel)        */
  diferencia: {
    activo: true,
    umbral: 0.5,
    decidir: "pixel",
    paginasSin: ["contact"],   // páginas sin fotos: texto normal, sin esta capa
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
