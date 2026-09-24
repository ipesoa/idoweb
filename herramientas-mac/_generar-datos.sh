#!/bin/bash
# =====================================================================
#  GENERAR DATOS  ·  lee las carpetas de /contenido y escribe
#  contenido/datos-generados.js  (lo que la web lee para saber qué hay)
#
#  No hace falta ejecutarlo a mano: lo lanzan "Ver en local",
#  "Publicar" y "Nuevo proyecto". NO edites datos-generados.js a mano.
#  Carpetas que empiezan por "_" (como _PLANTILLA) se ignoran.
# =====================================================================
cd "$(dirname "$0")/.." || exit 1
SALIDA="contenido/datos-generados.js"

# texto → literal JS entre comillas invertidas
escapar() { sed -e 's/\\/\\\\/g' -e 's/`/\\`/g' -e 's/\$/\\$/g' "$1"; }
# nombre de archivo → cadena JSON
json() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

# medidas de una imagen (solo en Mac, con "sips"); si no, la web las calcula sola
medidas() {
  if command -v sips >/dev/null 2>&1; then
    sips -g pixelWidth -g pixelHeight "$1" 2>/dev/null |
      awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{ if (w && h) printf ",\"w\":%s,\"h\":%s", w, h }'
  fi
}

archivos() { # $1 = carpeta
  local primero=1 f nombre ext
  printf '['
  for f in "$1"/*; do
    [ -f "$f" ] || continue
    nombre=$(basename "$f")
    ext=$(printf '%s' "${nombre##*.}" | tr 'A-Z' 'a-z')
    case "$ext" in
      jpg|jpeg|png|webp|gif|avif) extra=$(medidas "$f") ;;
      mp4|webm|mov|m4v) extra="" ;;
      *) continue ;;
    esac
    [ $primero -eq 1 ] || printf ','
    primero=0
    printf '\n      {"f":"%s"%s}' "$(json "$nombre")" "$extra"
  done
  printf ']'
}

tipo() { # $1 = films | series | comercials | videoclips
  printf '  "%s": [\n' "$1"
  [ -d contenido/"$1" ] || { printf '  ],\n'; return; }
  for d in contenido/"$1"/*/; do
    [ -d "$d" ] || continue
    d=${d%/}
    carpeta=$(basename "$d")
    case "$carpeta" in _*) continue ;; esac
    [ -f "$d/info.txt" ] || { echo "  ⚠ $d no tiene info.txt (se salta)" >&2; continue; }
    printf '    {\n      "carpeta": "%s",\n      "info": `' "$(json "$carpeta")"
    escapar "$d/info.txt"
    printf '`,\n      "archivos": '
    archivos "$d"
    printf '\n    },\n'
  done
  printf '  ],\n'
}

{
  echo "/* ARCHIVO GENERADO AUTOMÁTICAMENTE por herramientas-mac/_generar-datos.sh o herramientas-windows/_generar-datos.ps1"
  echo "   No lo edites a mano: cambia las carpetas de /contenido y vuelve a generarlo. */"
  echo "window.CONTENIDO = {"
  tipo films
  tipo series
  tipo comercials
  tipo videoclips
  printf '  "about": {\n    "info": `'
  [ -f contenido/about/info.txt ] && escapar contenido/about/info.txt
  printf '`,\n    "filmografia": `'
  [ -f contenido/about/filmografia-extra.txt ] && escapar contenido/about/filmografia-extra.txt
  printf '`,\n    "archivos": '
  archivos contenido/about
  printf '\n  }\n};\n'
} > "$SALIDA.tmp" && mv "$SALIDA.tmp" "$SALIDA"

resumen=""
for t in films series comercials videoclips; do
  n=$(find "contenido/$t" -mindepth 1 -maxdepth 1 -type d ! -name '_*' 2>/dev/null | wc -l | tr -d ' ')
  resumen="$resumen $n $t,"
done
echo "✓ Datos actualizados:${resumen%,}"
