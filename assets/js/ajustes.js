/* =====================================================================
   AJUSTES DE COMPORTAMIENTO  ·  colores del inicio, tiempos, textos
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

    /* ---- COLOR DE LAS LETRAS ----
       "tabla"      → la web mira el color de la foto detrás del texto,
                      busca en TABLA_COLORES el fondo más parecido y usa
                      su letra y su borde.
       "diferencia" → el efecto de inversión (negativo) de antes.     */
    modoColor: "tabla",
  },

  /* ---- TABLA DE COLORES DEL INICIO ----------------------------------
     Cada línea:  fondo parecido a…  →  color de la letra  +  color del borde
     La web elige la fila cuyo "fondo" se parezca más a la foto.
     Añade, quita o cambia filas libremente (colores en #hex).
     Para un proyecto concreto también se puede forzar en su info.txt:
         color_letra: #f3d34a
         color_borde: #d4372c
     Pruébala en laboratorio.html (modo "tabla").                        */
  tablaColores: [
    //  nombre              fondo        letra        borde
    { nombre: "negro",       fondo: "#0e0e0e", letra: "#f3d34a", borde: "#d4372c" }, // amarillo / rojo
    { nombre: "gris oscuro", fondo: "#3a3a3a", letra: "#ffffff", borde: "#101010" }, // blanco / negro
    { nombre: "gris medio",  fondo: "#7c7c7c", letra: "#ffffff", borde: "#1c1c1c" },
    { nombre: "blanco",      fondo: "#ececec", letra: "#141414", borde: "#f3d34a" }, // negro / amarillo
    { nombre: "beige",       fondo: "#d6c3a5", letra: "#2e1a47", borde: "#f6ecd9" }, // morado / crema
    { nombre: "rojo",        fondo: "#a91e1e", letra: "#f6e7c8", borde: "#16213e" }, // crema / azul marino
    { nombre: "granate",     fondo: "#5a1414", letra: "#f3d34a", borde: "#0b0b0b" },
    { nombre: "naranja",     fondo: "#c97a32", letra: "#1b2a55", borde: "#f6ecd9" }, // azul / crema
    { nombre: "amarillo",    fondo: "#e2c653", letra: "#2a1846", borde: "#e0443a" }, // morado / rojo
    { nombre: "marrón",      fondo: "#5b3b26", letra: "#bfe6e1", borde: "#150a04" }, // turquesa claro / negro
    { nombre: "verde",       fondo: "#3d6547", letra: "#f5c6d3", borde: "#1c0b15" }, // rosa / berenjena
    { nombre: "verde oscuro",fondo: "#1d302a", letra: "#f1e3b0", borde: "#a8322d" },
    { nombre: "azul",        fondo: "#2c4d7a", letra: "#ffb347", borde: "#0d0d14" }, // naranja / negro
    { nombre: "azul oscuro", fondo: "#141c30", letra: "#f5d0a9", borde: "#c0392b" },
    { nombre: "rosa",        fondo: "#d79aa6", letra: "#173a2b", borde: "#ffffff" }, // verde botella / blanco
    { nombre: "morado",      fondo: "#4b2d5e", letra: "#e7f27c", borde: "#120a18" }, // lima / negro
  ],

  /* ---- Textos de la web (por si quieres cambiarlos o traducirlos) --- */
  textos: {
    films: "Films",
    comercials: "Comercials",
    todo: "Todo",
    contacto: "Contact",
  },

  /* ---- Scroll automático (films, comercials, proyecto) -------------- */
  autoScroll: {
    velocidad: 42,               // píxeles por segundo
    empezarSolo: false,          // true = empieza solo al entrar en la página
    volverArriba: true,          // al llegar al final vuelve arriba
  },

  cortina: 650,                  // fundido entre páginas (igual que --t-cortina)
};
