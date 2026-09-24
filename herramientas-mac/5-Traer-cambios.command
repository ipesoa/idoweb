#!/bin/bash
# =====================================================================
#  5 · TRAER CAMBIOS  ·  descarga a este ordenador lo que esté en GitHub
#  (por ejemplo, si alguien ha cambiado un efecto desde otro ordenador)
# =====================================================================
source "$(dirname "$0")/_comun.sh"
echo "== Traer cambios =="
comprobar_git; comprobar_config
TOKEN=$(leer_token)
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  if [ "$(sino "Tienes cambios sin publicar en este ordenador. ¿Los guardo primero (sin subirlos) y luego traigo lo nuevo?")" = no ]; then exit 0; fi
  git add -A && git commit -q -m "Cambios locales ($(date '+%d/%m/%Y %H:%M'))"
fi
if git pull -q --no-rebase --no-edit "$(url_con_token "$TOKEN")" main; then
  generar
  aviso "Todo al día ✓"
else
  error "Ha habido un conflicto al juntar cambios. Pide ayuda antes de seguir."
fi
