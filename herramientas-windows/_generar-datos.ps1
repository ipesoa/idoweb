# =====================================================================
#  GENERAR DATOS (Windows)  ·  igual que herramientas-mac/_generar-datos.sh
#  Lee las carpetas de \contenido y escribe contenido\datos-generados.js
#  (lo que la web lee para saber qué hay). NO edites ese archivo a mano.
#  Carpetas que empiezan por "_" (como _PLANTILLA) se ignoran.
# =====================================================================
$ErrorActionPreference = 'Stop'
try { Add-Type -AssemblyName System.Drawing } catch { }
$Raiz   = Split-Path $PSScriptRoot -Parent
$Salida = Join-Path $Raiz 'contenido\datos-generados.js'
$UTF8   = New-Object System.Text.UTF8Encoding $false

function Esc-Js([string]$s)   { $s.Replace('\', '\\').Replace('`', '\`').Replace('$', '\$') }
function Esc-Json([string]$s) { $s.Replace('\', '\\').Replace('"', '\"') }

# Medidas de una imagen (si falla, la web las calcula sola)
function Medidas([string]$f) {
  try {
    $fs  = [System.IO.File]::OpenRead($f)
    $img = [System.Drawing.Image]::FromStream($fs, $false, $false)
    $w = $img.Width; $h = $img.Height
    if ($img.PropertyIdList -contains 0x0112) {         # foto girada (móvil)
      if ($img.GetPropertyItem(0x0112).Value[0] -ge 5) { $t = $w; $w = $h; $h = $t }
    }
    $img.Dispose(); $fs.Dispose()
    return ",""w"":$w,""h"":$h"
  } catch { if ($fs) { $fs.Dispose() }; return '' }
}

function Archivos([string]$dir) {
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.Append('[')
  $primero = $true
  Get-ChildItem -LiteralPath $dir -File | Sort-Object Name | ForEach-Object {
    $ext = $_.Extension.TrimStart('.').ToLower()
    if (@('jpg','jpeg','png','webp','gif','avif') -contains $ext) { $extra = Medidas $_.FullName }
    elseif (@('mp4','webm','mov','m4v') -contains $ext) { $extra = '' }
    else { return }
    if (-not $primero) { [void]$sb.Append(',') }
    $primero = $false
    [void]$sb.Append("`n      {""f"":""$(Esc-Json $_.Name)""$extra}")
  }
  [void]$sb.Append(']')
  $sb.ToString()
}

function Leer([string]$p) { if (Test-Path -LiteralPath $p) { Esc-Js ([System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)) } else { '' } }

function Tipo([string]$tipo) {
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.Append("  ""$tipo"": [`n")
  $base = Join-Path $Raiz "contenido\$tipo"
  if (Test-Path $base) {
    Get-ChildItem -LiteralPath $base -Directory | Sort-Object Name | Where-Object { -not $_.Name.StartsWith('_') } | ForEach-Object {
      $info = Join-Path $_.FullName 'info.txt'
      if (-not (Test-Path -LiteralPath $info)) { Write-Host "  ! $($_.Name) no tiene info.txt (se salta)"; return }
      [void]$sb.Append("    {`n      ""carpeta"": ""$(Esc-Json $_.Name)"",`n      ""info"": ``")
      [void]$sb.Append((Leer $info))
      [void]$sb.Append("``,`n      ""archivos"": ")
      [void]$sb.Append((Archivos $_.FullName))
      [void]$sb.Append("`n    },`n")
    }
  }
  [void]$sb.Append("  ],`n")
  $sb.ToString()
}

$about = Join-Path $Raiz 'contenido\about'
$js  = "/* ARCHIVO GENERADO AUTOMÁTICAMENTE por herramientas-mac/_generar-datos.sh o herramientas-windows/_generar-datos.ps1`n"
$js += "   No lo edites a mano: cambia las carpetas de /contenido y vuelve a generarlo. */`n"
$js += "window.CONTENIDO = {`n"
$js += Tipo 'films'
$js += Tipo 'series'
$js += Tipo 'comercials'
$js += Tipo 'videoclips'
$js += "  ""about"": {`n    ""info"": ``" + (Leer (Join-Path $about 'info.txt')) + "``,`n"
$js += "    ""filmografia"": ``" + (Leer (Join-Path $about 'filmografia-extra.txt')) + "``,`n"
$js += "    ""archivos"": " + (Archivos $about) + "`n  }`n};`n"
[System.IO.File]::WriteAllText($Salida, $js, $UTF8)

$resumen = @()
foreach ($t in @('films','series','comercials','videoclips')) {
  $d = Join-Path $Raiz "contenido\$t"
  $n = if (Test-Path $d) { @(Get-ChildItem $d -Directory | Where-Object { -not $_.Name.StartsWith('_') }).Count } else { 0 }
  $resumen += "$n $t"
}
Write-Host "OK  Datos actualizados: $($resumen -join ', ')"
