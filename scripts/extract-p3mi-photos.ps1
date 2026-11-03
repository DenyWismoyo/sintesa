Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "C:\Users\ASUS\.gemini\antigravity\brain\6f204e71-191a-410c-a040-509119a9ab56\.user_uploaded\media_1793745843525_1bb5a6d9.zip"
$destDir = "D:\Project\teknopark\public\uploads\alumni\p3mi"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$count = 0
foreach ($entry in $zip.Entries) {
    if (-not [string]::IsNullOrWhiteSpace($entry.Name)) {
        $cleanFileName = $entry.Name.Trim()
        $outPath = Join-Path $destDir $cleanFileName
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $outPath, $true)
        $count++
        Write-Host "Extracted: $cleanFileName"
    }
}
$zip.Dispose()
Write-Host "Total extracted photos: $count"

