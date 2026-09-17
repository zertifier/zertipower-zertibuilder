docker cp "$PSScriptRoot/browser-flow.cjs" smart-meter-dev:/tmp/browser-flow.cjs
docker exec smart-meter-dev node /tmp/browser-flow.cjs
