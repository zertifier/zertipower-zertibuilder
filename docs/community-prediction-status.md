# Community: estat verificat

## Consum local de prova

Activat nomes per Montolivet a docker/.env amb CONSUMPTION_LOCAL_TEST_COMMUNITY_ID=7. La resta conserva el servei existent. No es modifiquen registres de la base.

Es calcula energia importada (energy_hourly.kwh_in, ja en kWh): mitjana per dia de la setmana, fins a les ultimes vuit setmanes disponibles de cada membre actiu consumidor/prosumidor. No es divideixen valors grans per 1000. Es descarten dies incomplets, duplicats, amb valors negatius o nuls. Els timestamps de la copia SQL s’agrupen pels dies i hores emmagatzemats; els dies de canvi horari que no tenen 24 hores distintes s’exclouen d’aquesta estimacio de prova.

Resultat verificat el 16/09/2026: 13 de 29 membres amb dies complets. Rang global dels historics utilitzats: 27/03/2025 a 23/08/2025. Sis estimacions: 47,88; 50,52; 51,60; 48,43; 54,18; 50,75 kWh. SON PARCIALS, no el consum total de la comunitat. El portal mostra dates, cobertura i aquest avis. No calcula excedents quan la cobertura es parcial.

CUPS sense mostres completes utilitzables: 43,44,45,54,55,56,57,58,59,61,62,63,64,65,66,67.

## Produccio

La ruta comunitaria utilitza el model nou de radiacio d’Open-Meteo i agrega els dies de totes les cobertes de `energy_areas` de la ubicació que la calculadora carrega i mostra. La previsio individual a la calculadora es conserva. El predictor extern antic continua disponible per CUPS.

SOLAR_TEST_HOUSE_M2=0: prova de 50 m2 desactivada per indicacio de l’usuari. La produccio comunitaria utilitza la mateixa ubicació i el mateix conjunt complet d’àrees que la calculadora; no necessita configuracions desades per membres.

## Validacio i aplicacio

Proves aillades del consum passades (dies complets, zeros, duplicats, nuls, mitjanes setmanals i unitats), mes consulta real a la base local. Comprovacio semantica TypeScript del modul sense emissio de fitxers: correcta.

No s’ha recompilat ni reiniciat la plataforma ni copiat el frontend al contenidor. Des de docker executar .\update-community-preview.ps1. Aquest script compila/recrea el backend i copia nomes els dos fitxers del component i les tres traduccions al volum de la preview existent. Despres obrir http://localhost:4200/energy-stats/community.
