#!/bin/bash
# =====================================================================
#  3 · VER EN LOCAL  ·  actualiza los datos y abre la web en el navegador
#  (sin publicar nada; solo en tu ordenador)
# =====================================================================
source "$(dirname "$0")/_comun.sh"
generar
open "$RAIZ/index.html"
