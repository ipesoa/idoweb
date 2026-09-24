#!/bin/bash
# =====================================================================
#  2 · NUEVO PROYECTO  ·  crea la carpeta de una peli o anuncio nuevo
#  Pregunta los datos, copia y reduce las fotos, escribe info.txt
#  y abre info.txt para que escribas el texto largo.
# =====================================================================
source "$(dirname "$0")/_comun.sh"
echo "== Nuevo proyecto =="

TIPO=$(elegir "¿Qué es?" films series comercials videoclips); [ -n "$TIPO" ] || exit 0
TITULO=$(pregunta "Título:" ""); [ -n "$TITULO" ] || exit 0
ANO=$(pregunta "Año:" "$(date +%Y)")
LABOR=$(pregunta "Tu labor en el proyecto:" "Diseño de producción")
DIRECTOR=$(pregunta "Dirección (director/a):" "")
if [ "$TIPO" = comercials ]; then CLIENTE=$(pregunta "Cliente / marca:" ""); fi
INICIO=$(sino "¿Quieres que salga en el pase de imágenes de la página de inicio?")

CARPETA="contenido/$TIPO/$ANO-$(slug "$TITULO")"
if [ -e "$CARPETA" ]; then error "Ya existe $CARPETA"; exit 1; fi
mkdir -p "$CARPETA"

PORTADA=$(elegir_archivo "Elige la PORTADA (la imagen grande, horizontal)")
[ -n "$PORTADA" ] && copiar_medio "$PORTADA" "$CARPETA/portada"
if [ "$(sino "¿Tienes una versión VERTICAL de la portada para móviles? (opcional)")" = si ]; then
  PM=$(elegir_archivo "Elige la portada vertical")
  [ -n "$PM" ] && copiar_medio "$PM" "$CARPETA/portada-movil"
fi

echo "Elige las fotos del mosaico (puedes seleccionar muchas con ⌘)…"
n=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  n=$((n + 1)); printf -v num '%02d' "$n"
  echo "  copiando $(basename "$f")"
  copiar_medio "$f" "$CARPETA/$num"
done <<< "$(elegir_archivos "Elige las fotos del rodaje / decorados (se pueden elegir varias)")"

{
  echo "titulo: $TITULO"
  echo "año: $ANO"
  echo "labor: $LABOR"
  echo "director: $DIRECTOR"
  [ "$TIPO" = comercials ] && echo "cliente: $CLIENTE"
  echo "productora: "
  echo "mostrar_en_inicio: $INICIO"
  echo "# encuadre: center   (qué parte de la portada se ve: top, bottom, left, right, \"30% 50%\")"
  echo "video:              # enlace de Vimeo/YouTube, un .mp4 de tu servidor o el código <iframe…>"
  echo "# crew: Fotografía · Nombre Apellido    (una línea crew: por persona)"
  echo "---"
  echo "Escribe aquí el texto del proyecto."
} > "$CARPETA/info.txt"

generar
open -e "$CARPETA/info.txt"
open "$CARPETA"
aviso "Creado ✓  ($n fotos)

1. Escribe el texto en info.txt (se acaba de abrir) y guarda.
2. Mira cómo queda con  3-Ver-en-local.
3. Cuando te guste:  4-Publicar."
