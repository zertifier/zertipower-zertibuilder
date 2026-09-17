# Predicció comunitària amb cobertes de membres

`GET /energy-prediction?community=7` utilitza `CommunityPredictionService` i només accepta configuracions solars atribuïdes a un membre actiu. No interpreta tot el catàleg d’una localitat com instal·lacions.

La relació és `community -> shares(status=ACTIVE) -> customer -> cups` i, per a producció, `customer -> member_solar_configurations` o una selecció de calculadora amb `memberId`. Una selecció també es pot atribuir quan porta un CUPS del mateix community; el backend deriva el `customerId` i valida el membre actiu. Si no existeix cap relació, la coberta es descarta amb el motiu explícit.

Les cobertes vàlides conserven `energyAreaId`, referència, superfície, plaques, kWp, latitud, longitud, tilt i azimuth. Una configuració incompleta no rep dades inventades. El detall retorna membres totals/actius, cobertes completes/estimades/descartades i els motius.

Per coberta, Open-Meteo GTI es transforma amb `kWp × GTI / 1000 × 0,8`; les sèries horàries es sumen abans d’agrupar per dia local. El predictor comunitari no necessita potència d’inversor ni modela clipping si aquesta dada falta. L’endpoint principal manté sis valors D+1…D+6.

La calculadora usa `calculateEnergyBalance`: `self=min(producció,consum)`, `exportació=max(producció-consum,0)` i `importació=max(consum-producció,0)` per interval. Amb totals mensuals usa un perfil horari explícit i el marca `monthly-profile-estimate`. Això manté les identitats físiques i permet calcular l’estalvi separant cost evitat i compensació d’excedents.

El consum comunitari usa `energy_hourly.kwh_in`, rebutja dies incomplets o duplicats i calcula una predicció per subministrament a partir de fins a vuit dies del mateix dia de setmana. Els subministraments sense històric queden identificats com extrapolats. Els CUPS del mateix client es compten com subministraments diferents.

A la base local actual de Montolivet hi ha 28 membres actius a `shares`, 29 subministraments actius i cap configuració solar atribuïda a un membre. Les àrees 3103 i 3104 de la prova són seleccions sense `memberId`; es descarten. Per tant l’endpoint queda buit fins que un membre atribueixi una coberta o desi una configuració completa. Inferir aquesta relació violaria la regla de no inventar dades.

La validació és a `docker/validation-artifacts/`: compilacions Docker, compilació Angular, tests de predictor/seleccions/balanç i auditories de relacions i consum.
