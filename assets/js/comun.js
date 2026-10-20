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
  const PAGINAS_CON_LOGO = ["work", "films", "series", "comercials", "videoclips", "proyecto"];

  /* ---------- MENÚ ----------
     INICIO      arriba en el centro: NOMBRE · production designer · work
                 work despliega films, series, commercials y archive en el centro;
                 contact aparece abajo. No hay enlaces laterales.
     SECCIONES   en Films, Series y Commercials: NOMBRE arriba y, debajo,
                 la sección actual centrada entre enlaces a las otras dos.
                 Work y Videoclips conservan solo el nombre de su sección.
     CONTACT     NOMBRE y debajo "work" (para volver a la lista de todo)
     PROYECTO    arriba en el centro: NOMBRE y categoría enlazada a su parrilla
     Textos y secciones: assets/js/ajustes.js (AJUSTES.secciones / .textos) */
  function pintarMenu() {
    const nombre = (Web.about && Web.about.nombre) || "Idoia Esteban Galván";
    const seccion = A.secciones.find((s) => s.id === pagina);
    const donde = pagina === "work" ? A.textos.work : seccion ? seccion.titulo : "";
    const categoriaProyecto = pagina === "proyecto"
      ? A.secciones.find((s) => s.id === new URLSearchParams(location.search).get("tipo")) || A.secciones[0]
      : null;
    // máscara de cada opción de WORK: el texto entra por dentro (overflow: hidden)
    const mascara = (t) => `<span class="opcion-mascara"><span class="opcion-texto">${htmlSeguro(t)}</span></span>`;
    const enlaceSeccion = (s, clase = "menu__seccion") =>
      `<a class="${clase} menu__${s.id}" href="${s.pagina}">${htmlSeguro(s.titulo)}</a>`;
    const principales = ["films", "series", "comercials"];
    const otrasParrillas = principales.includes(pagina)
      ? A.secciones.filter((s) => principales.includes(s.id) && s.id !== pagina)
      : [];
    const categoriasParrilla = otrasParrillas.length === 2
      ? `<div class="menu__categorias">
          ${enlaceSeccion(otrasParrillas[0], "menu__categoria-lateral")}
          <span class="menu__donde" aria-current="page">${htmlSeguro(donde)}</span>
          ${enlaceSeccion(otrasParrillas[1], "menu__categoria-lateral")}
        </div>`
      : "";

    let dentro;
    if (pagina === "inicio") {
      dentro = `
      <div class="menu__centro">
        <a class="menu__nombre" href="index.html">${htmlSeguro(nombre)}</a>
        ${A.textos.labor ? `<span class="menu__labor">${htmlSeguro(A.textos.labor)}</span>` : ""}
        <button class="menu__work" type="button" aria-expanded="false" aria-controls="menu-inicio-opciones">${htmlSeguro(A.textos.work)}</button>
      </div>
      <div class="menu__opciones menu__plegable" id="menu-inicio-opciones" inert>
        ${A.secciones.filter((s) => ["films", "series", "comercials"].includes(s.id)).map((s) =>
          `<a class="menu__seccion menu__${s.id}" href="${s.pagina}">${mascara(s.titulo)}</a>`).join("")}
        <a class="menu__archivo" href="work.html">${mascara("Archive")}</a>
      </div>
      <div class="menu__pie">
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
        ${PAGINAS_CON_LOGO.includes(pagina)
          ? `<a class="menu__nombre menu__nombre--logo" href="index.html" data-dif-no="1"><img class="menu__logo" src="assets/img/idoia-logo.svg" alt="${htmlSeguro(nombre)}" width="2499" height="256" fetchpriority="high"></a>`
          : `<a class="menu__nombre" href="index.html">${htmlSeguro(nombre)}</a>`}
        ${categoriaProyecto
          ? `<a class="menu__donde" href="${htmlSeguro(categoriaProyecto.pagina)}">${htmlSeguro(categoriaProyecto.titulo)}</a>`
          : categoriasParrilla || (donde ? `<span class="menu__donde">${htmlSeguro(donde)}</span>` : "")}
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
      // WORK (GSAP). Efectos y tiempos: ajustes.js → animaciones.menu
      // (o el gestor, pestaña Cabecera, que manda sobre ajustes.js)
      const items = [...opciones.children];   // (Contact va aparte: siempre fijo y visible)
      const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const textos = items.map((a) => a.querySelector(".opcion-texto")).filter(Boolean);
      const acabar = () => { gsap.set(items.concat(textos), { clearProps: "all" }); nav.classList.remove("menu--animando"); delete nav.dataset.difVivo; };
      const mostrar = (abierto) => {
        const AM = (A.animaciones && A.animaciones.menu) || {};
        boton.setAttribute("aria-expanded", String(abierto));
        opciones.inert = !abierto;
        if (!window.gsap || sinMovimiento) { nav.classList.toggle("menu--abierto", abierto); return; }
        gsap.killTweensOf(items.concat(textos));
        nav.classList.add("menu--animando");          // sin transiciones CSS mientras manda GSAP
        nav.dataset.difVivo = "1";                    // las letras se mueven: el contraste las sigue
        const esc = (AM.escalon ?? 100) / 1000;
        if (abierto) {
          // MASK REVEAL: cada texto entra por dentro de su máscara (overflow: hidden),
          // de arriba abajo (yPercent -115 → 0), una opción detrás de otra
          nav.classList.add("menu--abierto");
          gsap.set(items, { autoAlpha: 1, filter: "none" });
          const desde = AM.abrir === "mascara-arriba" ? { yPercent: 115 }
            : AM.abrir === "fundido" ? { autoAlpha: 0 } : { yPercent: -115 };
          gsap.fromTo(textos, desde, { yPercent: 0, autoAlpha: 1,
            duration: (AM.duracion || 1000) / 1000, ease: AM.abrir === "fundido" ? "power2.out" : "power4.out",
            stagger: esc, onComplete: acabar });
        } else {
          // al cerrar: se difuminan (fundido + desenfoque suave), de la última a la primera
          gsap.set(items, { autoAlpha: 1 });
          nav.classList.remove("menu--abierto");
          const fin = AM.cerrar === "fundido" ? { autoAlpha: 0 } : { autoAlpha: 0, filter: "blur(6px)" };
          gsap.to(items, { ...fin, duration: (AM.duracionCerrar || 600) / 1000, ease: "power2.inOut",
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
    if (!el || el.classList.contains("menu__nombre--logo") || efecto === "ninguno" || !window.gsap) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((AN.nunca || ["contact"]).includes(pagina)) return;   // en Contact el nombre es texto fijo, sin animación
    if (!forzar) {
      const cuando = AN.cuando || "inicio";
      if (cuando === "inicio" && pagina !== "inicio") return;
      if (cuando === "visita") {
        let visto = false;
        try { visto = sessionStorage.getItem("nombre-visto") === "1"; sessionStorage.setItem("nombre-visto", "1"); } catch (e) { /* sin memoria: se anima */ }
        if (visto) return;
      }
    }
    // MASK REVEAL vertical: <span class="title-mask"> (overflow: hidden) es la
    // máscara; dentro, <span class="title"> sube de yPercent 115 a 0.
    // Solo se anima transform (yPercent); no cambia el tamaño ni el sitio
    // del encabezado, y al acabar se borra el transform (posición exacta).
    let titulo = el.querySelector(".title");
    if (!titulo) {
      const texto = el.textContent;
      el.innerHTML = `<span class="title-mask"><span class="title">${htmlSeguro(texto)}</span></span>`;
      titulo = el.querySelector(".title");
    }
    gsap.killTweensOf(titulo);
    el.dataset.difVivo = "1";                       // el texto se mueve: el contraste lo sigue
    const desde = efecto === "bajar" ? { yPercent: -115 } : efecto === "fundido" ? { autoAlpha: 0 } : { yPercent: 115 };
    gsap.fromTo(titulo, desde, {
      yPercent: 0, autoAlpha: 1,
      duration: (AN.duracion || 1000) / 1000,
      ease: efecto === "fundido" ? "power2.out" : "power4.out",
      delay: forzar ? 0.1 : (AN.retraso ?? 500) / 1000,
      onComplete: () => { gsap.set(titulo, { clearProps: "transform,opacity,visibility" }); delete el.dataset.difVivo; },
    });
  }

  /* ---------- FRANJA FIJA DE ENLACES ----------
     Al final de las parrillas y proyectos, centrada y sin el enlace a
     la sección actual. Sus colores y tipografía se editan en el gestor. */
  function franja(actual) {
    const F = A.franja || {};
    if (F.activo === false) return null;
    const categorias = actual === null ? ["films", "series"] : ["films", "series", "comercials"];
    const enlaces = A.secciones.filter((s) => categorias.includes(s.id) && s.id !== actual);
    const izquierda = enlaces.length > 2 ? enlaces.slice(0, 2) : enlaces.slice(0, 1);
    const derecha = enlaces.length > 2 ? enlaces.slice(2) : enlaces.slice(1);
    const pintar = (lista) => lista.map((s) => `<a href="${s.pagina}">${htmlSeguro(s.titulo)}</a>`).join("");
    const el = document.createElement("nav");
    el.className = "franja";
    el.setAttribute("aria-label", "Otras secciones");
    el.innerHTML = `<span class="franja__lado franja__lado--izquierdo">${pintar(izquierda)}</span>`
      + `<a class="franja__contacto" href="contact.html">${htmlSeguro(A.textos.contacto)}</a>`
      + `<span class="franja__lado franja__lado--derecho">${pintar(derecha)}</span>`;
    return el;
  }

  /* ---------- EFECTOS GUARDADOS EN EL GESTOR ----------
     El gestor (pestaña Cabecera) guarda en contenido/about/info.txt las
     animaciones y el color de las letras; aquí mandan sobre ajustes.js. */
  // Tipografías que se pueden elegir en el gestor (nombre y texto de las parrillas)
  const FAMILIAS = {
    garet: '"Garet", Arial, sans-serif',
    "garet-heavy": '"Garet Heavy", "Garet", Arial, sans-serif',
    arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    instrument: '"Instrument Serif", "Times New Roman", serif',
    "instrument-sans": '"Instrument Sans", Arial, sans-serif',
    personalizada: '"Idoia personalizada", "Garet", Arial, sans-serif',
  };
  /* ---------- TIPOGRAFÍAS SUBIDAS AL REPO ----------
     El gestor (pestaña Tipografías) las sube a assets/fonts/ y las apunta
     en contenido/about/info.txt, una línea por tipografía:
         fuente: Nombre que se ve | archivo.woff2
     Aquí se cargan y se añaden a la lista de tipografías elegibles. */
  const slugFuente = (t) => "fuente-" + t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function registrarFuentes(c, pendientes = []) {
    const lineas = String(c.fuente || "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((l) => l[0] && l[1]);
    const todas = lineas.map(([nombre, archivo]) => ({ nombre, url: "assets/fonts/" + encodeURIComponent(archivo), archivo }))
      .concat(pendientes);
    let style = document.getElementById("fuentes-subidas");
    if (!style) { style = document.createElement("style"); style.id = "fuentes-subidas"; document.head.append(style); }
    style.textContent = todas.map((f) => {
      const ext = (f.archivo || "").split(".").pop().toLowerCase();
      const formato = { woff2: "woff2", woff: "woff", otf: "opentype", ttf: "truetype" }[ext] || "woff2";
      FAMILIAS[slugFuente(f.nombre)] = `"${f.nombre.replace(/"/g, "")}", Arial, sans-serif`;
      return `@font-face{font-family:"${f.nombre.replace(/"/g, "")}";src:url("${f.url}") format("${formato}");font-display:swap}`;
    }).join("\n");
  }
  const estilo = (v) => (v === "si" ? "italic" : v === "no" ? "normal" : undefined);
  const mayus = (v) => (v === "si" ? "uppercase" : v === "no" ? "none" : undefined);
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
    fijar(AM, "abrir", ["mascara-abajo", "mascara-arriba", "fundido"].includes(c.anim_menu_abrir) ? c.anim_menu_abrir : undefined);
    fijar(AM, "cerrar", ["difuminar", "fundido"].includes(c.anim_menu_cerrar) ? c.anim_menu_cerrar : undefined);
    fijar(AM, "duracion", n(c.anim_menu_duracion, 100, 5000));
    fijar(AM, "escalon", n(c.anim_menu_escalon, 0, 1000));
    fijar(AM, "duracionCerrar", n(c.anim_menu_cerrar_duracion, 100, 5000));
    // PARRILLAS: línea entre fotos y texto de cada recuadro (variables CSS)
    const root = document.documentElement;
    const hilo = n(c.parrilla_hilo, 0, 40);
    if (hilo !== undefined) root.style.setProperty("--hilo", hilo + "px");
    if (/^#[0-9a-f]{3,8}$/i.test(c.parrilla_hilo_color || "")) root.style.setProperty("--hilo-color", c.parrilla_hilo_color);
    const tamTexto = n(c.parrilla_texto_tamano, 8, 32);
    if (tamTexto !== undefined) root.style.setProperty("--cartel-texto-tam", tamTexto + "px");
    if (FAMILIAS[c.parrilla_texto_fuente]) root.style.setProperty("--cartel-texto-fuente", FAMILIAS[c.parrilla_texto_fuente]);
    // Todos los títulos de trabajos: inicio, parrillas, fichas y Contact.
    const tamTitulo = n(c.titulo_tamano, 12, 48);
    if (tamTitulo !== undefined) root.style.setProperty("--titulo-tam", tamTitulo + "px");
    if (FAMILIAS[c.titulo_fuente]) root.style.setProperty("--titulo-fuente", FAMILIAS[c.titulo_fuente]);
    if (["400", "500", "700", "900"].includes(c.titulo_peso)) root.style.setProperty("--titulo-peso", c.titulo_peso);
    if (/^(si|no)$/.test(c.titulo_cursiva || "")) root.style.setProperty("--titulo-estilo", c.titulo_cursiva === "si" ? "italic" : "normal");
    const espTitulo = n(c.titulo_espaciado, -0.05, 0.3);
    if (espTitulo !== undefined) root.style.setProperty("--titulo-espaciado", espTitulo + "em");
    // Franja de enlaces al final de parrillas y proyectos
    A.franja = A.franja || {};
    // Ajuste nuevo: la franja fija empieza visible aunque la anterior,
    // animada, estuviera desactivada en una versión antigua.
    A.franja.activo = c.franja_fija !== "no";
    if (/^#[0-9a-f]{3,8}$/i.test(c.franja_fondo || "")) root.style.setProperty("--franja-fondo", c.franja_fondo);
    if (/^#[0-9a-f]{3,8}$/i.test(c.franja_color || "")) root.style.setProperty("--franja-color", c.franja_color);
    const tamF = n(c.franja_tamano, 8, 60);
    if (tamF !== undefined) root.style.setProperty("--franja-tam", tamF + "px");
    if (FAMILIAS[c.franja_fuente]) root.style.setProperty("--franja-fuente", FAMILIAS[c.franja_fuente]);
    document.querySelectorAll(".franja").forEach((f) => { f.hidden = A.franja.activo === false; });
    // Texto de los recuadros: grosor, cursiva, mayúsculas
    const fijarVar = (v, val) => { if (val !== undefined && val !== "") root.style.setProperty(v, val); };
    fijarVar("--cartel-texto-peso", ["400", "500", "700", "900"].includes(c.parrilla_texto_peso) ? c.parrilla_texto_peso : undefined);
    fijarVar("--cartel-texto-estilo", estilo(c.parrilla_texto_cursiva));
    fijarVar("--cartel-texto-transform", mayus(c.parrilla_texto_mayusculas));
    // Menú (production designer, work, films…): tipografía, tamaño, grosor, cursiva, mayúsculas
    if (FAMILIAS[c.menu_fuente]) root.style.setProperty("--fuente-menu", FAMILIAS[c.menu_fuente]);
    const tamMenu = n(c.menu_tamano, 8, 30);
    if (tamMenu !== undefined) root.style.setProperty("--menu-tam", tamMenu + "px");
    fijarVar("--menu-peso", ["400", "500", "700", "900"].includes(c.menu_peso) ? c.menu_peso : undefined);
    fijarVar("--menu-estilo", estilo(c.menu_cursiva));
    fijarVar("--menu-transform", mayus(c.menu_mayusculas));
    A.diferencia = A.diferencia || {};
    fijar(A.diferencia, "umbral", n(c.contraste_umbral, 0.05, 0.95));
    fijar(A.diferencia, "decidir", ["pixel", "letra", "palabra", "texto"].includes(c.contraste_por) ? c.contraste_por : undefined);
    fijar(A.diferencia, "grano", n(c.contraste_grano, 0, 6));
    fijar(A.diferencia, "claro", /^#[0-9a-f]{6}$/i.test(c.color_letra_claro || "") ? c.color_letra_claro : undefined);
    fijar(A.diferencia, "oscuro", /^#[0-9a-f]{6}$/i.test(c.color_letra_oscuro || "") ? c.color_letra_oscuro : undefined);
    if (A.diferencia.claro) root.style.setProperty("--dif-letra", A.diferencia.claro);   // (y el texto sin efecto)
    // DELFINES (gestor → pestaña Delfines). Lo usa assets/js/delfines.js
    const D = (A.delfines = A.delfines || {});
    if (/^(si|no)$/.test(c.delfines_inicio || "")) D.inicio = c.delfines_inicio === "si";
    if (/^(si|no)$/.test(c.delfines_contact || "")) D.contact = c.delfines_contact === "si";
    const CUANDO = ["entrar", "pulsar", "las-dos"];
    fijar(D, "cuandoInicio", CUANDO.includes(c.delfines_cuando_inicio) ? c.delfines_cuando_inicio : undefined);
    fijar(D, "cuandoContact", CUANDO.includes(c.delfines_cuando_contact) ? c.delfines_cuando_contact : undefined);
    D.imagen = /^[\w.-]+\.(png|webp|gif)$/i.test(c.delfines_imagen || "") ? "assets/img/broma/" + c.delfines_imagen : "assets/img/delfin.png";
    fijar(D, "espera", n(c.delfines_espera, 0, 10000));
    fijar(D, "duracion", n(c.delfines_duracion, 0.25, 15));
    fijar(D, "quedarse", n(c.delfines_quedarse, 0, 60));
    fijar(D, "cantidad", n(c.delfines_cantidad, 5, 300));
    fijar(D, "tamano", n(c.delfines_tamano, 15, 300));
    fijar(D, "potencia", n(c.delfines_potencia, 0, 2000));
    fijar(D, "angulo", n(c.delfines_angulo, -90, 90));
    fijar(D, "apertura", n(c.delfines_apertura, 0, 90));
    fijar(D, "giro", n(c.delfines_giro, 0, 1500));
    fijar(D, "gravedad", n(c.delfines_gravedad, 50, 2000));
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
     Acepta enlaces, varios "video:" en info.txt o códigos iframe pegados.
     Vimeo conserva el h= de los vídeos no listados y muestra sus controles. */
  const P = () => (A.proyecto || {});
  function fuentesVideo(valor) {
    const texto = String(valor || "").trim();
    if (!texto) return [];
    const iframes = [...texto.matchAll(/<iframe\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gis)]
      .map((m) => m[2].replace(/&amp;/g, "&"));
    return iframes.length ? iframes : texto.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  function embed(url) {
    if (!url) return "";
    const a = P().autoplay ? 1 : 0, s = P().silencio ? 1 : 0, c = P().controles === false ? 0 : 1;
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1&controls=${c}` +
      `&autoplay=${a}&mute=${s}${P().bucle ? `&loop=1&playlist=${m[1]}` : ""}`;
    try {
      const u = new URL(url);
      if (/^(?:player\.)?vimeo\.com$/i.test(u.hostname) || u.hostname === "www.vimeo.com") {
        m = u.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-z0-9]+))?/i);
        if (m) {
          const destino = new URL(`https://player.vimeo.com/video/${m[1]}`);
          const h = u.searchParams.get("h") || m[2];
          if (h) destino.searchParams.set("h", h);
          Object.entries({ dnt: 1, title: 0, byline: 0, portrait: 0, autoplay: a, muted: s, controls: c, playsinline: 1, unmute_button: 0 })
            .forEach(([k, v]) => destino.searchParams.set(k, String(v)));
          if (P().bucle) destino.searchParams.set("loop", "1");
          return destino.href;
        }
      }
    } catch (e) { /* otras direcciones de vídeo se dejan tal cual */ }
    return "";
  }
  const esArchivoVideo = (u) => /\.(mp4|webm|ogv|m4v|mov)(\?|#|$)/i.test(u);
  function reproductor(url, titulo = "", opciones = {}) {
    const fuente = fuentesVideo(url)[0];
    if (!fuente) return "";
    if (esArchivoVideo(fuente)) {
      const bucle = opciones.bucle === undefined ? P().bucle : opciones.bucle;
      return `<video src="${htmlSeguro(fuente)}" playsinline preload="metadata"
        ${P().autoplay ? "autoplay" : ""} ${P().silencio ? "muted" : ""} ${bucle ? "loop" : ""}
        ${opciones.controlesPropios || P().controles === false ? "" : "controls"}></video>`;
    }
    const src = embed(fuente) || fuente;
    if (!/^https?:\/\//i.test(src)) return "";
    return `<iframe src="${htmlSeguro(src)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="${htmlSeguro(titulo)}"></iframe>`;
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
  /* ---------- CABECERA: nombre (texto, tipografía, tamaños) ----------
     Valores de contenido/about/info.txt (los guarda el gestor). La misma
     función la usa la vista previa del gestor, en directo. */
  function aplicarCabecera(info, fuenteUrl) {
    const root = document.documentElement;
    const archivo = info.nombre_fuente_archivo || "";
    if (/^idoia-custom\.(woff2?|otf|ttf)$/.test(archivo)) {
      const formato = archivo.endsWith("woff2") ? "woff2" : archivo.endsWith("woff") ? "woff" : archivo.endsWith("otf") ? "opentype" : "truetype";
      let style = document.getElementById("fuente-personalizada");
      if (!style) { style = document.createElement("style"); style.id = "fuente-personalizada"; document.head.append(style); }
      style.textContent = `@font-face{font-family:"Idoia personalizada";src:url("${fuenteUrl || "assets/fonts/" + archivo}") format("${formato}");font-style:normal;font-weight:400;font-display:swap}`;
    }
    const familia = FAMILIAS[info.nombre_fuente];
    if (familia && (info.nombre_fuente !== "personalizada" || archivo)) root.style.setProperty("--nombre-fuente", familia);
    for (const [clave, variable, minimo, maximo] of [
      ["nombre_tamano", "--nombre-tam", 12, 48],
      ["nombre_tamano_movil", "--nombre-tam-movil", 12, 36],
    ]) {
      const n = Number(info[clave]);
      if (Number.isFinite(n) && n >= minimo && n <= maximo) root.style.setProperty(variable, n + "px");
    }
    const espaciado = Number(info.nombre_espaciado);
    if (info.nombre_espaciado !== undefined && Number.isFinite(espaciado) && espaciado >= -0.05 && espaciado <= 0.4)
      root.style.setProperty("--nombre-espaciado", espaciado + "em");
    if (["400", "700", "900"].includes(info.nombre_peso)) root.style.setProperty("--nombre-negrita", info.nombre_peso);
    if (/^(si|no)$/.test(info.nombre_cursiva || ""))
      root.style.setProperty("--nombre-cursiva", info.nombre_cursiva === "si" ? "italic" : "normal");
    if (/^(si|no)$/.test(info.nombre_mayusculas || ""))
      root.style.setProperty("--nombre-transform", info.nombre_mayusculas === "si" ? "uppercase" : "none");
    // texto del nombre (si ya está pintado y no se está animando)
    const el = document.querySelector(".menu__nombre");
    const t = el && !el.classList.contains("menu__nombre--logo") ? el.querySelector(".title") || el : null;
    if (t && info.nombre && !(el && el.dataset.difVivo) && t.textContent !== info.nombre) t.textContent = info.nombre;
  }
  function aplicarNombre() {
    const info = Web.leerInfo((window.CONTENIDO && window.CONTENIDO.about && window.CONTENIDO.about.info) || "");
    registrarFuentes(info);
    aplicarEfectos(info);
    aplicarCabecera(info);
  }

  /* ---------- VISTA PREVIA DEL GESTOR ----------
     El gestor manda los ajustes por mensaje (funciona aunque el gestor
     esté abierto desde el ordenador y la vista previa sea la web publicada). */
  if (/[?&]vista=gestor/.test(location.search)) {
    window.addEventListener("message", (e) => {
      const d = e.data || {};
      if (d.tipo !== "gestor") return;
      if (d.campos) { registrarFuentes(d.campos, d.fuentesNuevas || []); aplicarEfectos(d.campos); aplicarCabecera(d.campos, d.fuenteUrl); }
      if (d.imagenDelfin && A.delfines) A.delfines.imagen = d.imagenDelfin;   // PNG aún sin publicar
      if (d.accion === "nombre") entradaNombre(document.querySelector(".menu__nombre"), true);
      if (d.accion === "delfines" && window.Delfines) window.Delfines.lanzar(true);
      if (d.accion === "menu" && Comun_menu) {
        const b = document.querySelector(".menu__work");
        Comun_menu(!(b && b.getAttribute("aria-expanded") === "true"));
      }
    });
  }

  aplicarNombre();
  pintarMenu();
  montarCortina();


  window.Comun = { autoScroll, visor, aparecer, letras, azar, irA, embed, reproductor, fuentesVideo, ficha,
    aplicarEfectos,                                   // (gestor) aplicar efectos en directo
    franja,
    animarNombre: () => entradaNombre(document.querySelector(".menu__nombre"), true),
    menu: (abierto) => Comun_menu && Comun_menu(abierto) };
})();
