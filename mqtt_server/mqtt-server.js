const aedes = require('aedes')();
const net = require('net');
const mysql = require('mysql2');

require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

function saveDataToMySQL(reference, isoDate, accumulative_consumption, accumulative_production, consumption, production, origin='Shelly') {
  const query = `
    INSERT INTO energy_realtime (origin, reference, info_dt, accumulative_consumption, accumulative_production, consumption, production, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const info_dt = isoDate.slice(0, 19).replace('T', ' ');

  db.execute(query, [origin, reference, info_dt, accumulative_consumption, accumulative_production, consumption, production], (err, result) => {
    if (err) {
      console.error(`Error saving data for sensor:`, err.message);
    } else {
      console.log(`${reference} -> data saved`);
      console.log("--------------------------")
    }
  });
}

// MQTT server
const PORT = 1883; // Default port for mqtt
const server = net.createServer(aedes.handle);

server.listen(PORT, () => {
  console.log(`MQTT server listening on port ${PORT}`);
});

aedes.on('client', (client) => {
  console.log(`Sensor connected: ${client.id}`);
});

aedes.on('publish', (packet, client) => {
  if (!client) {
    return
  }

  if (packet.topic === 'custom-1min') {

    let payloadJson;
    try {
      payloadJson = JSON.parse(packet.payload.toString());
    } catch (error) {
      return;
    }

    const reference = client.id;
    const isoDate = payloadJson.hour

    let consumption = payloadJson.current_consumption.act_power
    let production = payloadJson.current_production.act_power

    const accumulative_consumption = payloadJson.accumulative_consumption.total_act_energy 
    const accumulative_production = payloadJson.accumulative_production.total_act_energy

    if (consumption < 0) {
      consumption = 0;
      production += -consumption;
    }
    
    if (production < 0) {
      production = 0;
      consumption += -production;
    }

    console.log(`Data on ${isoDate}. Production: ${production} and Consumption: ${consumption}`)

    saveDataToMySQL(reference, isoDate, accumulative_consumption, accumulative_production, consumption, production, origin='Shelly');
  }
});

aedes.on('clientDisconnect', (client) => {
  console.log(`Client disconnected: ${client.id}`);
});
