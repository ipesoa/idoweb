/* =====================================================================
   CONTENIDO  ·  convierte las carpetas de /contenido en datos para la web
   ---------------------------------------------------------------------
   Lee window.CONTENIDO (lo escribe el script _generar-datos.sh en
   contenido/datos-generados.js) y lo transforma en objetos fáciles:

     Web.proyectos("films")     → lista de películas
     Web.proyectos("series")    → series · "comercials" · "videoclips"
     Web.todos()                → todos juntos, del más nuevo al más viejo
     Web.proyecto(tipo, id)     → uno concreto
     Web.about                  → datos de la página contact

   Si una clave se repite (por ejemplo varias líneas "crew:"), se guardan
   todas, una debajo de otra.

   Formato de cada info.txt:
       clave: valor            (una por línea, arriba)
       # comentario            (se ignora)
       ---                     (a partir de aquí, texto libre)
   ===================================================================== */
(function () {
  const DATOS = window.CONTENIDO || { films: [], comercials: [], about: null };

  // "Año" → "ano", "Mostrar en inicio" → "mostrar_en_inicio"
  const normalizar = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
     .trim().replace(/\s+/g, "_");

  function leerInfo(txt) {
    const out = { texto: "" };
    const lineas = (txt || "").replace(/\r/g, "").split("\n");
    let i = 0;
    for (; i < lineas.length; i++) {
      const l = lineas[i];
      if (/^\s*---\s*$/.test(l)) { i++; break; }
      if (!l.trim() || /^\s*#/.test(l)) continue;
      const m = l.match(/^\s*([^:]+?)\s*:\s*(.*)$/);
      if (m) {
        const k = normalizar(m[1]), v = m[2].trim();
        out[k] = out[k] ? out[k] + "\n" + v : v;   // claves repetidas (crew:) → una debajo de otra
      }
    }
    out.texto = lineas.slice(i).join("\n").trim();
    return out;
  }

  const esSi = (v) => /^(si|sí|yes|true|1|x)$/i.test((v || "").trim());
  const esVideo = (f) => /\.(mp4|webm|mov|m4v)$/i.test(f);

  function ruta(tipo, carpeta, archivo) {
    return ["contenido", tipo, carpeta, archivo].map(encodeURIComponent).join("/")
      .replace(/%2F/g, "/");
  }

  function crearProyecto(tipo, bruto) {
    const info = leerInfo(bruto.info);
    const archivos = (bruto.archivos || []).map((a) =>
      typeof a === "string" ? { f: a } : a);

    // portada: la que diga info.txt, o un archivo llamado "portada.*", o la primera
    const buscar = (nombre) => nombre && archivos.find((a) => a.f.toLowerCase() === nombre.toLowerCase());
    const portada = buscar(info.portada)
      || archivos.find((a) => /^portada\./i.test(a.f))
      || archivos.find((a) => !esVideo(a.f));
    const portadaMovil = buscar(info.portada_movil)
      || archivos.find((a) => /^portada[-_]movil\./i.test(a.f));

    const galeria = archivos.filter((a) => a !== portada && a !== portadaMovil);

    const p = {
      tipo,
      id: bruto.carpeta,
      titulo: info.titulo || bruto.carpeta,
      ano: info.ano || "",
      labor: info.labor || "",
      // "director:" o "directed by:" · "productora:", "produced by:" o "cliente:"
      director: info.director || info.directed_by || info.dirigido_por || "",
      productora: info.productora || info.produced_by || info.producido_por || "",
      cliente: info.cliente || "",
      // "crew:" (se puede repetir una línea por persona) → lista
      crew: (info.crew || "").split("\n").map((l) => l.trim()).filter(Boolean),
      enInicio: esSi(info.mostrar_en_inicio),
      orden: parseFloat(info.orden) || 0,
      encuadre: info.encuadre || "center",
      video: info.video || "",
      texto: info.texto,
      extra: info,
      portada: portada ? { ...portada, url: ruta(tipo, bruto.carpeta, portada.f) } : null,
      portadaMovil: portadaMovil ? { ...portadaMovil, url: ruta(tipo, bruto.carpeta, portadaMovil.f) } : null,
      galeria: galeria.map((a) => ({ ...a, url: ruta(tipo, bruto.carpeta, a.f), video: esVideo(a.f) })),
    };
    p.enlace = `proyecto.html?tipo=${tipo}&id=${encodeURIComponent(p.id)}`;
    return p;
  }

  // Más reciente primero; "orden:" en info.txt manda si existe (mayor = antes)
  const ordenar = (a, b) => (b.orden - a.orden) || (parseInt(b.ano) || 0) - (parseInt(a.ano) || 0)
    || a.titulo.localeCompare(b.titulo);

  const cache = {};
  function proyectos(tipo) {
    if (tipo === "work" || tipo === "todo") return todos();
    if (!cache[tipo]) cache[tipo] = (DATOS[tipo] || []).map((b) => crearProyecto(tipo, b)).sort(ordenar);
    return cache[tipo];
  }

  // Los tipos de la web (films, series, comercials, videoclips): ajustes.js
  const tipos = () => ((window.AJUSTES && AJUSTES.secciones) || [{ id: "films" }, { id: "comercials" }]).map((s) => s.id);

  // Todos los trabajos con página propia, del más nuevo al más viejo
  function todos() {
    return tipos().flatMap((t) => proyectos(t)).sort(ordenar);
  }

  function proyecto(tipo, id) {
    return proyectos(tipo).find((p) => p.id === id) || null;
  }

  // ---------- About ----------
  let about = null;
  if (DATOS.about) {
    const info = leerInfo(DATOS.about.info);
    const archivos = (DATOS.about.archivos || []).map((a) => (typeof a === "string" ? { f: a } : a));
    const url = (f) => "contenido/about/" + encodeURIComponent(f);
    const retrato = archivos.find((a) => a.f.toLowerCase() === (info.retrato || "").toLowerCase())
      || archivos.find((a) => /^retrato\./i.test(a.f));
    const showreelArchivo = archivos.find((a) => /^showreel\./i.test(a.f));

    // filmografia-extra.txt: "año | título | labor | director/cliente"
    const extra = (DATOS.about.filmografia || "").replace(/\r/g, "").split("\n")
      .filter((l) => l.trim() && !/^\s*#/.test(l))
      .map((l) => {
        const [ano, titulo, labor, quien, tipo] = l.split("|").map((s) => (s || "").trim());
        return { ano, titulo, labor, director: quien, tipo: (tipo || "").toLowerCase() || "films", enlace: null };
      });

    about = {
      nombre: info.nombre || "",
      subtitulo: info.subtitulo || "",
      ubicacion: info.ubicacion || "",
      email: info.email || "",
      telefono: info.telefono || "",
      instagram: info.instagram || "",
      imdb: info.imdb || "",
      showreel: info.showreel || (showreelArchivo ? url(showreelArchivo.f) : ""),
      texto: info.texto,
      retrato: retrato ? url(retrato.f) : "",
      extra,
    };
  }

  // Todos los trabajos (los de la web + los de filmografia-extra.txt) por año
  function filmografia() {
    return todos()
      .map((p) => ({ ano: p.ano, titulo: p.titulo, labor: p.labor, director: p.director || p.cliente, tipo: p.tipo, enlace: p.enlace }))
      .concat(about ? about.extra : [])
      .sort((a, b) => (parseInt(b.ano) || 0) - (parseInt(a.ano) || 0));
  }

  // Convierte texto libre en párrafos HTML (línea en blanco = párrafo nuevo)
  function parrafos(txt) {
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return (txt || "").split(/\n\s*\n/).filter(Boolean)
      .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")}</p>`).join("");
  }

  window.Web = { proyectos, proyecto, todos, tipos, about, filmografia, parrafos, leerInfo };
})();
