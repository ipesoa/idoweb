# Web de Idoia Esteban Galván

Web de portfolio (diseño de producción): **inicio** con pase de imágenes, **Films** y **Comercials** (rejilla de portadas en formato cine), página de cada **proyecto** (rejilla de fotos + botón Contact) y **About** minimal.

No hace falta saber programar para mantenerla: todo el contenido son **carpetas con fotos + un archivo de texto** (`info.txt`).

---

## 🗂 Dónde está cada cosa

```
contenido/                 ← AQUÍ VA TODO EL CONTENIDO
  films/
    2023-la-casa-del-lago/ ← una carpeta por película
      info.txt             ← título, año, labor… y el texto
      portada.jpg          ← la imagen grande (inicio y cabecera)
      portada-movil.jpg    ← (opcional) versión vertical para móvil
      01.jpg 02.jpg …      ← fotos del mosaico, por orden de nombre
    _PLANTILLA/            ← modelo explicado (no sale en la web)
  comercials/              ← igual que films
  about/
    info.txt               ← nombre, email, instagram, showreel, bio
    retrato.jpg
    filmografia-extra.txt  ← trabajos sin fotos para la lista del about
  datos-generados.js       ← lo crea el script solo. No tocar.

herramientas-mac/          ← los botones para el día a día en Mac (doble clic)
herramientas-windows/      ← lo mismo para Windows (.bat)
assets/                    ← diseño y efectos (css = aspecto, js = comportamiento)
laboratorio.html           ← página para probar colores y tipografías
```

## ✏️ Un info.txt

```
titulo: La casa del lago
año: 2023
labor: Diseño de producción
director: Nombre Apellido
mostrar_en_inicio: si        ← si / no: sale o no en el pase del inicio
---
Texto libre. Una línea en blanco = párrafo nuevo. *Así* sale en cursiva.
```

Opcionales: `productora:`, `cliente:`, `encuadre:` (qué parte de la portada se ve: `top`, `left`, `30% 50%`…), `video:` (enlace de Vimeo/YouTube), `orden:` (número; mayor = antes), `color_letra:` / `color_borde:` (fuerzan los colores del texto de ese proyecto en el inicio).

Las fotos salen en la rejilla por orden de nombre (portada primero). Mejor horizontales: se recortan a formato cine. También vale vídeo `.mp4` corto (sin sonido, en bucle). El texto de debajo de `---` se guarda pero ahora no se muestra.

---

## 🖱 El día a día

Mac: carpeta `herramientas-mac` (archivos `.command`). Windows: carpeta `herramientas-windows` (archivos `.bat`). Hacen exactamente lo mismo.

| Doble clic en… | Para… |
|---|---|
| `1-Configurar` | **Solo la primera vez**: usuario, repositorio y token de GitHub |
| `2-Nuevo-proyecto` | Añadir una peli o anuncio: pregunta los datos, eliges fotos y lo prepara todo |
| `6-Anadir-fotos` | Meter más fotos en un proyecto que ya existe |
| `3-Ver-en-local` | Ver cómo queda en tu ordenador antes de publicar |
| `4-Publicar` | Subir los cambios a internet (1-2 min en verse) |
| `5-Traer-cambios` | Bajar a tu ordenador cambios hechos desde otro sitio |

También puedes editar a mano: cambiar un `info.txt`, borrar una foto, renombrar… y luego **3** para ver y **4** para publicar.

> **La primera vez que abras un `.command`**, macOS puede decir que "no se puede abrir porque es de un desarrollador no identificado": clic derecho → **Abrir** → **Abrir**. Solo pasa una vez por archivo.
> Si pide instalar "herramientas de línea de comandos", acepta (es de Apple, necesario para git).
>
> **En Windows**, la primera vez puede salir "Windows protegió su PC": **Más información → Ejecutar de todas formas**. Si falta Git, el propio `.bat` ofrece instalarlo. Las fotos HEIC del iPhone no se pueden leer en Windows: pásalas antes a JPG.

---

## 🚀 Poner la web en internet (una vez)

1. Crea una cuenta en [github.com](https://github.com) y un repositorio nuevo (ej. `web-idoia`), vacío.
2. Crea un **token**: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   - *Repository access*: solo ese repositorio.
   - *Permissions → Contents*: **Read and write**.
   - Copia el token (empieza por `github_pat_`).
3. Doble clic en `1-Configurar` (Mac o Windows) y pega usuario, repositorio y token.
   El token nunca se guarda dentro de la carpeta de la web (así no se sube a internet por error): en Mac va al **Llavero**; en Windows, cifrado con tu usuario en `%APPDATA%\web-portfolio`.
4. Doble clic en `4-Publicar`.
5. En GitHub: repositorio → **Settings → Pages** → *Source: Deploy from a branch* → `main` / `(root)` → Save.
6. La web queda en `https://USUARIO.github.io/web-idoia/`. (Luego se puede poner un dominio propio en la misma pantalla.)

---

## 🎨 Cambiar el aspecto

**`assets/css/ajustes.css`** (tamaños y formas), por secciones:
1. Tipografías (todo en Arial ahora)
2. **Inicio**: tamaño de IDOIA ESTEBAN GALVÁN, about, FILMS/COMERCIALS, título de la peli, año·labor, y **grosor del borde** de las letras
3. Menú en el resto de páginas
4. **Rejillas**: formato de cada rectángulo (`1.85 / 1`…) y columnas, para Films/Comercials y para la página de cada proyecto; tamaño del texto que sigue al ratón
5. About
6–7. Colores generales, tiempos, márgenes

**`assets/js/ajustes.js`** (comportamiento):
- **Tabla de colores del inicio**: *si el fondo se parece a X → letra Y + borde Z*. La web mira el color de la foto detrás del texto y elige la fila más parecida. Se pueden añadir, quitar o cambiar filas.
- Tiempos del pase de imágenes, velocidad del auto-scroll, textos de los botones (Films, Comercials, Todo, Contact).

**`laboratorio.html`**: para ver la tabla de colores sobre cada foto (pincha una fila para probarla), el grosor del borde, fuentes…

> Abriendo la web con doble clic en Chrome, el navegador no deja "leer" los colores de las fotos y el inicio usa el efecto de inversión. En la web publicada (y en Safari) la tabla funciona siempre.
- **Probar combinaciones** → abre `laboratorio.html`: eliges modo de mezcla, color y fuente sobre las fotos reales, y te da las líneas para copiar. Tiene una calculadora: "sobre este color de fondo quiero que el texto salga de este otro".

Para cambios más grandes, pásale la carpeta a una IA o a quien sea con `CLAUDE.md`: ahí está el mapa técnico de la web.
