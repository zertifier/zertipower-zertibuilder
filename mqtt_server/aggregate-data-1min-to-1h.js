const cron = require('node-cron');
const mysql = require('mysql2');

require('dotenv').config();

// Crear una conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  timezone: 'Z'
});

function getDateIntervalForPreviousHour(now, hour) {

  let startHourISO = new Date(now);
  let endHourISO = new Date(now);

  if (hour === 0) {
    // The day before from 23:00 to 23:59
    startHourISO.setUTCDate(now.getUTCDate() - 1);
    startHourISO.setUTCHours(23, 0, 0, 0); 
    
    endHourISO.setUTCDate(now.getUTCDate() - 1); 
    endHourISO.setUTCHours(23, 59, 59, 999); 
    
    return  { startHourISO, endHourISO }
  }

  // Interval before from xx:00 to xx:59 (if cron executes at 18:05 -> interval: from 17:00 to 17:59 )
  startHourISO.setUTCDate(now.getUTCDate());
  startHourISO.setUTCHours(hour -1, 0, 0, 0);
  
  endHourISO.setUTCDate(now.getUTCDate());  
  endHourISO.setUTCHours(hour -1, 59, 59, 999); 

  return  { startHourISO, endHourISO }

}

const getEnergyRealtimeData = (connection, startHour, endHour) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'SELECT * FROM energy_realtime WHERE info_dt BETWEEN ? AND ? ORDER BY info_dt ASC',
      [startHour, endHour],
      (err, results) => {
        if (err) {
          reject('Error en la consulta: ' + err.stack);
        } else {
          resolve(results);
        }
      }
    );
  });
};

const getLastHourSaved = (connection) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'SELECT * from datadis_energy_registers WHERE cups_id = ? ORDER BY info_dt DESC LIMIT 1',
      [6566],
      (err, results) => {
        if (err) {
          reject('Error en la consulta: ' + err.stack);
        } else {
          resolve(results);
        }
      }
    );
  });
}

const saveAggregationHourData = (connection, info_dt, consumption, production, lectures) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO datadis_energy_registers (info_dt, cups_id, transaction_id, import, export, tx_import, tx_export, battery, updates_counter, updates_historic, smart_contracts_version, created_at, updated_at, lectures) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)',
      [info_dt, 6566, null, consumption, production, null, null, null, null, null, null, lectures],
      (err, results) => {
        if (err) {
          console.error('Error en la consulta: ', err); // Mejor mostrar el error en la consola para facilitar la depuración.
          reject('Error en la consulta: ' + err.stack); // Rechazar la promesa con el error.
        } else {
          resolve(results); // Resolver la promesa si la consulta es exitosa.
        }
      }
    );
  });
};

async function aggregateData(connection, flag) {

  // Obtenir l'hora i els minuts en UTC
  const now = new Date()
  const hour = now.getUTCHours() + 1;  // Hora en UTC (0-23)

  if (hour < 0 || hour > 23) {
    return;
  }

  const { startHourISO, endHourISO } = getDateIntervalForPreviousHour(now, hour)

  const startHour = new Date(startHourISO).toISOString().slice(0, 19).replace('T', ' ');
  const endHour = new Date(endHourISO).toISOString().slice(0, 19).replace('T', ' ');

  let results
  try {
    results = await getEnergyRealtimeData(connection, startHour, endHour);
  } catch (error) {
    throw new Error('Error getting energy real time data')
  }

  const firstRegisterMinute = results[0].info_dt.getUTCMinutes();
  const lastRegisterMinute = results[results.length - 1].info_dt.getUTCMinutes();

  if (firstRegisterMinute !== 0 || lastRegisterMinute !== 59) {
    // No tenim la hora completa
    return { flag: true }
  }

  // Fer aquest bloc normal

  const firstRegister = results[0];
  const lastRegister = results[results.length - 1];

  const intervalConsumption = (Number(lastRegister.accumulative_consumption) - Number(firstRegister.accumulative_consumption)) / 1000 // From W to Kw
  const intervalProduction = (Number(lastRegister.accumulative_production) - Number(firstRegister.accumulative_production)) / 1000
  const inserDate = new Date(now.setUTCMinutes(hour -1, 0, 0))

  // Insert amb aquestes dades. Si mirem les hores de 20:00 - 20:59 és la hora 21:00:00
  try {
    await saveAggregationHourData(connection, inserDate, intervalConsumption, intervalProduction, 60);
  } catch (error) {
    throw new Error('Error saving aggregtion hour data')
  }

  if (!flag) {    
    return { flag: false }
  }

  // Mirar com repartim la energia. Mirar a datadis_energy_registers l'últim que en té:

  try {
    results = await getLastHourSaved(connection);
  } catch (error) {
    throw new Error('Error getting last hour saved data')
  }

  const lostHourSavedStartISO = lastRegister.info_dt
  lostHourSavedStartISO.setMinutes(59);
  lostHourSavedStartISO.setSeconds(59)
  lostHourSavedStartISO.setMilliseconds(999);

  const lostHourSavedEndISO = new Date(results[0].info_dt);
  lostHourSavedEndISO.setHours(lostHourSavedEndISO.getHours() - 1);
  lostHourSavedEndISO.setMinutes(59);
  lostHourSavedEndISO.setSeconds(59);
  lostHourSavedEndISO.setMilliseconds(999);

  // Select de realtime_energy where dins del interval
  const lostHourSavedStart = new Date(lostHourSavedStartISO).toISOString().slice(0, 19).replace('T', ' ');
  const lostHourSavedEnd = new Date(lostHourSavedEndISO).toISOString().slice(0, 19).replace('T', ' ');

  try {
    results = await getEnergyRealtimeData(connection, lostHourSavedStart, lostHourSavedEnd);
  } catch (error) {
    throw new Error('Error getting energy real time data for lost hours')
  }

  // Pillar el max i el min i fer l'interval
  const first = results[0];
  const last = results[results.length - 1];

  const lostIntervalConsumption = (Number(last.accumulative_consumption) - Number(first.accumulative_consumption)) / 1000
  const lostIntervalProduction = (Number(last.accumulative_production) - Number(first.accumulative_production)) / 1000

  // Mirar quantes hores hi ha pel mig i fer la divisió (repartir la energia)
  const hoursMissedStart = first.info_dt.getUTCHours()
  const hoursMissedEnd = last.info_dt.getUTCHours() + 1
  const hoursMissed = hoursMissedEnd - hoursMissedStart

  const avgConsumption = lostIntervalConsumption / hoursMissed
  const avgProduction = lostIntervalProduction / hoursMissed

  // Fer insert a la taula hourly amb la energia repertida per cada hora (registers = 0)
  let today = new Date();

  for (let i = hoursMissedStart + 1; i <= hoursMissedEnd; i++) {
    let adjustedTime = new Date(today.setUTCHours(i, 0, 0, 0));
    const dateForDb = new Date(adjustedTime).toISOString().slice(0, 19).replace('T', ' ');
    await saveAggregationHourData(connection, dateForDb, avgConsumption, avgProduction, 0);
  }
  
  return { flag: false }
}

let externalflag = false

setInterval(() => {
  try {
    connection.connect((err) => {
      if (err) throw new Error('Error connecting to db: ' + err.stack);
    });
    
    const { flag } = aggregateData(connection, externalflag)
    externalflag = flag

  } catch (error) {
    console.error(error.message);
    
  } finally {
    // connection.end();
  }

}, 60 * 60 * 1000);