# Mapa técnico de la web (para IA / desarrolladores)

Portfolio estático de una diseñadora de producción. **Sin frameworks, sin build, sin npm.** HTML + CSS + JS vanilla, alojado en GitHub Pages. Funciona también abriendo `index.html` con doble clic (file://), por eso los datos se cargan con `<script>` y no con `fetch`.

La dueña de la web **no programa**. Cualquier cambio debe mantener:
- el contenido en `contenido/` como carpetas + `info.txt` legibles por humanos,
- los ajustes visuales centralizados en `assets/css/ajustes.css` y `assets/js/ajustes.js`,
- comentarios en español en la cabecera de cada archivo explicando qué hace.

## Flujo de datos

```
contenido/<tipo>/<carpeta>/info.txt + imágenes
        │  herramientas-mac/_generar-datos.sh   (bash 3.2 compatible, macOS; usa `sips` para medir imágenes)
        ▼
contenido/datos-generados.js   → window.CONTENIDO = { films:[{carpeta, info, archivos:[{f,w,h}]}], series:[…], comercials:[…], videoclips:[…], about:{info, filmografia, archivos} }
        │  assets/js/contenido.js  (parsea info.txt → objetos)
        ▼
window.Web = { proyectos(tipo), proyecto(tipo,id), todos(), tipos(), about, filmografia(), parrafos(txt), leerInfo(txt) }
```

- `datos-generados.js` **se regenera**; nunca editarlo a mano. Tras tocar `contenido/`, ejecutar `bash herramientas-mac/_generar-datos.sh`.
- `info.txt`: líneas `clave: valor` hasta una línea `---`; después, texto libre. Las claves se normalizan (minúsculas, sin tildes, espacios→`_`): `año`→`ano`. Líneas con `#` = comentarios. Carpetas que empiezan por `_` se ignoran.
- Portada (foto de la parrilla y del inicio): clave `portada: NN.jpg` (forma nueva, la escribe el gestor; esa foto SIGUE en la galería en su sitio: `p.fotosPagina` = orden del gestor) o archivo `portada.*` (forma antigua: sale la primera en la página del proyecto); versión móvil `portada-movil.*` o clave `portada_movil:`. Cartel (póster): archivo `cartel.*` o clave `cartel:` → `p.cartel`; NO entra en la galería. El resto de imágenes/vídeos = galería, en orden alfabético.
- Claves reconocidas: `titulo, año, labor, director (o "directed by"), productora (o "produced by"), cliente, mostrar_en_inicio (si/no), encuadre (object-position), video, crew (repetible), orden`. Una clave repetida acumula sus valores separados por `\n` (así funciona `crew:`). Cualquier otra clave queda disponible en `proyecto.extra`.
- **Secciones**: films, series, comercials (se lee "Commercials"), videoclips. La lista manda desde `AJUSTES.secciones` (assets/js/ajustes.js) y debe coincidir con: los generadores de datos (bash y ps1), `TIPOS` del gestor y las páginas .html.

## Páginas

| Archivo | JS | CSS | Qué hace |
|---|---|---|---|
| `index.html` | `inicio.js` | `inicio.css` | Pase fullscreen SIN textos (`AJUSTES.inicio.mostrarTitulos: false`): solo la imagen, fundido+desenfoque y zoom lento. Clic → proyecto. ←/→ y swipe. |
| `work.html` | `lista.js` | `lista.css` | Todos los trabajos juntos, del más nuevo al más viejo. Arriba solo el nombre y "Work"; sin filtros ni enlaces (los filtros por sección están en `contact.html`). |
| `films.html`, `series.html`, `comercials.html`, `videoclips.html` | `lista.js` | `lista.css` | Rejilla de una sección. Info a las 4 del cursor: **título / directed by / produced by** (`Comun.ficha`). |
| `proyecto.html?tipo=films&id=CARPETA` | `proyecto.js` | `proyecto.css` | 1 vídeo limpio arriba (`Comun.reproductor`, autoplay mudo), 2 ficha centrada, 3 crew a dos columnas, 4 texto (alineado a la izquierda), 5 rejilla de fotos, 6 botón "Start a conversation" → contact.html. Arriba solo el nombre, siempre visible. |
| `contact.html` (antes about.html, que ahora redirige) | `contact.js` | `contact.css` | Columna abajo a la derecha: texto libre de `contenido/about/info.txt`, lista de TODOS los trabajos con filtros (All por defecto · Films · Series · Commercials · Videoclips) y email/teléfono/instagram. Filtros: secciones sin `enContact: false` (Videoclips está quitado). La lista tiene alto fijo (`--about-alto-lista`) para que al cambiar de filtro no se mueva nada; si esa sección está vacía sale una raya (`.trabajos.vacia`). Sin efectos. |
| `laboratorio.html` | inline + `diferencia.js` | inline | Herramienta interna para probar el umbral blanco/negro sobre fotos reales. No enlazada en el menú. |

Orden de scripts en cada página: `datos-generados.js → ajustes.js → contenido.js → comun.js → <página>.js`.

## Carteles en las rejillas (`lista.js` + `lista.css`, ajustes en `AJUSTES.carteles` y `ajustes.css` 4b)
En las páginas de `AJUSTES.carteles.paginas` la rejilla lleva `.modo-cartel`: cada celda = portada a todo el rectángulo (`.celda__fondo`) + cartel a la izquierda a todo lo alto con formato fijo `--cartel-formato` (`.celda__cartel`, solo si `p.cartel`) + texto fijo encima de la portada (`.celda__texto`: ficha y año abajo; sin etiqueta de cursor). Con cartel la portada está a `--cartel-oscuro` (.9); en hover/focus el cartel se desvanece y la portada vuelve a brightness(1), misma duración y curva, sin zoom ni destello (la dueña no los quiere). Texto pequeño (`--cartel-texto-tam`) en bloque abajo a la DERECHA, a `--cartel-texto-margen` de los bordes. Las imágenes van en capa propia fija (translateZ(0)) para que el fundido del cartel no «tiemble». Gestor: recuadro «Cartel» en el editor (subir/arrastrar, o botón «Cartel» en una foto); se publica como `cartel.jpg`.

## Animaciones GSAP (`assets/js/vendor/gsap.min.js` 3.13, copia local; `AJUSTES.animaciones`)
Los valores del gestor (pestaña Cabecera → claves `anim_*` y `contraste_*` en contenido/about/info.txt) mandan sobre ajustes.js: `Comun.aplicarEfectos(campos)` (llamado en `aplicarNombre`). Para la vista previa del gestor: `Comun.animarNombre()`, `Comun.menu(abierto)`.
- Nombre (`entradaNombre`): MASK REVEAL vertical según la especificación de la dueña: `<span class="title-mask">` (overflow hidden, relleno + margen negativo para acentos/cursiva sin cambiar el layout) > `<span class="title">` que va de yPercent 115 → 0, 1 s, power4.out; al acabar clearProps (posición exacta). Efecto subir/bajar/fundido/ninguno; cuándo inicio/visita/siempre; retraso 500 ms (la cortina). Nunca en `animaciones.nombre.nunca` (por defecto Contact: la dueña lo quiere fijo).
- Menú WORK (inicio): cada opción lleva `.opcion-mascara > .opcion-texto`. Abrir: mask reveal de arriba abajo (texto yPercent -115 → 0, stagger 0.1 s) / de abajo arriba / fundido. Cerrar: difuminar (autoAlpha 0 + blur 6px, orden inverso) / fundido. `.menu--abierto` = estado final (clearProps al acabar para el hover); `.menu--animando` quita transiciones CSS; `nav[data-dif-vivo]` mientras anima. Sin GSAP o reduced-motion: cambio directo.

## Novedades (oct. 2026, v10)
- **Tipografías propias**: gestor → pestaña Tipografías sube a `assets/fonts/<slug>.<ext>` y apunta en contenido/about/info.txt líneas repetidas `fuente: Nombre | archivo`. `registrarFuentes()` en comun.js crea los @font-face y las añade a `FAMILIAS` con clave `fuente-<slug>` (mismo slug en gestor y web). Elegibles en: nombre (`nombre_fuente`), menú (`menu_fuente/_tamano/_peso/_cursiva/_mayusculas`), texto de recuadros (`parrilla_texto_fuente/_tamano/_peso/_cursiva/_mayusculas`), franja (`franja_fuente`). El escritor del about en el gestor escribe valores multilínea como varias líneas `clave: valor`.
- **Colores de las letras**: `color_letra_claro` / `color_letra_oscuro` → `AJUSTES.diferencia.claro/oscuro` (diferencia.js pinta con ellos) y `--dif-letra`.
- **Rectángulo del nombre** (parrillas y páginas de proyecto, `parrilla_nombre_caja*`): `.nombre__caja::before` inclinado (`--nombre-caja-inclinacion`, por defecto 12°) y ceñido a la altura de las mayúsculas: `medirCaja()` mide con canvas (actualBoundingBoxAscent del texto sin acentos) y pone `--caja-t/b/l/r`; margen `--nombre-caja-margen` (3 px). Con rectángulo, el nombre lleva `data-dif-no` (texto DOM normal, color `--nombre-caja-letra`).
- **Franja** (`Comun.franja(seccionActual)`): al final de las parrillas (lista.js) y de cada proyecto (sustituye al botón «Start a conversation»); otras secciones (films/series/comercials menos la actual) + Contact, marquee CSS (`franja-pasa`, dos mitades iguales, duración = ancho/velocidad). Claves `franja` (si/no), `franja_fuente/_tamano/_velocidad/_fondo/_color`.
- **Contact en el inicio** siempre visible (ya no es parte del despliegue de WORK).
- **Móvil**: texto de los recuadros empieza a `--cartel-texto-izq-movil` (1/3), todos alineados.
- **Fotos al inicio desde el editor**: botón «Inicio» en cada foto → entrada en `E.home` con `origen` (la foto); al publicar se crea `contenido/home/<carpeta>-NN.jpg` reutilizando el sha del blob (sin volver a subir). En la pestaña Inicio, «✕ Quitar» borra el archivo. Identificación foto↔inicio por sha.
- **Versión del gestor** (`VERSION_GESTOR`): antes de publicar compara con el gestor.html del repo; si es distinto, no publica (evita que una pestaña antigua guarde con el formato viejo: pasó con Salitre, alternando portada.jpg / clave portada:). Subir la versión en cada entrega.

## Piezas compartidas (`assets/js/comun.js` → `window.Comun`)
- Menú inyectado (`pintarMenu`), distinto según `body[data-pagina]`: **inicio** = `.menu__centro` (nombre · production designer · work) arriba, `.menu__izq` (films, series) y `.menu__der` (commercials, videoclips) a media altura, `.menu__pie` (contact) abajo; **secciones** (work, films, series, comercials, videoclips) = nombre (enlace al inicio) + `.menu__donde` con dónde estás, nada más; **contact** = nombre + enlace "Work"; **proyecto** = solo el nombre, fijo arriba todo el rato. Los laterales existen SOLO en el inicio. Cada `<a>` del menú lleva un rectángulo de clic invisible (`--menu-zona-alto` / `--menu-zona-ancho`, relleno + margen negativo) para poder pinchar sin dar justo en las letras.
- `Comun.reproductor(url)` → HTML del vídeo (Vimeo/YouTube con autoplay mudo, archivo .mp4 → `<video>`, código `<iframe…>` tal cual). `Comun.ficha(p)` → [título, directed by…, produced by…].
- Cortina de transición entre páginas (`.cortina`, `Comun.irA(href)`).
- `Comun.autoScroll()` botón "auto" (se para al tocar/rueda/teclado).
- `Comun.visor(urls, i)` visor de fotos.
- `Comun.letras(texto, retraso, inicio)` → spans `.palabra > .letra` con `--d` (retraso).
- `Comun.azar(string)` pseudoaleatorio estable.
- Textos de menú/filtros/botón desde `AJUSTES.textos`.
- `Comun.embed(url)` Vimeo/YouTube → URL de iframe.

## Contraste de las letras (`assets/js/diferencia.js`)
Idea de la dueña: letras BLANCAS; donde caen sobre color claro, NEGRAS. Siempre blanco/negro puros (rechazó grises y fundidos).
- Modo `pixel` (por defecto, el que quiere): «como Diferencia de Photoshop pero solo donde hace falta». Vistazo a 1 px CSS: si nada bajo las letras llega a `umbral` (tolerancia, 0.5) → todo blanco directo. Si no: fondo a resolución de dispositivo, luminancia lineal con box blur de `grano` px (1.5, quita motas de texturas), binario con banda ±0.02 de histéresis por píxel, recortado con la máscara exacta de las letras.
- Modos `palabra` / `letra` / `texto`: cada unidad entera de un color (≥50 % de píxeles claros → negro; vuelve <35 %). Los probó y prefiere `pixel`.
Respeta máscaras: overflow y `clip-path: inset()` de los padres (`recorte()`). Textos anidados no se pintan dos veces. `data-dif-vivo` en el texto o un ancestro (p. ej. el nav durante la animación de WORK) = letras moviéndose por dentro → se remiden cada fotograma (si no, se pintan en la posición guardada y la animación no se ve). Ajustes leídos en vivo de `AJUSTES.diferencia` (el gestor los cambia).
Cómo: capa `<canvas class="dif-capa">` fija (z 80) y `canvas.dif-local` dentro de la celda para textos que se mueven con la página. Reconstruye el fondo (imgs/vídeos con rect, object-fit/position, opacidad, filtros, recorte por overflow). El DOM queda transparente (`.dif-activo`). Si `getImageData` falla (file://), se apaga y queda texto blanco.
`window.Diferencia`: `colorPara(hex)`, `umbral(valor?)`, `tiempos()`, `ms`.
Textos con `[data-dif-no]` (o dentro) se saltan: texto DOM normal (p. ej. el nombre con rectángulo negro en las parrillas, `.nombre__caja`). No se activa en `diferencia.paginasSin` (por defecto Contact: sin fotos, texto DOM normal y fijo).
Para añadir un texto nuevo al sistema: añadir su selector a `AJUSTES.diferencia.textos` (o ponerle `data-dif`).

## (Eliminado) About glitch
El efecto tipo "matrix" del about se quitó a petición de la dueña; los archivos `about-glitch.*` y `about.*` ya no existen. Texto plano en `contact.html`.


## Estilo
- Todo lo ajustable en `assets/css/ajustes.css`, por secciones numeradas: **0 EL NOMBRE** (`--nombre-tam`, `--nombre-fuente`, `--nombre-espaciado`, `--nombre-negrita`, `--nombre-tam-movil`, `--menu-tam`) lo primero del archivo porque es lo que más se toca, 1 fuentes, 2 inicio, 2b color de letras, 3 menú, 4 rejillas, 5 página de proyecto (`--video-*`, `--proyecto-tam-*`), 6 contact, 7 colores, 8 tiempos. No poner números sueltos en otros CSS: crear variable aquí.
- Las letras del inicio y del menú no tienen contorno (`-webkit-text-stroke: 0`).
- `.rejilla-cine` (base.css): `gap: var(--hilo)` con `background: var(--hilo-color)` = línea entre fotos (gestor → Parrillas, claves `parrilla_hilo`, `parrilla_hilo_color`); con hilo 0 las celdas solapan 1 px (margen `calc(min(var(--hilo),1px) - 1px)`) para que no asomen líneas por medios píxeles. Texto de los recuadros: `--cartel-texto-tam` / `--cartel-texto-fuente` (claves `parrilla_texto_tamano`, `parrilla_texto_fuente`, aplicadas en `Comun.aplicarEfectos`). Antes `--hilo` existía pero no estaba conectado a nada; grid de `--cols` columnas, celdas `aspect-ratio: var(--formato)`, hilo blanco `::after`, imágenes `object-fit: cover` que aparecen con `.visible` (IntersectionObserver en `Comun.aparecer`).
- `.mezcla` conserva el selector antiguo; el color visible lo calcula el canvas en blanco o negro.
- Tiempos del pase: `AJUSTES.inicio` → variables CSS en `inicio.js`.

## Herramientas Windows (`herramientas-windows/`)
Espejo de las de Mac. Cada `.bat` (ASCII, CRLF) llama a `_tareas.ps1 <tarea>` (PowerShell 5.1 compatible, **UTF-8 con BOM** para que Windows lea las tildes). Diálogos con Windows Forms. Token cifrado con DPAPI (`ConvertFrom-SecureString`) en `%APPDATA%\web-portfolio\token.dat`. Config en `herramientas-windows/.config-local` (mismo formato que la de Mac, gitignored). `_generar-datos.ps1` produce un `datos-generados.js` idéntico byte a byte al del script bash; si se cambia uno, cambiar el otro. Imágenes: System.Drawing, aplica la orientación EXIF y reduce a 2600 px JPG. `.gitattributes` fija LF para .sh/.command y CRLF para .bat/.ps1.

## Herramientas Mac (`herramientas-mac/`)
`.command` = scripts bash que se abren con doble clic en macOS. Diálogos con `osascript`. Token de GitHub en el Llavero (`security`, servicio `web-portfolio-github`), usuario/repo en `.config-local` (gitignored). Push/pull con URL que lleva el token en el momento (nunca se guarda en `.git/config`). Imágenes nuevas se reducen a 2600px JPG con `sips`.

## Gestor (`gestor.html`, UN SOLO ARCHIVO con su CSS y JS dentro)
Pestañas: Inicio · Films · Series · Commercials · Videoclips · Contact · Parrillas (línea entre fotos, rectángulo detrás del nombre `parrilla_nombre_caja`/`_color`, tipografía/tamaño del texto; vista previa de work.html) · Cabecera (nombre/tipografía + animación del nombre + menú WORK + color de las letras; vista previa en iframe de index.html, se reaplica cada 500 ms; botones ▶ para ver las animaciones). Las vistas previas (iframes con `?vista=gestor`) reciben los ajustes por `postMessage({tipo:'gestor', campos, accion})` — escucha en comun.js —, así funcionan aunque el gestor se abra desde file:// (entonces el iframe carga la web publicada, `webBase()`). OJO: si la dueña abre el gestor.html del zip en local, guarda datos con el formato nuevo aunque la web publicada siga con el código viejo: instalar siempre las actualizaciones desde el gestor publicado. Firma flotante «gildafitnes x ido» abajo a la derecha (`.firma`) (las de sección salen de `TIPOS` dentro del propio archivo). App web interna (noindex, no enlazada) que edita el repo directamente con la API de GitHub y un token fine-grained (Contents RW) guardado en localStorage. Repo detectado de la URL `usuario.github.io/repo/` (o campo manual / `ipesoa/idoweb`). Carga: ref → árbol recursivo → `datos-generados.js` (evaluado) + carpetas reales. Estado en memoria; "Publicar" = un único commit con Git Data API (blobs → tree con base_tree, `sha:null` para borrar, renombrados reutilizando el sha del blob → commit → PATCH ref sin force). Reescribe info.txt de los proyectos tocados, renombra fotos a `01.jpg`, `02.jpg`… según el orden del editor y guarda la portada como clave `portada:` (botón «Portada» = marca, no mueve la foto), regenera `datos-generados.js` con el MISMO formato que `_generar-datos.sh` (verificado) + comentario `/* gestor: versión */`, y renueva `?v=` en los .html. Fotos nuevas: `createImageBitmap(imageOrientation: from-image)` → canvas → JPEG 0.82, máx. 2600 px. LED: compara `datos-generados.js` publicado (fetch a `usuario.github.io`) con el del repo. Accesos directos en `gestor-accesos/`.
**Instalar actualización (.zip)** (pie del gestor): lee el zip en el navegador (directorio central + `DecompressionStream('deflate-raw')`), toma como raíz la carpeta donde está `index.html`, ignora `contenido/`, `__MACOSX`, `.git`, `.DS_Store`, `.config-local`; `borrar.txt` en la raíz = rutas a eliminar (una por línea, `carpeta/` para carpetas; nunca contenido/). Sube solo los archivos cuyo sha git cambia, renueva `?v=` en todos los .html y hace un único commit. Es la forma de entregar cambios de código a la dueña: un zip sin `contenido/`.

## Caché
Todos los `<link>`/`<script>` locales llevan `?v=AAAAMMDDHHMM`. `4-Publicar` (Mac y Windows) lo renueva solo. Si se edita a mano, cambiarlo en TODOS los .html a la vez. `diferencia.js` inyecta sus propios estilos para no depender de base.css.

## Convenciones
- Todo en español (nombres de variables, clases, comentarios), porque la dueña lee los archivos.
- Rutas relativas siempre (la web vive en `usuario.github.io/repo/`).
- No añadir dependencias externas salvo fuentes de Google y GSAP (copiado en `assets/js/vendor/`, no CDN).
- Después de cambiar algo, probar escritorio (1440×900) y móvil (390×844).
