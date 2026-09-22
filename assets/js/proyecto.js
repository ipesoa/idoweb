/* =====================================================================
   PROYECTO  ·  monta la página de una película o un anuncio
   ---------------------------------------------------------------------
   Dirección:  proyecto.html?tipo=films&id=CARPETA
   1. Rejilla regular: portada + todas las fotos de la carpeta (en orden
      de nombre), cada una en un rectángulo formato cine. Sin textos.
      Si info.txt tiene "video:" (Vimeo/YouTube), sale como un rectángulo más.
   2. Botón "Contact" (mailto al email de contenido/about/info.txt).
   Pinchar una foto la abre en grande.
   ===================================================================== */
(function () {
  const params = new URLSearchParams(location.search);
  const tipo = params.get("tipo") === "comercials" ? "comercials" : "films";
  const p = Web.proyecto(tipo, params.get("id"));
  const rejilla = document.getElementById("rejilla");

  if (!p) {
    document.querySelector("main").innerHTML =
      `<p class="no-encontrado">Este proyecto no existe o ha cambiado de nombre.<br><a href="${tipo}.html">←</a></p>`;
    return;
  }
  document.title = `${p.titulo} · ${(Web.about && Web.about.nombre) || ""}`;
  document.querySelector(".menu__" + tipo)?.classList.add("activo");

  // Portada primero y luego la galería
  const medios = (p.portada ? [p.portada] : []).concat(p.galeria);
  const fotos = medios.filter((m) => !/\.(mp4|webm|mov|m4v)$/i.test(m.f)).map((m) => m.url);

  medios.forEach((m, i) => {
    const celda = document.createElement("figure");
    celda.className = "celda";
    if (/\.(mp4|webm|mov|m4v)$/i.test(m.f)) {
      celda.innerHTML = `<video src="${m.url}" muted loop playsinline autoplay preload="metadata"></video>`;
    } else {
      celda.innerHTML = `<img src="${m.url}" alt="${p.titulo} — ${i + 1}" loading="${i < 4 ? "eager" : "lazy"}" decoding="async"
                          style="object-position:${i === 0 ? p.encuadre : "center"}">`;
      const n = fotos.indexOf(m.url);
      celda.addEventListener("click", () => Comun.visor(fotos, n));
    }
    rejilla.append(celda);
    Comun.aparecer(celda);
  });

  // Vídeo de Vimeo / YouTube: segundo rectángulo
  const embed = Comun.embed(p.video);
  if (embed) {
    const v = document.createElement("div");
    v.className = "celda-video visible";
    v.innerHTML = `<iframe src="${embed}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Vídeo ${p.titulo}"></iframe>`;
    rejilla.insertBefore(v, rejilla.children[1] || null);
  }

  // Contact
  const email = Web.about && Web.about.email;
  if (email) {
    document.getElementById("contacto").innerHTML =
      `<a class="boton-contacto" href="mailto:${email}?subject=${encodeURIComponent(p.titulo)}">${AJUSTES.textos.contacto}</a>`;
  }

  Comun.autoScroll();
})();
