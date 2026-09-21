/* =====================================================================
   ABOUT  ·  bio, contacto, showreel y filmografía
   ---------------------------------------------------------------------
   Todo sale de contenido/about/:
     info.txt               nombre, email, instagram, showreel... + bio
     retrato.jpg            foto (opcional)
     showreel.mp4           vídeo propio (opcional; o usa "showreel:" con Vimeo/YouTube)
     filmografia-extra.txt  trabajos sin página propia
   La filmografía junta automáticamente films + comercials + extra,
   ordenados del más reciente al más antiguo.
   ===================================================================== */
(function () {
  const ab = Web.about || {};

  // Retrato
  const ret = document.getElementById("retrato");
  if (ab.retrato) ret.innerHTML = `<img src="${ab.retrato}" alt="${ab.nombre}">`;
  else ret.remove();

  document.getElementById("subtitulo").textContent = ab.subtitulo || "";
  document.getElementById("bio").innerHTML = Web.parrafos(ab.texto);

  // Contacto
  const insta = (ab.instagram || "").replace(/^@/, "");
  const contacto = [
    ab.email && ["Email", `<a href="mailto:${ab.email}">${ab.email}</a>`],
    ab.telefono && ["Teléfono", `<a href="tel:${ab.telefono.replace(/\s/g, "")}">${ab.telefono}</a>`],
    insta && ["Instagram", `<a href="https://instagram.com/${insta}" target="_blank" rel="noopener">@${insta}</a>`],
    ab.imdb && ["IMDb", `<a href="${ab.imdb}" target="_blank" rel="noopener">ver perfil</a>`],
  ].filter(Boolean);
  document.getElementById("contacto").innerHTML =
    contacto.map(([k, v]) => `<li><span>${k}</span>${v}</li>`).join("");

  // Showreel
  if (ab.showreel) {
    const sec = document.getElementById("showreel");
    const marco = sec.querySelector(".showreel__marco");
    const embed = Comun.embed(ab.showreel);
    marco.innerHTML = embed
      ? `<iframe src="${embed}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Showreel"></iframe>`
      : `<video src="${ab.showreel}" controls playsinline preload="metadata"></video>`;
    sec.hidden = false;
  }

  // Filmografía
  const ol = document.getElementById("filmografia");
  ol.innerHTML = Web.filmografia().map((t) => {
    const dentro = `
      <span class="fila__ano">${t.ano || ""}</span>
      <span class="fila__titulo">${t.titulo}</span>
      <span class="fila__labor">${t.labor || ""}</span>
      <span class="fila__quien">${t.director || ""}</span>
      <span class="fila__tipo">${t.tipo === "comercials" ? "Comercial" : "Film"}</span>`;
    return `<li data-tipo="${t.tipo}">${t.enlace
      ? `<a class="fila" href="${t.enlace}">${dentro}</a>`
      : `<div class="fila">${dentro}</div>`}</li>`;
  }).join("");

  document.getElementById("filtros").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    document.querySelectorAll("#filtros button").forEach((x) => x.classList.toggle("activo", x === b));
    ol.querySelectorAll("li").forEach((li) =>
      li.classList.toggle("oculta", b.dataset.f !== "todo" && li.dataset.tipo !== b.dataset.f));
  });
})();
