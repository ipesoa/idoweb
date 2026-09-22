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
    zoomFinal: 1.06,             // cuánto se acerca la foto mientras está (lento y continuo)
  },

  /* ---- COLOR DE LAS LETRAS (inicio + menú de films/comercials/proyecto) ----
     modo:
       "tabla-mezcla" → la web mira el color de la foto detrás de cada texto,
                        busca en la tabla el fondo más parecido y usa su letra
                        y su borde, PERO mezclados con la foto (efecto
                        diferencia): donde la foto cambia de color, la letra
                        también cambia. ← recomendado
       "tabla"        → los colores de la tabla, planos (sin mezcla)
       "diferencia"   → solo el negativo, sin tabla                        */
  colores: {
    modo: "tabla-mezcla",
  },

  /* ---- TABLA DE COLORES -----------------------------------------------
     Cada fila:  si el fondo se parece a…  →  color de la letra  +  color del borde
     Colores flúor / chillones. Añade, quita o cambia filas (colores #hex).
     Para un proyecto concreto se puede forzar en su info.txt:
         color_letra: #fff200
         color_borde: #ff1a1a
     Pruébala en laboratorio.html.                                          */
  tablaColores: [
    //  nombre               fondo parecido a     letra (flúor)        borde
    { nombre: "negro",        fondo: "#0e0e0e", letra: "#fff200", borde: "#ff1a1a" }, // amarillo · rojo
    { nombre: "gris oscuro",  fondo: "#3a3a3a", letra: "#39ff14", borde: "#ff00c8" }, // verde · magenta
    { nombre: "gris medio",   fondo: "#7c7c7c", letra: "#00f0ff", borde: "#ff00c8" }, // cian · magenta
    { nombre: "blanco",       fondo: "#ececec", letra: "#1f51ff", borde: "#ff2bd6" }, // azul eléctrico · rosa
    { nombre: "beige",        fondo: "#d6c3a5", letra: "#ff00c8", borde: "#1f51ff" }, // magenta · azul
    { nombre: "rojo",         fondo: "#a91e1e", letra: "#00f0ff", borde: "#fff200" }, // cian · amarillo
    { nombre: "granate",      fondo: "#5a1414", letra: "#fff200", borde: "#00f0ff" }, // amarillo · cian
    { nombre: "naranja",      fondo: "#c97a32", letra: "#1f51ff", borde: "#39ff14" }, // azul · verde
    { nombre: "amarillo",     fondo: "#e2c653", letra: "#ff00c8", borde: "#1f51ff" }, // magenta · azul
    { nombre: "marrón",       fondo: "#5b3b26", letra: "#00f0ff", borde: "#ff00c8" }, // cian · magenta
    { nombre: "verde",        fondo: "#3d6547", letra: "#ff2bd6", borde: "#fff200" }, // rosa · amarillo
    { nombre: "verde oscuro", fondo: "#1d302a", letra: "#dfff00", borde: "#ff1a1a" }, // lima · rojo
    { nombre: "azul",         fondo: "#2c4d7a", letra: "#ff6a00", borde: "#fff200" }, // naranja · amarillo
    { nombre: "azul oscuro",  fondo: "#141c30", letra: "#39ff14", borde: "#ff00c8" }, // verde · magenta
    { nombre: "rosa",         fondo: "#d79aa6", letra: "#1f51ff", borde: "#39ff14" }, // azul · verde
    { nombre: "morado",       fondo: "#4b2d5e", letra: "#dfff00", borde: "#00f0ff" }, // lima · cian
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
