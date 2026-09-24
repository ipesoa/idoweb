#!/bin/bash
# =====================================================================
#  6 · AÑADIR FOTOS  ·  mete fotos nuevas en un proyecto que ya existe
# =====================================================================
source "$(dirname "$0")/_comun.sh"
TIPO=$(elegir "¿Dónde está el proyecto?" films series comercials videoclips); [ -n "$TIPO" ] || exit 0
PROYECTOS=(); for d in contenido/"$TIPO"/*/; do n=$(basename "$d"); case "$n" in _*) ;; *) PROYECTOS+=("$n");; esac; done
[ ${#PROYECTOS[@]} -gt 0 ] || { error "No hay proyectos en $TIPO"; exit 1; }
P=$(elegir "¿Qué proyecto?" "${PROYECTOS[@]}"); [ -n "$P" ] || exit 0
CARPETA="contenido/$TIPO/$P"
# seguir la numeración: buscar el número más alto que ya hay
n=$(ls "$CARPETA" | sed -n 's/^\([0-9][0-9]*\).*/\1/p' | sort -n | tail -1); n=$((10#${n:-0}))
c=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  n=$((n + 1)); c=$((c + 1)); printf -v num '%02d' "$n"
  echo "  copiando $(basename "$f")"
  copiar_medio "$f" "$CARPETA/$num"
done <<< "$(elegir_archivos "Elige las fotos nuevas")"
generar
open "$CARPETA"
aviso "Añadidas $c fotos ✓  Míralo con 3-Ver-en-local y publica con 4-Publicar."
