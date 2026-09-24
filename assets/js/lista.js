/* =====================================================================
   LISTA  ·  cuadrícula de portadas de una sección
   ---------------------------------------------------------------------
   La sección sale de <body data-pagina="films"> (o series, comercials,
   videoclips) y "work" = TODOS los trabajos juntos, del más nuevo al
   más antiguo. Arriba solo va el nombre y debajo dónde estás (comun.js).
   Columnas y formato de cada rectángulo: ajustes.css (sección 4).
   Al pasar el ratón, la info sale a las 4 del cursor (abajo a la derecha):
       Título / directed by … / produced by …
   ===================================================================== */
(function () {
  const tipo = document.body.dataset.pagina;
  const lista = document.getElementById("lista");
  const etiqueta = document.getElementById("etiqueta");
  const proyectos = Web.proyectos(tipo);

  if (!proyectos.length) {
    lista.outerHTML = `<p class="lista-vacia">Aún no hay nada en contenido/${tipo}/</p>`;
    return;
  }

  proyectos.forEach((p) => {
    const a = document.createElement("a");
    a.className = "celda-proyecto";
    a.href = p.enlace;
    a.dataset.tipo = p.tipo;
    const info = Comun.ficha(p).map((t) => `<span>${t}</span>`).join("");
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
