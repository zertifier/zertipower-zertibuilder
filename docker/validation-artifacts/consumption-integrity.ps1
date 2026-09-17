docker cp "$PSScriptRoot/consumption-integrity.cjs" zertipower-backend-1:/src/consumption-integrity.cjs
docker exec zertipower-backend-1 node /src/consumption-integrity.cjs
