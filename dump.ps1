# dump.ps1 - Generador de contexto para IA (v4 - dividido y filtrado)
$origen = (Get-Location).Path
$prefijo = "contexto_proyecto"

# Limpiar salidas previas
Get-ChildItem -Path $origen -Filter "$prefijo*.txt" | Remove-Item -Force

$excluirDirs = @("node_modules", "dist", "build", ".git", "coverage", ".vite", ".turbo")
$excluirArchivos = @("*.lock", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", ".env", ".env.local")
$extensiones = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.sql", "*.css", "*.html", "*.md")
$maxKB = 200  # truncar archivos gigantes

# Helper para escribir bloque
function Write-Bloque($path, $fullPath, $stream) {
    $info = Get-Item $fullPath
    $kb = [math]::Round($info.Length / 1KB, 2)
    "`n===========================================" | Out-File -FilePath $stream -Append -Encoding utf8
    "=== PATH: $path ($kb KB) ===" | Out-File -FilePath $stream -Append -Encoding utf8
    "===========================================" | Out-File -FilePath $stream -Append -Encoding utf8

    if ($info.Length / 1KB -gt $maxKB) {
        "[[ARCHIVO TRUNCADO: $kb KB > $maxKB KB]]" | Out-File -FilePath $stream -Append -Encoding utf8
        Get-Content $fullPath -TotalCount 300 -Encoding utf8 | Out-File -FilePath $stream -Append -Encoding utf8
    } else {
        Get-Content $fullPath -Raw -Encoding utf8 | Out-File -FilePath $stream -Append -Encoding utf8
    }
}

# 1. Cabecera + estructura
$salidaEstructura = Join-Path $origen "$prefijo`_00_estructura.txt"
"# ==============================================" | Out-File -FilePath $salidaEstructura -Encoding utf8
"# PROYECTO: colegios-app - ESTRUCTURA" | Out-File -FilePath $salidaEstructura -Append -Encoding utf8
"# ==============================================" | Out-File -FilePath $salidaEstructura -Append -Encoding utf8
"`n## ESTRUCTURA DE CARPETAS" | Out-File -FilePath $salidaEstructura -Append -Encoding utf8

foreach ($carpeta in @("src", "public", "supabase")) {
    $ruta = Join-Path $origen $carpeta
    if (Test-Path $ruta) {
        Get-ChildItem -Path $ruta -Recurse -Directory |
            Where-Object { $excluirDirs -notcontains $_.Name } |
            ForEach-Object { $_.FullName.Replace($origen, '') } |
            Out-File -FilePath $salidaEstructura -Append -Encoding utf8
    }
}

# 2. Archivos por grupos
$grupos = @{
    "01_src_core"    = @("src\components", "src\context", "src\hooks", "src\lib", "src\types", "src\utils")
    "02_src_pages"   = @("src\pages")
    "03_src_root"    = @("src")  # App.tsx, main.tsx, index.css (solo nivel raíz)
    "04_supabase"    = @("supabase")
    "05_public"      = @("public")
}

foreach ($grupo in $grupos.Keys | Sort-Object) {
    $salida = Join-Path $origen "$prefijo`_$grupo.txt"
    "# GRUPO: $grupo" | Out-File -FilePath $salida -Encoding utf8

    foreach ($sub in $grupos[$grupo]) {
        $rutaSub = Join-Path $origen $sub
        if (-not (Test-Path $rutaSub)) { continue }

        $archivos = if ($sub -eq "src") {
            # Solo nivel raíz de src
            Get-ChildItem -Path $rutaSub -File -Include $extensiones
        } else {
            Get-ChildItem -Path $rutaSub -Recurse -File -Include $extensiones |
                Where-Object { $excluirDirs -notcontains $_.Directory.Name }
        }

        $archivos | Sort-Object FullName | ForEach-Object {
            if ($excluirArchivos -contains $_.Name) { return }
            $rel = $_.FullName.Replace($origen, '')
            Write-Bloque $rel $_.FullName $salida
        }
    }
}

# 3. Archivos raíz
$salidaRaiz = Join-Path $origen "$prefijo`_06_raiz.txt"
"# GRUPO: configuracion_raiz" | Out-File -FilePath $salidaRaiz -Encoding utf8
$archivosRaiz = @("package.json","tsconfig.json","tsconfig.app.json","tsconfig.node.json","vite.config.ts","tailwind.config.js","postcss.config.js","eslint.config.js","index.html",".env.example")
foreach ($a in $archivosRaiz) {
    $p = Join-Path $origen $a
    if (Test-Path $p) { Write-Bloque "\$a" $p $salidaRaiz }
}

# Resultado
Get-ChildItem -Path $origen -Filter "$prefijo*.txt" | ForEach-Object {
    $kb = [math]::Round($_.Length / 1KB, 2)
    Write-Host "✅ $($_.Name) - $kb KB" -ForegroundColor Green
}