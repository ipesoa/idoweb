/* =====================================================================
   LETRAS LEGIBLES SOBRE FOTOS  (blanco, y negro solo donde hace falta)
   ---------------------------------------------------------------------
   Las letras son BLANCAS. Únicamente la parte de la letra que cae sobre
   una zona tan clara que el blanco no se leería se vuelve NEGRA (con un
   paso suave entre los dos). Si en blanco se sigue leyendo, no cambia.
   Cada punto cambia con un fundido, así nada salta aunque la foto se
   mueva o cambie de luz.

   Cómo mira el fondo: reconstruye en un lienzo invisible las fotos y
   vídeos que hay detrás de cada texto (con su encuadre, opacidad y
   filtros), le quita el grano y mide la luz de cada punto. Los textos de
   verdad siguen en la página (enlaces, accesibilidad), transparentes;
   lo que se ve es lo que pinta esta capa.

   Ajustes: assets/js/ajustes.js → diferencia
   Para añadir un texto: su selector a AJUSTES.diferencia.textos (o data-dif).
   ===================================================================== */
(function () {
  const AJ = (window.AJUSTES && window.AJUSTES.diferencia) || {};
  const ACTIVO = AJ.activo !== false;
  const TEXTOS = AJ.textos || ".menu a, .pase__titulo, .pase__datos, .etiqueta-cursor, .celda-proyecto__txt, [data-dif]";
  let negroDesde = num(AJ.negroDesde, 0.45);      // luz del fondo (0-1) donde el blanco empieza a no leerse
  let negroTotal = num(AJ.negroTotal, 0.62);      // a partir de aquí, negro del todo
  const SUAVIZADO = Math.max(0, num(AJ.suavizado, 3));  // px: ignora el grano y los detalles diminutos
  const FUNDIDO = Math.max(1, num(AJ.fundido, 450));   // ms del cambio blanco ↔ negro
  function num(v, d) { return Number.isFinite(Number(v)) ? Number(v) : d; }

  // luminancia lineal (la que usa la norma de contraste WCAG)
  const lineal = Float32Array.from({ length: 256 }, (_, i) => {
    const x = i / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const luz = (r, g, b) => 0.2126 * lineal[r] + 0.7152 * lineal[g] + 0.0722 * lineal[b];

  function colorPara(hex) {
    const s = hex.replace("#", "");
    const c = s.length === 3 ? [...s].map((x) => parseInt(x + x, 16)) : [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
    return { letra: luz(...c) >= negroDesde ? "#000000" : "#FFFFFF" };
  }
  window.Diferencia = {
    colorPara,
    // (laboratorio) cambia el punto de paso a negro; el de vuelta va un poco por debajo
    umbral: (valor) => {
      if (valor !== undefined && Number.isFinite(Number(valor))) {
        negroDesde = Math.max(0, Math.min(0.95, Number(valor)));
        negroTotal = Math.min(1, negroDesde + 0.17);
      }
      return negroDesde;
    },
    tiempos: () => ({}),
  };
  if (!ACTIVO) return;

  /* ---------- estilos y capa ---------- */
  const estilo = document.createElement("style");
  estilo.textContent = `
    .dif-activo :is(${TEXTOS}), .dif-activo :is(${TEXTOS}) * {
      color: transparent !important; -webkit-text-stroke-color: transparent !important; text-decoration-color: transparent !important;
    }`;
  document.head.appendChild(estilo);
  const capa = document.createElement("canvas");
  capa.className = "dif-capa";
  capa.setAttribute("aria-hidden", "true");
  capa.style.cssText = "position:fixed;left:0;top:0;z-index:80;pointer-events:none;";
  document.body.appendChild(capa);
  const cc = capa.getContext("2d");

  const lienzo = () => { const c = document.createElement("canvas"); return [c, c.getContext("2d", { willReadFrequently: true })]; };
  const [cFondo, xFondo] = lienzo();   // fondo reconstruido (1 px CSS: suficiente para medir la luz)
  const [cTemp, xTemp] = lienzo();     // desenfoques a baja resolución
  const [cMascara, xMascara] = lienzo(); // forma de las letras (resolución de pantalla)
  const [cComp, xComp] = lienzo();     // letras ya coloreadas
  const tam = (c, w, h) => { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } };
  const colorFondoPagina = () => getComputedStyle(document.body).backgroundColor;

  /* ---------- opacidad y filtros acumulados (memoria por fotograma) ---------- */
  let memo = new Map();
  function estiloAcumulado(el) {
    if (!el || el === document.documentElement || el === document.body) return { alfa: 1, filtro: "none", cs: null };
    let r = memo.get(el);
    if (r) return r;
    const cs = getComputedStyle(el);
    const padre = estiloAcumulado(el.parentElement);
    let alfa = padre.alfa * parseFloat(cs.opacity);
    if (cs.visibility === "hidden" || cs.display === "none") alfa = 0;
    const propio = cs.filter && cs.filter !== "none" ? cs.filter : "";
    const filtro = [padre.filtro === "none" ? "" : padre.filtro, propio].filter(Boolean).join(" ") || "none";
    r = { alfa, filtro, cs };
    memo.set(el, r);
    return r;
  }
  const radioBlur = (filtro) => { let r = 0; filtro.replace(/blur\(([\d.]+)px\)/g, (_, v) => (r += parseFloat(v))); return r; };

  /* ---------- fotos / vídeos que forman el fondo ---------- */
  let medios = null;
  function mediosDelFotograma() {
    if (medios) return medios;
    medios = [];
    for (const m of document.querySelectorAll("img, video")) {
      if (m.closest(".menu, .dif-capa, .visor")) continue;
      const nw = m.naturalWidth || m.videoWidth, nh = m.naturalHeight || m.videoHeight;
      if (!nw || !nh || (m.tagName === "IMG" && !m.complete)) continue;
      const r = m.getBoundingClientRect();
      if (!r.width || r.bottom < -200 || r.top > innerHeight + 200 || r.right < 0 || r.left > innerWidth) continue;
      medios.push({ m, r, nw, nh });
    }
    return medios;
  }
  function dibujarFondo(R) {
    xFondo.setTransform(1, 0, 0, 1, 0, 0);
    xFondo.globalAlpha = 1; xFondo.filter = "none";
    xFondo.fillStyle = colorFondoPagina();
    xFondo.fillRect(0, 0, cFondo.width, cFondo.height);
    for (const { m, r, nw, nh } of mediosDelFotograma()) {
      if (r.right <= R.x0 || r.left >= R.x1 || r.bottom <= R.y0 || r.top >= R.y1) continue;
      const { alfa, filtro, cs } = estiloAcumulado(m);
      if (alfa <= 0.003) continue;
      let s;   // object-fit / object-position (como lo pinta el navegador)
      if (cs.objectFit === "contain") s = Math.min(r.width / nw, r.height / nh);
      else if (cs.objectFit === "fill") s = null;
      else s = Math.max(r.width / nw, r.height / nh);
      const pos = cs.objectPosition.split(" ").map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
      const dw = s ? nw * s : r.width, dh = s ? nh * s : r.height;
      const dx = r.left + (r.width - dw) * (pos[0] ?? 0.5), dy = r.top + (r.height - dh) * (pos[1] ?? 0.5);
      // recorte: la propia caja y el primer contenedor con overflow oculto
      let cx0 = r.left, cy0 = r.top, cx1 = r.right, cy1 = r.bottom;
      for (let e = m.parentElement; e && e !== document.body; e = e.parentElement) {
        const o = estiloAcumulado(e).cs.overflow;
        if (o !== "visible") { const q = e.getBoundingClientRect(); cx0 = Math.max(cx0, q.left); cy0 = Math.max(cy0, q.top); cx1 = Math.min(cx1, q.right); cy1 = Math.min(cy1, q.bottom); break; }
      }
      const blur = radioBlur(filtro);
      const ax0 = Math.max(cx0, R.x0 - blur * 2), ay0 = Math.max(cy0, R.y0 - blur * 2);
      const ax1 = Math.min(cx1, R.x1 + blur * 2), ay1 = Math.min(cy1, R.y1 + blur * 2);
      if (ax1 <= ax0 || ay1 <= ay0) continue;
      const sx = (ax0 - dx) / dw * nw, sy = (ay0 - dy) / dh * nh, sw = (ax1 - ax0) / dw * nw, sh = (ay1 - ay0) / dh * nh;
      xFondo.save();
      xFondo.beginPath();
      xFondo.rect(Math.max(cx0, R.x0) - R.x0, Math.max(cy0, R.y0) - R.y0, Math.min(cx1, R.x1) - Math.max(cx0, R.x0), Math.min(cy1, R.y1) - Math.max(cy0, R.y0));
      xFondo.clip();
      xFondo.globalAlpha = alfa;
      try {
        if (blur > 2) {
          const red = Math.min(8, blur / 2), tw = Math.max(1, Math.ceil((ax1 - ax0) / red)), th = Math.max(1, Math.ceil((ay1 - ay0) / red));
          tam(cTemp, tw, th);
          xTemp.setTransform(1, 0, 0, 1, 0, 0); xTemp.globalAlpha = 1;
          xTemp.filter = "none"; xTemp.clearRect(0, 0, tw, th);
          xTemp.filter = filtro.replace(/blur\(([\d.]+)px\)/g, (_, v) => `blur(${(parseFloat(v) / red).toFixed(2)}px)`);
          xTemp.drawImage(m, sx, sy, sw, sh, 0, 0, tw, th);
          xFondo.filter = "none";
          xFondo.drawImage(cTemp, 0, 0, tw, th, ax0 - R.x0, ay0 - R.y0, ax1 - ax0, ay1 - ay0);
        } else {
          xFondo.filter = filtro;
          xFondo.drawImage(m, sx, sy, sw, sh, ax0 - R.x0, ay0 - R.y0, ax1 - ax0, ay1 - ay0);
        }
      } catch (e) { /* aún no listo */ }
      xFondo.restore();
    }
  }

  /* ---------- posición de cada letra (se guarda: solo se remide si cambia el texto o su tamaño) ---------- */
  const metricas = new Map();
  function medidas(fuente) {
    if (!metricas.has(fuente)) {
      xTemp.font = fuente;
      const m = xTemp.measureText("Hg");
      metricas.set(fuente, { asc: m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent, desc: m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent });
    }
    return metricas.get(fuente);
  }
  const rango = document.createRange();
  const disposiciones = new WeakMap();
  let versionLetras = 0;   // sube con resize / fuentes cargadas → se remide todo
  function letrasDe(el, caja) {
    const firma = `${versionLetras}|${Math.round(caja.width * 10)}|${Math.round(caja.height * 10)}|${el.textContent}`;
    const prev = disposiciones.get(el);
    if (prev && prev.firma === firma) return prev.lista;
    const lista = [];
    const recorrer = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let palabra = 0, enPalabra = false;
    for (let n = recorrer.nextNode(); n; n = recorrer.nextNode()) {
      const txt = n.textContent, p = n.parentElement;
      const cs = getComputedStyle(p);
      const fuente = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const subrayado = /underline/.test(getComputedStyle(p.closest("a") || p).textDecorationLine);
      if (enPalabra) { palabra++; enPalabra = false; }       // cada nodo de texto empieza palabra
      for (let k = 0; k < txt.length; k++) {
        let ch = txt[k];
        if (!ch.trim()) { if (enPalabra) { palabra++; enPalabra = false; } continue; }
        rango.setStart(n, k); rango.setEnd(n, k + 1);
        const r = rango.getBoundingClientRect();
        if (!r.width) continue;
        if (cs.textTransform === "uppercase") ch = ch.toUpperCase();
        else if (cs.textTransform === "lowercase") ch = ch.toLowerCase();
        enPalabra = true;
        lista.push({ ch, dx: r.left - caja.left, dy: r.top - caja.top, w: r.width, h: r.height,
          p, fuente, tam: parseFloat(cs.fontSize), subrayado, palabra });
      }
    }
    disposiciones.set(el, { firma, lista });
    return lista;
  }
  window.addEventListener("resize", () => versionLetras++);
  if (document.fonts) document.fonts.addEventListener("loadingdone", () => { versionLetras++; metricas.clear(); });

  /* ---------- cuánto negro lleva cada punto (0 = blanco, 1 = negro) ----------
     Blanco siempre, salvo donde el fondo es tan claro que el blanco no se
     leería: ahí (y solo ahí) se vuelve negro, con un paso suave entre los
     dos. Lo que ya se lee en blanco no se toca. Cada punto cambia con un
     fundido, así nada salta aunque la foto se mueva. */
  const previos = new WeakMap();   // el → { w, h, v: Float32Array } (lo que se pintó el fotograma anterior)
  let ahora = performance.now(), dt = 16, cuadro = 0;
  let sucioCapa = [];   // zonas de la capa pintadas en el fotograma anterior
  const suave = (t) => t * t * (3 - 2 * t);
  let bufA = new Float32Array(0), bufB = new Float32Array(0);
  function luces(d, w, h) {
    const n = w * h;
    if (bufA.length < n) { bufA = new Float32Array(n); bufB = new Float32Array(n); }
    for (let i = 0, q = 0; i < n; i++, q += 4) bufA[i] = luz(d[q], d[q + 1], d[q + 2]);
    const r = Math.round(SUAVIZADO);
    if (r < 1) return bufA;
    for (let pasada = 0; pasada < 2; pasada++) {
      for (let y = 0; y < h; y++) {          // horizontal: A → B
        const f = y * w; let acc = 0, cnt = 0;
        for (let x = -r; x < w; x++) {
          if (x + r < w) { acc += bufA[f + x + r]; cnt++; }
          if (x - r - 1 >= 0) { acc -= bufA[f + x - r - 1]; cnt--; }
          if (x >= 0) bufB[f + x] = acc / cnt;
        }
      }
      for (let x = 0; x < w; x++) {          // vertical: B → A
        let acc = 0, cnt = 0;
        for (let y = -r; y < h; y++) {
          if (y + r < h) { acc += bufB[(y + r) * w + x]; cnt++; }
          if (y - r - 1 >= 0) { acc -= bufB[(y - r - 1) * w + x]; cnt--; }
          if (y >= 0) bufA[y * w + x] = acc / cnt;
        }
      }
    }
    return bufA;
  }
  function negrura(l) {
    if (l <= negroDesde) return 0;
    if (l >= negroTotal) return 1;
    return suave((l - negroDesde) / (negroTotal - negroDesde));
  }

  /* ---------- pintar un texto ---------- */
  let fallo = false;
  // local = null → capa fija (menú, inicio)  ·  local = {c, x, caja} → lienzo pegado al texto (rejillas)
  // Devuelve true si ya está quieto (no hace falta repetir el siguiente fotograma)
  function pintarTexto(el, dpr, local = null) {
    const caja = el.getBoundingClientRect();
    const L = letrasDe(el, caja);
    if (!L.length) return true;
    // límites
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, margen = 0;
    const vivas = [];
    for (const g of L) {
      const acu = estiloAcumulado(g.p);
      if (acu.alfa <= 0.003) continue;
      const x = caja.left + g.dx, y = caja.top + g.dy, blur = radioBlur(acu.filtro);
      vivas.push({ g, x, y, alfa: acu.alfa, blur });
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + g.w); y1 = Math.max(y1, y + g.h);
      margen = Math.max(margen, blur * 2 + g.tam * 0.6);   // 0.6: sitio para cursivas y acentos
    }
    if (!vivas.length) return true;
    const R = local
      ? { x0: Math.floor(x0 - margen), y0: Math.floor(y0 - margen), x1: Math.ceil(x1 + margen), y1: Math.ceil(y1 + margen) }
      : { x0: Math.floor(Math.max(0, x0 - margen)), y0: Math.floor(Math.max(0, y0 - margen)),
          x1: Math.ceil(Math.min(innerWidth, x1 + margen)), y1: Math.ceil(Math.min(innerHeight, y1 + margen)) };
    const w = R.x1 - R.x0, h = R.y1 - R.y0;
    if (w <= 0 || h <= 0) return true;

    // Se mide el fondo un fotograma de cada dos (el fundido lo hace invisible);
    // en el otro se reutiliza el color ya calculado.
    let prev = previos.get(el);
    const W = Math.ceil(w * dpr), H = Math.ceil(h * dpr);
    if (prev && prev.w === w && prev.h === h && cuadro - prev.medido < 2 && cuadro !== prev.medido) {
      return dibujar(el, prev, vivas, R, w, h, W, H, dpr, local) && prev.quieto;
    }

    // a. fondo real detrás del texto
    tam(cFondo, w, h);
    dibujarFondo(R);
    let datos;
    try { datos = xFondo.getImageData(0, 0, w, h); }
    catch (e) { fallo = true; return true; }
    
    // b. campo de color: blanco salvo en las zonas muy claras, con fundido
    const d = datos.data, n = w * h;
    const nuevo = !prev || prev.w !== w || prev.h !== h;
    if (nuevo) { prev = { w, h, v: new Float32Array(n), cv: document.createElement("canvas") }; previos.set(el, prev); }
    const paso = Math.min(1, dt / FUNDIDO);
    const xc = prev.cv.getContext("2d");
    tam(prev.cv, w, h);
    const campo = xc.createImageData(w, h), c = campo.data;
    let quieto = true, vMin = 1, vMax = 0;
    // luz de cada punto, sin grano (desenfoque de caja en dos pasadas: rápido)
    const lz = luces(d, w, h);
    for (let i = 0, q = 0; i < n; i++, q += 4) {
      const meta = negrura(lz[i]);
      let v = prev.v[i];
      if (nuevo) v = meta;                                   // primera vez: sin fundido
      else if (v !== meta) {
        v = meta > v ? Math.min(meta, v + paso) : Math.max(meta, v - paso);
        if (Math.abs(v - meta) > 0.004) quieto = false; else v = meta;
      }
      prev.v[i] = v;
      if (v < vMin) vMin = v;
      if (v > vMax) vMax = v;
      const tono = 255 - Math.round(255 * v);
      c[q] = c[q + 1] = c[q + 2] = tono; c[q + 3] = 255;
    }
    prev.vMin = vMin; prev.vMax = vMax; prev.quieto = quieto; prev.medido = cuadro;
    if (vMax - vMin >= 0.004) xc.putImageData(campo, 0, 0);
    dibujar(el, prev, vivas, R, w, h, W, H, dpr, local);
    return quieto;
  }

  /* ---------- dibujar las letras con el color calculado ---------- */
  function dibujar(el, prev, vivas, R, w, h, W, H, dpr, local) {
    let x;
    if (local) {
      const cv = local.c, cajaL = local.caja.getBoundingClientRect();
      tam(cv, W, H);
      Object.assign(cv.style, { left: (R.x0 - cajaL.left - local.caja.clientLeft) + "px", top: (R.y0 - cajaL.top - local.caja.clientTop) + "px", width: w + "px", height: h + "px" });
      x = local.x;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, W, H);
    } else {
      x = cc;
      sucioCapa.push([R.x0 * dpr, R.y0 * dpr, W, H]);   // para borrar solo esto en el siguiente fotograma
    }
    // (la fuente, la opacidad y el filtro solo se cambian cuando cambian: es lo que más cuesta)
    const letras = (ctx, color) => {
      ctx.fillStyle = color;
      let fuente = "", alfaAct = -1, filtroAct = "";
      ctx.filter = "none"; filtroAct = "none";
      for (const { g, x: gx, y: gy, alfa, blur } of vivas) {
        const m = medidas(g.fuente);
        const base = gy + (g.h - (m.asc + m.desc)) / 2 + m.asc;
        const a = Math.min(1, alfa);
        if (a !== alfaAct) { ctx.globalAlpha = alfaAct = a; }
        const f = blur > 0.4 ? `blur(${(blur * dpr).toFixed(1)}px)` : "none";
        if (f !== filtroAct) { ctx.filter = filtroAct = f; }
        if (g.fuente !== fuente) { ctx.font = fuente = g.fuente; }
        ctx.fillText(g.ch, gx, base);
        if (g.subrayado) ctx.fillRect(gx, base + g.tam * 0.25, g.w, 1);
      }
      ctx.filter = "none"; ctx.globalAlpha = 1;
    };
    // Todo el texto de un solo color (lo normal): se pinta directamente
    if (prev.vMax - prev.vMin < 0.004) {
      const t = 255 - Math.round(255 * prev.vMax);
      x.setTransform(dpr, 0, 0, dpr, -(local ? R.x0 : 0) * dpr, -(local ? R.y0 : 0) * dpr);
      letras(x, `rgb(${t},${t},${t})`);
      x.setTransform(1, 0, 0, 1, 0, 0);
      return true;
    }
    // Mezcla: el campo blanco/negro recortado con la forma de las letras
    tam(cMascara, W, H); tam(cComp, W, H);
    xMascara.setTransform(1, 0, 0, 1, 0, 0);
    xMascara.clearRect(0, 0, W, H);
    xMascara.setTransform(dpr, 0, 0, dpr, -R.x0 * dpr, -R.y0 * dpr);
    letras(xMascara, "#fff");
    xComp.globalCompositeOperation = "copy";
    xComp.imageSmoothingEnabled = true; xComp.imageSmoothingQuality = "high";
    xComp.drawImage(prev.cv, 0, 0, W, H);
    xComp.globalCompositeOperation = "destination-in";
    xComp.drawImage(cMascara, 0, 0);
    xComp.globalCompositeOperation = "source-over";
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(cComp, local ? 0 : R.x0 * dpr, local ? 0 : R.y0 * dpr);
    return true;
  }

  /* ---------- textos que se mueven con la página (rejillas) ---------- */
  // Van en un lienzo propio dentro de su celda: se desplazan con ella sin
  // retraso y solo se recalculan cuando cambia algo debajo.
  const fijos = new WeakMap(), locales = new Map();
  function esFijo(el) {
    if (!fijos.has(el)) {
      let f = false;
      for (let e = el; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).position === "fixed") { f = true; break; }
      fijos.set(el, f);
    }
    return fijos.get(el);
  }
  function lienzoLocal(el) {
    let L = locales.get(el);
    if (!L) {
      const caja = el.offsetParent;
      if (!caja) return null;
      const c = document.createElement("canvas");
      c.className = "dif-local"; c.setAttribute("aria-hidden", "true");
      c.style.cssText = "position:absolute;pointer-events:none;z-index:4;";
      caja.appendChild(c);
      L = { c, x: c.getContext("2d"), caja, sucio: true };
      locales.set(el, L);
    }
    return L;
  }
  const ensuciar = () => locales.forEach((L) => (L.sucio = true));
  document.addEventListener("load", ensuciar, true);
  window.addEventListener("resize", ensuciar);
  // Mientras algo se anima (fundidos, el cartel…) se recalcula cada fotograma
  const animando = new Set();
  const empieza = (e) => { animando.add(e.target); ensuciar(); };
  const acaba = (e) => { animando.delete(e.target); ensuciar(); };
  document.addEventListener("transitionrun", empieza, true);
  document.addEventListener("transitionend", acaba, true);
  document.addEventListener("transitioncancel", acaba, true);
  document.addEventListener("animationstart", empieza, true);
  document.addEventListener("animationend", acaba, true);
  document.addEventListener("animationcancel", acaba, true);
  setInterval(() => { for (const el of animando) if (!el.isConnected) animando.delete(el); }, 2000);

  /* ---------- bucle ---------- */
  function fotograma(t) {
    if (fallo) { apagar(); return; }
    dt = Math.min(100, t - ahora); ahora = t;
    if (!document.hidden) {
      const t0 = performance.now();
      memo = new Map(); medios = null;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.ceil(innerWidth * dpr), ch = Math.ceil(innerHeight * dpr);
      if (capa.width !== cw || capa.height !== ch) { tam(capa, cw, ch); sucioCapa = []; }
      const ancho = innerWidth + "px", alto = innerHeight + "px";
      if (capa.style.width !== ancho) capa.style.width = ancho;
      if (capa.style.height !== alto) capa.style.height = alto;
      cuadro++;
      cc.setTransform(1, 0, 0, 1, 0, 0);
      for (const [zx, zy, zw, zh] of sucioCapa) cc.clearRect(zx - 2, zy - 2, zw + 4, zh + 4);
      sucioCapa = [];
      if (animando.size) ensuciar();
      let localesEsteFotograma = 0;
      const maxLocales = animando.size ? 12 : 4;
      for (const el of document.querySelectorAll(TEXTOS)) {
        const r = el.getBoundingClientRect();
        if (esFijo(el)) {
          if (!r.width || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
          pintarTexto(el, dpr);
        } else {
          const L = lienzoLocal(el);
          if (!L || !L.sucio || localesEsteFotograma >= maxLocales) continue;
          if (!r.width || r.bottom < -100 || r.top > innerHeight + 100 || r.right < 0 || r.left > innerWidth) continue;
          localesEsteFotograma++;
          L.sucio = !pintarTexto(el, dpr, L);
        }
        if (fallo) break;
      }
      window.Diferencia.ms = performance.now() - t0;   // tiempo del último fotograma (para medir)
    }
    requestAnimationFrame(fotograma);
  }
  function apagar() {
    document.documentElement.classList.remove("dif-activo");
    capa.remove();
    locales.forEach((L) => L.c.remove());
    estilo.remove();
  }

  document.documentElement.classList.add("dif-activo");
  requestAnimationFrame(fotograma);
})();
