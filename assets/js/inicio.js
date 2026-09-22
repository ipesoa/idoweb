/* =====================================================================
   INICIO  ·  pase de imágenes
   ---------------------------------------------------------------------
   Secuencia de cada proyecto:
     1. la foto nueva entra (desenfocada → nítida) mientras la anterior
        se desenfoca y desaparece
     2. aparece el texto (título / año · labor) letra a letra
     3. el texto se queda un rato
     4. el texto se disuelve → siguiente foto
   Pinchar en cualquier sitio lleva a la página de ese proyecto.
   Flechas del teclado ← → para pasar a mano.
   Colores de letra y borde: según la foto, con la tabla de
   AJUSTES.tablaColores (ver assets/js/colores.js), o lo que diga
   info.txt en "color_letra:" / "color_borde:".
   Tiempos: assets/js/ajustes.js → AJUSTES.inicio
   ===================================================================== */
(function () {
  const A = window.AJUSTES.inicio;
  const pase = document.getElementById("pase");
  const pie = document.getElementById("pie");
  const capas = [...pase.querySelectorAll(".pase__capa")];

  // Pasar los tiempos de ajustes.js al CSS
  pase.style.setProperty("--t-imagen", A.entradaImagen + "ms");
  pase.style.setProperty("--t-texto", A.entradaTexto + "ms");
  pase.style.setProperty("--t-salida", A.salidaTexto + "ms");
  pase.style.setProperty("--desenfoque", A.desenfoque + "px");
  pase.style.setProperty("--zoom", A.zoom);


  // ---- Qué proyectos salen ----
  let lista = Web.proyectos("films").filter((p) => p.enInicio);
  if (A.incluirComercials) lista = lista.concat(Web.proyectos("comercials").filter((p) => p.enInicio));
  lista = lista.filter((p) => p.portada);

  if (!lista.length) {
    pase.innerHTML = `<p class="pase__vacio">Todavía no hay proyectos marcados con<br><code>mostrar_en_inicio: si</code></p>`;
    return;
  }
  if (A.orden === "aleatorio") lista.sort(() => Math.random() - 0.5);
  else lista.sort((a, b) => (parseInt(b.ano) || 0) - (parseInt(a.ano) || 0));

  const esVertical = () => window.innerHeight > window.innerWidth;
  const imagenDe = (p) => (esVertical() && p.portadaMovil ? p.portadaMovil.url : p.portada.url);

  // ---- Utilidades ----
  const cargar = (src) => new Promise((ok) => {
    const i = new Image(); i.onload = i.onerror = () => ok(i); i.src = src;
  });

  // Elige color de letra y de borde para este proyecto (ver assets/js/colores.js)
  function ponerColores(p, img) {
    const e = p.extra;
    const forzada = (e.color_letra || e.color_borde)
      ? { letra: e.color_letra || "#ffffff", borde: e.color_borde || "#000000" } : null;
    if (Colores.modo() === "diferencia") return;
    const rgb = Colores.medio(img);
    if (!rgb) return;                       // no se puede leer la foto → modo diferencia
    const c = Colores.calcular(rgb, forzada);
    document.body.style.setProperty("--inicio-letra", c.letra);
    document.body.style.setProperty("--inicio-borde", c.borde);
  }

  // Zoom lento y continuo: empieza cuando la capa entra y NO se corta al salir
  // (antes se cortaba y la foto "saltaba" justo antes del cambio)
  function zoomLento(img) {
    if (!A.zoomLento) return;
    img.style.transition = "none";
    img.style.transform = "scale(1)";
    void img.offsetWidth;
    img.style.transition = "transform 20s linear";
    img.style.transform = `scale(${A.zoomFinal || 1.06})`;
  }

  let turno = 0; // cambia cada vez que se salta a mano → cancela esperas viejas
  const esperar = (ms, t) => new Promise((ok, no) => setTimeout(() => (t === turno ? ok() : no()), ms));

  let pos = 0, capa = 0, actual = null;

  function pintarPie(p) {
    const datos = [p.ano, p.labor].filter(Boolean).join(" · ");
    pie.querySelector(".pase__titulo").innerHTML = Comun.letras(p.titulo, A.retrasoLetra);
    pie.querySelector(".pase__datos").innerHTML =
      Comun.letras(datos, Math.round(A.retrasoLetra / 2), p.titulo.length * A.retrasoLetra * 0.6);
    pie.className = "pase__pie mezcla";
    void pie.offsetWidth; // reinicia la animación
  }

  async function mostrar(indice, t) {
    const p = lista[indice];
    actual = p;
    const cargada = await cargar(imagenDe(p));
    if (t !== turno) return;
    ponerColores(p, cargada);

    // 1. cambiar de foto
    const vieja = capas[capa], nueva = capas[1 - capa];
    capa = 1 - capa;
    const img = nueva.querySelector("img");
    img.src = imagenDe(p);
    img.alt = p.titulo;
    nueva.style.setProperty("--encuadre", p.encuadre);
    zoomLento(img);
    nueva.classList.remove("saliendo");
    vieja.classList.remove("activa");
    vieja.classList.add("saliendo");
    void nueva.offsetWidth;
    nueva.classList.add("activa");

    Colores.pintarMenu();
    setTimeout(Colores.pintarMenu, A.entradaImagen);

    // precargar la siguiente
    cargar(imagenDe(lista[(indice + 1) % lista.length]));

    // 2. texto entra
    await esperar(A.entradaImagen * 0.55 + A.esperaTexto, t);
    pintarPie(p);
    pie.classList.add("entra");

    // 3. texto quieto
    const largo = p.titulo.length * A.retrasoLetra;
    await esperar(A.entradaTexto + largo + A.textoVisible, t);

    // 4. texto sale
    pie.classList.replace("entra", "sale");
    await esperar(A.salidaTexto + A.esperaSiguiente, t);
  }

  async function bucle() {
    const t = turno;
    try {
      while (t === turno) {
        await mostrar(pos, t);
        pos = (pos + 1) % lista.length;
      }
    } catch (e) { /* salto manual: otro bucle ha tomado el relevo */ }
  }

  function saltar(d) {
    turno++;
    pie.classList.remove("entra");
    pie.classList.add("sale");
    pos = (pos + d + lista.length) % lista.length;
    setTimeout(bucle, 250);
  }

  pase.addEventListener("click", (e) => {
    if (e.target.closest(".menu")) return;
    if (actual) Comun.irA(actual.enlace);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") saltar(1);
    if (e.key === "ArrowLeft") saltar(-1);
  });
  // Deslizar el dedo en móvil
  let x0 = null;
  pase.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  pase.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 60) { e.preventDefault(); saltar(dx < 0 ? 1 : -1); }
    x0 = null;
  });

  bucle();
})();
