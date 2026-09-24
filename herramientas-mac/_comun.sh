#!/bin/bash
# =====================================================================
#  Funciones que comparten los scripts .command (no se ejecuta sola)
# =====================================================================
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ" || exit 1
CONFIG="$RAIZ/herramientas-mac/.config-local"      # no se sube a GitHub
LLAVERO="web-portfolio-github"                     # nombre en el Llavero de macOS

[ -f "$CONFIG" ] && source "$CONFIG"

# ---- ventanas de diálogo (AppleScript) ----
aviso()    { osascript -e "display dialog \"$1\" buttons {\"OK\"} default button 1 with title \"Web\"" >/dev/null 2>&1; }
error()    { osascript -e "display dialog \"$1\" buttons {\"OK\"} default button 1 with icon stop with title \"Web\"" >/dev/null 2>&1; echo "✗ $1"; }
pregunta() { # $1 texto  $2 valor por defecto  → escribe la respuesta (vacío si cancela)
  osascript -e "try" -e "text returned of (display dialog \"$1\" default answer \"$2\" with title \"Web\")" -e "on error" -e "return \"\"" -e "end try" 2>/dev/null
}
secreto()  {
  osascript -e "try" -e "text returned of (display dialog \"$1\" default answer \"\" with hidden answer with title \"Web\")" -e "on error" -e "return \"\"" -e "end try" 2>/dev/null
}
sino()     { # $1 texto → "si" o "no"
  local r; r=$(osascript -e "button returned of (display dialog \"$1\" buttons {\"No\", \"Sí\"} default button 2 with title \"Web\")" 2>/dev/null)
  [ "$r" = "Sí" ] && echo si || echo no
}
elegir()   { # $1 texto  $2.. opciones → opción elegida (vacío si cancela)
  local t="$1"; shift; local ops=""; for o in "$@"; do ops="$ops\"$o\","; done; ops="{${ops%,}}"
  local r; r=$(osascript -e "choose from list $ops with prompt \"$t\" default items {\"$1\"}" 2>/dev/null)
  [ "$r" = "false" ] || echo "$r"
}

# ---- token de GitHub guardado en el Llavero del Mac (nunca en archivos) ----
leer_token()    { security find-generic-password -s "$LLAVERO" -a "$GH_USUARIO" -w 2>/dev/null; }
guardar_token() { security add-generic-password -U -s "$LLAVERO" -a "$GH_USUARIO" -w "$1" >/dev/null; }
url_con_token() { echo "https://$GH_USUARIO:$1@github.com/$GH_REPO.git"; }

comprobar_git() {
  if ! command -v git >/dev/null 2>&1 || ! git --version >/dev/null 2>&1; then
    error "Falta instalar las herramientas de Apple (git). Se abrirá el instalador: acepta, espera a que termine y vuelve a abrir este script."
    xcode-select --install 2>/dev/null; exit 1
  fi
}
comprobar_config() {
  if [ -z "$GH_REPO" ] || [ -z "$GH_USUARIO" ] || [ -z "$(leer_token)" ]; then
    error "Primero abre  1-Configurar.command  (solo hace falta una vez)."; exit 1
  fi
}

# nombre de carpeta a partir de un título: "El Último Verano" → el-ultimo-verano
slug() {
  printf '%s' "$1" | sed -e 's/á/a/g' -e 's/à/a/g' -e 's/ä/a/g' -e 's/â/a/g' -e 's/Á/a/g' -e 's/À/a/g' -e 's/Ä/a/g' -e 's/Â/a/g' -e 's/é/e/g' -e 's/è/e/g' -e 's/ë/e/g' -e 's/ê/e/g' -e 's/É/e/g' -e 's/È/e/g' -e 's/Ë/e/g' -e 's/Ê/e/g' -e 's/í/i/g' -e 's/ì/i/g' -e 's/ï/i/g' -e 's/î/i/g' -e 's/Í/i/g' -e 's/Ì/i/g' -e 's/Ï/i/g' -e 's/Î/i/g' -e 's/ó/o/g' -e 's/ò/o/g' -e 's/ö/o/g' -e 's/ô/o/g' -e 's/Ó/o/g' -e 's/Ò/o/g' -e 's/Ö/o/g' -e 's/Ô/o/g' -e 's/ú/u/g' -e 's/ù/u/g' -e 's/ü/u/g' -e 's/û/u/g' -e 's/Ú/u/g' -e 's/Ù/u/g' -e 's/Ü/u/g' -e 's/Û/u/g' -e 's/ñ/n/g' -e 's/Ñ/n/g' -e 's/ç/c/g' -e 's/Ç/c/g' |
    iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null | tr 'A-Z' 'a-z' |
    sed -e 's/[^a-z0-9]\{1,\}/-/g' -e 's/^-//' -e 's/-$//'
}

# copia una imagen reduciéndola (máx. 2600 px, JPG) o copia un vídeo tal cual
copiar_medio() { # $1 origen  $2 destino-sin-extensión
  local ext; ext=$(printf '%s' "${1##*.}" | tr 'A-Z' 'a-z')
  case "$ext" in
    mp4|mov|m4v|webm) cp "$1" "$2.$ext" ;;
    gif) cp "$1" "$2.gif" ;;
    *) sips -Z 2600 -s format jpeg -s formatOptions 82 "$1" --out "$2.jpg" >/dev/null 2>&1 || cp "$1" "$2.$ext" ;;
  esac
}

# elegir varios archivos → una ruta por línea
elegir_archivos() { # $1 texto
  osascript -e "try" \
    -e "set fs to choose file with prompt \"$1\" of type {\"public.image\", \"public.movie\"} with multiple selections allowed" \
    -e "set out to \"\"" -e "repeat with f in fs" -e "set out to out & POSIX path of f & linefeed" -e "end repeat" \
    -e "return out" -e "on error" -e "return \"\"" -e "end try" 2>/dev/null
}
elegir_archivo() {
  osascript -e "try" -e "POSIX path of (choose file with prompt \"$1\" of type {\"public.image\"})" -e "on error" -e "return \"\"" -e "end try" 2>/dev/null
}

generar() { bash "$RAIZ/herramientas-mac/_generar-datos.sh"; }
