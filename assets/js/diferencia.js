/* =====================================================================
   DIFERENCIA DIRIGIDA  ·  color de LETRA y BORDE a partir del fondo real
   ---------------------------------------------------------------------
   MATEMÁTICA (modelo en assets/js/diferencia-modelo.js):
     1. base(fondo)  = |fondo − mezcla|  por canal RGB   (Difference de Photoshop)
                       mezcla letra = #FFFFFF · mezcla borde = #18A8FF
     2. Cada boya {bg, out}: residuo = OKLab(out) − OKLab(base(bg))
     3. Los residuos se interpolan por el espacio de color del FONDO (en
        OKLab) con una RBF gaussiana  φ(d) = exp(−(d / radio)²)  resolviendo
        el sistema Φ·w = residuos → en cada boya la salida es EXACTA.
     4. salida(fondo) = OKLab→RGB( OKLab(base(fondo)) + Σ wᵢ·φ(|fondo − bgᵢ|) )
     Lejos de las boyas la corrección tiende a 0 → Difference pura.
     Todo es continuo: sin tablas, sin bloques, sin categorías.

   DIBUJO (para que funcione píxel a píxel sobre las fotos):
     Una capa <canvas> transparente encima de la página. En cada fotograma,
     para cada texto (menú, títulos del inicio, info del ratón…):
       a. se reconstruye el trozo de fondo que tiene detrás (las fotos con
          su zoom, desenfoque y opacidad de ese instante; el hilo blanco
          NO se incluye, así no afecta al color),
       b. a cada píxel se le aplica salida(fondo) → un campo de color para
          la letra y otro para el borde,
       c. se recortan con la forma exacta de las letras (mismas fuentes,
          posiciones, opacidades y desenfoques que el texto real).
     El texto real sigue en la página (invisible) para clics y buscadores.

   Si el navegador no deja leer las fotos (abrir la web con doble clic en
   Chrome), se usa el Difference base con CSS (sin correcciones).
   ===================================================================== */
(function () {
  const AJ = (window.AJUSTES && window.AJUSTES.diferencia) || {};
  const ACTIVO = AJ.activo !== false;
  const TEXTOS = AJ.textos || ".menu a, .pase__titulo, .pase__datos, .etiqueta-cursor, .celda-proyecto__txt, [data-dif]";
  const LUT_N = 33;                                   // resolución de la tabla de consulta (33×33×33)

  /* =================== 1. MATEMÁTICA DEL COLOR =================== */
  const hexARgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const rgbAHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
  const aLineal = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const aSrgb = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

  function rgbAOklab(rgb) {
    const r = aLineal(rgb[0]), g = aLineal(rgb[1]), b = aLineal(rgb[2]);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ];
  }
  function oklabARgb(lab) {
    const l = Math.pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3);
    const m = Math.pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3);
    const s = Math.pow(lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2], 3);
    const rgb = [
      aSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      aSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      aSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
    ];
    return rgb.map((v) => (isFinite(v) ? Math.max(0, Math.min(255, v)) : 0));
  }
  const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

  // Resuelve A·X = B (A n×n, B n×3) por eliminación gaussiana con pivote
  function resolver(A, B) {
    const n = A.length, M = A.map((fila, i) => fila.concat(B[i]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let f = c + 1; f < n; f++) if (Math.abs(M[f][c]) > Math.abs(M[p][c])) p = f;
      [M[c], M[p]] = [M[p], M[c]];
      for (let f = 0; f < n; f++) {
        if (f === c) continue;
        const k = M[f][c] / M[c][c];
        for (let j = c; j < n + 3; j++) M[f][j] -= k * M[c][j];
      }
    }
    return M.map((fila, i) => [fila[n] / M[i][i], fila[n + 1] / M[i][i], fila[n + 2] / M[i][i]]);
  }

  // Crea la función salida(fondo) para un color de mezcla y sus boyas
  function crearFuncion(mezclaHex, boyas, radio) {
    const mezcla = hexARgb(mezclaHex);
    const base = (bg) => [Math.abs(bg[0] - mezcla[0]), Math.abs(bg[1] - mezcla[1]), Math.abs(bg[2] - mezcla[2])];
    const B = boyas.map((b) => {
      const bg = hexARgb(b.bg), out = hexARgb(b.out);
      const labOut = rgbAOklab(out), labBase = rgbAOklab(base(bg));
      return { bg, out, labBg: rgbAOklab(bg), residuo: [labOut[0] - labBase[0], labOut[1] - labBase[1], labOut[2] - labBase[2]] };
    });
    const r2 = radio * radio;
    const phi = (d2) => Math.exp(-d2 / r2);
    const W = B.length ? resolver(B.map((a) => B.map((b) => phi(dist2(a.labBg, b.labBg)))), B.map((b) => b.residuo)) : [];
    const exactas = new Map(B.map((b) => [(b.bg[0] << 16) | (b.bg[1] << 8) | b.bg[2], b.out]));

    function f(bg) {
      const exacta = exactas.get(((bg[0] & 255) << 16) | ((bg[1] & 255) << 8) | (bg[2] & 255));
      if (exacta && Number.isInteger(bg[0]) && Number.isInteger(bg[1]) && Number.isInteger(bg[2])) return exacta.slice();
      const lab = rgbAOklab(base(bg)), lb = rgbAOklab(bg);
      for (let i = 0; i < B.length; i++) {
        const k = phi(dist2(lb, B[i].labBg));
        lab[0] += W[i][0] * k; lab[1] += W[i][1] * k; lab[2] += W[i][2] * k;
      }
      return oklabARgb(lab);
    }
    f.exactas = exactas;
    return f;
  }

  // Tabla de consulta 33³ (interpolación trilineal) para ir rápido píxel a píxel
  function crearLUT(f) {
    const N = LUT_N, paso = 255 / (N - 1), lut = new Float32Array(N * N * N * 3);
    let k = 0;
    for (let r = 0; r < N; r++) for (let g = 0; g < N; g++) for (let b = 0; b < N; b++) {
      const o = f([r * paso, g * paso, b * paso]);
      lut[k++] = o[0]; lut[k++] = o[1]; lut[k++] = o[2];
    }
    return lut;
  }

  let modelo, fLetra, fBorde, lutLetra, lutBorde, bitsExactos;
  function construir(m) {
    modelo = m || window.DIFERENCIA_MODELO;
    const radio = modelo.interpolation.radius;
    fLetra = crearFuncion(modelo.base.letterBlend, modelo.letterAnchors || [], radio);
    fBorde = crearFuncion(modelo.base.borderBlend, modelo.borderAnchors || [], radio);
    lutLetra = crearLUT(fLetra);
    lutBorde = crearLUT(fBorde);
    // fondos exactamente iguales a una boya → salida exacta (sin pasar por la tabla)
    bitsExactos = new Set([...fLetra.exactas.keys(), ...fBorde.exactas.keys()]);
    document.documentElement.style.setProperty("--dif-letra", modelo.base.letterBlend);
    document.documentElement.style.setProperty("--dif-borde", modelo.base.borderBlend);
  }
  construir();

  // Mapea un bloque de píxeles de fondo → campos de color de letra y de borde
  function mapear(src, dstL, dstB) {
    const N = LUT_N, N2 = N * N, esc = (N - 1) / 255;
    for (let p = 0; p < src.length; p += 4) {
      const r = src[p], g = src[p + 1], b = src[p + 2];
      const clave = (r << 16) | (g << 8) | b;
      if (bitsExactos.has(clave)) {
        const L = fLetra([r, g, b]), Bo = fBorde([r, g, b]);
        dstL[p] = L[0]; dstL[p + 1] = L[1]; dstL[p + 2] = L[2]; dstL[p + 3] = 255;
        dstB[p] = Bo[0]; dstB[p + 1] = Bo[1]; dstB[p + 2] = Bo[2]; dstB[p + 3] = 255;
        continue;
      }
      const fr = r * esc, fg = g * esc, fb = b * esc;
      const r0 = Math.min(N - 2, fr | 0), g0 = Math.min(N - 2, fg | 0), b0 = Math.min(N - 2, fb | 0);
      const tr = fr - r0, tg = fg - g0, tb = fb - b0;
      const i000 = (r0 * N2 + g0 * N + b0) * 3;
      const i100 = i000 + N2 * 3, i010 = i000 + N * 3, i001 = i000 + 3;
      const i110 = i100 + N * 3, i101 = i100 + 3, i011 = i010 + 3, i111 = i110 + 3;
      const w000 = (1 - tr) * (1 - tg) * (1 - tb), w100 = tr * (1 - tg) * (1 - tb), w010 = (1 - tr) * tg * (1 - tb), w001 = (1 - tr) * (1 - tg) * tb;
      const w110 = tr * tg * (1 - tb), w101 = tr * (1 - tg) * tb, w011 = (1 - tr) * tg * tb, w111 = tr * tg * tb;
      for (let c = 0; c < 3; c++) {
        dstL[p + c] = lutLetra[i000 + c] * w000 + lutLetra[i100 + c] * w100 + lutLetra[i010 + c] * w010 + lutLetra[i001 + c] * w001
                    + lutLetra[i110 + c] * w110 + lutLetra[i101 + c] * w101 + lutLetra[i011 + c] * w011 + lutLetra[i111 + c] * w111;
        dstB[p + c] = lutBorde[i000 + c] * w000 + lutBorde[i100 + c] * w100 + lutBorde[i010 + c] * w010 + lutBorde[i001 + c] * w001
                    + lutBorde[i110 + c] * w110 + lutBorde[i101 + c] * w101 + lutBorde[i011 + c] * w011 + lutBorde[i111 + c] * w111;
      }
      dstL[p + 3] = 255; dstB[p + 3] = 255;
    }
  }

  // Para el laboratorio y para quien quiera usarla: salida exacta para un color
  function colorPara(fondoHex) {
    const bg = hexARgb(fondoHex);
    return { letra: rgbAHex(fLetra(bg)), borde: rgbAHex(fBorde(bg)) };
  }

  window.Diferencia = {
    colorPara, construir, hexARgb, rgbAHex,
    letra: (rgb) => fLetra(rgb), borde: (rgb) => fBorde(rgb),
    modelo: () => modelo,
    tiempos: () => T,
  };
  if (!ACTIVO) return;

  /* =================== 2. DIBUJO SOBRE LA PÁGINA =================== */
  const capa = document.createElement("canvas");
  capa.className = "dif-capa";
  capa.setAttribute("aria-hidden", "true");
  document.body.appendChild(capa);
  const cc = capa.getContext("2d");

  const lienzo = () => { const c = document.createElement("canvas"); return [c, c.getContext("2d", { willReadFrequently: true })]; };
  const [cFondo, xFondo] = lienzo();     // fondo reconstruido (1 px CSS)
  const [cCampoL, xCampoL] = lienzo();   // campo de color letra (1 px CSS)
  const [cCampoB, xCampoB] = lienzo();   // campo de color borde
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
      if (!r.width || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
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
          const k = Math.min(8, blur / 2), tw = Math.max(1, Math.ceil((ax1 - ax0) / k)), th = Math.max(1, Math.ceil((ay1 - ay0) / k));
          tam(cTemp, tw, th);
          xTemp.filter = "none"; xTemp.clearRect(0, 0, tw, th);
          xTemp.filter = filtro.replace(/blur\(([\d.]+)px\)/g, (_, v) => `blur(${(parseFloat(v) / k).toFixed(2)}px)`);
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
          trazo: parseFloat(cs.webkitTextStrokeWidth) || 0,
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
  function pintarTexto(el, dpr) {
    const t0 = performance.now();
    const G = glifos(el);
    T.glifos += performance.now() - t0;
    if (!G.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, margen = 0;
    for (const g of G) {
      x0 = Math.min(x0, g.x); y0 = Math.min(y0, g.y); x1 = Math.max(x1, g.x + g.w); y1 = Math.max(y1, g.y + g.h);
      margen = Math.max(margen, g.trazo + g.blur * 2 + g.tam * 0.25);
    }
    const R = {
      x0: Math.floor(Math.max(0, x0 - margen)), y0: Math.floor(Math.max(0, y0 - margen)),
      x1: Math.ceil(Math.min(innerWidth, x1 + margen)), y1: Math.ceil(Math.min(innerHeight, y1 + margen)),
    };
    const w = R.x1 - R.x0, h = R.y1 - R.y0;
    if (w <= 0 || h <= 0) return;

    // a. fondo real
    let t = performance.now();
    tam(cFondo, w, h);
    dibujarFondo(R);
    let datos;
    try { datos = xFondo.getImageData(0, 0, w, h); }
    catch (e) { fallo = true; return; }
    T.fondo += performance.now() - t; t = performance.now();

    // b. campos de color (salida(fondo) píxel a píxel)
    tam(cCampoL, w, h); tam(cCampoB, w, h);
    const campoL = xCampoL.createImageData(w, h), campoB = xCampoB.createImageData(w, h);
    mapear(datos.data, campoL.data, campoB.data);
    xCampoL.putImageData(campoL, 0, 0);
    xCampoB.putImageData(campoB, 0, 0);
    T.mapa += performance.now() - t; t = performance.now();

    // c. recortar con la forma de las letras: primero el borde, luego la letra
    const W = Math.ceil(w * dpr), H = Math.ceil(h * dpr);
    tam(cMascara, W, H); tam(cComp, W, H);
    for (const pasada of ["borde", "letra"]) {
      xMascara.setTransform(1, 0, 0, 1, 0, 0);
      xMascara.clearRect(0, 0, W, H);
      xMascara.setTransform(dpr, 0, 0, dpr, -R.x0 * dpr, -R.y0 * dpr);
      xMascara.fillStyle = xMascara.strokeStyle = "#fff";
      xMascara.lineJoin = "round";
      let hay = false;
      for (const g of G) {
        if (pasada === "borde" && g.trazo <= 0) continue;
        hay = true;
        const m = medidas(g.fuente);
        const base = g.y + (g.h - (m.asc + m.desc)) / 2 + m.asc;
        xMascara.globalAlpha = Math.min(1, g.alfa);
        if (g.blur > 0.4) {
          // letra desenfocada: se dibuja pequeña con el desenfoque y se amplía (mucho más rápido)
          const k = Math.max(1, Math.min(6, g.blur / 1.2)), mg = g.blur * 2 + g.trazo;
          const bx = g.x - mg, by = g.y - mg, bw = g.w + mg * 2, bh = g.h + mg * 2;
          const tw = Math.max(1, Math.ceil(bw * dpr / k)), th = Math.max(1, Math.ceil(bh * dpr / k)), f = dpr / k;
          tam(cTemp, tw, th);
          xTemp.setTransform(1, 0, 0, 1, 0, 0); xTemp.filter = "none"; xTemp.globalAlpha = 1; xTemp.clearRect(0, 0, tw, th);
          xTemp.setTransform(f, 0, 0, f, -bx * f, -by * f);
          xTemp.filter = `blur(${(g.blur * f).toFixed(2)}px)`;
          xTemp.font = g.fuente; xTemp.fillStyle = xTemp.strokeStyle = "#fff"; xTemp.lineJoin = "round";
          if (pasada === "borde") { xTemp.lineWidth = g.trazo; xTemp.strokeText(g.ch, g.x, base); } else xTemp.fillText(g.ch, g.x, base);
          xMascara.filter = "none";
          xMascara.drawImage(cTemp, 0, 0, tw, th, bx, by, bw, bh);
          continue;
        }
        xMascara.font = g.fuente;
        xMascara.filter = "none";
        if (pasada === "borde") { xMascara.lineWidth = g.trazo; xMascara.strokeText(g.ch, g.x, base); }
        else {
          xMascara.fillText(g.ch, g.x, base);
          if (g.subrayado) xMascara.fillRect(g.x, base + g.tam * 0.25, g.w, 1);
        }
      }
      if (!hay) continue;
      xComp.globalCompositeOperation = "copy";
      xComp.imageSmoothingEnabled = true;
      xComp.drawImage(pasada === "borde" ? cCampoB : cCampoL, 0, 0, W, H);
      xComp.globalCompositeOperation = "destination-in";
      xComp.drawImage(cMascara, 0, 0);
      cc.drawImage(cComp, R.x0 * dpr, R.y0 * dpr);
    }
    T.letras += performance.now() - t;
  }
  const T = { fondo: 0, mapa: 0, letras: 0, glifos: 0 };

  // ---------- bucle ----------
  function fotograma() {
    if (fallo) { apagar(); return; }
    if (!document.hidden) {
      const t0 = performance.now();
      memo = new Map(); medios = null;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      tam(capa, Math.ceil(innerWidth * dpr), Math.ceil(innerHeight * dpr));
      cc.setTransform(1, 0, 0, 1, 0, 0);
      cc.clearRect(0, 0, capa.width, capa.height);
      for (const el of document.querySelectorAll(TEXTOS)) {
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
        pintarTexto(el, dpr);
        if (fallo) break;
      }
      window.Diferencia.ms = performance.now() - t0;   // tiempo del último fotograma (para medir)
    }
    requestAnimationFrame(fotograma);
  }
  function apagar() {
    document.documentElement.classList.remove("dif-activo");
    capa.remove();
  }

  document.documentElement.classList.add("dif-activo");
  requestAnimationFrame(fotograma);
})();
