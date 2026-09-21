docker cp "$PSScriptRoot/db-probe.cjs" zertipower-backend-1:/src/db-probe.cjs
docker exec zertipower-backend-1 node /src/db-probe.cjs
