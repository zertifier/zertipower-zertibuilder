docker cp "$PSScriptRoot/audit.cjs" zertipower-backend-1:/src/audit.cjs
docker exec zertipower-backend-1 node /src/audit.cjs
docker cp zertipower-backend-1:/src/consumption-audit.json "$PSScriptRoot/consumption-audit.json"
