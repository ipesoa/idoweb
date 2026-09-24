/* =====================================================================
   CONTACT  ·  el texto, la lista de trabajos y los datos de contacto
   ---------------------------------------------------------------------
   contenido/about/info.txt:
       email: ...        telefono: ...        instagram: ...
       ---
       Aquí el texto que quieras (una línea en blanco = párrafo nuevo).
   La lista junta TODOS los trabajos (films, series, commercials,
   videoclips + contenido/about/filmografia-extra.txt) del más nuevo al
   más antiguo, con filtros: All (al entrar) · Films · Series ·
   Commercials · Videoclips.  Sin efectos: el texto sale tal cual.
   Tamaños y ancho de la columna: ajustes.css sección 6
   ===================================================================== */
(function () {
  const ab = Web.about || {};
  const T = AJUSTES.textos;
  const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // 1. el texto (lo que hay después del --- en info.txt)
  const texto = document.getElementById("texto");
  if (ab.texto) texto.innerHTML = Web.parrafos(ab.texto);
  else texto.remove();

  // 2. filtros: All + una por sección (en el orden de ajustes.js)
  const FILTROS = [["todo", T.todo]].concat(AJUSTES.secciones.map((s) => [s.id, s.titulo]));
  const filtros = document.getElementById("filtros");
  filtros.innerHTML = FILTROS.map(([k, v]) => `<button data-f="${k}">${v}</button>`).join("");

  // 3. la lista de trabajos
  const ol = document.getElementById("trabajos");
  ol.innerHTML = Web.filmografia().map((t) => {
    const dentro = `<span>${esc(t.ano || "")}</span><span class="titulo">${esc(t.titulo)}</span><span>${esc(t.labor || "")}</span>`;
    return `<li data-tipo="${esc(t.tipo)}">${t.enlace
      ? `<a class="fila" href="${t.enlace}">${dentro}</a>`
      : `<div class="fila">${dentro}</div>`}</li>`;
  }).join("");

  function filtrar(f) {
    filtros.querySelectorAll("button").forEach((b) => b.classList.toggle("activo", b.dataset.f === f));
    let hay = 0;
    ol.querySelectorAll("li").forEach((li) => {
      const fuera = f !== "todo" && li.dataset.tipo !== f;
      li.classList.toggle("oculta", fuera);
      if (!fuera) hay++;
    });
    ol.classList.toggle("vacia", hay === 0);   // sin nada en esa sección: sale una raya y no se mueve nada
    ol.scrollTop = 0;
  }
  filtros.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) filtrar(b.dataset.f); });
  filtrar(FILTROS[0][0]);   // al entrar: All

  // 4. email, teléfono e instagram (los vacíos no salen)
  const insta = (ab.instagram || "").replace(/^@/, "").trim();
  const lineas = [
    ab.email ? `<a href="mailto:${esc(ab.email)}">${esc(ab.email)}</a>` : "",
    ab.telefono ? `<a href="tel:${esc(ab.telefono.replace(/\s/g, ""))}">${esc(ab.telefono)}</a>` : "",
    insta ? `<a href="https://instagram.com/${esc(insta)}" target="_blank" rel="noopener">@${esc(insta)}</a>` : "",
  ].filter(Boolean);
  document.getElementById("datos").innerHTML = lineas.map((l) => `<p>${l}</p>`).join("");
})();
