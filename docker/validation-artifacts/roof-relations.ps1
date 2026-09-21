docker cp "$PSScriptRoot/roof-relations.cjs" zertipower-backend-1:/src/roof-relations.cjs
docker exec zertipower-backend-1 node /src/roof-relations.cjs
