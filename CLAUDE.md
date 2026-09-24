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
- Portada: clave `portada:` o archivo `portada.*`; versión móvil `portada-movil.*` o clave `portada_movil:`. El resto de imágenes/vídeos = galería, en orden alfabético.
- Claves reconocidas: `titulo, año, labor, director (o "directed by"), productora (o "produced by"), cliente, mostrar_en_inicio (si/no), encuadre (object-position), video, crew (repetible), orden`. Una clave repetida acumula sus valores separados por `\n` (así funciona `crew:`). Cualquier otra clave queda disponible en `proyecto.extra`.
- **Secciones**: films, series, comercials (se lee "Commercials"), videoclips. La lista manda desde `AJUSTES.secciones` (assets/js/ajustes.js) y debe coincidir con: los generadores de datos (bash y ps1), `TIPOS` del gestor y las páginas .html.

## Páginas

| Archivo | JS | CSS | Qué hace |
|---|---|---|---|
| `index.html` | `inicio.js` | `inicio.css` | Pase fullscreen SIN textos (`AJUSTES.inicio.mostrarTitulos: false`): solo la imagen, fundido+desenfoque y zoom lento. Clic → proyecto. ←/→ y swipe. |
| `work.html` | `lista.js` | `lista.css` | Todos los trabajos juntos, del más nuevo al más viejo. Arriba solo el nombre y "Work"; sin filtros ni enlaces (los filtros por sección están en `contact.html`). |
| `films.html`, `series.html`, `comercials.html`, `videoclips.html` | `lista.js` | `lista.css` | Rejilla de una sección. Info a las 4 del cursor: **título / directed by / produced by** (`Comun.ficha`). |
| `proyecto.html?tipo=films&id=CARPETA` | `proyecto.js` | `proyecto.css` | 1 vídeo limpio arriba (`Comun.reproductor`, autoplay mudo), 2 ficha centrada, 3 crew a dos columnas, 4 texto (alineado a la izquierda), 5 rejilla de fotos, 6 botón "Start a conversation" → contact.html. Arriba solo el nombre, siempre visible. |
| `contact.html` (antes about.html, que ahora redirige) | `contact.js` | `contact.css` | Columna abajo a la derecha: texto libre de `contenido/about/info.txt`, lista de TODOS los trabajos con filtros (All por defecto · Films · Series · Commercials · Videoclips) y email/teléfono/instagram. La lista tiene alto fijo (`--about-alto-lista`) para que al cambiar de filtro no se mueva nada; si esa sección está vacía sale una raya (`.trabajos.vacia`). Sin efectos. |
| `laboratorio.html` | inline + `diferencia.js` | inline | Herramienta interna: el modelo de color sobre las fotos, boyas (✓ exactas), rampas de continuidad, radio, pegar JSON. No enlazada en el menú. |

Orden de scripts en cada página: `datos-generados.js → ajustes.js → contenido.js → comun.js → <página>.js`.

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

## Color de las letras: "Difference dirigido" (`assets/js/diferencia.js` + `diferencia-modelo.js`)
Función de la dueña (NO cambiar la matemática sin que lo pida):
`salida(fondo) = OKLab→sRGB( OKLab(|fondo − mezcla|) + Σ wᵢ·exp(−(|OKLab(fondo) − OKLab(bgᵢ)|/radio)²) )`, con `w` resuelto (Φw = residuos) para que en cada boya la salida sea exacta. Letra (mezcla #FFFFFF) y borde (#18A8FF) con boyas independientes. Nada de tablas/categorías/vecino más cercano.
Aplicación píxel a píxel: capa `<canvas class="dif-capa">` fija encima (z 80). Cada fotograma, para cada texto de `AJUSTES.diferencia.textos`: reconstruye en un canvas el fondo real detrás (imgs/vídeos con su rect, object-fit/position, opacidad y filtros acumulados, recorte por overflow; el hilo blanco NO se dibuja), mapea cada píxel con una LUT 33³ trilineal (+ valor exacto si el píxel coincide con una boya), y recorta con máscaras de las letras dibujadas con la misma fuente/posición (Range por carácter), opacidad y desenfoque que el DOM (borde = strokeText con el ancho de `-webkit-text-stroke`). El DOM queda con texto transparente (`.dif-activo`). Si `getImageData` falla (file:// en Chrome) → se quita `.dif-activo` y queda el Difference base con CSS.
`window.Diferencia`: `colorPara(hex)`, `construir(modelo)`, `letra(rgb)`, `borde(rgb)`, `tiempos()`, `ms`.
Para añadir un texto nuevo al sistema: añadir su selector a `AJUSTES.diferencia.textos` (o ponerle `data-dif`).

## (Eliminado) About glitch
El efecto tipo "matrix" del about se quitó a petición de la dueña; los archivos `about-glitch.*` y `about.*` ya no existen. Texto plano en `contact.html`.


## Estilo
- Todo lo ajustable en `assets/css/ajustes.css`, por secciones numeradas: **0 EL NOMBRE** (`--nombre-tam`, `--nombre-fuente`, `--nombre-espaciado`, `--nombre-negrita`, `--nombre-tam-movil`, `--menu-tam`) lo primero del archivo porque es lo que más se toca, 1 fuentes, 2 inicio, 2b color de letras, 3 menú, 4 rejillas, 5 página de proyecto (`--video-*`, `--proyecto-tam-*`), 6 contact, 7 colores, 8 tiempos. No poner números sueltos en otros CSS: crear variable aquí.
- Borde de letras del inicio: `-webkit-text-stroke-width` + `paint-order: stroke fill` en `.pase__pie` y `.pagina-inicio .menu` (inicio.css).
- `.rejilla-cine` (base.css): grid de `--cols` columnas, celdas `aspect-ratio: var(--formato)`, hilo blanco `::after`, imágenes `object-fit: cover` que aparecen con `.visible` (IntersectionObserver en `Comun.aparecer`).
- `.mezcla` = `mix-blend-mode: var(--texto-mezcla)` (etiqueta del ratón, modo diferencia). Los ancestros no deben crear aislamiento (`isolation`, `opacity<1`, `transform`, `filter`).
- Tiempos del pase: `AJUSTES.inicio` → variables CSS en `inicio.js`.

## Herramientas Windows (`herramientas-windows/`)
Espejo de las de Mac. Cada `.bat` (ASCII, CRLF) llama a `_tareas.ps1 <tarea>` (PowerShell 5.1 compatible, **UTF-8 con BOM** para que Windows lea las tildes). Diálogos con Windows Forms. Token cifrado con DPAPI (`ConvertFrom-SecureString`) en `%APPDATA%\web-portfolio\token.dat`. Config en `herramientas-windows/.config-local` (mismo formato que la de Mac, gitignored). `_generar-datos.ps1` produce un `datos-generados.js` idéntico byte a byte al del script bash; si se cambia uno, cambiar el otro. Imágenes: System.Drawing, aplica la orientación EXIF y reduce a 2600 px JPG. `.gitattributes` fija LF para .sh/.command y CRLF para .bat/.ps1.

## Herramientas Mac (`herramientas-mac/`)
`.command` = scripts bash que se abren con doble clic en macOS. Diálogos con `osascript`. Token de GitHub en el Llavero (`security`, servicio `web-portfolio-github`), usuario/repo en `.config-local` (gitignored). Push/pull con URL que lleva el token en el momento (nunca se guarda en `.git/config`). Imágenes nuevas se reducen a 2600px JPG con `sips`.

## Gestor (`gestor.html`, UN SOLO ARCHIVO con su CSS y JS dentro)
Pestañas: Inicio · Films · Series · Commercials · Videoclips · Contact (las de sección salen de `TIPOS` dentro del propio archivo). App web interna (noindex, no enlazada) que edita el repo directamente con la API de GitHub y un token fine-grained (Contents RW) guardado en localStorage. Repo detectado de la URL `usuario.github.io/repo/` (o campo manual / `ipesoa/idoweb`). Carga: ref → árbol recursivo → `datos-generados.js` (evaluado) + carpetas reales. Estado en memoria; "Publicar" = un único commit con Git Data API (blobs → tree con base_tree, `sha:null` para borrar, renombrados reutilizando el sha del blob → commit → PATCH ref sin force). Reescribe info.txt de los proyectos tocados, renombra fotos a `portada.jpg`, `01.jpg`… según el orden, regenera `datos-generados.js` con el MISMO formato que `_generar-datos.sh` (verificado) + comentario `/* gestor: versión */`, y renueva `?v=` en los .html. Fotos nuevas: `createImageBitmap(imageOrientation: from-image)` → canvas → JPEG 0.82, máx. 2600 px. LED: compara `datos-generados.js` publicado (fetch a `usuario.github.io`) con el del repo. Accesos directos en `gestor-accesos/`.
**Instalar actualización (.zip)** (pie del gestor): lee el zip en el navegador (directorio central + `DecompressionStream('deflate-raw')`), toma como raíz la carpeta donde está `index.html`, ignora `contenido/`, `__MACOSX`, `.git`, `.DS_Store`, `.config-local`; `borrar.txt` en la raíz = rutas a eliminar (una por línea, `carpeta/` para carpetas; nunca contenido/). Sube solo los archivos cuyo sha git cambia, renueva `?v=` en todos los .html y hace un único commit. Es la forma de entregar cambios de código a la dueña: un zip sin `contenido/`.

## Caché
Todos los `<link>`/`<script>` locales llevan `?v=AAAAMMDDHHMM`. `4-Publicar` (Mac y Windows) lo renueva solo. Si se edita a mano, cambiarlo en TODOS los .html a la vez. `diferencia.js` inyecta sus propios estilos para no depender de base.css.

## Convenciones
- Todo en español (nombres de variables, clases, comentarios), porque la dueña lee los archivos.
- Rutas relativas siempre (la web vive en `usuario.github.io/repo/`).
- No añadir dependencias externas salvo fuentes de Google.
- Después de cambiar algo, probar escritorio (1440×900) y móvil (390×844).
