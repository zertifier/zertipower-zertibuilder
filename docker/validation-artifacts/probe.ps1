$ErrorActionPreference='Stop'
docker cp "$PSScriptRoot/probe.cjs" zertipower-backend-1:/src/probe.cjs
docker exec zertipower-backend-1 node /src/probe.cjs
