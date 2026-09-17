docker cp "$PSScriptRoot/e2e.cjs" smart-meter-dev:/tmp/e2e.cjs
docker exec smart-meter-dev node /tmp/e2e.cjs
$result=$LASTEXITCODE
docker cp smart-meter-dev:/tmp/e2e-evidence.json "$PSScriptRoot/e2e-evidence.json"
docker cp smart-meter-dev:/tmp/calculator-selected-roofs.png "$PSScriptRoot/calculator-selected-roofs.png"
docker cp smart-meter-dev:/tmp/community-production.png "$PSScriptRoot/community-production.png"
exit $result
