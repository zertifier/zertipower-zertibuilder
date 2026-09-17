# Revisió final calculadora / Montolivet (community 7)

## Estat de dades

- `shares`: 28 clients diferents amb share `ACTIVE`.
- CUPS actius de tipus `consumer`/`prosumer`: 29; dos CUPS inactius queden fora.
- No hi ha cap fila a `member_solar_configurations`.
- No hi ha cap relació FK CUPS → `energy_area`/coberta.
- Les úniques seleccions de calculadora existents (3103 i 3104) no tenen `memberId` ni `consumptionCupsId`; es classifiquen com a **descartades**, no com a cobertes de Montolivet.

Les seleccions explícites de la calculadora es tracten ara com a `source=simulation`, encara que no tinguin membre. Les instal·lacions reals continuen requerint atribució a un membre actiu. Això permet validar Montolivet amb una o més àrees simulades sense inventar cap relació de membre.

## Canvis

La calculadora ja no consulta CUPS, Datadis ni històrics. El consum surt dels tres camps manuals Vall/Llano/Punta; si encara no s'han introduït, es mostra `estimate-calculator` amb etiqueta explícita. El camí antic de 3.600 kWh era `CalculatorConsumptionService.consumptionProfile([])` (`Array(12).fill(300)`).

- Balanç horari de la calculadora amb `min`/`max`; les identitats anuals són `producció = autoconsum + excedent` i `consum = autoconsum + importació`.
- Si només hi ha totals mensuals, es documenta la font `monthly-profile-estimate`; no es presenta com a consum real.
- Consum: manual > històric del comptador/membre > estimació explícita. S'ha eliminat el càlcul d'excedent mensual `producció - consum`.
- Estalvi: cost evitat de l'autoconsum i compensació separada de l'energia exportada.
- `CommunityMemberRoofsService` resol només configuracions completes de membres actius i classifica les incompletes/no atribuïdes.
- Les seleccions de calculadora sense membre es resolen com a cobertes de simulació i entren al mateix predictor, sense consultar automàticament el catàleg complet.
- La predicció comunitària reutilitza les dades de la calculadora (`areaM2`, `panelCount`, `kwp`, lat/lon, tilt, azimuth), usa Open-Meteo GTI i PR 0,8, i suma per timestamp i dia. No exigeix potència d'inversor.
- El consum comunitari s'agrega per membre; múltiples CUPS del mateix membre se sumen només en dies complets compartits.

## Validació

- `balance-check`: PASS.
- Backend i calculadora compilats amb Docker abans de reiniciar els serveis.
- Build del frontend de comunitat: PASS.
- La captura i els valors 395,59…668,92 corresponen a la validació antiga amb les dues seleccions de prova i no són un resultat final de Montolivet; el filtre nou ja les descarta.
- Amb les dades actuals: `membersTotal=28`, `membersActive=28`, `activeSupplies=29`, `completeRoofs=0`, `estimatedRoofs=0`, `discardedRoofs=2` (3103/3104, selecció no atribuïda).
- `GET /energy-prediction?community=7` retorna HTTP 200 i `data: []` perquè no hi ha cap coberta vàlida; la UI mostra el missatge explicatiu en lloc d'atribuir cobertes de prova.

Per obtenir els sis valors de producció reals cal desar una configuració de coberta de calculadora amb `memberId` o `consumptionCupsId` per als membres de Montolivet. El codi ja queda preparat per agregar-les automàticament quan existeixin.
