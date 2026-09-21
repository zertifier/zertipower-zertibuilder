# Simulador de cobertes, independent del predictor existent

POST /roof-simulation rep latitude, longitude, kwp, tilt i azimuth. No llegeix la base de dades, CUPS, inversors ni historics. No crida /previsio. El predictor anterior es conserva.

A la calculadora, simulateSelectedRoof llegeix selectedCadastre.InsalledPower, inclination i orientation. Les coordenades queden associades a la coberta quan se selecciona al mapa; canviar entre cobertes no reutilitza les coordenades de l’ultima casa clicada. La potencia inicial es la suggerida pel calcul de superficie existent; l’usuari la pot modificar al formulari. La superficie i el nombre de plaques no es multipliquen de nou: la potencia total ja representa el conjunt de plaques.

Open-Meteo retorna global_tilted_irradiance en W/m2 per a la inclinacio i azimut rebuts (sud 0, est -90, oest 90). Aquesta variable incorpora la projeccio sobre el pla dels panells; no apliquem una segona correccio d’orientacio. Formula horaria: E[kWh] = P[kWp] * GTI[W/m2] / 1000 * 0,8 * 1h.

Model simplificat amb rendiment comu 80%, sense ombres locals, bruticia, ajust termic explicit, limit d’inversor ni calibracio historica. Es una estimacio meteorologica favorable, no un maxim garantit ni una previsio de cel sempre sere.

La radiacio es la mitjana de l’hora anterior; s’assigna a l’inici de l’interval. Sis dies locals complets (avui + cinc), amb comprovacio dels dies de 23/24/25 hores. Errors si falten hores o radiacions; zero nocturn valid. Les respostes retornen els parametres utilitzats juntament amb totals diaris i punts horaris.

Font tecnica: https://open-meteo.com/en/docs (global_tilted_irradiance). L’API gratuita te restriccions d’us comercial: https://open-meteo.com/en/terms.

## Proves

backend/test/roof-simulation-check.cjs comprova validacio, unitats, zeros, valors nuls, hores absents, duplicats i canvis d’hora. Executat amb resultat correcte; consulta real a Open-Meteo HTTP 200 i sis totals diaris. No s’ha recompilat ni reiniciat l’aplicacio, ni verificat visualment el formulari compilat.

## Provar a la calculadora local

Des de docker: docker compose up -d --build backend calculadora
Obrir http://localhost:4202/calculate, seleccionar una coberta, revisar inclinacio/orientacio/potencia i premer Simular produccio solar.

Aquest nou modul no modifica el consum ni la ruta de produccio comunitaria del portal. La prova anterior de 50 m2 no intervé en aquest simulador.
