## Pasos para ejecutar el servidor

1. **Clonar el repositorio**  
  ```bash
  git clone https://github.com/zertifier/mqtt-testing.git
  ```

2. **Instalar depencencias**
```bash
npm intall
```

3. **Arrancar servidor**
```bash
node server.js
```

4. **Cra el archivo .env**
   
Para la conexión con la base de datos.

5. **Configurar el shelly**
   
Poner la ip de nuestro servidor/pc a la configuración mqtt del shelly para que envie los datos correctamente y configurar el script para que envie los datos cada minuto.

6. **Ejecutar el cron**

Para traspasar en minutos a horas.

```txt
┌────────────── minuto (0 - 59)
│ ┌──────────── hora (0 - 23)
│ │ ┌────────── día del mes (1 - 31)
│ │ │ ┌──────── mes (1 - 12)
│ │ │ │ ┌────── día de la semana (0 - 7) (0 o 7 son domingo)
│ │ │ │ │
│ │ │ │ │
* * * * *
```
