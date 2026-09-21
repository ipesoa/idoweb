/* =====================================================================
   LISTA  ·  cuadrícula de portadas de films o de comercials
   ---------------------------------------------------------------------
   El tipo sale de <body data-pagina="films"> o "comercials".
   Orden: del más reciente al más antiguo (o por "orden:" en info.txt).
   Columnas y formato de cada rectángulo: ajustes.css (sección 4).
   Al pasar el ratón, título · año · labor siguen al cursor.
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
    lista.append(a);
    Comun.aparecer(a);
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
