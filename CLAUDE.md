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
contenido/datos-generados.js   → window.CONTENIDO = { films:[{carpeta, info, archivos:[{f,w,h}]}], comercials:[…], about:{info, filmografia, archivos} }
        │  assets/js/contenido.js  (parsea info.txt → objetos)
        ▼
window.Web = { proyectos(tipo), proyecto(tipo,id), about, filmografia(), parrafos(txt), leerInfo(txt) }
```

- `datos-generados.js` **se regenera**; nunca editarlo a mano. Tras tocar `contenido/`, ejecutar `bash herramientas-mac/_generar-datos.sh`.
- `info.txt`: líneas `clave: valor` hasta una línea `---`; después, texto libre. Las claves se normalizan (minúsculas, sin tildes, espacios→`_`): `año`→`ano`. Líneas con `#` = comentarios. Carpetas que empiezan por `_` se ignoran.
- Portada: clave `portada:` o archivo `portada.*`; versión móvil `portada-movil.*` o clave `portada_movil:`. El resto de imágenes/vídeos = galería, en orden alfabético.
- Claves reconocidas: `titulo, año, labor, director, productora, cliente, mostrar_en_inicio (si/no), encuadre (object-position), video (Vimeo/YouTube), orden`. Cualquier otra clave queda disponible en `proyecto.extra`.

## Páginas

| Archivo | JS | CSS | Qué hace |
|---|---|---|---|
| `index.html` | `inicio.js` + `colores.js` | `inicio.css` | Pase fullscreen: proyectos con `mostrar_en_inicio: si`. Doble capa de imagen con fundido+desenfoque, texto Arial letra a letra. Colores: modo `tabla` (por defecto) = se muestrea la franja central de la foto en un canvas, se busca la fila más cercana de `AJUSTES.tablaColores` y se ponen `--inicio-letra`/`--inicio-borde` en `<body>` (clase `modo-tabla`, blend normal); `color_letra`/`color_borde` en info.txt mandan. Si el canvas está "tainted" (file:// en Chrome) cae a `modo-diferencia`. Clic → proyecto. ←/→ y swipe. |
| `films.html`, `comercials.html` | `lista.js` | `lista.css` | `.rejilla-cine.lista-cine` desde arriba (sin título). `--lista-columnas`, `--lista-formato`. Info Arial pequeña sigue al cursor. |
| `proyecto.html?tipo=films&id=CARPETA` | `proyecto.js` | `proyecto.css` | `.rejilla-cine.proyecto-cine` desde arriba: portada + galería (+ iframe si `video:`), sin textos. Al final solo botón Contact (mailto a `about.email`). |
| `about.html` | `about.js` | `about.css` | Minimal Arial: nombre, subtitulo, ubicacion + lista de trabajos (films + comercials + `filmografia-extra.txt`) con filtros Films (por defecto) / Comercials / Todo. |
| `laboratorio.html` | inline + `colores.js` | inline | Herramienta interna: tabla de colores sobre cada foto, grosor de borde, mezcla, fuente. No enlazada en el menú. |

Orden de scripts en cada página: `datos-generados.js → ajustes.js → contenido.js → comun.js → <página>.js`.

## Piezas compartidas (`assets/js/comun.js` → `window.Comun`)
- Menú inyectado (`pintarMenu`), clases `.menu__nombre/.menu__about/.menu__films/.menu__comercials`. En `body.pagina-inicio` films/comercials van a media altura; en el resto, arriba; en móvil abajo.
- Cortina de transición entre páginas (`.cortina`, `Comun.irA(href)`).
- `Comun.autoScroll()` botón "auto" (se para al tocar/rueda/teclado).
- `Comun.visor(urls, i)` visor de fotos.
- `Comun.letras(texto, retraso, inicio)` → spans `.palabra > .letra` con `--d` (retraso).
- `Comun.azar(string)` pseudoaleatorio estable.
- Textos de menú/filtros/botón desde `AJUSTES.textos`.
- `Comun.embed(url)` Vimeo/YouTube → URL de iframe.

## Estilo
- Todo lo ajustable en `assets/css/ajustes.css`, por secciones numeradas (1 fuentes, 2 inicio: tamaños y `--inicio-borde-grosor`, 3 menú resto, 4 rejillas: `--lista-*`/`--proyecto-*` formato y columnas + etiqueta, 5 about, 6 colores, 7 tiempos). No poner números sueltos en otros CSS: crear variable aquí.
- Borde de letras del inicio: `-webkit-text-stroke-width` + `paint-order: stroke fill` en `.pase__pie` y `.pagina-inicio .menu` (inicio.css).
- `.rejilla-cine` (base.css): grid de `--cols` columnas, celdas `aspect-ratio: var(--formato)`, hilo blanco `::after`, imágenes `object-fit: cover` que aparecen con `.visible` (IntersectionObserver en `Comun.aparecer`).
- `.mezcla` = `mix-blend-mode: var(--texto-mezcla)` (etiqueta del ratón, modo diferencia). Los ancestros no deben crear aislamiento (`isolation`, `opacity<1`, `transform`, `filter`).
- Tiempos del pase: `AJUSTES.inicio` → variables CSS en `inicio.js`.

## Herramientas Windows (`herramientas-windows/`)
Espejo de las de Mac. Cada `.bat` (ASCII, CRLF) llama a `_tareas.ps1 <tarea>` (PowerShell 5.1 compatible, **UTF-8 con BOM** para que Windows lea las tildes). Diálogos con Windows Forms. Token cifrado con DPAPI (`ConvertFrom-SecureString`) en `%APPDATA%\web-portfolio\token.dat`. Config en `herramientas-windows/.config-local` (mismo formato que la de Mac, gitignored). `_generar-datos.ps1` produce un `datos-generados.js` idéntico byte a byte al del script bash; si se cambia uno, cambiar el otro. Imágenes: System.Drawing, aplica la orientación EXIF y reduce a 2600 px JPG. `.gitattributes` fija LF para .sh/.command y CRLF para .bat/.ps1.

## Herramientas Mac (`herramientas-mac/`)
`.command` = scripts bash que se abren con doble clic en macOS. Diálogos con `osascript`. Token de GitHub en el Llavero (`security`, servicio `web-portfolio-github`), usuario/repo en `.config-local` (gitignored). Push/pull con URL que lleva el token en el momento (nunca se guarda en `.git/config`). Imágenes nuevas se reducen a 2600px JPG con `sips`.

## Convenciones
- Todo en español (nombres de variables, clases, comentarios), porque la dueña lee los archivos.
- Rutas relativas siempre (la web vive en `usuario.github.io/repo/`).
- No añadir dependencias externas salvo fuentes de Google.
- Después de cambiar algo, probar escritorio (1440×900) y móvil (390×844).
