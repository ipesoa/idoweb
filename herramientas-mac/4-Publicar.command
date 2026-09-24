#!/bin/bash
# =====================================================================
#  4 · PUBLICAR  ·  sube todos los cambios a GitHub (y la web se
#  actualiza sola en 1-2 minutos)
# =====================================================================
source "$(dirname "$0")/_comun.sh"
echo "== Publicar =="
comprobar_git; comprobar_config
TOKEN=$(leer_token)
generar

# Avisar de archivos demasiado grandes (GitHub no acepta más de 100 MB)
GRANDES=$(find contenido -type f -size +90M 2>/dev/null)
if [ -n "$GRANDES" ]; then
  error "Estos archivos son demasiado grandes para GitHub (máx. 100 MB). Súbelos a Vimeo y pon el enlace en info.txt:

$GRANDES"
  exit 1
fi

# Número de versión nuevo en las páginas: así los navegadores nunca mezclan
# archivos viejos (guardados en su caché) con los nuevos
V=$(date +%Y%m%d%H%M)
for f in *.html; do sed -i '' -E "s/\?v=[0-9]+\"/?v=$V\"/g" "$f"; done

git add -A
if git diff --cached --quiet; then
  echo "No hay cambios nuevos."
else
  MENSAJE=$(pregunta "¿Qué has cambiado? (una frase, opcional)" "Actualización")
  git commit -q -m "${MENSAJE:-Actualización} ($(date '+%d/%m/%Y %H:%M'))"
fi

echo "Trayendo cambios de internet por si acaso…"
git pull -q --no-rebase --no-edit "$(url_con_token "$TOKEN")" main 2>/dev/null
echo "Subiendo…"
if git push -q "$(url_con_token "$TOKEN")" HEAD:main 2>/tmp/push-error.txt; then
  USR=${GH_REPO%%/*}; REPO=${GH_REPO#*/}
  aviso "Publicado ✓

En 1-2 minutos estará en:
https://$USR.github.io/$REPO/"
else
  sed "s/$TOKEN/****/g" /tmp/push-error.txt
  error "No se ha podido subir. Mira el mensaje en la ventana de Terminal. Si dice 'conflict', pide ayuda antes de seguir."
fi
rm -f /tmp/push-error.txt
