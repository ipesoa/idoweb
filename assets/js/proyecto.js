/* =====================================================================
   PROYECTO  ·  monta la página de un trabajo
   ---------------------------------------------------------------------
   Dirección:  proyecto.html?tipo=films&id=CARPETA
     tipo = films | series | comercials | videoclips
   Orden de la página:
     1. VÍDEO      archivos de R2 con controles nativos. Los anuncios con
                   varias piezas se reproducen seguidos y vuelven al primero.
                   Empieza solo y sin sonido.
     2. FICHA      título · directed by · produced by · año
     3. CREW       una línea "crew:" por persona → sale a dos columnas
     4. TEXTO      lo que hay después del --- en el info.txt
     5. FOTOS      rejilla regular formato cine, en el orden del gestor
                   (la portada de la parrilla no tiene por qué ir la primera)
     6. BOTÓN      "Start a conversation" → contact.html
   ===================================================================== */
(function () {
  const params = new URLSearchParams(location.search);
  const tipos = Web.tipos();
  const tipo = tipos.includes(params.get("tipo")) ? params.get("tipo") : tipos[0];
  const p = Web.proyecto(tipo, params.get("id"));
  const rejilla = document.getElementById("rejilla");
  const T = AJUSTES.textos;
  const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const esVideoDirecto = (u) => /\.(mp4|webm|ogv|m4v|mov)(?:[?#]|$)/i.test(u);

  function montarReproductorNativo(seccion, fuentes) {
    seccion.innerHTML = '<div class="proyecto__reproductor"></div>';
    const media = document.createElement("video");
    media.controls = true;
    media.autoplay = true;
    media.muted = true;
    media.defaultMuted = true;
    media.playsInline = true;
    media.preload = "metadata";
    media.loop = fuentes.length === 1;
    let indice = 0;
    let erroresSeguidos = 0;
    media.src = fuentes[indice];
    seccion.firstElementChild.append(media);

    const siguiente = () => {
      if (fuentes.length < 2) return;
      indice = (indice + 1) % fuentes.length;
      media.src = fuentes[indice];
      media.load();
      media.play().catch(() => {});
    };
    media.addEventListener("ended", () => { erroresSeguidos = 0; siguiente(); });
    media.addEventListener("error", () => { if (++erroresSeguidos < fuentes.length) siguiente(); });
  }
  if (!p) {
    document.querySelector("main").innerHTML =
      `<p class="no-encontrado">Este proyecto no existe o ha cambiado de nombre.<br><a href="work.html">←</a></p>`;
    return;
  }
  document.title = `${p.titulo} · ${(Web.about && Web.about.nombre) || ""}`;
  document.querySelector(".menu__" + tipo)?.classList.add("activo");

  /* ---- 1. vídeo ---- */
  const video = document.getElementById("video");
  const fuentes = Comun.fuentesVideo(p.video).filter((u) => Comun.reproductor(u, p.titulo));
  if (fuentes.length) {
    if (fuentes.every(esVideoDirecto)) montarReproductorNativo(video, fuentes);
    else {
      video.innerHTML = `<div class="proyecto__reproductor">${Comun.reproductor(fuentes[0], p.titulo)}</div>`;
      if (fuentes.length > 1) {
        const elegir = document.createElement("nav");
        elegir.className = "proyecto__videos-elegir";
        elegir.setAttribute("aria-label", "Vídeos de este trabajo");
        elegir.innerHTML = fuentes.map((_, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="Ver vídeo ${i + 1} de ${fuentes.length}">${String(i + 1).padStart(2, "0")}</button>`).join("");
        const botones = [...elegir.querySelectorAll("button")];
        botones.forEach((b, i) => b.addEventListener("click", () => {
          if (b.getAttribute("aria-pressed") === "true") return;
          video.querySelector(".proyecto__reproductor").innerHTML = Comun.reproductor(fuentes[i], `${p.titulo} — ${i + 1}`);
          botones.forEach((opcion, n) => opcion.setAttribute("aria-pressed", String(n === i)));
        }));
        video.append(elegir);
      }
    }
  } else { video.remove(); document.body.classList.add("sin-video"); }   // sin vídeo, la ficha baja para no chocar con el menú

  /* ---- 2. ficha: título / directed by / produced by / año ---- */
  const [titulo, dirigido, producido] = [
    esc(p.titulo),
    p.director ? `${T.dirigido} ${esc(p.director)}` : "",
    (p.productora || p.cliente) ? `${T.producido} ${esc(p.productora || p.cliente)}` : "",
  ];
  document.getElementById("ficha").innerHTML =
    `<h1 class="proyecto__titulo">${titulo}</h1>` +
    [dirigido, producido, [esc(p.ano), esc(p.labor)].filter(Boolean).join(" · ")]
      .filter(Boolean).map((l) => `<p class="proyecto__linea">${l}</p>`).join("");

  /* ---- 3. crew (dos columnas) ---- */
  const crew = document.getElementById("crew");
  if (p.crew && p.crew.length) crew.innerHTML = p.crew.map((l) => `<p>${esc(l)}</p>`).join("");
  else crew.remove();

  /* ---- 4. texto sobre la película ---- */
  const texto = document.getElementById("texto");
  if (p.texto) texto.innerHTML = Web.parrafos(p.texto);
  else texto.remove();

  /* ---- 5. fotos ---- */
  // en el orden del gestor (la portada de la parrilla puede ir en cualquier sitio)
  const medios = p.fotosPagina || (p.portada ? [p.portada] : []).concat(p.galeria || []);
  if (!medios.length) {
    rejilla.remove();
    document.body.classList.add("sin-fotos");
  }
  const fotos = medios.filter((m) => !/\.(mp4|webm|mov|m4v)$/i.test(m.f)).map((m) => m.url);

  medios.forEach((m, i) => {
    const celda = document.createElement("figure");
    celda.className = "celda";
    if (/\.(mp4|webm|mov|m4v)$/i.test(m.f)) {
      celda.innerHTML = `<video src="${m.url}" muted loop playsinline autoplay preload="metadata"></video>`;
    } else {
      celda.innerHTML = `<img src="${m.url}" alt="${esc(p.titulo)} — ${i + 1}" loading="${i < 4 ? "eager" : "lazy"}" decoding="async"
                          style="object-position:center">`;
      const n = fotos.indexOf(m.url);
      celda.addEventListener("click", () => Comun.visor(fotos, n));
    }
    rejilla.append(celda);
    Comun.aparecer(celda);
  });

  /* ---- 6. botón final: Start a conversation → contact ---- */
  // con la franja activada (gestor → Parrillas), la franja sustituye al botón
  const franja = Comun.franja && Comun.franja(tipo);
  const pie = document.getElementById("contacto");
  if (franja) { pie.classList.add("pie-contacto--franja"); pie.append(franja); }
  else pie.innerHTML = `<a class="boton-contacto" href="contact.html">${T.conversacion}</a>`;

  Comun.autoScroll();
})();
