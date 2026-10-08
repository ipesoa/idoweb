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
  const htmlSeguro = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ---------- MENÚ ----------
     INICIO      arriba en el centro: NOMBRE · production designer · work
                 work despliega films, series, commercials y archive en el centro;
                 contact aparece abajo. No hay enlaces laterales.
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
    const enlaceSeccion = (s, clase = "menu__seccion") =>
      `<a class="${clase} menu__${s.id}" href="${s.pagina}">${htmlSeguro(s.titulo)}</a>`;

    let dentro;
    if (pagina === "inicio") {
      dentro = `
      <div class="menu__centro">
        <a class="menu__nombre" href="index.html">${htmlSeguro(nombre)}</a>
        ${A.textos.labor ? `<span class="menu__labor">${htmlSeguro(A.textos.labor)}</span>` : ""}
        <button class="menu__work" type="button" aria-expanded="false" aria-controls="menu-inicio-opciones">${htmlSeguro(A.textos.work)}</button>
      </div>
      <div class="menu__opciones menu__plegable" id="menu-inicio-opciones" inert>
        ${A.secciones.filter((s) => ["films", "series", "comercials"].includes(s.id)).map((s) => enlaceSeccion(s)).join("")}
        <a class="menu__archivo" href="work.html">Archive</a>
      </div>
      <div class="menu__pie menu__plegable" inert>
        <a class="menu__contacto" href="contact.html">${htmlSeguro(A.textos.contacto)}</a>
      </div>`;
    } else if (pagina === "contact") {
      dentro = `
      <div class="menu__centro">
        <a class="menu__nombre" href="index.html">${htmlSeguro(nombre)}</a>
        <a class="menu__work" href="work.html">${A.textos.work}</a>
      </div>`;
    } else {
      dentro = `
      <div class="menu__centro">
        <a class="menu__nombre" href="index.html">${htmlSeguro(nombre)}</a>
        ${donde ? `<span class="menu__donde">${donde}</span>` : ""}
      </div>`;
    }

    const nav = document.createElement("nav");
    nav.className = "menu menu--" + (pagina || "otra");
    nav.setAttribute("aria-label", "Menú principal");
    nav.innerHTML = dentro;
    document.body.prepend(nav);
    if (pagina === "inicio") {
      const boton = nav.querySelector(".menu__work");
      const opciones = nav.querySelector(".menu__opciones");
      const contacto = nav.querySelector(".menu__pie");
      // WORK (GSAP). Efectos y tiempos: ajustes.js → animaciones.menu
      // (o el gestor, pestaña Cabecera, que manda sobre ajustes.js)
      const items = [...opciones.children, ...contacto.children];
      const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const acabar = () => { gsap.set(items, { clearProps: "all" }); nav.classList.remove("menu--animando"); };
      const mostrar = (abierto) => {
        const AM = (A.animaciones && A.animaciones.menu) || {};
        boton.setAttribute("aria-expanded", String(abierto));
        opciones.inert = !abierto;
        contacto.inert = !abierto;
        if (!window.gsap || sinMovimiento) { nav.classList.toggle("menu--abierto", abierto); return; }
        gsap.killTweensOf(items);
        nav.classList.add("menu--animando");          // sin transiciones CSS mientras manda GSAP
        const dur = (abierto ? AM.duracion || 1100 : AM.duracionCerrar || 550) / 1000;
        const esc = (AM.escalon ?? 90) / 1000;
        if (abierto) {
          nav.classList.add("menu--abierto");
          const desde = {
            "mascara-abajo":  { autoAlpha: 1, clipPath: "inset(0% 0% 100% 0%)", y: "-0.6em" },
            "mascara-arriba": { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0%)", y: "0.6em" },
            "fundido":        { autoAlpha: 0 },
            "subir":          { autoAlpha: 0, y: "1.2em" },
          }[AM.abrir] || { autoAlpha: 1, clipPath: "inset(0% 0% 100% 0%)", y: "-0.6em" };
          const hasta = { autoAlpha: 1, y: 0, duration: dur, stagger: esc,
            ease: AM.abrir === "fundido" ? "power2.out" : "power3.out", onComplete: acabar };
          if (desde.clipPath) hasta.clipPath = "inset(0% 0% 0% 0%)";
          gsap.fromTo(items, desde, hasta);
        } else {
          gsap.set(items, { autoAlpha: 1 });
          nav.classList.remove("menu--abierto");
          const fin = AM.cerrar === "mascara-arriba"
            ? { clipPath: "inset(0% 0% 100% 0%)", y: "-0.3em" }
            : { autoAlpha: 0, y: "-0.3em" };
          if (fin.clipPath) gsap.set(items, { clipPath: "inset(0% 0% 0% 0%)" });
          gsap.to(items, { ...fin, duration: dur, ease: "power2.inOut",
            stagger: { each: esc / 2, from: "end" }, onComplete: acabar });
        }
      };
      Comun_menu = mostrar;
      boton.addEventListener("click", () => mostrar(boton.getAttribute("aria-expanded") !== "true"));
      nav.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && boton.getAttribute("aria-expanded") === "true") {
          mostrar(false);
          boton.focus();
        }
      });
    }
    entradaNombre(nav.querySelector(".menu__nombre"));
    if (!document.title) document.title = nombre;
  }

  /* ---------- ENTRADA DEL NOMBRE (GSAP) ----------
     Las letras del nombre entran una detrás de otra dentro de una máscara.
     Efecto, cuándo y tiempos: ajustes.js → animaciones.nombre (o el gestor,
     pestaña Cabecera). Al acabar, el nombre vuelve a ser texto normal. */
  let Comun_menu = null;
  function entradaNombre(el, forzar = false) {
    const AN = (A.animaciones && A.animaciones.nombre) || {};
    const efecto = AN.efecto || "subir";
    if (!el || efecto === "ninguno" || !window.gsap) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!forzar) {
      const cuando = AN.cuando || "inicio";
      if (cuando === "inicio" && pagina !== "inicio") return;
      if (cuando === "visita") {
        let visto = false;
        try { visto = sessionStorage.getItem("nombre-visto") === "1"; sessionStorage.setItem("nombre-visto", "1"); } catch (e) { /* sin memoria: se anima */ }
        if (visto) return;
      }
    }
    const texto = el.dataset.texto || el.textContent;
    el.dataset.texto = texto;
    gsap.killTweensOf(el.querySelectorAll(".nombre__letra"));
    el.innerHTML = `<span class="nombre__mascara">${[...texto].map((ch) =>
      ch === " " ? " " : `<span class="nombre__letra">${htmlSeguro(ch)}</span>`).join("")}</span>`;
    el.setAttribute("aria-label", texto);
    el.dataset.difVivo = "1";                       // las letras se mueven: el contraste las sigue
    const letras = el.querySelectorAll(".nombre__letra");
    const desde = { subir: { yPercent: 115 }, bajar: { yPercent: -115 }, fundido: { autoAlpha: 0 } }[efecto] || { yPercent: 115 };
    gsap.fromTo(letras, desde, {
      yPercent: 0, autoAlpha: 1,
      duration: (AN.duracion || 1200) / 1000,
      ease: efecto === "fundido" ? "power2.out" : "power4.out",
      stagger: (AN.escalon ?? 35) / 1000,
      delay: forzar ? 0.1 : (AN.retraso ?? 500) / 1000,
      onComplete: () => { el.textContent = texto; delete el.dataset.texto; el.removeAttribute("aria-label"); delete el.dataset.difVivo; },
    });
  }

  /* ---------- EFECTOS GUARDADOS EN EL GESTOR ----------
     El gestor (pestaña Cabecera) guarda en contenido/about/info.txt las
     animaciones y el color de las letras; aquí mandan sobre ajustes.js. */
  function aplicarEfectos(c) {
    const n = (v, min, max) => { const x = Number(v); return Number.isFinite(x) && x >= min && x <= max ? x : undefined; };
    const fijar = (obj, clave, v) => { if (v !== undefined && v !== "") obj[clave] = v; };
    A.animaciones = A.animaciones || {};
    const AN = (A.animaciones.nombre = A.animaciones.nombre || {});
    fijar(AN, "efecto", ["subir", "bajar", "fundido", "ninguno"].includes(c.anim_nombre) ? c.anim_nombre : undefined);
    fijar(AN, "cuando", ["inicio", "visita", "siempre"].includes(c.anim_nombre_cuando) ? c.anim_nombre_cuando : undefined);
    fijar(AN, "duracion", n(c.anim_nombre_duracion, 100, 5000));
    fijar(AN, "escalon", n(c.anim_nombre_escalon, 0, 500));
    fijar(AN, "retraso", n(c.anim_nombre_retraso, 0, 5000));
    const AM = (A.animaciones.menu = A.animaciones.menu || {});
    fijar(AM, "abrir", ["mascara-abajo", "mascara-arriba", "fundido", "subir"].includes(c.anim_menu_abrir) ? c.anim_menu_abrir : undefined);
    fijar(AM, "cerrar", ["fundido", "mascara-arriba"].includes(c.anim_menu_cerrar) ? c.anim_menu_cerrar : undefined);
    fijar(AM, "duracion", n(c.anim_menu_duracion, 100, 5000));
    fijar(AM, "escalon", n(c.anim_menu_escalon, 0, 1000));
    fijar(AM, "duracionCerrar", n(c.anim_menu_cerrar_duracion, 100, 5000));
    A.diferencia = A.diferencia || {};
    fijar(A.diferencia, "umbral", n(c.contraste_umbral, 0.05, 0.95));
    fijar(A.diferencia, "decidir", ["letra", "palabra", "texto"].includes(c.contraste_por) ? c.contraste_por : undefined);
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

  /* La cabecera se ajusta desde la pestaña Cabecera del gestor. Los valores
     se guardan en contenido/about/info.txt junto al nombre visible. */
  function aplicarNombre() {
    const info = Web.leerInfo((window.CONTENIDO && window.CONTENIDO.about && window.CONTENIDO.about.info) || "");
    aplicarEfectos(info);
    const root = document.documentElement;
    const familias = {
      garet: '"Garet", Arial, sans-serif',
      arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
      instrument: '"Instrument Serif", "Times New Roman", serif',
      personalizada: '"Idoia personalizada", "Garet", Arial, sans-serif',
    };
    const archivo = info.nombre_fuente_archivo || "";
    if (/^idoia-custom\.(woff2?|otf|ttf)$/.test(archivo)) {
      const formato = archivo.endsWith("woff2") ? "woff2" : archivo.endsWith("woff") ? "woff" : archivo.endsWith("otf") ? "opentype" : "truetype";
      const style = document.createElement("style");
      style.textContent = `@font-face{font-family:"Idoia personalizada";src:url("assets/fonts/${archivo}") format("${formato}");font-style:normal;font-weight:400;font-display:swap}`;
      document.head.append(style);
    }
    const familia = familias[info.nombre_fuente];
    if (familia && (info.nombre_fuente !== "personalizada" || archivo)) root.style.setProperty("--nombre-fuente", familia);
    for (const [clave, variable, minimo, maximo] of [
      ["nombre_tamano", "--nombre-tam", 12, 48],
      ["nombre_tamano_movil", "--nombre-tam-movil", 12, 36],
    ]) {
      const n = Number(info[clave]);
      if (Number.isFinite(n) && n >= minimo && n <= maximo) root.style.setProperty(variable, n + "px");
    }
    const espaciado = Number(info.nombre_espaciado);
    if (Number.isFinite(espaciado) && espaciado >= -0.05 && espaciado <= 0.4)
      root.style.setProperty("--nombre-espaciado", espaciado + "em");
    if (["400", "700", "900"].includes(info.nombre_peso)) root.style.setProperty("--nombre-negrita", info.nombre_peso);
    if (/^(si|no)$/.test(info.nombre_cursiva || ""))
      root.style.setProperty("--nombre-cursiva", info.nombre_cursiva === "si" ? "italic" : "normal");
    if (/^(si|no)$/.test(info.nombre_mayusculas || ""))
      root.style.setProperty("--nombre-transform", info.nombre_mayusculas === "si" ? "uppercase" : "none");
  }

  aplicarNombre();
  pintarMenu();
  montarCortina();


  window.Comun = { autoScroll, visor, aparecer, letras, azar, irA, embed, reproductor, ficha,
    aplicarEfectos,                                   // (gestor) aplicar efectos en directo
    animarNombre: () => entradaNombre(document.querySelector(".menu__nombre"), true),
    menu: (abierto) => Comun_menu && Comun_menu(abierto) };
})();
