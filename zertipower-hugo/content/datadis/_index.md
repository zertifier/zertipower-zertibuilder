+++
title = 'Datadis'
date = 2024-03-27T11:09:44+01:00
draft = true
weight = 4
+++

### Requisits per obtenir les dades de Datadis

Per obtenir les dades d'un Datadis és necessari tenir un usuari registrat. 

la petició per obtenir la autorització per obenir les dades es aquesta

https://datadis.es/nikola-auth/tokens/login

la petició de login espera un usuari i contrasenya al seu cos.

 ![postman-datadis-login.PNG](postman-datadis-login.PNG)

Amb aquesta autorització podem demanar les dades generals del client amb petició 'get-supplies'.

https://datadis.es/api-private/api/get-supplies

'get-supplies' ens dona la informació necessària per obtenir els consums dels cups associats amb el compte. 
El paràmetre opcional 'authorizedNif' pot utilitzar-se per obtenir els suministraments dels comptes autoritzats.

 ![postman-datadis-supplies.PNG](postman-datadis-supplies.PNG)

La següent petició és per obtenir els consums: 

https://datadis.es/api-private/api/get-consumption-data

Els paràmetres per obtenir els consums son els següents: 
cups, meassurementType, pointType, distributorCode, startDate, endDate i authorizedNif (opcional)

![postman-datadis-consumptions.PNG](postman-datadis-consumptions.PNG)
![postman-datadis-consumptions-response.PNG](postman-datadis-consumptions-response.PNG)

Per consultar més informació sobre el API: https://datadis.es/private-api

<!-- https://datadis.es/api-private/api/get-supplies

https://datadis.es/api-private/api/get-supplies?authorizedNif=43631879M

https://datadis.es/api-private/api/get-consumption-data?cups=ES0031446428360001HM0F&distributorCode=2&startDate=2024/01&endDate=2024/03&measurementType=0&pointType=5&authorizedNif=77921261K  -->