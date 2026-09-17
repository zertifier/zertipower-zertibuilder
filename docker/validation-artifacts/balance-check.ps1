docker cp "$PSScriptRoot/../../calculadora/src/app/services/energy-balance.ts" zertipower-backend-1:/src/energy-balance.ts
docker cp "$PSScriptRoot/balance-check.cjs" zertipower-backend-1:/src/balance-check.cjs
docker exec zertipower-backend-1 node /src/balance-check.cjs
