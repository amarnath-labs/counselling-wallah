Add-Type -AssemblyName System.Drawing

$source =
  Join-Path `
    (Get-Location) `
    "public\favicon.png"

if (
  -not (
    Test-Path $source
  )
) {
  throw "public\favicon.png not found."
}

$image =
  [System.Drawing.Image]::FromFile(
    $source
  )

function Save-TruMargIcon {
  param (
    [int]$Size,
    [string]$Output
  )

  $bitmap =
    New-Object `
      System.Drawing.Bitmap `
      $Size,
      $Size

  $graphics =
    [System.Drawing.Graphics]::FromImage(
      $bitmap
    )

  $graphics.Clear(
    [System.Drawing.Color]::Transparent
  )

  $graphics.InterpolationMode =
    [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $graphics.SmoothingMode =
    [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  $graphics.PixelOffsetMode =
    [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $graphics.DrawImage(
    $image,
    0,
    0,
    $Size,
    $Size
  )

  $bitmap.Save(
    $Output,
    [System.Drawing.Imaging.ImageFormat]::Png
  )

  $graphics.Dispose()
  $bitmap.Dispose()
}

Save-TruMargIcon `
  -Size 48 `
  -Output ".\public\favicon-48x48.png"

Save-TruMargIcon `
  -Size 96 `
  -Output ".\public\favicon-96x96.png"

Save-TruMargIcon `
  -Size 192 `
  -Output ".\public\favicon-192x192.png"

$image.Dispose()

Write-Host ""
Write-Host "========================================"
Write-Host "TRUMARG FAVICONS GENERATED"
Write-Host "========================================"
Write-Host ""
