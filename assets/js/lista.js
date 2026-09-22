/* =====================================================================
   LISTA  ·  cuadrícula de portadas de films o de comercials
   ---------------------------------------------------------------------
   El tipo sale de <body data-pagina="films"> o "comercials".
   Orden: del más reciente al más antiguo (o por "orden:" en info.txt).
   Columnas y formato de cada rectángulo: ajustes.css (sección 4, --lista-...).
   Al pasar el ratón, la info sale a las 4 del cursor (abajo a la derecha):
       Título / labor / año   (un párrafo alineado a la izquierda)
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

  proyectos.forEach((p) => {
    const a = document.createElement("a");
    a.className = "celda-proyecto";
    a.href = p.enlace;
    const info = [p.titulo, p.labor, p.ano].filter(Boolean).map((t) => `<span>${t}</span>`).join("");
    a.innerHTML = `
      <img src="${(p.portada || {}).url || ""}" alt="${p.titulo}" loading="lazy" decoding="async"
           style="object-position:${p.encuadre}">
      <span class="celda-proyecto__txt">${info}</span>`;
    a.addEventListener("mouseenter", () => {
      etiqueta.innerHTML = info;
      etiqueta.classList.add("visible");
    });
    a.addEventListener("mouseleave", () => etiqueta.classList.remove("visible"));
    lista.append(a);
    Comun.aparecer(a);
  });

  // Etiqueta que sigue al cursor (suavizada)
  let x = 0, y = 0, ex = 0, ey = 0;
  window.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
  (function seguir() {
    ex += (x - ex) * 0.18; ey += (y - ey) * 0.18;
    etiqueta.style.transform = `translate(${ex}px, ${ey}px)`;
    requestAnimationFrame(seguir);
  })();

  Comun.autoScroll();
})();
