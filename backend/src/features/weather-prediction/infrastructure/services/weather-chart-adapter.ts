import * as moment from 'moment-timezone';
import { OpenMeteoResponse } from './weather-prediction.service';

// Compatibility for the existing chart; source data remains Open-Meteo.
// WMO meanings: https://open-meteo.com/en/docs#weathervariables
export function weatherForChart(code: number | null | undefined) {
  const codes: Record<number, [number, string, string]> = {
    0: [800, 'Clear', '01d'], 1: [801, 'Clouds', '02d'],
    2: [802, 'Clouds', '03d'], 3: [804, 'Clouds', '04d'],
    45: [741, 'Fog', '50d'], 48: [741, 'Fog', '50d'],
    51: [300, 'Drizzle', '09d'], 53: [301, 'Drizzle', '09d'], 55: [302, 'Drizzle', '09d'],
    56: [511, 'Freezing drizzle', '13d'], 57: [511, 'Freezing drizzle', '13d'],
    61: [500, 'Rain', '10d'], 63: [501, 'Rain', '10d'], 65: [502, 'Rain', '10d'],
    66: [511, 'Freezing rain', '13d'], 67: [511, 'Freezing rain', '13d'],
    71: [600, 'Snow', '13d'], 73: [601, 'Snow', '13d'], 75: [602, 'Snow', '13d'],
    77: [600, 'Snow grains', '13d'], 80: [520, 'Rain', '09d'],
    81: [521, 'Rain', '09d'], 82: [522, 'Rain', '09d'],
    85: [621, 'Snow', '13d'], 86: [622, 'Snow', '13d'],
    95: [211, 'Thunderstorm', '11d'], 96: [212, 'Thunderstorm', '11d'], 99: [212, 'Thunderstorm', '11d'],
  };
  const entry = code == null ? undefined : codes[code];
  if (!entry) return null; // Missing codes must not be shown as clear skies.
  return { id: entry[0], main: entry[1], description: entry[1], icon: entry[2] };
}

export function weatherChartList(data: OpenMeteoResponse) {
  const start = moment.tz('Europe/Madrid').format('YYYY-MM-DD');
  const end = moment.tz('Europe/Madrid').add(6, 'days').format('YYYY-MM-DD');
  return data.hourly.time.flatMap((time, index) => {
    const weather = weatherForChart(data.hourly.weather_code[index]);
    const date = moment.utc(time).tz('Europe/Madrid');
    const day = date.format('YYYY-MM-DD');
    if (!weather || !date.isValid() || day < start || day > end) return [];
    return [{ dt: date.unix(), dt_txt: date.format('YYYY-MM-DD HH:mm:ss'), weather: [weather] }];
  });
}
