/* =====================================================================
   ABOUT GLITCH  ·  el about aparece como en ikeryou "sketch491"
   (https://github.com/ikeryou/sketch491 · src/line.ts + src/main.ts)
   ---------------------------------------------------------------------
   PARÁMETROS PRINCIPALES (cámbialos aquí):                              */

const LINE_COUNT = 0;               // líneas EXTRA solo de datos encima del about, como el original (0 = ninguna)
const CHARACTERS_PER_LINE = "auto"; // "auto" = los caracteres que quepan en el hueco de cada texto · o un número máximo
const LINE_DELAY = 0.1;             // segundos entre el arranque de una línea y la siguiente (original: 0.1)
const ANIMATION_SPEED = 1;          // 1 = como el original (cada barrido dura 1 s) · 2 = el doble de rápido · 0.5 = la mitad
const HOLD_TIME = 2;                // (solo si REPEAT = true) segundos antes de desaparecer (original: 2)
const RESTART_DELAY = 2;            // (solo si REPEAT = true) segundos oculto antes de volver (original: 2)
const FONT_SIZE = 10;               // px de las líneas extra (el ruido del about usa la MISMA letra que el texto)
const LINE_GAP = 0.5;               // em entre las líneas extra (original: 0.5)
const RANDOM_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const WORDS = [                     // palabras reales que aparecen un instante entre el ruido
  "Madrid", "Art", "Film", "Set", "Props", "Arte", "Cine", "Rodaje", "Decorado", "Atrezzo", "Scene", "Take",
];

/* Otros ajustes */
const REPEAT = false;               // false = aparece una vez y SE QUEDA · true = ciclo como el original
const START_DELAY = 0.3;            // segundos antes de la primera línea (original: 1)
const CONTAINER = ".about__columna";

/* ---------------------------------------------------------------------
   CÓMO FUNCIONA (igual que Line en line.ts):
   Cada línea (nombre, labor, ciudad, filtros, cada fila de la lista)
   tiene dos valores que van de 0 a 1:
     A (showRateA)  la línea se escribe de izquierda a derecha   (ExpoOut, 1 s)
     B (showRateB)  0,75 s después barre de izquierda a derecha y
                    borra el ruido; solo queda el texto real       (ExpoInOut, 1 s)
   Los caracteres del texto real aparecen tal cual (como las "words" del
   original) y el hueco que queda a su derecha se llena de caracteres al
   azar que cambian en cada fotograma, con alguna palabra de WORDS.
   Todo con la MISMA fuente, tamaño y color que el texto: al terminar,
   el texto queda exactamente igual que sin efecto.
   Las líneas arrancan escalonadas (LINE_DELAY).
   ===================================================================== */
(function () {
  const columna = document.querySelector(CONTAINER);
  if (!columna) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  (columna.closest(".about") || columna).classList.add("glitch");

  /* ---------- mini motor de animación (en lugar de gsap) ---------- */
  const EASE = {
    expoOut: (p) => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    expoInOut: (p) => (p === 0 ? 0 : p === 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2),
  };
  const tweens = [];
  function tween(obj, key, to, dur, delay, ease, op = {}) {
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && tweens[i].key === key) tweens.splice(i, 1);
    if (op.from !== undefined) obj[key] = op.from;
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

  const medidor = document.createElement("canvas").getContext("2d");
  const azarEntero = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const letraAzar = () => RANDOM_CHARACTERS.charAt(Math.floor(Math.random() * RANDOM_CHARACTERS.length));
  const HUECO = " ";   // hueco invisible (como el "_" negro del original)

  /* ---------- un texto dentro de una línea ---------- */
  class Hoja {
    constructor(el, extra) {
      this.el = el;
      this.extra = extra;
      this.texto = extra ? "" : el.textContent;
      const cs = getComputedStyle(el);
      medidor.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const r = el.getBoundingClientRect();
      this.ancho = r.width; this.alto = r.height;
      const media = medidor.measureText(RANDOM_CHARACTERS).width / RANDOM_CHARACTERS.length;
      const txt = cs.textTransform === "uppercase" ? this.texto.toUpperCase() : this.texto;
      const libre = Math.max(0, Math.floor((r.width - medidor.measureText(txt).width) / media) - 1);
      let total = this.texto.length + libre;
      if (CHARACTERS_PER_LINE !== "auto") total = Math.min(total, Math.max(this.texto.length, CHARACTERS_PER_LINE));
      this.total = total;
      // de 1 a 5 palabras en el hueco, como el constructor de Line
      this.palabras = [];
      let ahora = this.texto.length + 1;
      for (let k = azarEntero(1, 5); k > 0; k--) {
        const t = WORDS[azarEntero(0, WORDS.length - 1)];
        if (ahora + t.length < this.total - 1) {
          const start = azarEntero(ahora, this.total - 1 - t.length);
          this.palabras.push({ t, start, end: start + t.length });
          ahora = start + t.length + 1;
        }
      }
    }
    bloquear() {   // mismo tamaño durante la animación: nada se mueve alrededor
      Object.assign(this.el.style, { width: this.ancho + "px", minHeight: this.alto + "px", overflow: "hidden", whiteSpace: "pre" });
    }
    liberar() {    // deja el texto exactamente como estaba
      this.el.textContent = this.texto;
      ["width", "minHeight", "overflow", "whiteSpace"].forEach((k) => (this.el.style[k] = ""));
    }
    pintar(sA, sB) {
      if (sA <= 0) { this.el.textContent = HUECO; return; }
      const etc = sB * this.total;   // Util.map(sB, 0, total, 0, 1)
      const num = sA * this.total;   // Util.map(sA, 0, total, 0, 1)
      const n = this.texto.length;
      let str = "";
      for (let i = 0; i < num; i++) {
        if (i < n) { str += this.texto.charAt(i); continue; }           // texto real: se queda
        const p = this.palabras.find((w) => w.start <= i && i < w.end);
        if (p && (this.extra || i >= etc)) { str += p.t.charAt(i - p.start); continue; }
        str += i >= etc ? letraAzar() : HUECO;
      }
      this.el.textContent = str || HUECO;
    }
  }

  /* ---------- una línea = una o varias hojas que arrancan a la vez ---------- */
  class Linea {
    constructor(hojas) {
      this.hojas = hojas;
      this.a = 0; this.b = 0; this.mostrado = false; this.terminada = false;
      hojas.forEach((h) => { h.bloquear(); h.pintar(0, 0); });
    }
    show(d = 0) {
      const t = 1 / ANIMATION_SPEED;
      this.mostrado = false; this.terminada = false;
      this.hojas.forEach((h) => h.bloquear());
      tween(this, "a", 1, t, d, EASE.expoOut, { from: 0 });
      tween(this, "b", 1, t, d + t * 0.75, EASE.expoInOut, { from: 0, onComplete: () => { if (REPEAT) this.hide(HOLD_TIME); } });
    }
    hide(d = 0) {
      const t = 1 / ANIMATION_SPEED;
      tween(this, "a", 0, t, d + t * 0.75, EASE.expoOut, { onComplete: () => this.show(RESTART_DELAY) });
      tween(this, "b", 0, t, d, EASE.expoInOut, { onStart: () => { this.mostrado = false; this.hojas.forEach((h) => h.bloquear()); } });
    }
    pintar() {                       // = _update() de line.ts
      if (this.mostrado) return;
      this.hojas.forEach((h) => h.pintar(this.a, this.b));
      if (this.b >= 1) {             // limpio: el texto queda tal cual, sin estilos añadidos
        this.mostrado = true;
        this.hojas.forEach((h) => h.liberar());
      }
    }
  }

  /* ---------- montar ---------- */
  let lineas = [];
  const visible = (el) => el.offsetParent !== null;

  function crearExtras() {
    if (LINE_COUNT <= 0) return [];
    let bloque = columna.querySelector(".glitch-extra");
    if (!bloque) {
      bloque = document.createElement("div");
      bloque.className = "glitch-extra";
      bloque.setAttribute("aria-hidden", "true");
      bloque.style.setProperty("--glitch-tam", FONT_SIZE + "px");
      bloque.style.setProperty("--glitch-separacion", LINE_GAP + "em");
      for (let i = 0; i < LINE_COUNT; i++) bloque.appendChild(document.createElement("div"));
      columna.prepend(bloque);
    }
    return [...bloque.children].map((el) => new Linea([new Hoja(el, true)]));
  }

  function lineasDelAbout(soloLista) {
    const L = [];
    if (!soloLista) {
      columna.querySelectorAll(".about__datos p").forEach((p) => L.push(new Linea([new Hoja(p, false)])));
      const botones = [...columna.querySelectorAll(".filtros button")];
      if (botones.length) L.push(new Linea(botones.map((b) => new Hoja(b, false))));
    }
    columna.querySelectorAll(".trabajos li").forEach((li) => {
      if (!visible(li)) return;
      const hojas = [...li.querySelectorAll(".fila > span")].filter((s) => s.textContent.trim()).map((s) => new Hoja(s, false));
      if (hojas.length) L.push(new Linea(hojas));
    });
    return L;
  }

  function montar(soloLista) {
    // termina limpio lo que estuviera a medias
    lineas.forEach((l) => { if (!l.mostrado) l.hojas.forEach((h) => h.liberar()); });
    tweens.length = 0;
    const nuevas = (soloLista ? [] : crearExtras()).concat(lineasDelAbout(soloLista));
    lineas = soloLista ? lineas.filter((l) => l.mostrado && !l.hojas[0].el.closest(".trabajos")).concat(nuevas) : nuevas;
    nuevas.forEach((l, i) => l.show((soloLista ? 0 : START_DELAY) + i * LINE_DELAY));   // main.ts: line.show(1 + i * 0.1)
  }

  (function bucle(ahora) {
    avanzar(ahora);
    for (const l of lineas) l.pintar();
    requestAnimationFrame(bucle);
  })(performance.now());

  // Films / Comercials / Todo: la lista vuelve a escribirse con el efecto
  document.addEventListener("click", (e) => {
    if (e.target.closest(".filtros button")) setTimeout(() => montar(true), 0);
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => montar(false)); else montar(false);
})();
