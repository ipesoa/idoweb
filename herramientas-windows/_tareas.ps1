# =====================================================================
#  HERRAMIENTAS WINDOWS  ·  lo mismo que los .command del Mac
#  Cada archivo .bat llama a este script con una tarea:
#     configurar | nuevo | ver | publicar | traer | fotos
#  Necesita "Git for Windows" (el script avisa si falta).
#  El token de GitHub se guarda cifrado con tu usuario de Windows en
#  %APPDATA%\web-portfolio\token.dat (nunca dentro de la carpeta de la web).
# =====================================================================
param([string]$Tarea)
$ErrorActionPreference = 'Continue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing, Microsoft.VisualBasic
[System.Windows.Forms.Application]::EnableVisualStyles()
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$Raiz = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $Raiz
$Config       = Join-Path $PSScriptRoot '.config-local'
$DirToken     = Join-Path $env:APPDATA 'web-portfolio'
$ArchivoToken = Join-Path $DirToken 'token.dat'
$UTF8         = New-Object System.Text.UTF8Encoding $false

# ---------------- ventanas ----------------
function Aviso($t)      { [void][System.Windows.Forms.MessageBox]::Show($t, 'Web', 'OK', 'Information') }
function Mal($t)        { Write-Host "X $t" -ForegroundColor Red; [void][System.Windows.Forms.MessageBox]::Show($t, 'Web', 'OK', 'Error') }
function SiNo($t)       { [System.Windows.Forms.MessageBox]::Show($t, 'Web', 'YesNo', 'Question') -eq 'Yes' }

function Ventana($texto, $alto) {
  $f = New-Object System.Windows.Forms.Form
  $f.Text = 'Web'; $f.StartPosition = 'CenterScreen'; $f.TopMost = $true
  $f.FormBorderStyle = 'FixedDialog'; $f.MaximizeBox = $false; $f.MinimizeBox = $false
  $f.ClientSize = New-Object System.Drawing.Size 460, $alto
  $f.Font = New-Object System.Drawing.Font 'Segoe UI', 10
  $l = New-Object System.Windows.Forms.Label
  $l.Text = $texto; $l.Location = '14,12'; $l.Size = '432,60'
  $f.Controls.Add($l)
  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = 'Aceptar'; $ok.DialogResult = 'OK'; $ok.Location = "270,$($alto - 42)"; $ok.Size = '85,30'
  $no = New-Object System.Windows.Forms.Button
  $no.Text = 'Cancelar'; $no.DialogResult = 'Cancel'; $no.Location = "361,$($alto - 42)"; $no.Size = '85,30'
  $f.Controls.AddRange(@($ok, $no)); $f.AcceptButton = $ok; $f.CancelButton = $no
  $f
}
function Pedir($texto, $defecto = '', [switch]$Oculto) {
  $f = Ventana $texto 150
  $c = New-Object System.Windows.Forms.TextBox
  $c.Location = '14,74'; $c.Size = '432,26'; $c.Text = $defecto
  if ($Oculto) { $c.UseSystemPasswordChar = $true }
  $f.Controls.Add($c); $f.Add_Shown({ $c.Select() })
  if ($f.ShowDialog() -eq 'OK') { return $c.Text.Trim() } else { return '' }
}
function Elegir($texto, [string[]]$opciones) {
  $f = Ventana $texto 300
  $lista = New-Object System.Windows.Forms.ListBox
  $lista.Location = '14,74'; $lista.Size = '432,170'
  [void]$lista.Items.AddRange($opciones); $lista.SelectedIndex = 0
  $lista.Add_DoubleClick({ $f.DialogResult = 'OK'; $f.Close() })
  $f.Controls.Add($lista)
  if ($f.ShowDialog() -eq 'OK') { return [string]$lista.SelectedItem } else { return '' }
}
$Filtro = 'Imágenes y vídeos|*.jpg;*.jpeg;*.png;*.webp;*.gif;*.heic;*.mp4;*.mov;*.m4v;*.webm'
function Elegir-Archivos($titulo) {
  $d = New-Object System.Windows.Forms.OpenFileDialog
  $d.Title = $titulo; $d.Multiselect = $true; $d.Filter = $Filtro
  if ($d.ShowDialog() -eq 'OK') { return $d.FileNames } else { return @() }
}
function Elegir-Archivo($titulo) {
  $d = New-Object System.Windows.Forms.OpenFileDialog
  $d.Title = $titulo; $d.Filter = 'Imágenes|*.jpg;*.jpeg;*.png;*.webp'
  if ($d.ShowDialog() -eq 'OK') { return $d.FileName } else { return '' }
}

# ---------------- configuración y token ----------------
function Leer-Config {
  $c = @{ GH_USUARIO = ''; GH_REPO = '' }
  if (Test-Path $Config) {
    Get-Content $Config -Encoding UTF8 | ForEach-Object {
      if ($_ -match '^\s*(\w+)\s*=\s*"?([^"]*)"?\s*$') { $c[$matches[1]] = $matches[2] }
    }
  }
  $c
}
function Guardar-Token($t) {
  New-Item -ItemType Directory -Force $DirToken | Out-Null
  ConvertTo-SecureString $t -AsPlainText -Force | ConvertFrom-SecureString | Set-Content $ArchivoToken
}
function Leer-Token {
  if (-not (Test-Path $ArchivoToken)) { return '' }
  try {
    $s = Get-Content $ArchivoToken | ConvertTo-SecureString
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
  } catch { '' }
}
function Url-Con-Token($cfg, $token) { "https://$($cfg.GH_USUARIO):$token@github.com/$($cfg.GH_REPO).git" }

# git sin ventanas de contraseña (usamos el token directamente)
function G { & git -c credential.helper= @args; return $LASTEXITCODE }

function Comprobar-Git {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    if (SiNo "Falta instalar Git (lo necesita la web para publicar).`n`n¿Lo instalo ahora? (tarda un par de minutos; luego cierra y vuelve a abrir este archivo)") {
      Start-Process winget -ArgumentList 'install --id Git.Git -e --source winget' -Wait
    } else { Start-Process 'https://git-scm.com/download/win' }
    exit 1
  }
}
function Comprobar-Config($cfg) {
  if (-not $cfg.GH_USUARIO -or -not $cfg.GH_REPO -or -not (Leer-Token)) {
    Mal 'Primero abre  1-Configurar.bat  (solo hace falta una vez).'; exit 1
  }
}

# ---------------- utilidades ----------------
function Generar { & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot '_generar-datos.ps1') }

# "El Último Verano" -> "el-ultimo-verano"
function Slug([string]$t) {
  $n = $t.Normalize([Text.NormalizationForm]::FormD)
  $s = -join ($n.ToCharArray() | Where-Object { [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne 'NonSpacingMark' })
  ($s.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
}

# Copia una imagen reduciéndola (máx. 2600 px, JPG, girada bien) o copia un vídeo tal cual
function Copiar-Medio([string]$origen, [string]$destino) {
  $ext = [IO.Path]::GetExtension($origen).TrimStart('.').ToLower()
  if (@('mp4','mov','m4v','webm','gif') -contains $ext) { Copy-Item -LiteralPath $origen "$destino.$ext"; return }
  if ($ext -eq 'heic') { Write-Host "  ! $(Split-Path $origen -Leaf) es HEIC (iPhone): Windows no la lee. Pásala a JPG y añádela con 6-Anadir-fotos."; return }
  try {
    $img = [System.Drawing.Image]::FromFile($origen)
    if ($img.PropertyIdList -contains 0x0112) {
      switch ($img.GetPropertyItem(0x0112).Value[0]) {
        2 { $img.RotateFlip('RotateNoneFlipX') }   3 { $img.RotateFlip('Rotate180FlipNone') }
        4 { $img.RotateFlip('Rotate180FlipX') }    5 { $img.RotateFlip('Rotate90FlipX') }
        6 { $img.RotateFlip('Rotate90FlipNone') }  7 { $img.RotateFlip('Rotate270FlipX') }
        8 { $img.RotateFlip('Rotate270FlipNone') }
      }
    }
    $e = [Math]::Min(1.0, 2600.0 / [Math]::Max($img.Width, $img.Height))
    $w = [int]($img.Width * $e); $h = [int]($img.Height * $e)
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($img, 0, 0, $w, $h); $g.Dispose()
    $jpg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $p = New-Object System.Drawing.Imaging.EncoderParameters 1
    $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]82)
    $bmp.Save("$destino.jpg", $jpg, $p)
    $bmp.Dispose(); $img.Dispose()
  } catch {
    Copy-Item -LiteralPath $origen "$destino.$ext"
  }
}

function Numero-Mas-Alto($carpeta) {
  $n = 0
  Get-ChildItem -LiteralPath $carpeta -File | ForEach-Object { if ($_.Name -match '^(\d+)') { $n = [Math]::Max($n, [int]$matches[1]) } }
  $n
}

# =====================================================================
#  TAREAS
# =====================================================================
switch ($Tarea) {

  # ---- 1 · CONFIGURAR (solo la primera vez en cada ordenador) ----
  'configurar' {
    Comprobar-Git
    $cfg = Leer-Config
    $u = Pedir 'Tu usuario de GitHub:' $cfg.GH_USUARIO; if (-not $u) { exit }
    $def = if ($cfg.GH_REPO) { $cfg.GH_REPO } else { "$u/web-idoia" }
    $r = Pedir "Repositorio (usuario/nombre), ej:  $u/web-idoia" $def; if (-not $r) { exit }
    $t = Pedir "Pega el token de GitHub (empieza por github_pat_ o ghp_).`nSi ya lo guardaste antes y no cambia, déjalo vacío." '' -Oculto
    [IO.File]::WriteAllText($Config, "GH_USUARIO=""$u""`nGH_REPO=""$r""`n", $UTF8)
    if ($t) { Guardar-Token $t }
    $token = Leer-Token
    if (-not $token) { Mal 'No hay token guardado. Vuelve a abrir este archivo y pégalo.'; exit 1 }
    $cfg = Leer-Config

    if (-not (git config user.name))  { git config user.name $u }
    if (-not (git config user.email)) { git config user.email "$u@users.noreply.github.com" }
    if (-not (Test-Path .git)) { git init -q -b main }
    git remote remove origin 2>$null
    git remote add origin "https://github.com/$r.git"

    Write-Host 'Comprobando conexión con GitHub...'
    $url = Url-Con-Token $cfg $token
    & git -c credential.helper= ls-remote $url *> $null
    if ($LASTEXITCODE -eq 0) {
      & git -c credential.helper= ls-remote --exit-code $url main *> $null
      $remotoTiene = ($LASTEXITCODE -eq 0)
      & git rev-parse -q --verify HEAD *> $null
      $localVacio = ($LASTEXITCODE -ne 0)
      if ($remotoTiene -and $localVacio) { [void](G fetch -q $url main); git reset -q FETCH_HEAD }
      Aviso 'Listo.  Ya puedes usar  4-Publicar  y  5-Traer-cambios.'
    } else {
      Mal "No he podido conectar con github.com/$r. Revisa el usuario, el nombre del repositorio y que el token tenga permiso de escritura (Contents: Read and write)."
    }
  }

  # ---- 2 · NUEVO PROYECTO ----
  'nuevo' {
    $tipo = Elegir '¿Qué es?' @('films', 'series', 'comercials', 'videoclips'); if (-not $tipo) { exit }
    $titulo = Pedir 'Título:'; if (-not $titulo) { exit }
    $ano = Pedir 'Año:' (Get-Date -Format yyyy)
    $labor = Pedir 'Tu labor en el proyecto:' 'Diseño de producción'
    $director = Pedir 'Dirección (director/a):'
    $cliente = if ($tipo -eq 'comercials') { Pedir 'Cliente / marca:' } else { '' }
    $inicio = if (SiNo '¿Quieres que salga en el pase de imágenes de la página de inicio?') { 'si' } else { 'no' }

    $carpeta = Join-Path $Raiz "contenido\$tipo\$ano-$(Slug $titulo)"
    if (Test-Path $carpeta) { Mal "Ya existe $carpeta"; exit 1 }
    New-Item -ItemType Directory $carpeta | Out-Null

    $portada = Elegir-Archivo 'Elige la PORTADA (la imagen grande, horizontal)'
    if ($portada) { Copiar-Medio $portada (Join-Path $carpeta 'portada') }
    if (SiNo '¿Tienes una versión VERTICAL de la portada para móviles? (opcional)') {
      $pm = Elegir-Archivo 'Elige la portada vertical'
      if ($pm) { Copiar-Medio $pm (Join-Path $carpeta 'portada-movil') }
    }
    $n = 0
    foreach ($f in (Elegir-Archivos 'Elige las fotos del rodaje / decorados (puedes elegir varias con Ctrl)')) {
      $n++; Write-Host "  copiando $(Split-Path $f -Leaf)"
      Copiar-Medio $f (Join-Path $carpeta ('{0:D2}' -f $n))
    }

    $txt = @("titulo: $titulo", "año: $ano", "labor: $labor", "director: $director")
    if ($tipo -eq 'comercials') { $txt += "cliente: $cliente" }
    $txt += @('productora: ', "mostrar_en_inicio: $inicio",
      '# encuadre: center   (qué parte de la portada se ve: top, bottom, left, right, "30% 50%")',
      '# video:             (enlace de Vimeo o YouTube)', '---', 'Escribe aquí el texto del proyecto.')
    $info = Join-Path $carpeta 'info.txt'
    [IO.File]::WriteAllText($info, ($txt -join "`n") + "`n", $UTF8)

    Generar
    Start-Process notepad.exe $info
    Start-Process explorer.exe $carpeta
    Aviso "Creado  ($n fotos)`n`n1. Escribe el texto en info.txt (se acaba de abrir) y guarda.`n2. Mira cómo queda con  3-Ver-en-local.`n3. Cuando te guste:  4-Publicar."
  }

  # ---- 3 · VER EN LOCAL ----
  'ver' {
    Generar
    Start-Process (Join-Path $Raiz 'index.html')
  }

  # ---- 4 · PUBLICAR ----
  'publicar' {
    Comprobar-Git; $cfg = Leer-Config; Comprobar-Config $cfg
    $token = Leer-Token
    Generar

    $grandes = Get-ChildItem (Join-Path $Raiz 'contenido') -Recurse -File | Where-Object { $_.Length -gt 90MB }
    if ($grandes) {
      Mal ("Estos archivos son demasiado grandes para GitHub (máx. 100 MB). Súbelos a Vimeo y pon el enlace en info.txt:`n`n" + (($grandes | ForEach-Object { $_.FullName }) -join "`n"))
      exit 1
    }

    # Número de versión nuevo en las páginas: así los navegadores nunca mezclan
    # archivos viejos (guardados en su caché) con los nuevos
    $V = Get-Date -Format yyyyMMddHHmm
    Get-ChildItem -LiteralPath $Raiz -Filter *.html | ForEach-Object {
      $t = [IO.File]::ReadAllText($_.FullName)
      [IO.File]::WriteAllText($_.FullName, [regex]::Replace($t, '\?v=\d+"', "?v=$V`""), $UTF8)
    }

    git add -A
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) { Write-Host 'No hay cambios nuevos.' }
    else {
      $m = Pedir '¿Qué has cambiado? (una frase, opcional)' 'Actualización'
      if (-not $m) { $m = 'Actualización' }
      git commit -q -m "$m ($(Get-Date -Format 'dd/MM/yyyy HH:mm'))"
    }

    $url = Url-Con-Token $cfg $token
    Write-Host 'Trayendo cambios de internet por si acaso...'
    & git -c credential.helper= pull -q --no-rebase --no-edit $url main *> $null
    Write-Host 'Subiendo...'
    $salida = & git -c credential.helper= push -q $url HEAD:main 2>&1
    if ($LASTEXITCODE -eq 0) {
      $usr, $repo = $cfg.GH_REPO.Split('/')
      Aviso "Publicado`n`nEn 1-2 minutos estará en:`nhttps://$usr.github.io/$repo/"
    } else {
      ($salida | Out-String).Replace($token, '****') | Write-Host
      Mal "No se ha podido subir. Mira el mensaje en la ventana negra. Si dice 'conflict', pide ayuda antes de seguir."
      exit 1
    }
  }

  # ---- 5 · TRAER CAMBIOS ----
  'traer' {
    Comprobar-Git; $cfg = Leer-Config; Comprobar-Config $cfg
    $token = Leer-Token
    if (git status --porcelain) {
      if (-not (SiNo 'Tienes cambios sin publicar en este ordenador. ¿Los guardo primero (sin subirlos) y luego traigo lo nuevo?')) { exit }
      git add -A; git commit -q -m "Cambios locales ($(Get-Date -Format 'dd/MM/yyyy HH:mm'))"
    }
    if ((G pull -q --no-rebase --no-edit (Url-Con-Token $cfg $token) main) -eq 0) { Generar; Aviso 'Todo al día.' }
    else { Mal 'Ha habido un conflicto al juntar cambios. Pide ayuda antes de seguir.'; exit 1 }
  }

  # ---- 6 · AÑADIR FOTOS a un proyecto existente ----
  'fotos' {
    $tipo = Elegir '¿Dónde está el proyecto?' @('films', 'series', 'comercials', 'videoclips'); if (-not $tipo) { exit }
    $proyectos = @(Get-ChildItem (Join-Path $Raiz "contenido\$tipo") -Directory | Where-Object { -not $_.Name.StartsWith('_') } | ForEach-Object { $_.Name })
    if (-not $proyectos) { Mal "No hay proyectos en $tipo"; exit 1 }
    $p = Elegir '¿Qué proyecto?' $proyectos; if (-not $p) { exit }
    $carpeta = Join-Path $Raiz "contenido\$tipo\$p"
    $n = Numero-Mas-Alto $carpeta; $c = 0
    foreach ($f in (Elegir-Archivos 'Elige las fotos nuevas')) {
      $n++; $c++; Write-Host "  copiando $(Split-Path $f -Leaf)"
      Copiar-Medio $f (Join-Path $carpeta ('{0:D2}' -f $n))
    }
    Generar
    Start-Process explorer.exe $carpeta
    Aviso "Añadidas $c fotos.  Míralo con 3-Ver-en-local y publica con 4-Publicar."
  }

  default { Write-Host 'Uso: _tareas.ps1 configurar|nuevo|ver|publicar|traer|fotos' }
}
