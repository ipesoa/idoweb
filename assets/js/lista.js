/* =====================================================================
   LISTA  ·  cuadrícula de portadas de una sección
   ---------------------------------------------------------------------
   La sección sale de <body data-pagina="films"> (o series, comercials,
   videoclips) y "work" = TODOS los trabajos juntos, del más nuevo al
   más antiguo. Arriba solo va el nombre y debajo dónde estás (comun.js).
   Columnas y formato de cada rectángulo: ajustes.css (sección 4).

   Dos formas de mostrar cada rectángulo:

   CON CARTELES (AJUSTES.carteles, ajustes.js)
     - cartel a la izquierda, todos del mismo tamaño (ajustes.css 4b)
     - detrás, la portada ocupando todo el rectángulo, un poco oscura
     - encima de la portada:  Título / directed by … / produced by …
                              y abajo el año
     - al pasar el ratón el cartel se desvanece y la portada brilla
       un instante y se queda en su tono original
     Los proyectos sin cartel salen solo con la portada y el mismo texto,
     para que todo quede alineado.

   SIN CARTELES (la de siempre)
     Al pasar el ratón, la info sale a las 4 del cursor (abajo a la derecha):
       Título / directed by … / produced by …
   ===================================================================== */
(function () {
  const tipo = document.body.dataset.pagina;
  const lista = document.getElementById("lista");
  const etiqueta = document.getElementById("etiqueta");
  const proyectos = Web.proyectos(tipo);
  const C = window.AJUSTES.carteles || {};
  const conCarteles = C.activo !== false && (C.paginas || ["work"]).includes(tipo);
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  if (!proyectos.length) {
    lista.outerHTML = `<p class="lista-vacia">Aún no hay imágenes en esta sección.</p>`;
    return;
  }
  if (conCarteles) lista.classList.add("modo-cartel");

  proyectos.forEach((p) => {
    const a = document.createElement("a");
    a.className = "celda-proyecto";
    a.href = p.enlace;
    a.dataset.tipo = p.tipo;
    const ficha = Comun.ficha(p).map((t) => `<span>${esc(t)}</span>`).join("");
    const portada = `<img class="celda__fondo" src="${esc((p.portada || {}).url)}" alt="${esc(p.titulo)}" loading="lazy" decoding="async"
           style="object-position:${esc(p.encuadre)}">`;

    if (conCarteles) {
      if (p.cartel) a.classList.add("con-cartel");
      const ano = C.mostrarAno !== false && p.ano ? `<span class="celda__ano">${esc(p.ano)}</span>` : "";
      a.innerHTML = `${portada}
        ${p.cartel ? `<img class="celda__cartel" src="${esc(p.cartel.url)}" alt="" loading="lazy" decoding="async">` : ""}
        <span class="celda-proyecto__txt celda__texto"><span class="celda__ficha">${ficha}</span>${ano}</span>`;
    } else {
      a.innerHTML = `${portada}<span class="celda-proyecto__txt">${ficha}</span>`;
      a.addEventListener("mouseenter", () => {
        etiqueta.innerHTML = ficha;
        etiqueta.classList.add("visible");
      });
      a.addEventListener("mouseleave", () => etiqueta.classList.remove("visible"));
    }
    lista.append(a);
    Comun.aparecer(a);
  });

  // Etiqueta que sigue al cursor (suavizada) · solo sin carteles
  if (!conCarteles) {
    let x = 0, y = 0, ex = 0, ey = 0;
    window.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
    (function seguir() {
      ex += (x - ex) * 0.18; ey += (y - ey) * 0.18;
      etiqueta.style.transform = `translate(${ex}px, ${ey}px)`;
      requestAnimationFrame(seguir);
    })();
  } else if (etiqueta) etiqueta.remove();

  // franja con las otras secciones + Contact, al final de la parrilla
  const f = Comun.franja && Comun.franja(tipo === "work" ? null : tipo);
  if (f) lista.after(f);

  Comun.autoScroll();
})();
