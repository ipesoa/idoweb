/* =====================================================================
   COMÚN  ·  piezas que usan todas las páginas
   ---------------------------------------------------------------------
   - pintarMenu()      menú fijo (nombre, about, films, comercials)
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
  const pagina = document.body.dataset.pagina; // inicio | films | comercials | proyecto | about

  /* ---------- MENÚ ---------- */
  function pintarMenu() {
    const nombre = (Web.about && Web.about.nombre) || "Idoia Esteban Galván";
    const nav = document.createElement("nav");
    nav.className = "menu";
    nav.setAttribute("aria-label", "Menú principal");
    nav.innerHTML = `
      <a class="menu__nombre" href="index.html">${nombre}</a>
      <a class="menu__about ${pagina === "about" ? "activo" : ""}" href="about.html">about</a>
      <a class="menu__films ${pagina === "films" ? "activo" : ""}" href="films.html">${A.textos.films}</a>
      <a class="menu__comercials ${pagina === "comercials" ? "activo" : ""}" href="comercials.html">${A.textos.comercials}</a>`;
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

  /* ---------- VÍDEO: enlace de Vimeo/YouTube → dirección para incrustar ---------- */
  function embed(url) {
    if (!url) return "";
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`;
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
    if (m) return `https://player.vimeo.com/video/${m[1]}${m[2] ? "?h=" + m[2] + "&" : "?"}dnt=1&title=0&byline=0&portrait=0`;
    return "";
  }

  pintarMenu();
  montarCortina();

  window.Comun = { autoScroll, visor, aparecer, letras, azar, irA, embed };
})();
