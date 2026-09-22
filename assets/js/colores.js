/* =====================================================================
   COLORES  ·  mira de qué color es una foto y elige letra + borde
   ---------------------------------------------------------------------
   Colores.medio(img)        → color medio [r,g,b] de la franja central
                               de la foto (donde va el texto), o null si
                               el navegador no deja leerla (ver nota)
   Colores.elegir(rgb)       → la fila de AJUSTES.tablaColores cuyo
                               "fondo" se parece más a ese color
   NOTA: abriendo la web con doble clic (file://) Chrome no deja leer los
   píxeles de las fotos; entonces se usa el modo "diferencia". En la web
   publicada (GitHub Pages) funciona siempre.
   ===================================================================== */
(function () {
  const hexARgb = (h) => {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };

  // Franja donde está el texto: del 8 % al 92 % de ancho, del 33 % al 67 % de alto
  function medio(img, zona = { x: 0.08, y: 0.33, w: 0.84, h: 0.34 }) {
    try {
      const W = 64, H = 36;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      // recorte igual que "object-fit: cover" en la pantalla actual
      const va = window.innerWidth / window.innerHeight;
      const ia = img.naturalWidth / img.naturalHeight;
      let sw = img.naturalWidth, sh = img.naturalHeight;
      if (ia > va) sw = sh * va; else sh = sw / va;
      ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, W, H);
      const d = ctx.getImageData(Math.round(zona.x * W), Math.round(zona.y * H),
        Math.round(zona.w * W), Math.round(zona.h * H)).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      return [r / n, g / n, b / n];
    } catch (e) {
      return null; // imagen "protegida" (file://)
    }
  }

  // Distancia de color con pesos según la sensibilidad del ojo
  function distancia(a, b) {
    const rm = (a[0] + b[0]) / 2;
    const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
  }

  function elegir(rgb, tabla = window.AJUSTES.tablaColores) {
    let mejor = tabla[0], min = Infinity;
    tabla.forEach((fila) => {
      const d = distancia(rgb, hexARgb(fila.fondo));
      if (d < min) { min = d; mejor = fila; }
    });
    return mejor;
  }

  window.Colores = { medio, elegir, hexARgb };
})();
