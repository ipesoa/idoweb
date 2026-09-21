/* =====================================================================
   PROYECTO  ·  monta la página de una película o un anuncio
   ---------------------------------------------------------------------
   Dirección:  proyecto.html?tipo=films&id=CARPETA
   1. Portada a pantalla completa con título (efecto diferencia)
   2. Mosaico: cada foto ocupa más o menos celdas según su forma
      (horizontal / vertical) y un azar fijo. Trucos en el nombre
      del archivo para forzar tamaño:
          _grande   ocupa 2/3 del ancho
          _ancha    ocupa todo el ancho
          _alta     columna estrecha y alta
          _pequena  una sola celda
   3. Bloque de texto (ficha + texto de info.txt) dentro del mosaico
   4. Enlaces a proyecto anterior / siguiente
   ===================================================================== */
(function () {
  const A = window.AJUSTES;
  const params = new URLSearchParams(location.search);
  const tipo = params.get("tipo") === "comercials" ? "comercials" : "films";
  const p = Web.proyecto(tipo, params.get("id"));
  const main = document.getElementById("proyecto");

  if (!p) {
    main.innerHTML = `<p class="no-encontrado">Este proyecto no existe o ha cambiado de nombre.<br><a href="${tipo}.html">Ver todos →</a></p>`;
    return;
  }

  document.title = `${p.titulo} · ${(Web.about && Web.about.nombre) || ""}`;
  document.querySelector(".menu__" + tipo)?.classList.add("activo");

  /* ---------- 1. PORTADA ---------- */
  const portada = document.getElementById("portada");
  const img = portada.querySelector(".portada__img");
  const vertical = window.innerHeight > window.innerWidth;
  const src = (vertical && p.portadaMovil ? p.portadaMovil : p.portada)?.url;
  portada.style.setProperty("--encuadre", p.encuadre);
  portada.querySelector(".portada__sup").textContent =
    [tipo === "films" ? "Film" : "Comercial", p.ano].filter(Boolean).join("  ·  ");
  portada.querySelector(".portada__titulo").innerHTML = Comun.letras(p.titulo, 40, 500);
  portada.querySelector(".portada__labor").textContent = p.labor;
  if (src) {
    img.onload = () => portada.classList.add("lista");
    img.src = src; img.alt = p.titulo;
    if (img.complete) portada.classList.add("lista");
  } else portada.classList.add("lista");
  portada.querySelector(".portada__bajar").addEventListener("click", () =>
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" }));

  /* ---------- 2. MOSAICO ---------- */
  const mosaico = document.getElementById("mosaico");
  const altoFila = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alto-fila")) || 0.72;
  const columnas = () => parseInt(getComputedStyle(mosaico).getPropertyValue("--cols")) || 6;

  // Decide cuántas columnas (c) quiere ocupar una foto; las filas salen
  // de su proporción, para que el recorte sea pequeño.
  function forma(nombre, ratio, cols) {
    const n = nombre.toLowerCase();
    const s = Comun.azar(p.id + nombre);
    let c;
    if (/_ancha/.test(n)) c = cols;
    else if (/_grande/.test(n)) c = Math.ceil(cols * 0.66);
    else if (/_pequena|_pequeña/.test(n)) c = 1;
    else if (/_alta/.test(n)) { c = 1; ratio = Math.min(ratio, 0.5); }
    else if (ratio > 1.15)      c = s < .22 ? 3 : s < .72 ? 2 : s < .9 ? 4 : 1;   // horizontal
    else if (ratio < 0.87)      c = s < .55 ? 1 : s < .9 ? 2 : 3;                 // vertical
    else                        c = s < .6 ? 1 : 2;                               // cuadrada
    c = Math.max(1, Math.min(c, cols));
    const filas = (cc) => Math.max(1, Math.min(Math.round(cc / (ratio * altoFila())), cc === cols ? 8 : 5));
    return { c, f: filas };
  }

  const fotos = p.galeria.filter((g) => !g.video).map((g) => g.url);
  const celdas = [];
  let pendiente = null;
  const recomponer = () => { clearTimeout(pendiente); pendiente = setTimeout(componer, 60); };

  p.galeria.forEach((g, i) => {
    const celda = document.createElement("figure");
    celda.className = "celda";
    if (g.video) {
      celda.innerHTML = `<video src="${g.url}" muted loop playsinline autoplay preload="metadata"></video>`;
      celda.querySelector("video").addEventListener("loadedmetadata", (e) => {
        g.w = e.target.videoWidth; g.h = e.target.videoHeight; recomponer();
      });
    } else {
      celda.innerHTML = `<img src="${g.url}" alt="${p.titulo} — imagen ${i + 1}" loading="${g.w ? "lazy" : "eager"}" decoding="async">`;
      const im = celda.querySelector("img");
      // Si no sabemos las medidas (se calculan en Mac al publicar), se miden al cargar
      if (!g.w) im.addEventListener("load", () => { g.w = im.naturalWidth; g.h = im.naturalHeight; recomponer(); }, { once: true });
      const n = fotos.indexOf(g.url);
      celda.addEventListener("click", () => Comun.visor(fotos, n));
    }
    celda._g = g;
    celdas.push(celda);
    Comun.aparecer(celda);
  });

  // Vídeo de Vimeo / YouTube (clave "video:" en info.txt): ancho completo
  const embed = Comun.embed(p.video);
  if (embed) {
    const v = document.createElement("div");
    v.className = "celda-video";
    v.innerHTML = `<iframe src="${embed}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Vídeo ${p.titulo}"></iframe>`;
    v._video = true;
    celdas.splice(Math.min(celdas.length, 1), 0, v);
  }

  // Bloque de texto (ficha + texto libre)
  const ficha = [
    ["Año", p.ano], ["Labor", p.labor], ["Dirección", p.director],
    ["Productora", p.productora], ["Cliente", p.cliente],
  ].filter(([, v]) => v);
  if (ficha.length || p.texto) {
    const t = document.createElement("article");
    t.className = "celda-texto";
    t.innerHTML = `<dl class="ficha">${ficha.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
                   <div class="texto">${Web.parrafos(p.texto)}</div>`;
    t._texto = true;
    celdas.splice(Math.min(celdas.length, A.mosaico.posicionTexto), 0, t);
  }
  mosaico.append(...celdas);

  // Calcula la forma de cada celda y las coloca sin huecos
  function componer() {
    const cols = columnas();
    const piezas = celdas.map((el) => {
      if (el._texto) {
        // filas necesarias: se mide la altura real del texto
        const c = Math.min(cols, 2);
        const anchoCol = mosaico.clientWidth / cols, altoCelda = anchoCol * altoFila();
        el.style.gridColumn = `span ${c}`; el.style.gridRow = "span 1";
        el.style.height = "auto"; el.style.overflow = "visible";
        const alto = el.scrollHeight;
        el.style.height = ""; el.style.overflow = "";
        const f = Math.max(2, Math.ceil(alto / altoCelda));
        return { el, c, f: () => f, fijo: true };
      }
      if (el._video) {
        return { el, c: cols, f: () => Math.max(1, Math.round(cols / ((16 / 9) * altoFila()))), fijo: true };
      }
      const g = el._g;
      return { el, ...forma(g.f, g.w && g.h ? g.w / g.h : 1.4, cols) };
    });
    Comun.empaquetar(piezas, cols);
  }
  componer();
  if (document.fonts) document.fonts.ready.then(componer);

  let colsAntes = columnas();
  window.addEventListener("resize", () => {
    const c = columnas();
    if (c !== colsAntes) { colsAntes = c; componer(); }
  });

  /* ---------- 3. ANTERIOR / SIGUIENTE ---------- */
  const todos = Web.proyectos(tipo);
  const i = todos.indexOf(p);
  const ant = todos[(i - 1 + todos.length) % todos.length];
  const sig = todos[(i + 1) % todos.length];
  document.getElementById("siguiente").innerHTML = todos.length > 1 ? `
      <a class="ant" href="${ant.enlace}"><small>← anterior</small><span class="titulo">${ant.titulo}</span></a>
      <a class="todos" href="${tipo}.html">todos</a>
      <a class="sig" href="${sig.enlace}"><small>siguiente →</small><span class="titulo">${sig.titulo}</span></a>`
    : `<span></span><a class="todos" href="${tipo}.html">todos</a><span></span>`;

  Comun.autoScroll();
})();
