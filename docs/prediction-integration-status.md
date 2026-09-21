# Integracio de prediccio: estat i proves

La ruta de produccio existent continua utilitzant GET /previsio i els kWh retornats.
No s'ha modificat el predictor remot ni s'ha confirmat quin proveidor meteorologic utilitza internament.

## Dades de la calculadora

El backend consulta Prisma directament. SOLAR_CUPS_AREAS_JSON associa explicitament un ID de CUPS amb un ID d'energy_areas. No hi ha una clau forana que permeti descobrir aquesta relacio automaticament. No emplenar amb IDs inventats.

Es llegeixen kWh_p, kWh_inversor i inclination quan existeixen. Cal confirmar que aquests camps historics representen kWp, kW i graus, respectivament, abans de configurar una associacio. L'orientacio i el rendiment no estan disponibles en aquesta taula. SOLAR_INSTALLATIONS_JSON preval sobre els camps de la coberta. Els valors absents mantenen els valors provisionals autoritzats: no son especificacions verificades.

La calculadora simula amb PVGIS; el flux de simulacio no desa totes les caracteristiques per CUPS. Aquesta implementacio NO afegeix encara un formulari per vincular i desar instal·lacions. El metode sync existent nomes consulta, no persisteix.

## Historics i meteorologia

Open-Meteo forecast per a dates futures; archive per a dates passades. Les hores s'uneixen en UTC amb precisio de minuts. Cal confirmar que infoDt de la importacio SQL representa UTC i si l'hora indica l'inici o el final de l'interval: la radiacio horaria d'Open-Meteo es una mitjana de l'hora anterior. No entrenar fins a validar aquesta convencio.

No es converteixen valors nuls de radiacio en zeros. No s'utilitza kwh_out en lloc de production. La radiacio es W/m2 i la produccio kWh; no es resten entre si per calcular un error.

GET /user-prediction/cups/46/input?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD prepara 30 dies d'historics (amb marge de cinc dies per a l'arxiu), configuracio i previsio meteorologica. No envia res al predictor. Indica si hi ha produccio positiva i quants registres tenen radiacio. L'absencia d'historics no vol dir produccio zero.

Les rutes noves de prediccio amb historics retornen un error explicit de contracte pendent: s'ha retirat la crida no confirmada POST /production/predict a l'API de consum. La grafica continua a /energy-prediction.

## Validacio pendent

No s'ha compilat ni reiniciat Docker, segons la preferencia de l'usuari. Cal compilar i provar les rutes. No hi ha encara calibracio, RMSE, persistencia de prediccions ni integracio remota amb historics.

Des de docker: docker compose up -d --build backend
Portal: http://localhost:4200/energy-stats/community
Configuracio: http://localhost:3000/calculadora-sync/cups/46/config
Produccio existent: http://localhost:3000/energy-prediction?community=7

## Correu per al responsable

Assumpte: Dades pendents per connectar calculadora i predictor solar

Hola,

Estic adaptant la plataforma per utilitzar les dades de cada instal·lacio i combinar production d'energy_hourly amb meteorologia d'Open-Meteo.

Necessito confirmar la relacio entre cada CUPS i la coberta de la calculadora, on es desen els parametres reals (potencia fotovoltaica, inversor, inclinacio, orientacio, rendiment i coordenades), i les unitats dels camps kWh_p i kWh_inversor.

Tambe necessito el repositori o codi de l'API /previsio per afegir-li els historics i la meteorologia. El contracte conegut nomes rep parametres de la instal·lacio. Cal confirmar el fus horari d'energy_hourly, el significat temporal de cada interval i que production conte generacio real, no nomes excedents.

Per Montolivet tenim indicada una potencia de 32,4 kWp; falta completar les altres especificacions. En la revisio anterior del CUPS 46 no hi havia produccio positiva a production per calibrar el model.

Open-Meteo limita l'API gratuita a usos no comercials; per a la plataforma comercial cal revisar el pla corresponent.

Gracies!

## Flux automatic comunitari (substitueix la proposta de formulari)

S’ha retirat el formulari i la ruta de previsio manual afegits a la calculadora. GET /energy-prediction?community=7 ara prepara una configuracio per cada CUPS consumidor/prosumidor actiu, en resol la coberta, agafa els valors guardats d’aquella coberta i suma les previsions horaries completes. No inclou simultaniament el productor compartit per evitar duplicar la produccio en aquest escenari de cases.

Rendiment comu: 0,8. Limit estimat de l’inversor: MAX(energy_hourly.production) positiu anterior al moment actual de cada CUPS, interpretant registres d’una hora en kWh. Es la proxy demanada per l’usuari, no la potencia nominal. El flux Datadis calcula production a partir del repartiment d’exportacio comunitaria; per tant, la previsio resultant seria un escenari basat en aquest repartiment fins a disposar de generacio fisica.

Les coordenades es calculen a partir dels vertexs de cada coberta. Es requereixen potencia i inclinacio guardades i orientation numeric (convencio sud=0, est=-90) a les propietats GeoJSON. No s’inventen aquests camps quan falten. SOLAR_CUPS_AREAS_JSON ha de contenir la correspondencia confirmada entre CUPS i energy_areas. La copia actual no conte aquesta correspondencia ni tots aquests parametres. Per tant, la nova ruta no es operativa encara: retorna un error de dades incompletes en lloc d’un total parcial o de la previsio de la instal·lacio compartida anterior.

El mapa carrega totes les cobertes del municipi per location_id. El contorn blanc es l’estil del mapa, no una relacio persistent amb la comunitat. No es pot sumar tot el municipi com si fos Montolivet.

El consum comunitari conserva la ruta existent /energy-prediction/community/7/consumption. No s’ha verificat en execucio en aquest canvi.

Pendent: obtenir el conjunt de cobertes/CUPS de Montolivet i les especificacions guardades; compilar i provar. No cal utilitzar la calculadora per executar la previsio un cop les dades estiguin disponibles.

## Prova temporal autoritzada: 50 m2 per casa

Activada nomes al docker/.env local per a la comunitat 7: SOLAR_TEST_HOUSE_M2=50 i SOLAR_TEST_COMMUNITY_ID=7. No canvia registres de la base de dades. Cada CUPS consumidor/prosumidor actiu representa una casa de prova. La potencia simulada es 6,7 kWp segons la formula de la calculadora. Coordenades comunitaries, inclinacio 30 graus, azimut 45 (sud-oest), rendiment 0,8. Es conserva el maxim historic individual de production com a limit estimat de l’inversor. La ruta comunitaria suma les previsions de totes les cases. Els valors son un escenari de prova, no les caracteristiques reals de les cobertes.

Per desactivar: SOLAR_TEST_HOUSE_M2=0 i recrear el backend. No s’ha compilat ni executat la previsio remota en aquest canvi.
