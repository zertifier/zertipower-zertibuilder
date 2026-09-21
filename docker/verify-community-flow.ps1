$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$files = @(
'src/features/energy-areas.controller.ts',
'src/features/energy-prediction/energy-prediction.module.ts',
'src/features/energy-prediction/infrastructure/controllers/energy-prediction/energy-prediction.controller.ts',
'src/features/energy-prediction/infrastructure/services/calculator-installation.ts',
'src/features/energy-prediction/infrastructure/services/community-prediction.service.ts',
'src/features/energy-prediction/infrastructure/services/community-prediction.service.spec.ts',
'src/features/energy-prediction/infrastructure/services/community-solar-roof-store.service.spec.ts',
'src/features/energy-prediction/infrastructure/services/community-solar-roof-store.service.ts'
)
foreach ($file in $files) {
 docker cp (Join-Path "$repo/backend" $file) "zertipower-backend-1:/src/$file"
 if ($LASTEXITCODE -ne 0) { throw "Copy failed: $file" }
}
docker exec zertipower-backend-1 npm test -- --runInBand community-prediction.service.spec.ts community-solar-roof-store.service.spec.ts energy-forecast.service.spec.ts calculator-solar.spec.ts
if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed' }
docker exec zertipower-backend-1 npm run build
if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' }
