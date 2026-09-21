# Simulació fotovoltaica de la calculadora

> Actualització: la predicció de `GET /energy-prediction?community=ID` utilitza ara
> exclusivament configuracions seleccionades i el predictor propi. Vegeu
> [el flux actual](community-selected-roof-prediction.md).
> Les descripcions següents de la simulació de tota la localitat són del camí antic
> `/roof-simulation/community`, que no alimenta aquesta predicció.

La previsió solar nova utilitza exclusivament la configuració de la calculadora i Open-Meteo.
El servei antic `energy-forecast.service.ts`, el predictor antic i `/previsio` es mantenen intactes.

## Origen de les dades

- `map.component.ts`: `google.maps.geometry.spherical.computeArea(path)` → propietat `areaM2`.
- `calculate.component.ts`: punt de la coberta seleccionat → `solarLatitude` / `solarLongitude`; `m2 = Math.floor(areaM2)`.
- Selectors `inclination` i `orientation`: graus, 0 sud, -90 est, 90 oest.
- `energy-areas.controller.ts`, càlcul existent de la calculadora: `kWp` → `InsalledPower`, `numberPanels` → `n_plaques`. La previsió llegeix la potència seleccionada; no la recalcula a partir de l'àrea.
- El mateix càlcul existent utilitza angle 20 i azimut 0 quan la coberta té inclinació <5°. Ara retorna aquests valors efectius com `tilt` / `azimuth` i la calculadora els conserva com `solarTilt` / `solarAzimuth`.
- Àrea, plaques i potència es guarden tal com les envia la calculadora. L'àrea i el nombre de plaques són metadades; no multipliquen de nou la producció.

## Persistència i identitat

La calculadora pública pot simular sense sessió. L'acció explícita «Desar com a coberta meva a la comunitat» autentica amb `/auth/login`. El token es manté en memòria; no es guarden credencials. Si expira, cal tornar a iniciar sessió.

El backend obté `users.customer_id` del compte autenticat i verifica la relació existent `shares.customerId`, `shares.communityId`, `shares.status = ACTIVE`. El client no pot escollir el propietari. `shares.controller.ts/activateParticipant` confirma aquesta definició d'activitat. Els membres es compten per client diferent; no per files de participacions ni per punts de subministrament.

La taula nova `member_solar_configurations` guarda configuracions personals per a altres funcionalitats. La producció comunitària no la consulta i no depèn de cap propietari.

Migració: `sql/migrations/002_member_solar_configurations.sql`. El repositori també crea aquesta mateixa taula de manera idempotent seguint el patró de persistència ja existent. No hi ha migració automàtica d'identitats ni dades fictícies. Per disposar de producció comunitària real, els membres han de desar les seves configuracions.

## API

- `POST /roof-simulation`: públic; `{latitude, longitude, kwp, tilt, azimuth, areaM2?, panelCount?}`. Si es proporcionen les metadades, cal proporcionar-les totes dues. Retorna `input`, `daily[{date,kwh}]`, `hourly`, `performanceRatio`, unitats i hipòtesis.
- `POST /roof-simulation/community-roof`: autenticat; els camps anteriors més `communityId`, `roofReference`, `areaM2`, `panelCount`. Guarda la configuració del client autenticat.
- `GET /roof-simulation/community-roofs?community=ID`: autenticat; retorna les configuracions pròpies.
- `DELETE /roof-simulation/community-roof?community=ID&reference=REF`: autenticat; elimina només la configuració pròpia.
- `GET /roof-simulation/community?community=ID`: suma comunitària i diagnòstic. La ruta existent `GET /energy-prediction?community=ID` també utilitza aquest servei.

## Fórmula i límits

Open-Meteo `global_tilted_irradiance` és la mitjana de l'hora anterior en W/m², sobre el pla configurat amb `tilt` i `azimuth`. Es comproven les unitats retornades. Producció de cada hora = `kwp × GTI / 1000 × 0.8` kWh. No es torna a aplicar cap factor geomètric. El rendiment 0.8 és una hipòtesi explícita del simulador, no una mesura de la instal·lació.

Documentació: https://open-meteo.com/en/docs

S'assigna cada interval al seu inici i se suma per dia d'Europe/Madrid; es validen dies de 23, 24 o 25 hores, dades absents i intervals duplicats. Es calcula avui i els cinc dies següents amb meteorologia prevista i sense ombres locals, brutícia, degradació ni calibratge històric. No és una garantia de producció ni una simulació de cel sempre serè.

La comunitat utilitza una finestra comuna, simula totes les cobertes retornades per la ubicació de la comunitat pel mateix endpoint que usa la calculadora i suma els kWh individuals per dia. No hi ha membres, radi ni límit arbitrari de cobertes. Si falla una simulació no es presenta una suma parcial com a completa. Si no hi ha cobertes vàlides retorna `forecast: []`, `status: no-calculator-roofs` i els totals reals.

Diagnòstic: `activeMembers`, `membersWithSolarConfiguration`, `membersWithoutSolarConfiguration`, `solarConfigurations`, `excludedInactiveConfigurations`, `invalidMembershipRecords`, potència total i àrea total. Logs estructurats mostren pla, potència, rendiment, kWh diaris i totals, sense coordenades, credencials ni dades personals.

## Validació

`npm test -- --runInBand --runTestsByPath src/features/energy-prediction/infrastructure/services/calculator-solar.spec.ts`

Les proves cobreixen unitats, geometria sense doble correcció, DST, propietat, participants inactius, membres sense configuració, més de 25 configuracions i errors parcials. No necessiten serveis externs ni dades de producció.
