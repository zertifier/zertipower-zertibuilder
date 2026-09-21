import { weatherForChart, weatherChartList } from './weather-chart-adapter';
import * as moment from 'moment-timezone';

describe('Open-Meteo chart compatibility', () => {
  it('maps weather codes to icons shipped with the existing portal', () => {
    expect(weatherForChart(0)).toMatchObject({ id: 800, icon: '01d' });
    expect(weatherForChart(95)).toMatchObject({ id: 211, icon: '11d' });
    expect(weatherForChart(75)).toMatchObject({ id: 602, icon: '13d' });
    expect(weatherForChart(null)).toBeNull();
    expect(weatherForChart(999)).toBeNull();
  });
  it('returns the list, date and weather fields the portal consumes', () => {
    const localMidnight = moment.tz('Europe/Madrid').startOf('day');
    const data: any = { hourly: { time: [localMidnight.clone().utc().format('YYYY-MM-DDTHH:mm')], weather_code: [61] } };
    const list = weatherChartList(data);
    expect(list).toHaveLength(1);
    expect(list[0].dt_txt).toBe(localMidnight.format('YYYY-MM-DD HH:mm:ss'));
    expect(list[0].weather[0].id).toBe(500);
  });
});
