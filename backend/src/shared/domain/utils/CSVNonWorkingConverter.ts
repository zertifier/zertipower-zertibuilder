import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import {ShareService} from "../../infrastructure/services/share/share.service"; // Import the path module

export class CSVNonWorkingConverter{

  static convertCsvNonWorking(){
    // Read the CSV file
    const filePath = path.resolve(__dirname, '../../../../backups');
    fs.readFile(`${filePath}/calendario.csv`, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return;
      }

      // Split the lines of the file
      const lines = data.split('\n');

      // CSV header
      // let header = lines[0];

      // Procesa las líneas
      const newData = lines.slice(1).map(line => {
        const [day, weekday, day_type, festive_type, festivity] = line.split(';');

        // Convierte la columna 'day' al formato deseado
        const formattedDay = moment(day, 'DD/MM/YYYY').format('YYYY/MM/DD');

        if ((day_type && festive_type && festive_type == 'Festivo nacional') || weekday == 'sabado' || weekday == 'sábado' || weekday == 'domingo')
          return `${formattedDay};`;
        else
          return
      }).filter(item => item);;

      // const headerArray = header.split(';')
      // header = `${headerArray[0]};${headerArray[1]};`
      // header = `${headerArray[0]};`

      // Combine the header and processed data
      // const result = ['date;', ...newData].join('\n');
      const result = [...newData].join('\n');

      // Save the result to a new CSV file
      fs.writeFile(`${filePath}/calendario2.csv`, result, 'utf8', (err) => {
        if (err) {
          console.error('Error writing the file:', err);
          return;
        }

        console.log('Dates have been formatted and saved to "nuevo_archivo.csv".');
      });
    });
  }

}
