/* =====================================================================
   ABOUT  ·  nombre, labor, ciudad y lista de trabajos
   ---------------------------------------------------------------------
   contenido/about/info.txt:  nombre · subtitulo · ubicacion
   La lista junta films + comercials + filmografia-extra.txt,
   del más reciente al más antiguo. Filtros: Films (al entrar) ·
   Comercials · Todo  (los nombres están en ajustes.js → textos)
   ===================================================================== */
(function () {
  const ab = Web.about || {};
  const T = AJUSTES.textos;
  document.getElementById("nombre").textContent = ab.nombre || "";
  document.getElementById("subtitulo").textContent = ab.subtitulo || "";
  document.getElementById("ubicacion").textContent = ab.ubicacion || "";

  // Filtros: el primero es el que sale al entrar
  const FILTROS = [["films", T.films], ["comercials", T.comercials], ["todo", T.todo]];
  const filtros = document.getElementById("filtros");
  filtros.innerHTML = FILTROS.map(([k, v]) => `<button data-f="${k}">${v}</button>`).join("");

  const ol = document.getElementById("trabajos");
  ol.innerHTML = Web.filmografia().map((t) => {
    const dentro = `<span>${t.ano || ""}</span><span class="titulo">${t.titulo}</span><span>${t.labor || ""}</span>`;
    return `<li data-tipo="${t.tipo}">${t.enlace
      ? `<a class="fila" href="${t.enlace}">${dentro}</a>`
      : `<div class="fila">${dentro}</div>`}</li>`;
  }).join("");

  function filtrar(f) {
    filtros.querySelectorAll("button").forEach((b) => b.classList.toggle("activo", b.dataset.f === f));
    ol.querySelectorAll("li").forEach((li) => li.classList.toggle("oculta", f !== "todo" && li.dataset.tipo !== f));
  }
  filtros.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) filtrar(b.dataset.f); });
  filtrar(FILTROS[0][0]);
})();
