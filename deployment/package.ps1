param([Parameter(Mandatory = $true)][string]$Output)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$outputPath = [IO.Path]::GetFullPath($Output)
if (Test-Path -LiteralPath $outputPath) { throw 'Output already exists; choose a new archive name.' }
$stage = Join-Path ([IO.Path]::GetTempPath()) ("codekita-release-" + [guid]::NewGuid().ToString('N'))
try {
    New-Item -ItemType Directory -Path $stage | Out-Null
    foreach ($dir in @('dist', '.server-build')) {
        if (!(Test-Path -LiteralPath (Join-Path $root "$dir/index.html")) -and $dir -eq 'dist') { throw 'Build frontend first.' }
        if ($dir -eq '.server-build' -and !(Test-Path -LiteralPath (Join-Path $root "$dir/server.js"))) { throw 'Build backend first.' }
        Copy-Item -LiteralPath (Join-Path $root $dir) -Destination (Join-Path $stage $dir) -Recurse
    }
    foreach ($file in @('package.json', 'package-lock.json')) { Copy-Item -LiteralPath (Join-Path $root $file) -Destination $stage }
    New-Item -ItemType Directory -Path (Join-Path $stage 'prisma/migrations'), (Join-Path $stage 'scripts') | Out-Null
    foreach ($file in @('schema.prisma', 'seed.mjs', 'grant-admin.mjs', 'bootstrap-admin.mjs')) { Copy-Item -LiteralPath (Join-Path $root "prisma/$file") -Destination (Join-Path $stage 'prisma') }
    Copy-Item -LiteralPath (Join-Path $root 'scripts/import-curriculum.mjs') -Destination (Join-Path $stage 'scripts')
    Get-ChildItem -LiteralPath (Join-Path $root 'prisma/migrations') -Directory | ForEach-Object {
        $target = Join-Path $stage "prisma/migrations/$($_.Name)"
        New-Item -ItemType Directory -Path $target | Out-Null
        Copy-Item -LiteralPath (Join-Path $_.FullName 'migration.sql') -Destination $target
    }
    $lock = Join-Path $root 'prisma/migrations/migration_lock.toml'
    if (Test-Path -LiteralPath $lock) { Copy-Item -LiteralPath $lock -Destination (Join-Path $stage 'prisma/migrations') }
    & tar.exe -czf $outputPath -C $stage .
    if ($LASTEXITCODE -ne 0) { throw 'Archive creation failed.' }
    Write-Host "Release archive created: $outputPath"
} finally {
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
}