docker cp "$PSScriptRoot/final-check.cjs" zertipower-backend-1:/src/final-check.cjs
docker exec zertipower-backend-1 node /src/final-check.cjs
$result=$LASTEXITCODE
docker cp zertipower-backend-1:/src/final-check.json "$PSScriptRoot/final-check.json"
exit $result
