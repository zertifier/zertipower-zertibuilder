$ErrorActionPreference='Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
 docker compose build backend calculadora
 if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
 docker compose up -d --no-deps backend calculadora
 if ($LASTEXITCODE -ne 0) { throw 'Startup failed' }
 docker exec zertipower-backend-1 npm test -- --runInBand community-prediction.service.spec.ts calculator-community-selections.service.spec.ts community-solar-roof-store.service.spec.ts energy-forecast.service.spec.ts calculator-solar.spec.ts
 if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
 docker exec smart-meter-dev npx ng build --configuration development --output-path /tmp/community-ui-build
 if ($LASTEXITCODE -ne 0) { throw 'Portal build failed' }
} finally { Pop-Location }
