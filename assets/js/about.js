/* =====================================================================
   ABOUT  ·  nombre, labor, ciudad y lista de trabajos
   ---------------------------------------------------------------------
   contenido/about/info.txt:  nombre · subtitulo · ubicacion · email · telefono · instagram
   (cada dato relleno es una línea; email/teléfono/instagram son enlaces)
   La lista junta films + comercials + filmografia-extra.txt,
   del más reciente al más antiguo. Filtros: Films (al entrar) ·
   Comercials · Todo  (los nombres están en ajustes.js → textos)
   ===================================================================== */
(function () {
  const ab = Web.about || {};
  const T = AJUSTES.textos;
  // Líneas de datos: las vacías no salen
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const insta = (ab.instagram || "").replace(/^@/, "").trim();
  const lineas = [
    esc(ab.nombre || ""),
    esc(ab.subtitulo || ""),
    esc(ab.ubicacion || ""),
    ab.email ? `<a href="mailto:${esc(ab.email)}">${esc(ab.email)}</a>` : "",
    ab.telefono ? `<a href="tel:${esc(ab.telefono.replace(/\s/g, ""))}">${esc(ab.telefono)}</a>` : "",
    insta ? `<a href="https://instagram.com/${esc(insta)}" target="_blank" rel="noopener">@${esc(insta)}</a>` : "",
  ].filter(Boolean);
  // (vale también con un about.html antiguo: se usa la caja .about__datos que haya)
  const caja = document.getElementById("datos") || document.querySelector(".about__datos");
  if (caja) caja.innerHTML = lineas.map((l) => `<p>${l}</p>`).join("");

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
