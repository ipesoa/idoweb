/* =====================================================================
   COLORES  ·  letra + borde según la foto que hay detrás
   ---------------------------------------------------------------------
   1. Se mira el color medio de la foto justo detrás del texto.
   2. Se busca en AJUSTES.tablaColores la fila con el "fondo" más parecido
      → color de letra y color de borde deseados.
   3. Según AJUSTES.colores.modo:
      "tabla-mezcla" → el texto se MEZCLA con la foto (efecto diferencia),
                       calculado para que sobre ese fondo medio salga el
                       color de la tabla; donde la foto cambia, la letra
                       cambia con ella (efecto translúcido).
      "tabla"        → colores de la tabla tal cual, planos.
      "diferencia"   → solo el negativo de antes, sin tabla.

   Se usa en el texto del inicio (inicio.js) y en el menú de las páginas
   con fotos (inicio, films, comercials, proyecto): cada enlace del menú
   mira la foto que tiene debajo.

   NOTA: abriendo la web con doble clic (file://) Chrome no deja leer los
   píxeles de las fotos; entonces todo pasa al modo "diferencia".
   En la web publicada (GitHub Pages) y en Safari funciona.
   ===================================================================== */
(function () {
  const AJ = window.AJUSTES;
  const MODO = (AJ.colores && AJ.colores.modo) || "tabla-mezcla";
  let modoActual = MODO;

  const hexARgb = (h) => {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const rgbAHex = (a) => "#" + a.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

  function ponerModo(m) {
    modoActual = m;
    const b = document.body.classList;
    b.remove("modo-mezcla", "modo-tabla", "modo-diferencia");
    b.add(m === "tabla-mezcla" ? "modo-mezcla" : m === "tabla" ? "modo-tabla" : "modo-diferencia");
  }

  // ---- leer píxeles ----
  const lienzo = document.createElement("canvas");
  lienzo.width = 32; lienzo.height = 16;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });

  function promedio(img, sx, sy, sw, sh) {
    try {
      ctx.clearRect(0, 0, 32, 16);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 32, 16);
      const d = ctx.getImageData(0, 0, 32, 16).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 10) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      return n ? [r / n, g / n, b / n] : null;
    } catch (e) {
      if (modoActual !== "diferencia") ponerModo("diferencia"); // foto "protegida" (file://)
      return null;
    }
  }

  // Franja central de la foto (donde va el título del inicio), recortada como "cover"
  function medio(img, zona = { x: 0.08, y: 0.33, w: 0.84, h: 0.34 }) {
    if (!img || !img.naturalWidth) return null;
    const va = window.innerWidth / window.innerHeight, ia = img.naturalWidth / img.naturalHeight;
    let sw = img.naturalWidth, sh = img.naturalHeight;
    if (ia > va) sw = sh * va; else sh = sw / va;
    const x0 = (img.naturalWidth - sw) / 2, y0 = (img.naturalHeight - sh) / 2;
    return promedio(img, x0 + zona.x * sw, y0 + zona.y * sh, zona.w * sw, zona.h * sh);
  }

  // Parte de una <img> (object-fit: cover) que queda debajo de un rectángulo de la pantalla
  function medioBajo(img, R) {
    if (!img || !img.naturalWidth) return null;
    const r = img.getBoundingClientRect();
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const s = Math.max(r.width / nw, r.height / nh);
    const ox = r.left + (r.width - nw * s) / 2, oy = r.top + (r.height - nh * s) / 2;
    const L = Math.max(R.left, r.left), T = Math.max(R.top, r.top);
    const W = Math.min(R.right, r.right) - L, H = Math.min(R.bottom, r.bottom) - T;
    if (W <= 1 || H <= 1) return null;
    return promedio(img, (L - ox) / s, (T - oy) / s, W / s, H / s);
  }

  // Distancia de color con pesos según la sensibilidad del ojo
  function distancia(a, b) {
    const rm = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
  }
  function elegir(rgb, tabla = AJ.tablaColores) {
    let mejor = tabla[0], min = Infinity;
    tabla.forEach((f) => { const d = distancia(rgb, hexARgb(f.fondo)); if (d < min) { min = d; mejor = f; } });
    return mejor;
  }

  // Color que hay que poner para que, en "diferencia" sobre el fondo P, salga el color deseado
  function paraDiferencia(P, deseadoHex) {
    const L = hexARgb(deseadoHex);
    return rgbAHex(P.map((p, i) => {
      if (p + L[i] <= 255) return p + L[i];
      if (p - L[i] >= 0) return p - L[i];
      return Math.abs(255 - p - L[i]) < Math.abs(p - L[i]) ? 255 : 0;
    }));
  }

  // Colores finales {letra, borde} para un fondo (y una fila opcional forzada)
  function calcular(rgb, forzada) {
    const fila = forzada || elegir(rgb);
    if (modoActual === "tabla-mezcla") return { fila, letra: paraDiferencia(rgb, fila.letra), borde: paraDiferencia(rgb, fila.borde) };
    return { fila, letra: fila.letra, borde: fila.borde };
  }

  // ---- MENÚ: cada enlace mira la foto que tiene debajo ----
  function pintarMenu() {
    if (modoActual === "diferencia") return;
    document.querySelectorAll(".menu a").forEach((a) => {
      const R = a.getBoundingClientRect();
      const x = R.left + R.width / 2, y = R.top + R.height / 2;
      const img = document.elementsFromPoint(x, y).find((el) => el.tagName === "IMG" && getComputedStyle(el).opacity > 0.05 && getComputedStyle(el.closest(".pase__capa") || el).opacity > 0.05);
      // sin foto debajo → el color de fondo de la página
      const rgb = img ? medioBajo(img, R) : (getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [13, 12, 11]).slice(0, 3).map(Number);
      if (!rgb) return;
      const c = calcular(rgb);
      a.style.setProperty("--l", c.letra);
      a.style.setProperty("--b", c.borde);
    });
  }
  let pendiente = false;
  const repintar = () => { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarMenu(); }); };

  function iniciar() {
    ponerModo(MODO);
    document.body.classList.add("color-auto");
    window.addEventListener("scroll", repintar, { passive: true });
    window.addEventListener("resize", repintar);
    document.addEventListener("load", (e) => { if (e.target.tagName === "IMG") repintar(); }, true);
    document.addEventListener("transitionend", (e) => { if (e.target.closest && e.target.closest(".rejilla-cine")) repintar(); }, true);
    setTimeout(repintar, 300);
  }

  window.Colores = { medio, medioBajo, elegir, calcular, paraDiferencia, hexARgb, pintarMenu: repintar, modo: () => modoActual, ponerModo };
  iniciar();
})();
