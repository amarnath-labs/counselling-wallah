Add-Type -AssemblyName System.Drawing

$source =
  Join-Path `
    (Get-Location) `
    "public\favicon-192x192.png"

if (-not (Test-Path $source)) {
  throw "public\favicon-192x192.png not found."
}

$image =
  [System.Drawing.Image]::FromFile(
    $source
  )

$bitmap =
  New-Object `
    System.Drawing.Bitmap `
    48,
    48

$graphics =
  [System.Drawing.Graphics]::FromImage(
    $bitmap
  )

$graphics.Clear(
  [System.Drawing.Color]::Transparent
)

$graphics.InterpolationMode =
  [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$graphics.DrawImage(
  $image,
  0,
  0,
  48,
  48
)

$iconHandle =
  $bitmap.GetHicon()

$icon =
  [System.Drawing.Icon]::FromHandle(
    $iconHandle
  )

$stream =
  New-Object `
    System.IO.FileStream(
      ".\public\favicon.ico",
      [System.IO.FileMode]::Create
    )

$icon.Save(
  $stream
)

$stream.Close()
$graphics.Dispose()
$bitmap.Dispose()
$image.Dispose()

Write-Host ""
Write-Host "favicon.ico generated successfully"
