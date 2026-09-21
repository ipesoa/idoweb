/* =====================================================================
   LISTA  ·  cuadrícula de portadas de films o de comercials
   ---------------------------------------------------------------------
   El tipo sale de <body data-pagina="films"> o "comercials".
   Cada portada ocupa una forma distinta (grande, apaisada, alta...)
   para que la composición sea variada pero siempre igual en cada visita.
   ===================================================================== */
(function () {
  const tipo = document.body.dataset.pagina;
  const lista = document.getElementById("lista");
  const etiqueta = document.getElementById("etiqueta");
  const proyectos = Web.proyectos(tipo);

  if (!proyectos.length) {
    lista.outerHTML = `<p class="lista-vacia">Aún no hay proyectos en contenido/${tipo}/</p>`;
    return;
  }

  // Formas posibles [columnas, filas] según el ancho de pantalla.
  // Cambia estas listas para otra composición.
  const FORMAS = {
    6: [[3, 3], [2, 2], [1, 2], [2, 1], [3, 2], [1, 1], [4, 3], [2, 3]],
    4: [[2, 2], [2, 3], [1, 2], [2, 1], [4, 3], [1, 1]],
    2: [[2, 2], [1, 2], [1, 1], [2, 1], [1, 1]],
  };
  const columnas = () => parseInt(getComputedStyle(lista).getPropertyValue("--cols")) || 6;

  const celdas = proyectos.map((p, i) => {
    const a = document.createElement("a");
    a.className = "celda-proyecto";
    a.href = p.enlace;
    a._p = p; a._i = i;
    const datos = [p.ano, p.labor].filter(Boolean).join(" · ");
    a.innerHTML = `
      <img src="${(p.portada || {}).url || ""}" alt="${p.titulo}" loading="lazy" decoding="async"
           style="object-position:${p.encuadre}">
      <span class="celda-proyecto__txt"><b>${p.titulo}</b><small>${datos}</small></span>`;
    a.addEventListener("mouseenter", () => {
      etiqueta.innerHTML = `<b>${p.titulo}</b><small>${datos}</small>`;
      etiqueta.classList.add("visible");
    });
    a.addEventListener("mouseleave", () => etiqueta.classList.remove("visible"));
    return a;
  });

  function formar() {
    const cols = columnas();
    const formas = FORMAS[cols] || FORMAS[6];
    const piezas = celdas.map((a) => {
      // el primero siempre grande; el resto según un azar fijo por proyecto
      const [c, f] = a._i === 0 ? formas[0] : formas[Math.floor(Comun.azar(a._p.id) * formas.length)];
      return { el: a, c: Math.min(c, cols), f: (cc) => Math.max(1, Math.round(f * cc / c)) };
    });
    Comun.empaquetar(piezas, cols);
    // si la celda quedó más alta que ancha y hay portada vertical, usarla
    celdas.forEach((a) => {
      const img = a.querySelector("img");
      const vertical = a.clientHeight > a.clientWidth * 1.05 && a._p.portadaMovil;
      const nueva = (vertical ? a._p.portadaMovil : a._p.portada)?.url;
      if (nueva && !img.src.endsWith(nueva)) img.src = nueva;
    });
  }

  lista.append(...celdas);
  formar();
  celdas.forEach(Comun.aparecer);

  let colsAntes = columnas();
  window.addEventListener("resize", () => {
    if (columnas() !== colsAntes) { colsAntes = columnas(); formar(); }
  });

  // Etiqueta que sigue al cursor (suavizada)
  let x = 0, y = 0, ex = 0, ey = 0;
  window.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
  (function seguir() {
    ex += (x - ex) * 0.18; ey += (y - ey) * 0.18;
    etiqueta.style.transform = `translate(${ex}px, ${ey}px) translate(-50%, -50%)`;
    requestAnimationFrame(seguir);
  })();

  Comun.autoScroll();
})();
