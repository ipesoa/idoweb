/* =====================================================================
   COMÚN  ·  piezas que usan todas las páginas
   ---------------------------------------------------------------------
   - pintarMenu()      menú fijo (nombre, production designer, work,
                       las secciones de AJUSTES.secciones y contact)
   - cortina           fundido al entrar/salir de página
   - Comun.autoScroll  botón y lógica del scroll automático
   - Comun.visor       visor de fotos a pantalla completa
   - Comun.aparecer    hace aparecer las fotos al entrar en pantalla
   - Comun.letras      parte un texto en letras (para animarlas)
   - Comun.azar        números "aleatorios" pero siempre iguales por nombre
   - Comun.embed       enlace de Vimeo/YouTube → reproductor incrustado
   ===================================================================== */
(function () {
  const A = window.AJUSTES;
  const pagina = document.body.dataset.pagina; // inicio | work | films | series | comercials | videoclips | proyecto | contact

  /* ---------- MENÚ ----------
     INICIO      arriba en el centro: NOMBRE · production designer · work
                 a la izquierda: films y series · a la derecha: commercials
                 y videoclips · abajo en el centro: contact
     SECCIONES   (work, films, series, commercials, videoclips)
                 arriba en el centro: NOMBRE (lleva al inicio) y, debajo,
                 dónde estás. Nada más: ni laterales ni contact.
     CONTACT     NOMBRE y debajo "work" (para volver a la lista de todo)
     PROYECTO    arriba en el centro: solo el NOMBRE, siempre visible
     Textos y secciones: assets/js/ajustes.js (AJUSTES.secciones / .textos) */
  function pintarMenu() {
    const nombre = (Web.about && Web.about.nombre) || "Idoia Esteban Galván";
    const seccion = A.secciones.find((s) => s.id === pagina);
    const donde = pagina === "work" ? A.textos.work : seccion ? seccion.titulo : "";
    const lado = (cual) => A.secciones.filter((s) => (s.lado || "izquierda") === cual)
      .map((s) => `<a class="menu__seccion menu__${s.id}" href="${s.pagina}">${s.titulo}</a>`).join("");

    let dentro;
    if (pagina === "inicio") {
      dentro = `
      <div class="menu__centro">
        <a class="menu__nombre" href="index.html">${nombre}</a>
        ${A.textos.labor ? `<span class="menu__labor">${A.textos.labor}</span>` : ""}
        <a class="menu__work" href="work.html">${A.textos.work}</a>
      </div>
      <div class="menu__izq">${lado("izquierda")}</div>
      <div class="menu__der">${lado("derecha")}</div>
      <div class="menu__pie">
        <a class="menu__contacto" href="contact.html">${A.textos.contacto}</a>
      </div>`;
    } else if (pagina === "contact") {
      dentro = `
      <div class="menu__centro">
        <a class="menu__nombre" href="index.html">${nombre}</a>
        <a class="menu__work" href="work.html">${A.textos.work}</a>
      </div>`;
    } else {
      dentro = `
      <div class="menu__centro">
        <a class="menu__nombre" href="index.html">${nombre}</a>
        ${donde ? `<span class="menu__donde">${donde}</span>` : ""}
      </div>`;
    }

    const nav = document.createElement("nav");
    nav.className = "menu menu--" + (pagina || "otra");
    nav.setAttribute("aria-label", "Menú principal");
    nav.innerHTML = dentro;
    document.body.prepend(nav);
    if (!document.title) document.title = nombre;
  }

  /* ---------- CORTINA (transición entre páginas) ---------- */
  function montarCortina() {
    const c = document.createElement("div");
    c.className = "cortina";
    document.body.append(c);
    requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add("abierta")));

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:)/.test(href)) return;
      e.preventDefault();
      irA(href);
    });
    // Al volver con el botón "atrás" del navegador, reabrir la cortina
    window.addEventListener("pageshow", (e) => { if (e.persisted) c.classList.add("abierta"); });
  }
  function irA(href) {
    const c = document.querySelector(".cortina");
    c.classList.remove("abierta");
    setTimeout(() => (location.href = href), A.cortina);
  }

  /* ---------- AUTO-SCROLL ---------- */
  function autoScroll() {
    if (A.autoScroll.mostrarBoton === false) return;   // botón desactivado en ajustes.js
    const b = document.createElement("button");
    b.className = "boton-auto";
    b.textContent = "auto";
    b.setAttribute("aria-pressed", "false");
    document.body.append(b);

    let encendido = false, ultimo = 0, acumulado = 0;
    const paso = (t) => {
      if (!encendido) return;
      const dt = ultimo ? t - ultimo : 16;
      ultimo = t;
      acumulado += (A.autoScroll.velocidad * dt) / 1000;
      const px = Math.floor(acumulado);
      if (px >= 1) { window.scrollBy(0, px); acumulado -= px; }
      const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (alFinal) {
        if (A.autoScroll.volverArriba) window.scrollTo({ top: 0, behavior: "smooth" });
        else return parar();
      }
      requestAnimationFrame(paso);
    };
    const empezar = () => { encendido = true; ultimo = 0; b.classList.add("encendido"); b.setAttribute("aria-pressed", "true"); requestAnimationFrame(paso); };
    const parar = () => { encendido = false; b.classList.remove("encendido"); b.setAttribute("aria-pressed", "false"); };

    b.addEventListener("click", () => (encendido ? parar() : empezar()));
    // Si la persona toca, rueda o usa el teclado, se para
    ["wheel", "touchstart", "keydown"].forEach((ev) =>
      window.addEventListener(ev, () => encendido && parar(), { passive: true }));
    if (A.autoScroll.empezarSolo) setTimeout(empezar, 1500);
  }

  /* ---------- VISOR DE FOTOS ---------- */
  let visorEl, lista = [], indice = 0;
  function visor(fotos, desde) {
    lista = fotos; indice = desde;
    if (!visorEl) {
      visorEl = document.createElement("div");
      visorEl.className = "visor";
      visorEl.innerHTML = `<img alt=""><button class="visor__cerrar">cerrar</button>
        <button class="visor__ant">ant</button><button class="visor__sig">sig</button>
        <div class="visor__cuenta"></div>`;
      document.body.append(visorEl);
      visorEl.querySelector(".visor__cerrar").onclick = cerrarVisor;
      visorEl.querySelector(".visor__ant").onclick = (e) => { e.stopPropagation(); moverVisor(-1); };
      visorEl.querySelector(".visor__sig").onclick = (e) => { e.stopPropagation(); moverVisor(1); };
      visorEl.addEventListener("click", (e) => { if (e.target === visorEl) cerrarVisor(); });
      document.addEventListener("keydown", (e) => {
        if (!visorEl.classList.contains("abierto")) return;
        if (e.key === "Escape") cerrarVisor();
        if (e.key === "ArrowRight") moverVisor(1);
        if (e.key === "ArrowLeft") moverVisor(-1);
      });
      let x0 = null;
      visorEl.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
      visorEl.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) moverVisor(dx < 0 ? 1 : -1);
        x0 = null;
      });
    }
    pintarVisor();
    visorEl.classList.add("abierto");
    document.documentElement.style.overflow = "hidden";
  }
  function pintarVisor() {
    const img = visorEl.querySelector("img");
    img.style.opacity = 0;
    const nueva = new Image();
    nueva.onload = () => { img.src = nueva.src; img.style.opacity = 1; };
    nueva.src = lista[indice];
    visorEl.querySelector(".visor__cuenta").textContent = `${indice + 1} / ${lista.length}`;
  }
  function moverVisor(d) { indice = (indice + d + lista.length) % lista.length; pintarVisor(); }
  function cerrarVisor() { visorEl.classList.remove("abierto"); document.documentElement.style.overflow = ""; }

  /* ---------- APARECER AL HACER SCROLL ---------- */
  const observador = "IntersectionObserver" in window
    ? new IntersectionObserver((entradas) => entradas.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("visible"); observador.unobserve(en.target); }
      }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  function aparecer(el) {
    const img = el.querySelector("img, video");
    const mostrar = () => (observador ? observador.observe(el) : el.classList.add("visible"));
    if (img && img.tagName === "IMG" && !img.complete) img.addEventListener("load", mostrar, { once: true });
    else mostrar();
  }

  /* ---------- LETRAS (para animar texto letra a letra) ----------
     Cada palabra va en un bloque que no se parte; cada letra en su span
     con un retraso (--d) creciente. */
  function letras(texto, retraso = 30, inicio = 0) {
    let n = 0;
    return texto.split(" ").map((palabra) =>
      `<span class="palabra">${[...palabra].map((ch) =>
        `<span class="letra" style="--d:${inicio + n++ * retraso}ms">${ch}</span>`).join("")}</span>`
    ).join(" ");
  }

  /* ---------- AZAR FIJO (misma entrada → mismo número 0..1) ---------- */
  function azar(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 10000) / 10000;
  }

  /* ---------- VÍDEO ----------
     Comun.embed(url)        → dirección para incrustar (Vimeo / YouTube)
     Comun.reproductor(url)  → el trozo de HTML ya montado, lo más limpio
                               posible: sin títulos, sin logotipos y, si
                               AJUSTES.proyecto lo dice, con autoplay.
     Vale un enlace de Vimeo o YouTube, la dirección de un archivo .mp4
     colgado en cualquier servidor, la dirección de un reproductor
     cualquiera, o el código <iframe …> que te dé la página que lo aloja. */
  const P = () => (A.proyecto || {});
  function embed(url) {
    if (!url) return "";
    const a = P().autoplay ? 1 : 0, s = P().silencio ? 1 : 0, c = P().controles === false ? 0 : 1;
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1&controls=${c}` +
      `&autoplay=${a}&mute=${s}${P().bucle ? `&loop=1&playlist=${m[1]}` : ""}`;
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
    if (m) return `https://player.vimeo.com/video/${m[1]}?${m[2] ? "h=" + m[2] + "&" : ""}dnt=1&title=0&byline=0&portrait=0` +
      `&autoplay=${a}&muted=${s}&controls=${c}${P().bucle ? "&loop=1" : ""}`;
    return "";
  }
  const esArchivoVideo = (u) => /\.(mp4|webm|ogv|m4v|mov)(\?|#|$)/i.test(u);
  function reproductor(url, titulo = "") {
    if (!url) return "";
    if (/^\s*</.test(url)) return url;                       // código <iframe …> pegado tal cual
    if (esArchivoVideo(url)) {
      return `<video src="${url}" playsinline preload="metadata"
        ${P().autoplay ? "autoplay" : ""} ${P().silencio ? "muted" : ""} ${P().bucle ? "loop" : ""}
        ${P().controles === false ? "" : "controls"}></video>`;
    }
    const src = embed(url) || url;                            // otro reproductor cualquiera
    return `<iframe src="${src}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowfullscreen frameborder="0" title="${titulo}"></iframe>`;
  }

  /* ---------- FICHA: título / directed by / produced by ---------- */
  function ficha(p) {
    return [
      p.titulo,
      p.director ? `${A.textos.dirigido} ${p.director}` : "",
      (p.productora || p.cliente) ? `${A.textos.producido} ${p.productora || p.cliente}` : "",
    ].filter(Boolean);
  }

  pintarMenu();
  montarCortina();


  window.Comun = { autoScroll, visor, aparecer, letras, azar, irA, embed, reproductor, ficha };
})();
