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
| `index.html` | `inicio.js` | `inicio.css` | Pase fullscreen: proyectos con `mostrar_en_inicio: si`. Doble capa de imagen con fundido+desenfoque, texto letra a letra con `mix-blend-mode`. Clic → proyecto. ←/→ y swipe. |
| `films.html`, `comercials.html` | `lista.js` | `lista.css` | Mosaico de portadas. Tipo según `<body data-pagina>`. Etiqueta que sigue al cursor. Formas en la constante `FORMAS`. |
| `proyecto.html?tipo=films&id=CARPETA` | `proyecto.js` | `proyecto.css` | Portada fullscreen + mosaico de la galería + bloque de texto (`AJUSTES.mosaico.posicionTexto`) + vídeo + anterior/siguiente. |
| `about.html` | `about.js` | `about.css` | Bio, contacto, showreel, filmografía (films + comercials + `filmografia-extra.txt`) con filtros. |
| `laboratorio.html` | inline | inline | Herramienta interna para probar mezcla/color/fuente. No enlazada en el menú. |

Orden de scripts en cada página: `datos-generados.js → ajustes.js → contenido.js → comun.js → <página>.js`.

## Piezas compartidas (`assets/js/comun.js` → `window.Comun`)
- Menú inyectado (`pintarMenu`), clases `.menu__nombre/.menu__about/.menu__films/.menu__comercials`. En `body.pagina-inicio` films/comercials van a media altura; en el resto, arriba; en móvil abajo.
- Cortina de transición entre páginas (`.cortina`, `Comun.irA(href)`).
- `Comun.autoScroll()` botón "auto" (se para al tocar/rueda/teclado).
- `Comun.visor(urls, i)` visor de fotos.
- `Comun.empaquetar(piezas, cols)` **empaquetador del mosaico sin huecos**: cada pieza `{el, c, f:(c)=>filas, fijo}`; rellena siempre el primer hueco libre, estrecha/acorta piezas no fijas, y estira las últimas para dejar el borde inferior recto. Escribe `grid-column/grid-row` inline.
- `Comun.letras(texto, retraso, inicio)` → spans `.palabra > .letra` con `--d` (retraso).
- `Comun.azar(string)` pseudoaleatorio estable (misma foto → mismo tamaño siempre).
- `Comun.embed(url)` Vimeo/YouTube → URL de iframe.

## Estilo
- Tokens en `assets/css/ajustes.css` (`--fuente-*`, `--color-*`, `--texto-mezcla`, `--texto-color`, `--menu-mezcla`, `--hilo`, `--columnas-*`, `--alto-fila`…). Fuentes vía `@import` de Google Fonts al principio de ese archivo.
- Efecto "diferencia": clase `.mezcla` = `color: var(--texto-color); mix-blend-mode: var(--texto-mezcla)`. Para que funcione, los ancestros del texto no deben crear aislamiento (`isolation`, `opacity<1`, `transform`, `filter`) entre el texto y la imagen.
- Mosaico: `.mosaico` en `base.css`; columnas por breakpoint (1100px / 700px); alto de fila = ancho de columna × `--alto-fila`. El hilo blanco es un `::after` con borde en cada celda.
- Tiempos del pase: `AJUSTES.inicio` se pasan como variables CSS en `inicio.js`.

## Herramientas Mac (`herramientas-mac/`)
`.command` = scripts bash que se abren con doble clic en macOS. Diálogos con `osascript`. Token de GitHub en el Llavero (`security`, servicio `web-portfolio-github`), usuario/repo en `.config-local` (gitignored). Push/pull con URL que lleva el token en el momento (nunca se guarda en `.git/config`). Imágenes nuevas se reducen a 2600px JPG con `sips`.

## Convenciones
- Todo en español (nombres de variables, clases, comentarios), porque la dueña lee los archivos.
- Rutas relativas siempre (la web vive en `usuario.github.io/repo/`).
- No añadir dependencias externas salvo fuentes de Google.
- Después de cambiar algo, probar escritorio (1440×900) y móvil (390×844).
