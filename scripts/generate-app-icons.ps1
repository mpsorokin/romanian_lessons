param(
  [string]$OutputRoot = (Join-Path $PSScriptRoot "..\public")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$canvasSize = 512.0
$background = [System.Drawing.ColorTranslator]::FromHtml("#111210")
$border = [System.Drawing.ColorTranslator]::FromHtml("#37362F")
$gold = [System.Drawing.ColorTranslator]::FromHtml("#E0BC79")
$transparent = [System.Drawing.Color]::Transparent

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-CaleaPath {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddBezier(
    [System.Drawing.PointF]::new(346, 150),
    [System.Drawing.PointF]::new(300, 112),
    [System.Drawing.PointF]::new(240, 108),
    [System.Drawing.PointF]::new(194, 137)
  )
  $path.AddBezier(
    [System.Drawing.PointF]::new(194, 137),
    [System.Drawing.PointF]::new(143, 169),
    [System.Drawing.PointF]::new(128, 238),
    [System.Drawing.PointF]::new(149, 298)
  )
  $path.AddBezier(
    [System.Drawing.PointF]::new(149, 298),
    [System.Drawing.PointF]::new(172, 359),
    [System.Drawing.PointF]::new(262, 387),
    [System.Drawing.PointF]::new(344, 343)
  )
  return $path
}

function New-CaleaBitmap {
  param(
    [int]$Size,
    [bool]$Maskable = $false
  )

  $bitmap = [System.Drawing.Bitmap]::new(
    $Size,
    $Size,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $bitmap.SetResolution(96, 96)

  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear($(if ($Maskable) { $background } else { $transparent }))
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.ScaleTransform($Size / $canvasSize, $Size / $canvasSize)

    if (-not $Maskable) {
      $tile = New-RoundedRectanglePath -X 32 -Y 32 -Width 448 -Height 448 -Radius 104
      try {
        $tileBrush = [System.Drawing.SolidBrush]::new($background)
        $tilePen = [System.Drawing.Pen]::new($border, 4)
        try {
          $graphics.FillPath($tileBrush, $tile)
          $graphics.DrawPath($tilePen, $tile)
        }
        finally {
          $tileBrush.Dispose()
          $tilePen.Dispose()
        }
      }
      finally {
        $tile.Dispose()
      }
    }

    $mark = New-CaleaPath
    try {
      $goldPen = [System.Drawing.Pen]::new($gold, 58)
      $roadPen = [System.Drawing.Pen]::new($background, 14)
      try {
        foreach ($pen in @($goldPen, $roadPen)) {
          $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
          $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
          $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        }
        $graphics.DrawPath($goldPen, $mark)
        $graphics.DrawPath($roadPen, $mark)
      }
      finally {
        $goldPen.Dispose()
        $roadPen.Dispose()
      }
    }
    finally {
      $mark.Dispose()
    }
  }
  finally {
    $graphics.Dispose()
  }

  return $bitmap
}

function Convert-BitmapToPngBytes {
  param([System.Drawing.Bitmap]$Bitmap)

  $stream = [System.IO.MemoryStream]::new()
  try {
    $Bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    return ,$stream.ToArray()
  }
  finally {
    $stream.Dispose()
  }
}

function Save-CaleaPng {
  param(
    [string]$Path,
    [int]$Size,
    [bool]$Maskable = $false
  )

  $bitmap = New-CaleaBitmap -Size $Size -Maskable $Maskable
  try {
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $bitmap.Dispose()
  }
}

function Save-CaleaIco {
  param([string]$Path)

  $sizes = @(16, 32, 48)
  $images = foreach ($size in $sizes) {
    $bitmap = New-CaleaBitmap -Size $size
    try {
      Convert-BitmapToPngBytes -Bitmap $bitmap
    }
    finally {
      $bitmap.Dispose()
    }
  }

  $stream = [System.IO.FileStream]::new($Path, [System.IO.FileMode]::Create)
  $writer = [System.IO.BinaryWriter]::new($stream)
  try {
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$sizes.Count)

    $offset = 6 + (16 * $sizes.Count)
    for ($index = 0; $index -lt $sizes.Count; $index += 1) {
      $writer.Write([byte]$sizes[$index])
      $writer.Write([byte]$sizes[$index])
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$images[$index].Length)
      $writer.Write([UInt32]$offset)
      $offset += $images[$index].Length
    }

    foreach ($image in $images) {
      $writer.Write($image)
    }
  }
  finally {
    $writer.Dispose()
    $stream.Dispose()
  }
}

$iconsRoot = Join-Path $OutputRoot "icons"
[System.IO.Directory]::CreateDirectory($iconsRoot) | Out-Null

$faviconSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title">
  <title id="title">Calea</title>
  <rect x="32" y="32" width="448" height="448" rx="104" fill="#111210" stroke="#37362f" stroke-width="4"/>
  <path d="M346 150C300 112 240 108 194 137C143 169 128 238 149 298C172 359 262 387 344 343" fill="none" stroke="#e0bc79" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M346 150C300 112 240 108 194 137C143 169 128 238 149 298C172 359 262 387 344 343" fill="none" stroke="#111210" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
'@

[System.IO.Directory]::CreateDirectory($OutputRoot) | Out-Null
[System.IO.File]::WriteAllText(
  (Join-Path $OutputRoot "favicon.svg"),
  $faviconSvg,
  [System.Text.UTF8Encoding]::new($false)
)

Save-CaleaIco -Path (Join-Path $OutputRoot "favicon.ico")
Save-CaleaPng -Path (Join-Path $OutputRoot "apple-touch-icon.png") -Size 180 -Maskable $true
Save-CaleaPng -Path (Join-Path $iconsRoot "icon-192.png") -Size 192
Save-CaleaPng -Path (Join-Path $iconsRoot "icon-512.png") -Size 512
Save-CaleaPng -Path (Join-Path $iconsRoot "icon-maskable-192.png") -Size 192 -Maskable $true
Save-CaleaPng -Path (Join-Path $iconsRoot "icon-maskable-512.png") -Size 512 -Maskable $true

Write-Output "Generated Calea app icons in $OutputRoot"
