docker cp "$PSScriptRoot/relations.cjs" zertipower-backend-1:/src/relations.cjs
docker exec zertipower-backend-1 node /src/relations.cjs
