# Montolivet: dades de la instal·lació solar

Dades facilitades per l'usuari; pendent contrastar-les amb la fitxa tècnica.

- Comunitat: Montolivet (ID 7).
- CUPS productor comunitari: ES0031446430838002WD0F (ID 46).
- Potència fotovoltaica instal·lada: **32,4 kWp**.
- Nombre de plaques: **90**.
- Producció anual estimada del projecte: **43.000 kWh/any** (no és una mesura real ni un valor diari constant).
- Emplaçament: coberta de les antigues escoles / Llar d'Infants Sant Pere Màrtir.
- Empresa instal·ladora: **SEI**.
- Estudi del projecte: **Km0 Energy**.

## Configuració local

A `docker/.env`, `SOLAR_INSTALLATIONS_JSON` conté l'override
`{"46":{"kwp":32.4}}`. Només afecta el CUPS 46.
La resta de CUPS conserva la seva configuració.

L'API utilitza la potència total: no s'ha de multiplicar 32,4 kWp per 90 plaques.
La producció anual estimada serveix per contrastar resultats a escala anual,
no per fixar ni escalar artificialment cada previsió horària.

## Pendent de confirmar

- Potència màxima AC de l'inversor (encara s'utilitza el valor provisional de **6 kW**, que pot limitar excessivament la previsió).
- Inclinació (provisional: 30 graus).
- Orientació (provisional: sud-oest).
- Performance ratio (provisional: 0,8).
- Coordenades exactes de la coberta. Actualment es fan servir les de la comunitat: 42.181703, 2.477629.
- Preus punta, pla i vall per als resultats econòmics (actualment provisionals).

Des de la carpeta `docker`, aplicar amb:

```powershell
docker compose up -d backend
```

Si encara hi ha canvis de codi pendents de compilar, afegir `--build`.
