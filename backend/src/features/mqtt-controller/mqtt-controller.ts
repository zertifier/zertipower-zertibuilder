import * as mqtt from "mqtt";
import * as moment from "moment/moment";
import mysql from "mysql2/promise";
import { MysqlService } from "../../shared/infrastructure/services";

let mqttData: any[] = [];
let client: mqtt.MqttClient;
let conn: mysql.Pool;

export function setupMqttConnection() {
  client = mqtt.connect("mqtt://prosumtest.ddns.net", {
    port: 1883,
    username: "root",
    password: "admin"
  });

  client.on("connect", () => {
    client.subscribe("produccio_corts", (err: any) => {
      if (!err) {
        console.log("Suscripción exitosa a produccio_corts");
      } else {
        console.error("Error al suscribirse al topic:", err);
      }
    });
  });

  // Maneja mensajes recibidos en el topic
  client.on("message", (receivedTopic: any, message: any, data: any) => {
      //console.log(`Mensaje recibido en el topic ${receivedTopic}: ${message.toString()}`);
      //let payload = JSON.parse(data.payload)
      //console.log("payload", payload);
      const messageObj: Mqtt = JSON.parse(message);

    //console.log("messageObj",messageObj);

      //console.log("message:",messageObj);
      const energiaHores: EnergiaHores = messageObj.energiaHores;

      let userHoursEnergy:any[] = [];

      energiaHores.energiaTotalWh.map((energiaTotal, index) => {
        const hourEnergy = energiaHores.hora[index];
        const year = Math.floor(hourEnergy / 1000000);
        const month = Math.floor((hourEnergy % 1000000) / 10000);
        const day = Math.floor((hourEnergy % 10000) / 100);
        const hour = hourEnergy % 100;

        const energyDate = moment.utc({
          year: year,
          month: month - 1, // Meses en moment.js van de 0 a 11
          date: day,
          hour: hour,
          minute: 0,
          second: 0,
          millisecond: 0
        });

        let formattedDate = energyDate.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
        //console.log(formattedDate);
        //console.log("total, usuario y hora: ",energiaTotal,energiaHores.energiaUsuariWh[index],formattedDate);

        if(energiaHores.energiaUsuariWh[index]>0){
          userHoursEnergy.push({ datehour: formattedDate, energyWh: energiaHores.energiaUsuariWh[index] });
        }

      });

      const userDataHour = {
        userId: messageObj.idUsuari,
        coeficient: messageObj.coeficient,
        energiaHores: userHoursEnergy
      };

      //if user id es el mismo, entonces se mira energiaHores.
      //if energiaHores es igual que el ultimo elemento con ese id de mqttData, entonces no hay nuevos datos
      //en caso contrario, se añade a la lista.

    if(mqttData.length){
      if(userDataHour.energiaHores.length==mqttData[mqttData.length-1].energiaHores.length){
        //console.log("son iguales");
      } else {
        mqttData.push(userDataHour)
        //console.log("son diferentes");
      }
    } else {
      mqttData.push(userDataHour)
    }




    }
  );
}

setInterval(async () => {
  //Todo: revisar la lista mqttData y comprobar si se han hecho las inserciones a base de datos
  //hacer petición a base de datos y mirar si las horas están

  let cupsId;
  let dateInit;
  let dateEnd;

  if(mqttData.length>0) {
    mqttData.map(async (data: any) => {

      cupsId = data.userId;
      dateInit = data.energiaHores[1];
      dateEnd = data.energiaHores[data.energiaHores.length - 1];

      //sql question last records
      //let [ROWS] = await conn.query(`SELECT * from energy_registers_original_hourly WHERE cups_id=? AND info_dt BETWEEN ? AND ?`, [cupsId, dateInit, dateEnd])
    })
  }

  //console.log("mqtt data: ",JSON.stringify(mqttData));
  //console.log("");
}, 60000);

interface Mqtt {
  idUsuari: number;
  coeficient: number;
  potenciaTotalW: number;
  potenciaUsuariKWn: number;
  potenciaUsuariW: number;
  energiaHores: EnergiaHores;
  energiaDiaTotal: number;
  energiaDiaUsuari: number;
  energiaMesos: EnergiaMesos;
  infoTecnica: InfoTecnica;
}

interface EnergiaHores {
  energiaTotalWh: number[];
  energiaUsuariWh: number[];
  hora: number[];
}

interface EnergiaMesos {
  energiaTotalkWh: number[];
  energiaUsuarikWh: number[];
  mes: number[];
}

interface InfoTecnica {
  v1: number;
  v2: number;
  v3: number;
  i1: number;
  i2: number;
  i3: number;
}


