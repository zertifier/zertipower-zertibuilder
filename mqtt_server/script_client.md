# Script client (Shelly)

1. Hbilitar el MQTT: `http://ip-shelly/#/settings/mqtt`

2. Crear el script: `http://ip-shelly/#/scripts`

```js
// Send data every 1 min
let notifyTimer = Timer.set(
   60000,
   true,
   function() {
     MQTT.publish("custom-1min", JSON.stringify({
      hour: new Date(),
      current_consumption: Shelly.getComponentStatus("em1:0"),
      current_production: Shelly.getComponentStatus("em1:1"),
      accumulative_consumption: Shelly.getComponentStatus("em1data:0"),
      accumulative_production: Shelly.getComponentStatus("em1data:1"),
    }), 0, false);
   }
 );
```