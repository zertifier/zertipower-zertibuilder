docker cp "$PSScriptRoot/apply-index.cjs" zertipower-backend-1:/src/apply-index.cjs
docker exec zertipower-backend-1 node /src/apply-index.cjs
