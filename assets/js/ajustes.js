/* =====================================================================
   AJUSTES DE COMPORTAMIENTO  ·  tiempos y opciones de la web
   ---------------------------------------------------------------------
   Los números en milisegundos (1000 = 1 segundo).
   Colores, fuentes y aspecto visual están en assets/css/ajustes.css
   ===================================================================== */
window.AJUSTES = {

  /* ---- Pase de imágenes del INICIO --------------------------------- */
  inicio: {
    orden: "aleatorio",          // "aleatorio" | "cronologico" (más reciente primero)
    incluirComercials: true,     // ¿los comercials con "mostrar_en_inicio: si" también salen?

    entradaImagen: 2200,         // lo que tarda la foto en aparecer (difuminado → nítido)
    esperaTexto:    700,         // pausa entre foto nítida y aparición del texto
    entradaTexto:  1400,         // aparición del texto (letra a letra)
    retrasoLetra:    35,         // desfase entre letras
    textoVisible:  3200,         // tiempo que el texto se queda quieto
    salidaTexto:   1100,         // el texto se disuelve
    esperaSiguiente: 300,        // pausa antes de la siguiente foto

    desenfoque: 28,              // px de desenfoque al entrar/salir la foto
    zoom: 1.07,                  // escala de la foto al empezar (1 = sin zoom)
    zoomLento: true,             // la foto se acerca muy despacio mientras está
  },

  /* ---- Scroll automático (proyecto, films, comercials) -------------- */
  autoScroll: {
    velocidad: 42,               // píxeles por segundo
    empezarSolo: false,          // true = empieza a moverse al entrar en la página
    volverArriba: true,          // al llegar al final vuelve arriba y sigue
  },

  /* ---- Cuadrícula de proyecto --------------------------------------- */
  mosaico: {
    // Cada foto se coloca según su forma (horizontal / vertical / cuadrada)
    // y un poco de azar "fijo" (siempre sale igual para la misma foto).
    // Trucos en el nombre del archivo:  _grande  _ancha  _alta  _pequena
    posicionTexto: 3,            // después de cuántas fotos aparece el bloque de texto
  },

  /* ---- Cambio de página -------------------------------------------- */
  cortina: 650,                  // debe coincidir con --t-cortina de ajustes.css
};
