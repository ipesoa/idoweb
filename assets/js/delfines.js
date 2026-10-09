/* =====================================================================
   DELFINES  ·  la broma del nombre
   ---------------------------------------------------------------------
   INICIO   salen dos chorros de delfines: de la I de IDOIA hacia la
            izquierda y de la N de GALVÁN hacia la derecha. Giran, caen,
            se amontonan abajo de verdad (unos encima de otros, sin
            atravesarse), se quedan unos segundos y se desvanecen.
            Van por encima de todo.
   CONTACT  igual, pero solo de la I, y siempre DEBAJO del texto.

   Se enciende/apaga, se cambia la imagen y se ajusta todo en el gestor
   (pestaña Delfines). Valores por defecto: ajustes.js → delfines.
   Física: assets/js/vendor/matter.min.js (se carga solo cuando hace falta).
   Pintado: un <canvas class="delfines"> que no bloquea ningún clic.
   ===================================================================== */
(function () {
  const pagina = document.body.dataset.pagina;
  if (!["inicio", "contact"].includes(pagina)) return;
  const enGestor = /[?&]vista=gestor/.test(location.search);
  const cfg = () => (window.AJUSTES && window.AJUSTES.delfines) || {};
  const activo = () => cfg()[pagina] !== false;
  const cuando = () => (pagina === "inicio" ? cfg().cuandoInicio : cfg().cuandoContact) || (pagina === "inicio" ? "las-dos" : "entrar");
  const azar = (a, b) => a + Math.random() * (b - a);

  /* ---------- carga perezosa de la física ---------- */
  let cargando = null;
  function cargarMatter() {
    if (window.Matter) return Promise.resolve(window.Matter);
    if (cargando) return cargando;
    const propio = [...document.scripts].find((s) => /delfines\.js/.test(s.src));
    const src = propio ? propio.src.replace(/delfines\.js.*$/, "vendor/matter.min.js") : "assets/js/vendor/matter.min.js";
    cargando = new Promise((ok, mal) => {
      const s = document.createElement("script");
      s.src = src; s.onload = () => ok(window.Matter); s.onerror = mal;
      document.head.append(s);
    });
    return cargando;
  }

  /* ---------- la imagen ---------- */
  const imagenes = {};
  function imagen(url) {
    if (!imagenes[url]) {
      imagenes[url] = new Promise((ok) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = () => (url.endsWith("delfin.png") ? ok(null) : imagen("assets/img/delfin.png").then(ok));
        im.src = url;
      });
    }
    return imagenes[url];
  }

  /* ---------- de dónde salen: la I y la N reales del nombre ----------
     Se buscan las letras en el texto de la cabecera y se mide dónde están
     en ese momento (sirve con cualquier tipografía, tamaño o pantalla). */
  function origenes() {
    const el = document.querySelector(".menu__nombre");
    if (!el) return [];
    const nodos = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) if (tw.currentNode.data.trim()) nodos.push(tw.currentNode);
    const letra = (buscar, desdeElFinal) => {
      const lista = desdeElFinal ? nodos.slice().reverse() : nodos;
      for (const n of lista) {
        const t = n.data.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        // (normalize no cambia la longitud de i/n: las posiciones valen)
        const i = desdeElFinal ? n.data.toLowerCase().lastIndexOf(buscar) : n.data.toLowerCase().indexOf(buscar);
        const j = i >= 0 ? i : desdeElFinal ? t.lastIndexOf(buscar) : t.indexOf(buscar);
        if (j < 0) continue;
        const r = document.createRange(); r.setStart(n, j); r.setEnd(n, j + 1);
        const b = r.getBoundingClientRect();
        if (b.width || b.height) return { x: b.left + b.width / 2, y: b.top + b.height * 0.55 };
      }
      return null;
    };
    const salida = [];
    const I = letra("i", false);
    if (I) salida.push({ ...I, lado: -1 });
    if (pagina === "inicio") { const N = letra("n", true); if (N) salida.push({ ...N, lado: 1 }); }
    return salida;
  }

  /* ---------- la escena ---------- */
  let escena = null;
  function parar() {
    if (!escena) return;
    cancelAnimationFrame(escena.raf);
    escena.lienzo.remove();
    removeEventListener("resize", escena.redimensionar);
    escena = null;
  }

  async function lanzar(forzar = false) {
    if (!forzar && !activo()) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches && !forzar) return;
    const C = { ...cfg() };
    let M, im;
    try { [M, im] = await Promise.all([cargarMatter(), imagen(C.imagen || "assets/img/delfin.png")]); }
    catch (e) { return; }
    if (!M || !im) return;
    parar();

    const lienzo = document.createElement("canvas");
    lienzo.className = "delfines" + (pagina === "contact" ? " delfines--debajo" : "");
    lienzo.setAttribute("aria-hidden", "true");
    document.body.append(lienzo);
    const ctx = lienzo.getContext("2d");
    let W = 0, H = 0;

    const motor = M.Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 6 });
    motor.gravity.y = 1;
    motor.gravity.scale = (C.gravedad || 450) / 1e6;     // px/s² → unidades de Matter (px/ms²)
    const SUELO = 0x0001, DELFIN = 0x0002;
    const muro = (o) => M.Bodies.rectangle(0, 0, 10, 10, { isStatic: true, friction: 0.05, collisionFilter: { category: SUELO }, ...o });
    const suelo = muro({}), izq = muro({}), der = muro({});
    M.Composite.add(motor.world, [suelo, izq, der]);
    const GRUESO = 400;
    function redimensionar() {
      W = innerWidth; H = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
      lienzo.style.width = W + "px"; lienzo.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // suelo = el borde de abajo de la pantalla; paredes a los lados
      const pon = (b, x, y, w, h) => {
        M.Body.setPosition(b, { x, y });
        const bw = b.bounds.max.x - b.bounds.min.x, bh = b.bounds.max.y - b.bounds.min.y;
        M.Body.scale(b, w / bw, h / bh);
      };
      pon(suelo, W / 2, H + GRUESO / 2, W * 3, GRUESO);
      pon(izq, -GRUESO / 2, H / 2 - H, GRUESO, H * 4);
      pon(der, W + GRUESO / 2, H / 2 - H, GRUESO, H * 4);
      M.Composite.allBodies(motor.world).forEach((b) => !b.isStatic && M.Sleeping.set(b, false));
    }
    redimensionar();
    addEventListener("resize", redimensionar);

    const proporcion = im.naturalWidth / im.naturalHeight;   // ancho / alto del PNG
    const delfines = [];
    function nacer(o) {
      const largo = (C.tamano || 56) * azar(0.78, 1.27);
      // el lado largo de la imagen es el "largo" del delfín
      const w = proporcion <= 1 ? largo * proporcion : largo, h = proporcion <= 1 ? largo : largo / proporcion;
      // cuerpo físico: una cápsula un poco más estrecha que el dibujo
      // (así se apilan pegados, como un montón de verdad)
      const cw = w * 0.62, ch = h * 0.9;
      const cuerpo = M.Bodies.rectangle(o.x, o.y, cw, ch, {
        chamfer: { radius: Math.min(cw, ch) * 0.48 },
        angle: azar(-Math.PI, Math.PI),
        friction: 0.55, frictionStatic: 0.9, frictionAir: 0.004, restitution: 0.15, density: 0.0015,
        sleepThreshold: 40,
        // mientras vuela no choca con otros delfines (salen todos del mismo
        // punto y se empujarían); en cuanto está libre, sí
        collisionFilter: { category: DELFIN, mask: SUELO },
      });
      const theta = ((C.angulo ?? 26) + azar(-(C.apertura ?? 26), C.apertura ?? 26)) * Math.PI / 180;
      const v = (C.potencia ?? 200) * escala * azar(0.73, 1.23);
      const paso = 1000 / 60;   // Matter mide la velocidad por paso de 1/60 s
      M.Body.setVelocity(cuerpo, { x: o.lado * Math.cos(theta) * v * paso / 1000, y: (Math.sin(theta) * v - azar(40, 180)) * paso / 1000 });
      M.Body.setAngularVelocity(cuerpo, azar(-1, 1) * (C.giro ?? 600) * Math.PI / 180 * paso / 1000);
      cuerpo.dibujo = { w, h };
      cuerpo.nacio = reloj;
      cuerpo.libre = false;
      M.Composite.add(motor.world, cuerpo);
      delfines.push(cuerpo);
    }
    // un delfín que vuela se vuelve "sólido" cuando ya no toca a ningún otro
    function soltar() {
      const solidos = delfines.filter((d) => d.libre);
      for (const d of delfines) {
        if (d.libre || reloj - d.nacio < 0.25) continue;
        if (!M.Query.collides(d, solidos).length) {
          d.libre = true;
          d.collisionFilter.mask = SUELO | DELFIN;
          solidos.push(d);
        }
      }
    }

    const duracion = C.duracion ?? 2.75, quedarse = C.quedarse ?? 3, fundido = C.fundido ?? 0.65;
    // en pantallas estrechas (móvil) salen menos y con menos fuerza,
    // para que el montón quepa y no se suban por las paredes
    const escala = Math.max(0.4, Math.min(1, innerWidth / 1280));
    const cantidad = (C.cantidad ?? 45) * escala;
    const fin = duracion + quedarse + fundido;
    let reloj = 0, previo = performance.now(), resto = 0, acumulado = 0, turno = 0, puntos = origenes();
    if (!puntos.length) puntos = [{ x: innerWidth / 2, y: 40, lado: -1 }, { x: innerWidth / 2, y: 40, lado: 1 }];

    function fotograma(ahora) {
      const dt = Math.min((ahora - previo) / 1000, 0.05); previo = ahora;
      const antes = reloj; reloj += dt;
      // echar delfines (alternando los chorros)
      if (antes < duracion) {
        if (antes < 0.2 || Math.floor(antes * 4) !== Math.floor(reloj * 4)) puntos = origenes().length ? origenes() : puntos;
        resto += cantidad * (Math.min(reloj, duracion) - antes);
        while (resto >= 1) { resto -= 1; nacer(puntos[turno++ % puntos.length]); }
      }
      // física a pasos fijos (estable en cualquier pantalla)
      acumulado += dt * 1000;
      let n = 0;
      while (acumulado >= 1000 / 60 && n < 4) { M.Engine.update(motor, 1000 / 60); acumulado -= 1000 / 60; n++; soltar(); }
      // los que se escapan por arriba y salen de la pantalla no cuentan
      // pintar
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, Math.min(1, (fin - reloj) / fundido));
      for (const d of delfines) {
        ctx.save();
        ctx.translate(d.position.x, d.position.y);
        ctx.rotate(d.angle);
        ctx.drawImage(im, -d.dibujo.w / 2, -d.dibujo.h / 2, d.dibujo.w, d.dibujo.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (reloj >= fin) { parar(); return; }
      escena.raf = requestAnimationFrame(fotograma);
    }
    escena = { lienzo, redimensionar, raf: requestAnimationFrame(fotograma) };
  }

  /* ---------- cuándo ---------- */
  // al pulsar el nombre (en vez de ir al inicio)
  document.addEventListener("click", (e) => {
    const nombre = e.target.closest && e.target.closest(".menu__nombre");
    if (!nombre || !activo() || !["pulsar", "las-dos"].includes(cuando())) return;
    e.preventDefault(); e.stopPropagation();
    lanzar();
  }, true);
  // al entrar en la página (en la vista previa del gestor, solo con su botón ▶)
  addEventListener("load", () => {
    if (enGestor || !activo() || !["entrar", "las-dos"].includes(cuando())) return;
    setTimeout(() => lanzar(), cfg().espera ?? 1700);
  });
  // si no se va a usar, nada; si sí, se va cargando la física sin prisa
  addEventListener("load", () => { if (activo()) setTimeout(() => cargarMatter().catch(() => {}), 300); });

  window.Delfines = { lanzar, parar };
})();
