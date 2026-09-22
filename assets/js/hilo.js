/* =====================================================================
   HILO  ·  el hilo blanco del marco de las fotos NO pasa por debajo de
   las letras del menú (IDOIA ESTEBAN GALVÁN, about, films, comercials)
   ---------------------------------------------------------------------
   Cada celda de la rejilla recibe una máscara con "huecos" justo donde
   tiene encima una palabra del menú. Se recalcula al hacer scroll,
   al cambiar el tamaño de la ventana y al cargar las fotos.
   (Solo se carga en films, comercials y proyecto.)
   ===================================================================== */
(function () {
  const MARGEN = 4; // px de hueco alrededor de cada palabra

  function actualizar() {
    const celdas = document.querySelectorAll(".rejilla-cine > *");
    if (!celdas.length) return;
    const palabras = [...document.querySelectorAll(".menu a")]
      .map((a) => a.getBoundingClientRect()).filter((r) => r.width > 0);

    celdas.forEach((c) => {
      const r = c.getBoundingClientRect();
      const huecos = [];
      palabras.forEach((p) => {
        const L = Math.max(p.left - MARGEN, r.left), T = Math.max(p.top - MARGEN, r.top);
        const R = Math.min(p.right + MARGEN, r.right), B = Math.min(p.bottom + MARGEN, r.bottom);
        if (R > L && B > T) {
          huecos.push(`linear-gradient(#000 0 0) ${(L - r.left).toFixed(1)}px ${(T - r.top).toFixed(1)}px / ${(R - L).toFixed(1)}px ${(B - T).toFixed(1)}px no-repeat`);
        }
      });
      if (huecos.length) c.style.setProperty("--hilo-huecos", ["linear-gradient(#000 0 0)"].concat(huecos).join(", "));
      else c.style.removeProperty("--hilo-huecos");
    });
  }

  let pendiente = false;
  const pedir = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; actualizar(); });
  };
  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir);
  document.addEventListener("load", pedir, true);
  if (document.fonts) document.fonts.ready.then(pedir);
  pedir();
})();
