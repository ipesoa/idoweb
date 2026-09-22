/* =====================================================================
   ABOUT GLITCH  ·  el about aparece como en ikeryou "sketch491"
   (https://github.com/ikeryou/sketch491 · src/line.ts + src/main.ts)
   ---------------------------------------------------------------------
   PARÁMETROS PRINCIPALES (cámbialos aquí):                              */

const LINE_COUNT = 10;              // líneas EXTRA solo de datos/ruido encima del about, como el original (0 = ninguna)
const CHARACTERS_PER_LINE = "auto"; // "auto" = los que quepan en el ancho de la columna · o un número máximo (original: 150 / 50 en móvil)
const LINE_DELAY = 0.1;             // segundos entre el arranque de una línea y la siguiente (original: 0.1)
const ANIMATION_SPEED = 1;          // 1 = como el original (cada barrido dura 1 s) · 2 = el doble de rápido · 0.5 = la mitad
const HOLD_TIME = 6;                // segundos que el texto se queda limpio antes de desaparecer (original: 2)
const RESTART_DELAY = 2;            // segundos todo oculto antes de volver a aparecer (original: 2)
const FONT_SIZE = 10;               // px de los caracteres de ruido (original: 10)
const LINE_GAP = 0.5;               // em de separación entre las líneas extra (original: 0.5)
const RANDOM_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const WORDS = [                     // palabras reales que aparecen incrustadas entre el ruido
  "Madrid", "Art", "Film", "Set", "Props", "Arte", "Cine", "Rodaje", "Decorado",
  "Atrezzo", "Plato", "Scene", "Take", "Frame", "Location", "Color", "Luz", "Idoia",
];

/* Otros ajustes */
const REPEAT = true;                // false = aparece una vez y se queda
const START_DELAY = 0.3;            // segundos antes de que arranque la primera línea (original: 1)
const TARGETS = ".about__datos p, .filtros, .trabajos li";   // qué líneas del about se animan
const CONTAINER = ".about__columna";                          // dónde van las líneas extra

/* ---------------------------------------------------------------------
   CÓMO FUNCIONA (igual que Line en line.ts):
   Cada línea tiene dos valores que van de 0 a 1:
     A (showRateA)  revela la línea de izquierda a derecha      (ExpoOut, 1 s)
     B (showRateB)  0,75 s después barre de izquierda a derecha y
                    convierte el ruido en huecos; solo quedan las
                    palabras / el texto real                     (ExpoInOut, 1 s)
   En cada fotograma los caracteres de ruido se sortean de nuevo.
   Pasado HOLD_TIME: B vuelve a 0 (el ruido reaparece de derecha a
   izquierda), 0,75 s después A vuelve a 0 (la línea se recoge) y,
   tras RESTART_DELAY, vuelta a empezar. Las líneas arrancan escalonadas.
   En las líneas del about, el "texto real" es el propio texto (en su
   fuente de siempre): A lo va destapando y el ruido monoespaciado ocupa
   el resto de la línea.
   ===================================================================== */
(function () {
  const columna = document.querySelector(CONTAINER);
  if (!columna) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const raiz = columna.closest(".about") || columna;
  raiz.classList.add("glitch");
  raiz.style.setProperty("--glitch-tam", FONT_SIZE + "px");
  raiz.style.setProperty("--glitch-separacion", LINE_GAP + "em");

  /* ---------- mini motor de animación (sustituye a gsap) ---------- */
  const EASE = {
    expoOut: (p) => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    expoInOut: (p) => (p === 0 ? 0 : p === 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2),
  };
  const tweens = [];
  function tween(obj, key, to, dur, delay, ease, op = {}) {
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && tweens[i].key === key) tweens.splice(i, 1); // killTweensOf
    if (op.from !== undefined) obj[key] = op.from;                                                                        // gsap.set(from)
    tweens.push({ obj, key, to, dur: dur * 1000, inicio: performance.now() + delay * 1000, ease, op, empezado: false, desde: 0 });
  }
  function avanzar(ahora) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i];
      if (ahora < t.inicio) continue;
      if (!t.empezado) { t.empezado = true; t.desde = t.obj[t.key]; t.op.onStart && t.op.onStart(); }
      const p = Math.min(1, (ahora - t.inicio) / t.dur);
      t.obj[t.key] = t.desde + (t.to - t.desde) * t.ease(p);
      if (p >= 1) { tweens.splice(i, 1); t.op.onComplete && t.op.onComplete(); }
    }
  }

  /* ---------- medidas ---------- */
  let anchoLetra = FONT_SIZE * 0.6;
  function medirLetra() {
    const s = document.createElement("span");
    s.className = "glitch-ruido";
    s.style.cssText = "position:absolute;visibility:hidden;width:auto";
    s.textContent = "M".repeat(100);
    columna.appendChild(s);
    anchoLetra = s.getBoundingClientRect().width / 100 || anchoLetra;
    s.remove();
  }
  const azar = (min, max) => Math.random() * (max - min) + min;
  const azarEntero = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const letraAzar = () => RANDOM_CHARACTERS.charAt(Math.floor(Math.random() * RANDOM_CHARACTERS.length));

  /* ---------- una línea (= Line de line.ts) ---------- */
  class Linea {
    constructor(el, extra) {
      this.el = el;
      this.extra = extra;          // línea solo de datos (las palabras se quedan, como en el original)
      this.a = 0;                  // _showRateA
      this.b = 0;                  // _showRateB
      this.mostrado = false;       // _isShowed
      this.ruido = el.querySelector(":scope > .glitch-ruido");
      if (!this.ruido) {
        this.ruido = document.createElement("span");
        this.ruido.className = "glitch-ruido";
        this.ruido.setAttribute("aria-hidden", "true");
        el.appendChild(this.ruido);
      }
      el.classList.add("glitch-linea");
      el.style.clipPath = "inset(0 100% 0 0)";
      this.medir();
    }

    medir() {
      const r = this.el.getBoundingClientRect();
      let total = Math.max(1, Math.floor(r.width / anchoLetra));
      if (CHARACTERS_PER_LINE !== "auto") total = Math.min(total, CHARACTERS_PER_LINE);
      this.total = total;
      // casillas ocupadas por el texto real (no llevan ruido encima)
      this.texto = new Uint8Array(total);
      const recorrer = document.createTreeWalker(this.el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (this.ruido.contains(n) || !n.textContent.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      const rango = document.createRange();
      for (let n = recorrer.nextNode(); n; n = recorrer.nextNode()) {
        rango.selectNodeContents(n);
        for (const c of rango.getClientRects()) {
          const i0 = Math.max(0, Math.floor((c.left - r.left) / anchoLetra));
          const i1 = Math.min(total - 1, Math.ceil((c.right - r.left) / anchoLetra));
          for (let i = i0; i <= i1; i++) this.texto[i] = 1;
        }
      }
      this.colocarPalabras();
    }

    // Igual que el constructor de Line: de 1 a 5 palabras en posiciones al azar
    colocarPalabras() {
      this.palabras = [];
      let ahora = 0;
      const libres = [];
      for (let i = 0; i < this.total; i++) if (!this.texto[i]) libres.push(i);
      const desde = libres.length ? libres[0] : this.total;   // el ruido empieza tras el texto real
      ahora = this.extra ? 0 : desde + 2;
      const num = azarEntero(1, 5);
      for (let k = 0; k < num; k++) {
        const t = WORDS[azarEntero(0, WORDS.length - 1)];
        if (ahora + t.length < this.total - 3) {
          const start = Math.floor(azar(ahora, this.total - 3 - t.length));
          const end = start + t.length;
          let choca = false;
          for (let i = start; i <= end; i++) if (this.texto[i]) choca = true;
          if (!choca) this.palabras.push({ t, start, end });
          ahora += end;
        }
      }
    }

    show(d = 0) {
      const t = 1 / ANIMATION_SPEED;
      tween(this, "a", 1, t, d, EASE.expoOut, { from: 0 });
      tween(this, "b", 1, t, d + t * 0.75, EASE.expoInOut, {
        from: 0,
        onComplete: () => { if (REPEAT) this.hide(HOLD_TIME); },
      });
    }

    hide(d = 0) {
      const t = 1 / ANIMATION_SPEED;
      tween(this, "a", 0, t, d + t * 0.75, EASE.expoOut, { onComplete: () => this.show(RESTART_DELAY) });
      tween(this, "b", 0, t, d, EASE.expoInOut, { onStart: () => { this.mostrado = false; } });
    }

    // = _update() de line.ts
    pintar() {
      const sA = this.a, sB = this.b;
      this.el.style.clipPath = sA <= 0 ? "inset(0 100% 0 0)" : `inset(-0.4em ${((1 - sA) * 100).toFixed(2)}% -0.4em 0)`;
      if (sA <= 0 || this.mostrado) return;

      const etc = sB * this.total;   // Util.map(sB, 0, total, 0, 1)
      const num = sA * this.total;   // Util.map(sA, 0, total, 0, 1)
      let str = "";
      for (let i = 0; i < num; i++) {
        if (this.texto[i]) { str += " "; continue; }          // el texto real ya se ve debajo
        let esPalabra = false;
        for (const p of this.palabras) {
          if (p.start <= i && i < p.end) {
            // en las líneas extra las palabras se quedan (como el original);
            // en las del about se van con el ruido para dejar solo el texto real
            if (this.extra || i >= etc) { str += p.t.charAt(i - p.start); esPalabra = true; }
          }
        }
        if (!esPalabra) str += i >= etc ? letraAzar() : " ";
      }
      this.ruido.textContent = str;
      if (sB >= 1) this.mostrado = true;
    }
  }

  /* ---------- montar ---------- */
  let lineas = [];
  let bloqueExtra = null;

  function montar() {
    tweens.length = 0;
    medirLetra();

    if (LINE_COUNT > 0 && !bloqueExtra) {
      bloqueExtra = document.createElement("div");
      bloqueExtra.className = "glitch-extra";
      bloqueExtra.setAttribute("aria-hidden", "true");
      for (let i = 0; i < LINE_COUNT; i++) {
        const l = document.createElement("div");
        l.className = "glitch-linea--extra";
        bloqueExtra.appendChild(l);
      }
      columna.prepend(bloqueExtra);
    }

    const extras = bloqueExtra ? [...bloqueExtra.children] : [];
    const reales = [...columna.querySelectorAll(TARGETS)].filter((el) => el.offsetParent !== null);
    // líneas ocultas por los filtros: sin recorte, para que se vean al volver
    columna.querySelectorAll(TARGETS).forEach((el) => { if (el.offsetParent === null) el.style.clipPath = ""; });

    lineas = extras.map((el) => new Linea(el, true)).concat(reales.map((el) => new Linea(el, false)));
    lineas.forEach((l, i) => l.show(START_DELAY + i * LINE_DELAY));   // main.ts: line.show(1 + i * 0.1)
  }

  (function bucle(ahora) {
    avanzar(ahora);
    for (const l of lineas) l.pintar();
    requestAnimationFrame(bucle);
  })(performance.now());

  // Al cambiar de filtro (Films / Comercials / Todo) la lista vuelve a aparecer con el efecto
  document.addEventListener("click", (e) => {
    if (e.target.closest(".filtros button")) setTimeout(montar, 0);
  });
  // Al cambiar el tamaño: volver a medir
  let espera;
  window.addEventListener("resize", () => {
    clearTimeout(espera);
    espera = setTimeout(() => { medirLetra(); lineas.forEach((l) => l.medir()); }, 200);
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(montar); else montar();
})();
