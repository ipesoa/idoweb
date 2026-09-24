#!/bin/bash
# =====================================================================
#  1 · CONFIGURAR  (solo la primera vez en cada ordenador)
#  Guarda el usuario, el repositorio y el token de GitHub.
#  El token se guarda en el LLAVERO del Mac, no en ningún archivo,
#  así nunca se sube a internet por error.
# =====================================================================
source "$(dirname "$0")/_comun.sh"
echo "== Configurar la web =="
comprobar_git

GH_USUARIO=$(pregunta "Tu usuario de GitHub:" "${GH_USUARIO:-}")
[ -n "$GH_USUARIO" ] || exit 0
GH_REPO=$(pregunta "Repositorio (usuario/nombre), ej:  $GH_USUARIO/web-idoia" "${GH_REPO:-$GH_USUARIO/web-idoia}")
[ -n "$GH_REPO" ] || exit 0
TOKEN=$(secreto "Pega el token de GitHub (empieza por github_pat_ o ghp_).
Si ya lo guardaste antes y no cambia, déjalo vacío.")

cat > "$CONFIG" <<CFG
GH_USUARIO="$GH_USUARIO"
GH_REPO="$GH_REPO"
CFG
[ -n "$TOKEN" ] && guardar_token "$TOKEN"
[ -n "$(leer_token)" ] || { error "No hay token guardado. Vuelve a abrir este script y pégalo."; exit 1; }

git config user.name  >/dev/null || git config user.name "$GH_USUARIO"
git config user.email >/dev/null || git config user.email "$GH_USUARIO@users.noreply.github.com"

# Conectar esta carpeta con el repositorio
if [ ! -d .git ]; then
  git init -q -b main
fi
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GH_REPO.git"

echo "Comprobando conexión con GitHub…"
if git ls-remote "$(url_con_token "$(leer_token)")" >/dev/null 2>&1; then
  # Si el repositorio ya tiene contenido, unir historias sin tocar los archivos locales
  if git ls-remote --exit-code "$(url_con_token "$(leer_token)")" main >/dev/null 2>&1 && ! git rev-parse -q --verify HEAD >/dev/null; then
    git fetch -q "$(url_con_token "$(leer_token)")" main && git reset -q FETCH_HEAD
  fi
  aviso "Listo ✓  Ya puedes usar  4-Publicar  y  5-Traer-cambios."
else
  error "No he podido conectar con github.com/$GH_REPO. Revisa el usuario, el nombre del repositorio y que el token tenga permiso de escritura (Contents: Read and write)."
fi
