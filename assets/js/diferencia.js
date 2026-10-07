/* =====================================================================
   CONTRASTE DE LAS LETRAS SOBRE FOTOS
   ---------------------------------------------------------------------
   Cada píxel de letra mira el píxel de la foto que tiene justo debajo:
     modo "blanco-negro"  → blanco sobre oscuro, negro sobre claro
     modo "photoshop"     → el opuesto exacto del fondo (como el modo de
                            fusión «Diferencia» de Photoshop con blanco)
   Se calcula a la resolución real de la pantalla (también retina) y,
   mientras algo se mueve o cambia de luz (fundidos, carteles…), se
   recalcula en cada fotograma para que nunca vaya con retraso.
   Modo, umbral y suavizado: assets/js/ajustes.js → diferencia.
   ===================================================================== */
(function () {
  const AJ = (window.AJUSTES && window.AJUSTES.diferencia) || {};
  const ACTIVO = AJ.activo !== false;
  const TEXTOS = AJ.textos || ".menu a, .pase__titulo, .pase__datos, .etiqueta-cursor, .celda-proyecto__txt, [data-dif]";
  const suavizado = Math.max(0, Number(AJ.suavizado) || 0);
  const INVERTIR = AJ.modo === "photoshop";
  let umbral = Number.isFinite(Number(AJ.umbral)) ? Number(AJ.umbral) : 0.179;
  const lineal = Float32Array.from({ length: 256 }, (_, i) => {
    const x = i / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const T = { fondo: 0, mapa: 0, letras: 0, glifos: 0 };

  function claro(r, g, b) {
    return 0.2126 * lineal[r] + 0.7152 * lineal[g] + 0.0722 * lineal[b] >= umbral;
  }
  function mapear(src, dstL) {
    if (INVERTIR) {   // «Diferencia» de Photoshop con letra blanca: 255 − fondo, canal a canal
      for (let p = 0; p < src.length; p += 4) {
        dstL[p] = 255 - src[p]; dstL[p + 1] = 255 - src[p + 1]; dstL[p + 2] = 255 - src[p + 2];
        dstL[p + 3] = 255;
      }
      return;
    }
    for (let p = 0; p < src.length; p += 4) {
      const tinta = claro(src[p], src[p + 1], src[p + 2]) ? 0 : 255;
      dstL[p] = dstL[p + 1] = dstL[p + 2] = tinta;
      dstL[p + 3] = 255;
    }
  }
  function colorPara(hex) {
    const s = hex.replace("#", "");
    const c = s.length === 3 ? [...s].map((x) => parseInt(x + x, 16)) : [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
    const tinta = INVERTIR ? "#" + c.map((v) => (255 - v).toString(16).padStart(2, "0")).join("")
      : claro(...c) ? "#000000" : "#FFFFFF";
    return { letra: tinta };
  }
  window.Diferencia = {
    colorPara,
    umbral: (valor) => {
      if (valor !== undefined && Number.isFinite(Number(valor))) umbral = Math.max(0, Math.min(1, Number(valor)));
      return umbral;
    },
    tiempos: () => T,
  };
  if (!ACTIVO) return;

  /* =================== 2. DIBUJO SOBRE LA PÁGINA =================== */
  // Estilos propios: así la capa funciona aunque el navegador tenga guardado un CSS antiguo
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
  const [cFondo, xFondo] = lienzo();
  const [cSuave, xSuave] = lienzo();     // fondo reconstruido (a resolución de pantalla)
  const [cCampoL, xCampoL] = lienzo();   // campo de color letra (a resolución de pantalla)
  const [cMascara, xMascara] = lienzo(); // forma de las letras (a resolución de pantalla)
  const [cComp, xComp] = lienzo();       // composición
  const [cTemp, xTemp] = lienzo();       // desenfoque a baja resolución

  const tam = (c, w, h) => { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } };
  const colorFondoPagina = () => getComputedStyle(document.body).backgroundColor;

  // ---------- opacidad y filtros acumulados de un elemento ----------
  // (se guardan durante el fotograma para no recalcular lo mismo en cada letra)
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

  // ---------- fotos / vídeos que forman el fondo ----------
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
  let estable = true;
  // k = píxeles reales por píxel CSS (2 en pantallas retina): así el
  // blanco/negro cambia exactamente donde cambia la foto, sin escalones
  function dibujarFondo(R, k) {
    estable = true;
    xFondo.setTransform(1, 0, 0, 1, 0, 0);
    xFondo.globalAlpha = 1; xFondo.filter = "none";
    xFondo.fillStyle = colorFondoPagina();
    xFondo.fillRect(0, 0, cFondo.width, cFondo.height);
    xFondo.setTransform(k, 0, 0, k, 0, 0);
    for (const { m, r, nw, nh } of mediosDelFotograma()) {
      if (r.right <= R.x0 || r.left >= R.x1 || r.bottom <= R.y0 || r.top >= R.y1) continue;
      const { alfa, filtro, cs } = estiloAcumulado(m);
      if (alfa < 0.99 || cs.transform !== "none" && cs.transform !== "matrix(1, 0, 0, 1, 0, 0)" || cs.animationName !== "none") estable = false;
      if (alfa <= 0.003) continue;
      // object-fit / object-position (como lo pinta el navegador)
      let s;
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
      // solo el trozo que hace falta (más margen para el desenfoque)
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
          // desenfoque a resolución reducida (se ve igual y cuesta mucho menos)
          const red = Math.min(8, blur / 2), tw = Math.max(1, Math.ceil((ax1 - ax0) / red)), th = Math.max(1, Math.ceil((ay1 - ay0) / red));
          tam(cTemp, tw, th);
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

  // ---------- las letras de un texto (posición, fuente, opacidad, desenfoque) ----------
  const metricas = new Map();
  function medidas(fuente) {
    if (!metricas.has(fuente)) {
      xMascara.font = fuente;
      const m = xMascara.measureText("Hg");
      metricas.set(fuente, { asc: m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent, desc: m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent });
    }
    return metricas.get(fuente);
  }
  const rango = document.createRange();
  function glifos(el) {
    const lista = [];
    const recorrer = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const cache = new Map();
    for (let n = recorrer.nextNode(); n; n = recorrer.nextNode()) {
      const txt = n.textContent;
      if (!txt.trim()) continue;
      const p = n.parentElement;
      let info = cache.get(p);
      if (!info) {
        const acu = estiloAcumulado(p), cs = acu.cs;
        info = {
          fuente: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
          tam: parseFloat(cs.fontSize),
          trans: cs.textTransform,
          alfa: acu.alfa,
          blur: radioBlur(acu.filtro),
          subrayado: /underline/.test(estiloAcumulado(p.closest("a") || p).cs.textDecorationLine),
        };
        cache.set(p, info);
      }
      if (info.alfa <= 0.003) continue;
      for (let k = 0; k < txt.length; k++) {
        let ch = txt[k];
        if (!ch.trim() || ch === " ") continue;
        rango.setStart(n, k); rango.setEnd(n, k + 1);
        const r = rango.getBoundingClientRect();
        if (!r.width) continue;
        if (info.trans === "uppercase") ch = ch.toUpperCase();
        else if (info.trans === "lowercase") ch = ch.toLowerCase();
        lista.push({ ch, x: r.left, y: r.top, w: r.width, h: r.height, ...info });
      }
    }
    return lista;
  }

  // ---------- pintar un texto ----------
  let fallo = false;
  // local = null → capa fija (textos que no se mueven: menú, inicio, ratón)
  // local = {c, x} → lienzo propio pegado al texto (textos que se mueven con la página)
  function pintarTexto(el, dpr, local = null) {
    const t0 = performance.now();
    const G = glifos(el);
    T.glifos += performance.now() - t0;
    if (!G.length) return true;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, margen = 0;
    for (const g of G) {
      x0 = Math.min(x0, g.x); y0 = Math.min(y0, g.y); x1 = Math.max(x1, g.x + g.w); y1 = Math.max(y1, g.y + g.h);
      margen = Math.max(margen, g.blur * 2 + g.tam * 0.25);
    }
    const R = local
      ? { x0: Math.floor(x0 - margen), y0: Math.floor(y0 - margen), x1: Math.ceil(x1 + margen), y1: Math.ceil(y1 + margen) }
      : { x0: Math.floor(Math.max(0, x0 - margen)), y0: Math.floor(Math.max(0, y0 - margen)),
          x1: Math.ceil(Math.min(innerWidth, x1 + margen)), y1: Math.ceil(Math.min(innerHeight, y1 + margen)) };
    const w = R.x1 - R.x0, h = R.y1 - R.y0;
    if (w <= 0 || h <= 0) return true;

    // a. fondo real, a la resolución de la pantalla
    let t = performance.now();
    const W = Math.ceil(w * dpr), H = Math.ceil(h * dpr);
    tam(cFondo, W, H);
    dibujarFondo(R, dpr);
    let datos;
    try {
      if (suavizado) {
        tam(cSuave, W, H);
        xSuave.setTransform(1, 0, 0, 1, 0, 0);
        xSuave.clearRect(0, 0, W, H);
        xSuave.filter = `blur(${suavizado * dpr}px)`;
        xSuave.drawImage(cFondo, 0, 0);
        xSuave.filter = "none";
        datos = xSuave.getImageData(0, 0, W, H);
      } else datos = xFondo.getImageData(0, 0, W, H);
    }
    catch (e) { fallo = true; return; }
    T.fondo += performance.now() - t; t = performance.now();

    // b. campo de color de la letra, píxel a píxel (sin reescalar)
    tam(cCampoL, W, H);
    const campoL = xCampoL.createImageData(W, H);
    mapear(datos.data, campoL.data);
    xCampoL.putImageData(campoL, 0, 0);
    T.mapa += performance.now() - t; t = performance.now();

    // c. recortar el campo con la forma de las letras
    tam(cMascara, W, H); tam(cComp, W, H);
    if (local) {   // el lienzo propio se coloca justo encima del texto, dentro de su caja
      const caja = local.caja.getBoundingClientRect();
      tam(local.c, W, H);
      Object.assign(local.c.style, { left: (R.x0 - caja.left - local.caja.clientLeft) + "px", top: (R.y0 - caja.top - local.caja.clientTop) + "px", width: w + "px", height: h + "px" });
      local.x.clearRect(0, 0, W, H);
    }
      xMascara.setTransform(1, 0, 0, 1, 0, 0);
      xMascara.clearRect(0, 0, W, H);
      xMascara.setTransform(dpr, 0, 0, dpr, -R.x0 * dpr, -R.y0 * dpr);
      xMascara.fillStyle = "#fff";
      for (const g of G) {
        const m = medidas(g.fuente);
        const base = g.y + (g.h - (m.asc + m.desc)) / 2 + m.asc;
        xMascara.globalAlpha = Math.min(1, g.alfa);
        if (g.blur > 0.4) {
          // letra desenfocada: se dibuja pequeña con el desenfoque y se amplía (mucho más rápido)
          const k = Math.max(1, Math.min(6, g.blur / 1.2)), mg = g.blur * 2;
          const bx = g.x - mg, by = g.y - mg, bw = g.w + mg * 2, bh = g.h + mg * 2;
          const tw = Math.max(1, Math.ceil(bw * dpr / k)), th = Math.max(1, Math.ceil(bh * dpr / k)), f = dpr / k;
          tam(cTemp, tw, th);
          xTemp.setTransform(1, 0, 0, 1, 0, 0); xTemp.filter = "none"; xTemp.globalAlpha = 1; xTemp.clearRect(0, 0, tw, th);
          xTemp.setTransform(f, 0, 0, f, -bx * f, -by * f);
          xTemp.filter = `blur(${(g.blur * f).toFixed(2)}px)`;
          xTemp.font = g.fuente; xTemp.fillStyle = "#fff";
          xTemp.fillText(g.ch, g.x, base);
          xMascara.filter = "none";
          xMascara.drawImage(cTemp, 0, 0, tw, th, bx, by, bw, bh);
          continue;
        }
        xMascara.font = g.fuente;
        xMascara.filter = "none";
        xMascara.fillText(g.ch, g.x, base);
        if (g.subrayado) xMascara.fillRect(g.x, base + g.tam * 0.25, g.w, 1);
      }
      xComp.globalCompositeOperation = "copy";
      xComp.drawImage(cCampoL, 0, 0);
      xComp.globalCompositeOperation = "destination-in";
      xComp.drawImage(cMascara, 0, 0);
      if (local) local.x.drawImage(cComp, 0, 0);
      else cc.drawImage(cComp, R.x0 * dpr, R.y0 * dpr);
    T.letras += performance.now() - t;
    return estable;
  }

  // ---------- textos que se mueven con la página (títulos sobre las fotos en el móvil) ----------
  // Van en un lienzo propio dentro de su foto: se desplazan con ella sin retraso
  // y solo se recalculan cuando cambia algo (foto cargada, aparición, tamaño).
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
  // Mientras haya algo animándose (fundidos, el cartel que se va, el brillo
  // de la portada…) los textos se recalculan en cada fotograma: así el
  // color sigue a la foto en tiempo real y no salta al final.
  const animando = new Set();
  const empieza = (e) => { animando.add(e.target); ensuciar(); };
  const acaba = (e) => { animando.delete(e.target); ensuciar(); };
  document.addEventListener("transitionrun", empieza, true);
  document.addEventListener("transitionend", acaba, true);
  document.addEventListener("transitioncancel", acaba, true);
  document.addEventListener("animationstart", empieza, true);
  document.addEventListener("animationend", acaba, true);
  document.addEventListener("animationcancel", acaba, true);
  // por si un evento de fin se pierde (elemento borrado, pestaña oculta…)
  setInterval(() => { for (const el of animando) if (!el.isConnected) animando.delete(el); }, 2000);

  // ---------- bucle ----------
  function fotograma() {
    if (fallo) { apagar(); return; }
    if (!document.hidden) {
      const t0 = performance.now();
      memo = new Map(); medios = null;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // la capa mide EXACTAMENTE lo visible (en móvil "100vh" es más alto que la pantalla con la barra del navegador)
      tam(capa, Math.ceil(innerWidth * dpr), Math.ceil(innerHeight * dpr));
      const ancho = innerWidth + "px", alto = innerHeight + "px";
      if (capa.style.width !== ancho) capa.style.width = ancho;
      if (capa.style.height !== alto) capa.style.height = alto;
      cc.setTransform(1, 0, 0, 1, 0, 0);
      cc.clearRect(0, 0, capa.width, capa.height);
      let localesEsteFotograma = 0;
      if (animando.size) ensuciar();
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
          L.sucio = !pintarTexto(el, dpr, L);   // si las fotos aún están apareciendo, se repite
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
