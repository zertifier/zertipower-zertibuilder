# Validació end-to-end — 17-09-2026

Resultat: backend i calculadora desplegats localment; producció comunitària amb sis dies reals, consum comunitari conservat.

## Consum de la calculadora

Origen comprovat al codi original: `selectedCadastre` i `resetCadastre` inicialitzaven `totalConsumption: 300`, `valle: 50`, `llano: 100`, `punta: 150`. `updateConsumptions()` repetia la suma per cada mes de generació: 300 × 12 = 3.600 kWh. No era un consum mesurat.

Ara es respecta el consum manual; es consulta el CUPS seleccionat i després l’històric comunitari si falta informació. Un any complet es tracta com a mesurat; les anualitzacions i la mitjana comunitària es marquen com a estimacions. Només si no hi ha cap històric es conserva 300 kWh/mes com a estimació explícita, mai com a lectura real.

Resultat local sense membre associat: **2.369,34 kWh/any**, suma exacta dels dotze mesos:

```json
{
  "source": "estimate-community-history",
  "label": "Estimació per habitatge amb l’històric comunitari; sense comptador associat a aquesta coberta.",
  "monthlyKwh": [
    300.56,
    194.55,
    197.4,
    154.57,
    159.22,
    134.18,
    116.09,
    115.22,
    172.62,
    251,
    239.46,
    334.47
  ],
  "annualKwh": 2369.34,
  "observedDays": 6257,
  "observedPoints": 13,
  "historyFrom": "2024-01-01",
  "historyTo": "2025-08-23",
  "cupsId": null
}
```

CUPS 16: estimació amb històric propi de **3.195,84 kWh/any**, 415 dies complets entre 18-01-2024 i 23-08-2025. Prova de consum manual: 71+83+97=251 kWh/mes, 3.012 kWh/any; una resposta d’històric posterior no el substitueix.

S’ha afegit l’índex `(cups_id, info_dt)`: la consulta comunitària de la calculadora baixa de diversos minuts a aproximadament 3,1 s en aquesta prova. No modifica les lectures. També s’han protegit les respostes asíncrones contra canvis de comunitat, comptador o entrada manual.

## Consum comunitari

Font: `energy_hourly.kwh_in`, via `LocalConsumptionService`; a l’entorn local està activat per `CONSUMPTION_LOCAL_TEST_COMMUNITY_ID=7`. Es conserven els sis valors originals.

La base local conté 32 CUPS: 31 de membre i un de comunitat. Dels 31, dos són inactius (20 i 69); entren **29 consumidors actius**, 13 amb històric i 16 estimats. Per això el nombre difereix dels 31 que mostra la calculadora.

Per cadascun dels 13 punts observats es prenen fins a 56 dies finals, es rebutgen dies incomplets/duplicats i es calcula la mitjana de fins a vuit dies del mateix dia de la setmana. Se sumen les prediccions individuals i s’extrapola `suma / 13 × 29` als punts sense històric. La cobertura global va del **27-03-2025 al 23-08-2025**. No hi ha un volum de consum hardcodejat. És coherent com a estimació de la comunitat amb aquesta cobertura; no són 29 ni 31 consums mesurats.

## Cobertes, entrada i resposta del predictor

Seleccions afegides expressament durant la prova local, conservades a `calculator_community_selections` per a comunitat 7:

| Àrea | Referència | m² | Plaques | kWp | Inclinació | Azimut |
|---|---|---:|---:|---:|---:|---:|
| 3103 | 6902401DG5760S | 853 | 253 | 113.7 | 25 | 0 |
| 3104 | 6902601DG5760S | 60 | 18 | 8 | 25 | 0 |

La segona coberta és una selecció de prova del polígon real 3104. Cap dada afirma que aquestes plaques estiguin físicament instal·lades. Són les instal·lacions simulades per la calculadora, amb superfície calculada sobre la geometria seleccionada.

No s’utilitza `member_solar_configurations`, no s’exigeix membre autenticat i no es projecten les 8.419 geometries. També s’ha corregit `/roof-simulation/community` perquè delegui al mateix servei de seleccions.

Entrades exactes i resposta diària per coberta:

```json
[
  {
    "energyAreaId": 3103,
    "roofReference": "6902401DG5760S",
    "input": {
      "latitude": 42.18171145337464,
      "longitude": 2.477655278542555,
      "kwp": 113.7,
      "tilt": 25,
      "azimuth": 0,
      "areaM2": 853,
      "panelCount": 253
    },
    "daily": [
      {
        "date": "2026-09-18",
        "kwh": 369.59
      },
      {
        "date": "2026-09-19",
        "kwh": 567.69
      },
      {
        "date": "2026-09-20",
        "kwh": 590.64
      },
      {
        "date": "2026-09-21",
        "kwh": 579.19
      },
      {
        "date": "2026-09-22",
        "kwh": 622.54
      },
      {
        "date": "2026-09-23",
        "kwh": 624.95
      }
    ]
  },
  {
    "energyAreaId": 3104,
    "roofReference": "6902601DG5760S",
    "input": {
      "latitude": 42.18124971968432,
      "longitude": 2.478314660739948,
      "kwp": 8,
      "tilt": 25,
      "azimuth": 0,
      "areaM2": 60,
      "panelCount": 18
    },
    "daily": [
      {
        "date": "2026-09-18",
        "kwh": 26
      },
      {
        "date": "2026-09-19",
        "kwh": 39.94
      },
      {
        "date": "2026-09-20",
        "kwh": 41.56
      },
      {
        "date": "2026-09-21",
        "kwh": 40.75
      },
      {
        "date": "2026-09-22",
        "kwh": 43.8
      },
      {
        "date": "2026-09-23",
        "kwh": 43.97
      }
    ]
  }
]
```

El servei específic rep aquestes configuracions i consulta la radiació horària GTI d’Open-Meteo amb latitud, longitud, tilt, azimuth, Europe/Madrid i timestamps Unix. Integra cada interval amb `kWp × GTI / 1000 × 0,8` i suma cobertes abans d’arrodonir. No s’inventa inversor: no es modela el límit de l’inversor ni ombres locals. El 80% és una hipòtesi declarada. Contracte meteorològic contrastat amb [la documentació oficial](https://open-meteo.com/en/docs).

| Dia | Coberta 3103 kWh | Coberta 3104 kWh | Total producció kWh | Consum kWh |
|---|---:|---:|---:|---:|
| 2026-09-18 | 369.59 | 26.00 | 395.59 | 115.11 |
| 2026-09-19 | 567.69 | 39.94 | 607.63 | 108.04 |
| 2026-09-20 | 590.64 | 41.56 | 632.20 | 120.86 |
| 2026-09-21 | 579.19 | 40.75 | 619.94 | 113.22 |
| 2026-09-22 | 622.54 | 43.80 | 666.34 | 116.08 |
| 2026-09-23 | 624.95 | 43.97 | 668.92 | 106.82 |

## Resposta HTTP real

`GET http://localhost:3000/energy-prediction?community=7` — HTTP 200:

```json
{
  "success": true,
  "data": [
    {
      "time": "2026-09-18T12:00:00+02:00",
      "value": 395.59
    },
    {
      "time": "2026-09-19T12:00:00+02:00",
      "value": 607.63
    },
    {
      "time": "2026-09-20T12:00:00+02:00",
      "value": 632.2
    },
    {
      "time": "2026-09-21T12:00:00+02:00",
      "value": 619.94
    },
    {
      "time": "2026-09-22T12:00:00+02:00",
      "value": 666.34
    },
    {
      "time": "2026-09-23T12:00:00+02:00",
      "value": 668.92
    }
  ],
  "message": "Selected community roof production prediction"
}
```

## Compilació, tests i navegador

- Backend Nest i calculadora Angular compilats amb Docker i desplegats localment.
- Portal compilat amb `npx ng build --configuration development`.
- 29 tests correctes en 5 suites: seleccions persistents, agregació comunitària/consum, física solar, adaptador individual i configuracions de membre.
- Una coberta: sis prediccions reals; dues cobertes: suma comprovada per dia i sis valors retornats per l’endpoint principal.
- Consum mensual/anual coherent; valor manual respectat; seleccions recuperades després de recarregar, incloent estalvi i tarifes.
- Chromium: component real de producció/consum a `http://localhost:4200/community-prediction-preview/7`, amb API i meteorologia reals, sense mocks. Sis cercles verds de producció i consum original intacte. Cap error JavaScript.
- La ruta de previsualització és local i utilitza el mateix component; no s’ha validat l’inici de sessió ni s’han canviat comptes. La selecció automatitzada dispara l’esdeveniment del polígon real del mapa i prem el botó de desar.

Captures: [producció comunitària](validation-artifacts/community-production.png), [llista d’agregats](validation-artifacts/calculator-selected-roofs.png).

Evidència completa: [peticions i navegador](validation-artifacts/e2e-evidence.json), [consum](validation-artifacts/consumption-audit.json), [entrada/resposta del predictor](validation-artifacts/predictor-input-output.json), [resposta de l’endpoint](validation-artifacts/energy-prediction-community-7.json).

## Fitxers de la solució

Canvis completats en aquesta continuació:

- `backend/prisma/schema.prisma`
- `sql/migrations/005_consumption_history_index.sql`
- `backend/src/features/energy-prediction/infrastructure/services/community-roof-simulation.service.ts`
- `backend/src/features/energy-prediction/infrastructure/services/roof-simulation.service.ts`
- `backend/src/features/energy-prediction/infrastructure/services/calculator-community-selections.service.ts`
- `backend/src/features/energy-prediction/infrastructure/services/calculator-community-selections.service.spec.ts`
- `backend/src/features/energy-prediction/infrastructure/services/calculator-solar.spec.ts`
- `calculadora/src/app/pages/calculate/calculate.component.ts`
- `calculadora/src/app/pages/calculate/calculate.component.html`
- `docs/community-selected-roof-prediction.md`
- `docker/community-prediction-validation.md` i scripts/evidències a `docker/validation-artifacts/`.

Implementació ja present de la sessió anterior, comprovada i desplegada en aquest flux:

- `backend/src/features/energy-areas.controller.ts`
- `backend/src/features/energy-prediction/energy-prediction.module.ts`
- `backend/src/features/energy-prediction/infrastructure/controllers/roof-simulation.controller.ts`
- `backend/src/features/energy-prediction/infrastructure/controllers/energy-prediction/energy-prediction.controller.ts`
- Serveis `calculator-consumption.service.ts`, `calculator-installation.ts`, `community-prediction.service.ts` i `community-prediction.service.spec.ts`.
- `sql/migrations/004_calculator_community_selections.sql`
- `calculadora/src/app/services/energy-areas.service.ts`
- Component `energy-prediction` del repositori germà `ris3cat-smart-meter`, validat sense nous canvis en aquesta continuació.

La lògica de `local-consumption.service.ts` es conserva.
