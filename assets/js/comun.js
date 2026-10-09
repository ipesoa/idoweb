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
    // máscara de cada opción de WORK: el texto entra por dentro (overflow: hidden)
    const mascara = (t) => `<span class="opcion-mascara"><span class="opcion-texto">${htmlSeguro(t)}</span></span>`;
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
    if (!el || efecto === "ninguno" || !window.gsap) return;
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

  /* ---------- FRANJA CON ENLACES EN MOVIMIENTO ----------
     Al final de las parrillas y de cada proyecto: una franja del alto de
     la letra con las otras secciones + Contact, que pasa sola de derecha
     a izquierda (se para al poner el ratón encima). En Series salen
     Films · Commercials · Contact; en Films, Series · Commercials · Contact…
     Se pone y se quita, y se cambian colores, tamaño y velocidad, en el
     gestor (pestaña Parrillas). */
  function franja(actual) {
    const F = A.franja || {};
    if (F.activo === false) return null;
    const enlaces = A.secciones.filter((s) => ["films", "series", "comercials"].includes(s.id) && s.id !== actual)
      .map((s) => [s.titulo, s.pagina]).concat([[A.textos.contacto, "contact.html"]]);
    const sep = `<span class="franja__sep" aria-hidden="true">${htmlSeguro(F.separador || "·")}</span>`;
    const grupo = enlaces.map(([t, h]) => `<a href="${h}">${htmlSeguro(t)}</a>`).join(sep) + sep;
    const el = document.createElement("nav");
    el.className = "franja";
    el.setAttribute("aria-label", "Otras secciones");
    el.innerHTML = `<div class="franja__pista"><div class="franja__mitad">${grupo}</div></div>`;
    // se repite el grupo hasta llenar la pantalla y se duplica la mitad: así
    // el movimiento es continuo, sin saltos
    const ajustar = () => {
      const pista = el.querySelector(".franja__pista");
      const mitad = pista.querySelector(".franja__mitad");
      mitad.innerHTML = grupo;
      let n = 1;
      while (mitad.scrollWidth < innerWidth * 1.2 && n < 30) { mitad.insertAdjacentHTML("beforeend", grupo); n++; }
      pista.querySelectorAll(".franja__mitad[aria-hidden]").forEach((m) => m.remove());
      const copia = mitad.cloneNode(true); copia.setAttribute("aria-hidden", "true");
      copia.querySelectorAll("a").forEach((a) => a.tabIndex = -1);
      pista.append(copia);
      const vel = Number((A.franja || {}).velocidad) || 60;     // píxeles por segundo
      pista.style.setProperty("--franja-duracion", (mitad.scrollWidth / vel).toFixed(2) + "s");
    };
    requestAnimationFrame(ajustar);
    window.addEventListener("resize", ajustar);
    el.ajustar = ajustar;
    return el;
  }

  /* ---------- RECTÁNGULO DETRÁS DEL NOMBRE (parrillas) ----------
     En Work, Films, Series… el nombre puede ir sobre un rectángulo negro
     al ras de las letras. Se pone y se quita en el gestor (Parrillas).
     Con el rectángulo, el nombre es siempre blanco (no usa el contraste). */
  const PAGINAS_PARRILLA = ["work", "films", "series", "comercials", "videoclips", "proyecto"];
  function cajaNombre() {
    const el = document.querySelector(".menu__nombre");
    if (!el || !PAGINAS_PARRILLA.includes(pagina)) return;
    const activa = !!A.nombreCaja;
    let caja = el.querySelector(".nombre__caja");
    if (activa && !caja) { el.innerHTML = `<span class="nombre__caja">${htmlSeguro(el.textContent)}</span>`; }
    else if (!activa && caja) { el.textContent = caja.textContent; }
    if (activa) el.dataset.difNo = "1"; else delete el.dataset.difNo;
    if (activa) medirCaja();
  }
  // Mide dónde están de verdad las letras (con la tipografía cargada) para
  // que el rectángulo vaya al ras: altura de las mayúsculas + el margen.
  const lienzoMedir = document.createElement("canvas").getContext("2d");
  function medirCaja() {
    const caja = document.querySelector(".nombre__caja");
    if (!caja || !caja.firstChild) return;
    const cs = getComputedStyle(caja);
    const margen = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nombre-caja-margen")) || 3;
    lienzoMedir.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    let texto = caja.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (cs.textTransform === "uppercase") texto = texto.toUpperCase();
    const m = lienzoMedir.measureText(texto);
    const r = document.createRange(); r.selectNodeContents(caja);
    const lineas = r.getBoundingClientRect(), b = caja.getBoundingClientRect();
    const asc = m.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * 0.9;
    const base = lineas.top - b.top + asc;                      // línea de base dentro de la caja
    const arriba = base - m.actualBoundingBoxAscent - margen;   // parte de arriba de las mayúsculas
    const abajo = base + Math.max(0, m.actualBoundingBoxDescent) + margen;
    const izq = lineas.left - b.left - margen, der = b.right - lineas.right - margen;
    // TILDES (la Á de GALVÁN): sobresalen por encima de las mayúsculas.
    //   "trocito" (por defecto): el rectángulo sigue al ras y solo encima de
    //             cada letra con tilde sube un trocito que la cubre
    //   "entera":  todo el rectángulo sube hasta la altura de la tilde
    const modo = A.nombreCajaTilde || "trocito";
    const conTilde = [];
    const nodo = caja.firstChild;
    let real = caja.textContent; if (cs.textTransform === "uppercase") real = real.toUpperCase();
    [...real].forEach((ch, i) => { if (ch.normalize("NFD") !== ch && /[A-ZÀ-Ý]/i.test(ch.normalize("NFD")[0])) conTilde.push(i); });
    let tope = arriba;
    if (conTilde.length) tope = Math.min(arriba, base - lienzoMedir.measureText(real).actualBoundingBoxAscent - margen);
    const recortar = modo === "trocito" && conTilde.length && tope < arriba - 0.5 && nodo && nodo.nodeType === 3;
    caja.style.setProperty("--caja-t", (modo === "entera" || recortar ? tope : arriba).toFixed(1) + "px");
    caja.style.setProperty("--caja-b", (b.height - abajo).toFixed(1) + "px");
    caja.style.setProperty("--caja-l", izq.toFixed(1) + "px");
    caja.style.setProperty("--caja-r", der.toFixed(1) + "px");
    if (!recortar) { caja.style.removeProperty("--caja-recorte"); return; }
    // Recorte del rectángulo (clip-path): la parte baja entera y, arriba,
    // solo los trocitos encima de las letras con tilde. Se calcula en el
    // rectángulo SIN inclinar; al inclinarlo (skewX) los trocitos se
    // inclinan con él, igual que la cursiva.
    const ancho = b.width - izq - der, alto = b.height - (b.height - abajo) - tope;
    const tan = Math.tan((parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nombre-caja-inclinacion")) || 0) * Math.PI / 180);
    const corte = arriba - tope;                     // donde empieza el rectángulo normal
    const yBase = base - tope, cy = alto / 2;
    const puntos = [[0, corte]];
    const rr = document.createRange();
    const chars = [...nodo.data];
    let pos = 0; const offsets = chars.map((c) => { const o = pos; pos += c.length; return o; });
    conTilde.filter((i) => i < chars.length).forEach((i) => {
      rr.setStart(nodo, offsets[i]); rr.setEnd(nodo, offsets[i] + chars[i].length);
      const r = rr.getBoundingClientRect();
      // x de la letra en la línea de base → x sin inclinar (respecto al centro)
      const x1 = r.left - b.left - izq + tan * (yBase - cy) - margen;
      const x2 = r.right - b.left - izq + tan * (yBase - cy) + margen;
      puntos.push([Math.max(0, x1), corte], [Math.max(0, x1), 0], [Math.min(ancho, x2), 0], [Math.min(ancho, x2), corte]);
    });
    puntos.push([ancho, corte], [ancho, alto], [0, alto]);
    caja.style.setProperty("--caja-recorte", `polygon(${puntos.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`);
  }
  window.addEventListener("resize", () => medirCaja());
  if (document.fonts) { document.fonts.ready.then(() => medirCaja()); document.fonts.addEventListener("loadingdone", () => medirCaja()); }

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
    // Franja de enlaces al final de parrillas y proyectos
    A.franja = A.franja || {};
    if (/^(si|no)$/.test(c.franja || "")) A.franja.activo = c.franja === "si";
    const velF = n(c.franja_velocidad, 1, 400);
    if (velF !== undefined) A.franja.velocidad = velF;
    if (/^#[0-9a-f]{3,8}$/i.test(c.franja_fondo || "")) root.style.setProperty("--franja-fondo", c.franja_fondo);
    if (/^#[0-9a-f]{3,8}$/i.test(c.franja_color || "")) root.style.setProperty("--franja-color", c.franja_color);
    const tamF = n(c.franja_tamano, 8, 60);
    if (tamF !== undefined) root.style.setProperty("--franja-tam", tamF + "px");
    if (FAMILIAS[c.franja_fuente]) root.style.setProperty("--franja-fuente", FAMILIAS[c.franja_fuente]);
    document.querySelectorAll(".franja").forEach((f) => { f.hidden = A.franja.activo === false; f.ajustar && f.ajustar(); });
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
    // Rectángulo detrás del nombre en las parrillas (Work, Films, Series…)
    if (/^(si|no)$/.test(c.parrilla_nombre_caja || "")) A.nombreCaja = c.parrilla_nombre_caja === "si";
    if (/^#[0-9a-f]{3,8}$/i.test(c.parrilla_nombre_caja_color || "")) root.style.setProperty("--nombre-caja-color", c.parrilla_nombre_caja_color);
    if (/^#[0-9a-f]{3,8}$/i.test(c.parrilla_nombre_caja_letra || "")) root.style.setProperty("--nombre-caja-letra", c.parrilla_nombre_caja_letra);
    const margenCaja = n(c.parrilla_nombre_caja_margen, 0, 30);
    if (margenCaja !== undefined) root.style.setProperty("--nombre-caja-margen", margenCaja + "px");
    const incl = n(c.parrilla_nombre_caja_inclinacion, -30, 30);
    if (incl !== undefined) root.style.setProperty("--nombre-caja-inclinacion", incl + "deg");
    // Tilde de GALVÁN: con su trocito de rectángulo, o el rectángulo entero más alto
    if (["trocito", "entera"].includes(c.parrilla_nombre_caja_tilde)) A.nombreCajaTilde = c.parrilla_nombre_caja_tilde;
    cajaNombre();
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
    if (c.delfines_imagen !== undefined) D.imagen = /^[\w.-]+\.(png|webp|gif)$/i.test(c.delfines_imagen) ? "assets/img/broma/" + c.delfines_imagen : "assets/img/delfin.png";
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
    const t = el && el.querySelector(".nombre__caja, .title") || el;
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
      if (d.campos) { registrarFuentes(d.campos, d.fuentesNuevas || []); aplicarEfectos(d.campos); aplicarCabecera(d.campos, d.fuenteUrl); medirCaja(); }
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
  cajaNombre();
  montarCortina();


  window.Comun = { autoScroll, visor, aparecer, letras, azar, irA, embed, reproductor, ficha,
    aplicarEfectos,                                   // (gestor) aplicar efectos en directo
    franja,
    animarNombre: () => entradaNombre(document.querySelector(".menu__nombre"), true),
    menu: (abierto) => Comun_menu && Comun_menu(abierto) };
})();
