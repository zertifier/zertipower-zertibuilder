$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  docker compose up -d --build backend calculadora
  if ($LASTEXITCODE -ne 0) { throw 'Backend or calculator build failed' }
  $portalRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../ris3cat-smart-meter'))
  $previewFiles = @(
    'src/app/features/energy-stats/infrastructure/services/energy-prediction.service.ts',
    'src/app/features/energy-stats/infrastructure/components/energy-prediction/energy-prediction.component.ts',
    'src/app/features/energy-stats/infrastructure/components/energy-prediction/energy-prediction.component.html',
    'src/assets/i18n/ca.json', 'src/assets/i18n/es.json', 'src/assets/i18n/en.json'
  )
  foreach ($previewFile in $previewFiles) {
    $sourceFile = Join-Path $portalRoot $previewFile
    if (!(Test-Path -LiteralPath $sourceFile)) { throw "Missing file: $sourceFile" }
    docker cp $sourceFile "zertipower-smart-meter-preview:/app/$previewFile"
    if ($LASTEXITCODE -ne 0) { throw "Failed to copy $previewFile" }
  }
  Write-Host 'Open http://localhost:4200/energy-stats/community and refresh after the preview recompiles.'
} finally { Pop-Location }
