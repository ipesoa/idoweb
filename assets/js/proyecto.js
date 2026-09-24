/* =====================================================================
   PROYECTO  ·  monta la página de un trabajo
   ---------------------------------------------------------------------
   Dirección:  proyecto.html?tipo=films&id=CARPETA
     tipo = films | series | comercials | videoclips
   Orden de la página:
     1. VÍDEO      clave "video:" del info.txt (Vimeo, YouTube, un .mp4 de
                   tu servidor o el código <iframe…> que te den).
                   Empieza solo y sin sonido: ajustes.js → AJUSTES.proyecto
     2. FICHA      título · directed by · produced by · año
     3. CREW       una línea "crew:" por persona → sale a dos columnas
     4. TEXTO      lo que hay después del --- en el info.txt
     5. FOTOS      rejilla regular formato cine (ajustes.css sección 4)
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

  if (!p) {
    document.querySelector("main").innerHTML =
      `<p class="no-encontrado">Este proyecto no existe o ha cambiado de nombre.<br><a href="work.html">←</a></p>`;
    return;
  }
  document.title = `${p.titulo} · ${(Web.about && Web.about.nombre) || ""}`;
  document.querySelector(".menu__" + tipo)?.classList.add("activo");

  /* ---- 1. vídeo ---- */
  const video = document.getElementById("video");
  const html = Comun.reproductor(p.video, p.titulo);
  if (html) video.innerHTML = html;
  else { video.remove(); document.body.classList.add("sin-video"); }   // sin vídeo, la ficha baja para no chocar con el menú

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
  const medios = (p.portada ? [p.portada] : []).concat(p.galeria);
  const fotos = medios.filter((m) => !/\.(mp4|webm|mov|m4v)$/i.test(m.f)).map((m) => m.url);

  medios.forEach((m, i) => {
    const celda = document.createElement("figure");
    celda.className = "celda";
    if (/\.(mp4|webm|mov|m4v)$/i.test(m.f)) {
      celda.innerHTML = `<video src="${m.url}" muted loop playsinline autoplay preload="metadata"></video>`;
    } else {
      celda.innerHTML = `<img src="${m.url}" alt="${esc(p.titulo)} — ${i + 1}" loading="${i < 4 ? "eager" : "lazy"}" decoding="async"
                          style="object-position:${i === 0 ? p.encuadre : "center"}">`;
      const n = fotos.indexOf(m.url);
      celda.addEventListener("click", () => Comun.visor(fotos, n));
    }
    rejilla.append(celda);
    Comun.aparecer(celda);
  });

  /* ---- 6. botón final: Start a conversation → contact ---- */
  document.getElementById("contacto").innerHTML =
    `<a class="boton-contacto" href="contact.html">${T.conversacion}</a>`;

  Comun.autoScroll();
})();
