Add-Type -AssemblyName System.Drawing

$sourcePath = 'C:\Users\ASUS\.gemini\antigravity-ide\brain\f325f96d-1fbb-4208-a8a8-e069013c28f8\techno_sign_pwa_icon_1791180149532.jpg'
$destDir = 'd:\Project\teknopark\public\icons\presensi'

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$img = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image($srcImg, $width, $height, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $width, $height)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $outPath"
}

Resize-Image $img 512 512 (Join-Path $destDir "icon-512x512.png")
Resize-Image $img 192 192 (Join-Path $destDir "icon-192x192.png")
Resize-Image $img 180 180 (Join-Path $destDir "apple-touch-icon.png")
Resize-Image $img 512 512 (Join-Path $destDir "icon-maskable.png")

# Juga copy ke public/ sebagai fallback default PWA browser
Resize-Image $img 512 512 "d:\Project\teknopark\public\icon-512x512.png"
Resize-Image $img 192 192 "d:\Project\teknopark\public\icon-192x192.png"

$img.Dispose()
Write-Host "All icons generated successfully!"
