/* =====================================================================
   LETRAS LEGIBLES SOBRE FOTOS
   ---------------------------------------------------------------------
   La idea: las letras son BLANCAS; donde lo que tienen debajo es un
   color claro (donde el blanco no se leería), pasan a NEGRO.
   Modo «pixel» (por defecto): como «Diferencia» de Photoshop pero solo
   donde hace falta: el corte sigue a la imagen, píxel a píxel, y solo
   reacciona a los colores más claros que la «tolerancia». Siempre
   blanco o negro puros. Se ignora la textura más fina («grano») para
   que no salgan motas, y hay un pequeño margen para que no parpadee.
   Otros modos: «palabra», «letra» o «texto» (cada uno entero de un color).

   Cómo mira el fondo: reconstruye en un lienzo invisible las fotos y
   vídeos que hay detrás de cada texto (con su encuadre, opacidad y
   filtros) y mide la luz bajo cada letra. Los textos de verdad siguen
   en la página (enlaces, accesibilidad), transparentes; lo que se ve es
   lo que pinta esta capa. Respeta las máscaras (overflow y clip-path)
   de las animaciones.

   Ajustes: assets/js/ajustes.js → diferencia (y el gestor, pestaña
   Cabecera → «Color de las letras», que manda sobre ajustes.js).
   Para añadir un texto: su selector a AJUSTES.diferencia.textos (o data-dif).
   Si una animación mueve letras por dentro de un texto, poner
   data-dif-vivo en el texto mientras dura (así se remiden cada fotograma).
   ===================================================================== */
(function () {
  const AJ = (window.AJUSTES && window.AJUSTES.diferencia) || {};
  const ACTIVO = AJ.activo !== false;
  const TEXTOS = AJ.textos || ".menu a, .menu button, .menu span, .pase__titulo, .pase__datos, .etiqueta-cursor, .celda-proyecto__txt, [data-dif]";
  // Se leen en cada fotograma: el gestor puede cambiarlos en directo.
  const cfg = () => (window.AJUSTES && window.AJUSTES.diferencia) || AJ;
  const umbral = () => num(cfg().umbral, 0.45);           // tolerancia: luz (0-1) a partir de la cual pasa a negro
  const decidir = () => cfg().decidir || "pixel";          // "pixel" | "palabra" | "letra" | "texto"
  const PROPORCION = 0.5;    // parte de la letra que tiene que estar sobre claro para pasar a negro
  const VUELTA = 0.35;       // y por debajo de esta parte vuelve a blanco (margen anti-parpadeo)
  const BANDA = 0.02;        // (modo píxel) margen anti-parpadeo alrededor de la tolerancia
  const grano = () => Math.max(0, num(cfg().grano, 1.5));  // (modo píxel) px de textura fina que se ignora
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
    return { letra: luz(...c) >= umbral() ? "#000000" : "#FFFFFF" };
  }
  window.Diferencia = {
    colorPara,
    umbral: (valor) => {   // (laboratorio)
      if (valor !== undefined && Number.isFinite(Number(valor)) && window.AJUSTES) {
        window.AJUSTES.diferencia = Object.assign({}, window.AJUSTES.diferencia, { umbral: Math.max(0, Math.min(1, Number(valor))) });
      }
      return umbral();
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
  const [cFondo, xFondo] = lienzo();     // fondo reconstruido
  const [cTemp, xTemp] = lienzo();       // desenfoques a baja resolución
  const [cMascara, xMascara] = lienzo(); // (modo píxel) forma de las letras
  const [cComp, xComp] = lienzo();       // (modo píxel) letras ya coloreadas
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

  /* ---------- recortes: overflow oculto y clip-path: inset() de los padres ---------- */
  let memoRecorte = new Map();
  function recorte(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    if (memoRecorte.has(el)) return memoRecorte.get(el);
    let r = recorte(el.parentElement);
    const cs = estiloAcumulado(el).cs;
    const corta = (q) => (r = r ? [Math.max(r[0], q[0]), Math.max(r[1], q[1]), Math.min(r[2], q[2]), Math.min(r[3], q[3])] : q);
    if (cs && (cs.overflowX !== "visible" || cs.overflowY !== "visible")) {
      const b = el.getBoundingClientRect(); corta([b.left, b.top, b.right, b.bottom]);
    }
    const m = cs && cs.clipPath && cs.clipPath.match(/^inset\(([^)]*)\)/);
    if (m) {
      const b = el.getBoundingClientRect();
      const v = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/).map((t, i) => {
        const n = parseFloat(t); const dim = i % 2 ? b.width : b.height;
        return t.endsWith("%") ? n / 100 * dim : n || 0;
      });
      const [t, rr = t, bb = t, l = rr] = v;
      corta([b.left + l, b.top + t, b.right - rr, b.bottom - bb]);
    }
    memoRecorte.set(el, r);
    return r;
  }

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
  // k = píxeles reales por píxel CSS (2 en retina)
  function dibujarFondo(R, k) {
    xFondo.setTransform(1, 0, 0, 1, 0, 0);
    xFondo.globalAlpha = 1; xFondo.filter = "none";
    xFondo.fillStyle = colorFondoPagina();
    xFondo.fillRect(0, 0, cFondo.width, cFondo.height);
    xFondo.setTransform(k, 0, 0, k, 0, 0);
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
          xFondo.filter = k === 1 ? filtro : filtro.replace(/blur\(([\d.]+)px\)/g, (_, v) => `blur(${(parseFloat(v) * k).toFixed(2)}px)`);
          xFondo.drawImage(m, sx, sy, sw, sh, ax0 - R.x0, ay0 - R.y0, ax1 - ax0, ay1 - ay0);
        }
      } catch (e) { /* aún no listo */ }
      xFondo.restore();
    }
  }

  /* ---------- posición de cada letra (se guarda; se remide si cambia algo) ---------- */
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
  let versionLetras = 0;
  function letrasDe(el, caja) {
    const vivo = el.closest("[data-dif-vivo]") || el.querySelector("[data-dif-vivo]");
    const firma = `${versionLetras}|${Math.round(caja.width * 10)}|${Math.round(caja.height * 10)}|${el.textContent}`;
    const prev = disposiciones.get(el);
    if (!vivo && prev && prev.firma === firma) return prev.lista;
    const lista = [];
    const recorrer = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let palabra = 0, enPalabra = false;
    for (let n = recorrer.nextNode(); n; n = recorrer.nextNode()) {
      const txt = n.textContent, p = n.parentElement;
      if (!txt.trim()) { if (enPalabra) { palabra++; enPalabra = false; } continue; }
      const cs = getComputedStyle(p);
      const fuente = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const subrayado = /underline/.test(getComputedStyle(p.closest("a") || p).textDecorationLine);
      for (let k = 0; k < txt.length; k++) {
        let ch = txt[k];
        if (!ch.trim()) { if (enPalabra) { palabra++; enPalabra = false; } continue; }
        enPalabra = true;
        rango.setStart(n, k); rango.setEnd(n, k + 1);
        const r = rango.getBoundingClientRect();
        if (!r.width) continue;
        if (cs.textTransform === "uppercase") ch = ch.toUpperCase();
        else if (cs.textTransform === "lowercase") ch = ch.toLowerCase();
        lista.push({ ch, dx: r.left - caja.left, dy: r.top - caja.top, w: r.width, h: r.height,
          p, fuente, tam: parseFloat(cs.fontSize), subrayado, palabra });
      }
    }
    disposiciones.set(el, { firma, lista });
    return lista;
  }
  window.addEventListener("resize", () => versionLetras++);
  if (document.fonts) document.fonts.addEventListener("loadingdone", () => { versionLetras++; metricas.clear(); });

  /* ---------- pintar las letras, cada una con su color y su máscara ---------- */
  function letras(ctx, vivas, colores, dpr) {
    let fuente = "", alfaAct = -1, filtroAct = "none", clipAct = null, colorAct = "";
    ctx.save(); ctx.filter = "none";
    vivas.forEach(({ g, x: gx, y: gy, alfa, blur, clip }, i) => {
      if (clip !== clipAct) {          // cambia la máscara: se restaura y se aplica la nueva
        ctx.restore(); ctx.save();
        fuente = ""; alfaAct = -1; filtroAct = "none"; colorAct = "";
        if (clip) { ctx.beginPath(); ctx.rect(clip[0], clip[1], clip[2] - clip[0], clip[3] - clip[1]); ctx.clip(); }
        clipAct = clip;
      }
      const color = colores[i] ? "#000" : "#fff";
      if (color !== colorAct) ctx.fillStyle = colorAct = color;
      const m = medidas(g.fuente);
      const base = gy + (g.h - (m.asc + m.desc)) / 2 + m.asc;
      const a = Math.min(1, alfa);
      if (a !== alfaAct) ctx.globalAlpha = alfaAct = a;
      const f = blur > 0.4 ? `blur(${(blur * dpr).toFixed(1)}px)` : "none";
      if (f !== filtroAct) ctx.filter = filtroAct = f;
      if (g.fuente !== fuente) ctx.font = fuente = g.fuente;
      ctx.fillText(g.ch, gx, base);
      if (g.subrayado) ctx.fillRect(gx, base + g.tam * 0.25, g.w, 1);
    });
    ctx.restore();
  }

  /* ---------- (modo píxel) luz de cada píxel, sin la textura más fina ---------- */
  let bufA = new Float32Array(0), bufB = new Float32Array(0);
  function luces(d, w, h, r) {
    const n = w * h;
    if (bufA.length < n) { bufA = new Float32Array(n); bufB = new Float32Array(n); }
    for (let i = 0, q = 0; i < n; i++, q += 4) bufA[i] = luz(d[q], d[q + 1], d[q + 2]);
    if (r < 1) return bufA;
    for (let pasada = 0; pasada < 2; pasada++) {
      for (let y = 0; y < h; y++) {
        const f = y * w; let acc = 0, cnt = 0;
        for (let x = -r; x < w; x++) {
          if (x + r < w) { acc += bufA[f + x + r]; cnt++; }
          if (x - r - 1 >= 0) { acc -= bufA[f + x - r - 1]; cnt--; }
          if (x >= 0) bufB[f + x] = acc / cnt;
        }
      }
      for (let x = 0; x < w; x++) {
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
  const mapas = new WeakMap();   // (modo píxel) el → { W, H, negro: Uint8Array, cv }

  /* ---------- pintar un texto ---------- */
  const estados = new WeakMap();   // el → { negro: Uint8Array } (color de cada letra el fotograma anterior)
  let sucioCapa = [];
  let fallo = false;
  // local = null → capa fija (menú, inicio)  ·  local = {c, x, caja} → lienzo pegado al texto (rejillas)
  function pintarTexto(el, dpr, local = null) {
    const caja = el.getBoundingClientRect();
    const L = letrasDe(el, caja);
    if (!L.length) return true;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, margen = 0;
    const vivas = [];
    for (let i = 0; i < L.length; i++) {
      const g = L[i];
      const acu = estiloAcumulado(g.p);
      if (acu.alfa <= 0.003) continue;
      const x = caja.left + g.dx, y = caja.top + g.dy, blur = radioBlur(acu.filtro);
      const clip = recorte(g.p);
      if (clip && (x + g.w <= clip[0] || x >= clip[2] || y + g.h <= clip[1] || y >= clip[3])) continue;   // tapada por su máscara
      vivas.push({ g, i, x, y, alfa: acu.alfa, blur, clip });
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + g.w); y1 = Math.max(y1, y + g.h);
      margen = Math.max(margen, blur * 2 + g.tam * 0.6);   // sitio para cursivas y acentos
    }
    if (!vivas.length) return true;
    const R = local
      ? { x0: Math.floor(x0 - margen), y0: Math.floor(y0 - margen), x1: Math.ceil(x1 + margen), y1: Math.ceil(y1 + margen) }
      : { x0: Math.floor(Math.max(0, x0 - margen)), y0: Math.floor(Math.max(0, y0 - margen)),
          x1: Math.ceil(Math.min(innerWidth, x1 + margen)), y1: Math.ceil(Math.min(innerHeight, y1 + margen)) };
    const w = R.x1 - R.x0, h = R.y1 - R.y0;
    if (w <= 0 || h <= 0) return true;
    const W = Math.ceil(w * dpr), H = Math.ceil(h * dpr);

    // a. el fondo real detrás del texto (1 px CSS basta para medir la luz)
    tam(cFondo, w, h);
    dibujarFondo(R, 1);
    let datos;
    try { datos = xFondo.getImageData(0, 0, w, h); }
    catch (e) { fallo = true; return true; }
    const d = datos.data, U = umbral();
    const modo = decidir();

    // destino (capa fija o lienzo de la celda)
    const destino = () => {
      if (local) {
        const cv = local.c, cajaL = local.caja.getBoundingClientRect();
        tam(cv, W, H);
        Object.assign(cv.style, { left: (R.x0 - cajaL.left - local.caja.clientLeft) + "px", top: (R.y0 - cajaL.top - local.caja.clientTop) + "px", width: w + "px", height: h + "px" });
        local.x.setTransform(1, 0, 0, 1, 0, 0);
        local.x.clearRect(0, 0, W, H);
        return local.x;
      }
      sucioCapa.push([R.x0 * dpr, R.y0 * dpr, W, H]);
      return cc;
    };
    const directo = (negro) => {   // todo el texto de un solo color
      const x = destino();
      x.setTransform(dpr, 0, 0, dpr, (local ? -R.x0 : 0) * dpr, (local ? -R.y0 : 0) * dpr);
      letras(x, vivas, vivas.map(() => negro), dpr);
      x.setTransform(1, 0, 0, 1, 0, 0);
      return true;
    };

    if (modo === "pixel") {
      // MODO PÍXEL (como «Diferencia» de Photoshop, solo donde hace falta):
      // blanco salvo los píxeles de letra que caen sobre un color claro.
      let mp = mapas.get(el);
      // vistazo rápido: si nada bajo las letras llega a la tolerancia → todo blanco
      let maxLuz = 0;
      for (const v of vivas) {
        const gx0 = Math.max(0, Math.floor(v.x - R.x0)), gy0 = Math.max(0, Math.floor(v.y - R.y0));
        const gx1 = Math.min(w, Math.ceil(v.x + v.g.w - R.x0)), gy1 = Math.min(h, Math.ceil(v.y + v.g.h - R.y0));
        for (let y = gy0; y < gy1; y++) for (let x = gx0, q = (y * w + gx0) * 4; x < gx1; x++, q += 4) {
          const l = luz(d[q], d[q + 1], d[q + 2]); if (l > maxLuz) maxLuz = l;
        }
      }
      if (maxLuz < U - BANDA) { if (mp) mp.negro = null; return directo(0); }

      // a resolución de pantalla, píxel a píxel
      tam(cFondo, W, H);
      dibujarFondo(R, dpr);
      let dd;
      try { dd = xFondo.getImageData(0, 0, W, H).data; }
      catch (e) { fallo = true; return true; }
      const n = W * H;
      if (!mp) { mp = { cv: document.createElement("canvas") }; mapas.set(el, mp); }
      const mismo = mp.negro && mp.W === W && mp.H === H;
      const negro = mismo ? mp.negro : new Uint8Array(n);
      const lz = luces(dd, W, H, Math.round(grano() * dpr));
      tam(mp.cv, W, H);
      const xc = mp.cv.getContext("2d");
      const campo = xc.createImageData(W, H), c = campo.data;
      let hayN = false, hayB = false;
      for (let i = 0, q = 0; i < n; i++, q += 4) {
        const l = lz[i];
        const b = l >= U + BANDA ? 1 : l < U - BANDA ? 0 : (mismo ? negro[i] : (l >= U ? 1 : 0));
        negro[i] = b;
        const t = b ? 0 : 255;
        c[q] = c[q + 1] = c[q + 2] = t; c[q + 3] = 255;
        if (b) hayN = true; else hayB = true;
      }
      mp.negro = negro; mp.W = W; mp.H = H;
      if (!hayN) return directo(0);
      if (!hayB) return directo(1);
      xc.putImageData(campo, 0, 0);
      // recortar el mapa blanco/negro con la forma exacta de las letras (corte limpio)
      tam(cMascara, W, H); tam(cComp, W, H);
      xMascara.setTransform(1, 0, 0, 1, 0, 0);
      xMascara.clearRect(0, 0, W, H);
      xMascara.setTransform(dpr, 0, 0, dpr, -R.x0 * dpr, -R.y0 * dpr);
      letras(xMascara, vivas, vivas.map(() => 0), dpr);
      xComp.setTransform(1, 0, 0, 1, 0, 0);
      xComp.globalCompositeOperation = "copy";
      xComp.imageSmoothingEnabled = false;
      xComp.drawImage(mp.cv, 0, 0);
      xComp.globalCompositeOperation = "destination-in";
      xComp.drawImage(cMascara, 0, 0);
      xComp.globalCompositeOperation = "source-over";
      const x = destino();
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.drawImage(cComp, local ? 0 : R.x0 * dpr, local ? 0 : R.y0 * dpr);
      return true;
    }

    // b. qué parte de cada letra cae sobre un color claro
    //    (se mira el centro de la letra: los bordes son aire alrededor)
    const grupos = new Map();   // letra / palabra / texto → [claros, total]
    const clave = (v) => (modo === "texto" ? 0 : modo === "palabra" ? v.g.palabra : v.i);
    for (const v of vivas) {
      const mx = v.g.w * 0.15, my = v.g.h * 0.2;
      const gx0 = Math.max(0, Math.floor(v.x + mx - R.x0)), gy0 = Math.max(0, Math.floor(v.y + my - R.y0));
      const gx1 = Math.min(w, Math.ceil(v.x + v.g.w - mx - R.x0)), gy1 = Math.min(h, Math.ceil(v.y + v.g.h - my - R.y0));
      let claros = 0, total = 0;
      for (let y = gy0; y < gy1; y++) for (let x = gx0, q = (y * w + gx0) * 4; x < gx1; x++, q += 4) {
        total++; if (luz(d[q], d[q + 1], d[q + 2]) >= U) claros++;
      }
      const k = clave(v), gr = grupos.get(k) || [0, 0];
      gr[0] += claros; gr[1] += total; grupos.set(k, gr);
    }
    // c. decisión con memoria: pasa a negro si más de la mitad es claro;
    //    vuelve a blanco solo cuando baja bastante
    let est = estados.get(el);
    if (!est || est.length !== L.length) { est = new Uint8Array(L.length); estados.set(el, est); }
    const colores = vivas.map((v) => {
      const [claros, total] = grupos.get(clave(v));
      const parte = total ? claros / total : 0;
      let negro = est[v.i];
      if (!negro && parte >= PROPORCION) negro = 1;
      else if (negro && parte < VUELTA) negro = 0;
      est[v.i] = negro;
      return negro;
    });

    // d. dibujar
    const x = destino();
    x.setTransform(dpr, 0, 0, dpr, (local ? -R.x0 : 0) * dpr, (local ? -R.y0 : 0) * dpr);
    letras(x, vivas, colores, dpr);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return true;
  }

  /* ---------- textos que se mueven con la página (rejillas) ---------- */
  const fijos = new WeakMap(), locales = new Map(), anidados = new WeakMap();
  function esFijo(el) {
    if (!fijos.has(el)) {
      let f = false;
      for (let e = el; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).position === "fixed") { f = true; break; }
      fijos.set(el, f);
    }
    return fijos.get(el);
  }
  // un texto dentro de otro que ya se pinta (p. ej. letras dentro del nombre) no se pinta dos veces
  function anidado(el) {
    if (!anidados.has(el)) anidados.set(el, !!(el.parentElement && el.parentElement.closest(TEXTOS)));
    return anidados.get(el);
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
  function fotograma() {
    if (fallo) { apagar(); return; }
    if (!document.hidden) {
      const t0 = performance.now();
      memo = new Map(); memoRecorte = new Map(); medios = null;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.ceil(innerWidth * dpr), ch = Math.ceil(innerHeight * dpr);
      if (capa.width !== cw || capa.height !== ch) { tam(capa, cw, ch); sucioCapa = []; }
      const ancho = innerWidth + "px", alto = innerHeight + "px";
      if (capa.style.width !== ancho) capa.style.width = ancho;
      if (capa.style.height !== alto) capa.style.height = alto;
      cc.setTransform(1, 0, 0, 1, 0, 0);
      for (const [zx, zy, zw, zh] of sucioCapa) cc.clearRect(zx - 2, zy - 2, zw + 4, zh + 4);
      sucioCapa = [];
      if (animando.size || document.querySelector("[data-dif-vivo]")) ensuciar();
      let localesEsteFotograma = 0;
      const maxLocales = animando.size ? 12 : 4;
      for (const el of document.querySelectorAll(TEXTOS)) {
        if (anidado(el)) continue;
        const r = el.getBoundingClientRect();
        if (esFijo(el)) {
          if (!r.width || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
          pintarTexto(el, dpr);
        } else {
          const L = lienzoLocal(el);
          if (!L || !L.sucio || localesEsteFotograma >= maxLocales) continue;
          if (!r.width || r.bottom < -100 || r.top > innerHeight + 100 || r.right < 0 || r.left > innerWidth) continue;
          localesEsteFotograma++;
          L.sucio = !pintarTexto(el, dpr, L) || animando.size > 0;
        }
        if (fallo) break;
      }
      window.Diferencia.ms = performance.now() - t0;
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
