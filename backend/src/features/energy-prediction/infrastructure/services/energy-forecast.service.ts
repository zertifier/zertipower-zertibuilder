import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as https from 'node:https';

@Injectable()
export class EnergyForecastService {
  private readonly apiUrl = 'https://ai.megatro.cat:9999/previsio';
  private readonly authCode = 'd3b07384-d113-40a4-a719-33829be31600';

  private httpClient = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });

  public async getRadiationForecast(from?: Date, to?: Date): Promise<{ value: number; time: Date }[]> {
    try {
      const startDate = from ? new Date(from) : new Date();
      const endDate = to ? new Date(to) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const queryParams = new URLSearchParams({
        latitud: '42.1833',
        longitud: '2.4833',
        kwp: '7.22',
        potencia_inversor_kw: '6',
        orientacio: 'sud-oest',
        graus: '30',
        performance_ratio: '0.8',
        preu_punta_eur_kwh: '0.18',
        preu_pla_eur_kwh: '0.12',
        preu_vall_eur_kwh: '0.08',
        data_inici: startDate.toISOString().split('T')[0],
        data_final: endDate.toISOString().split('T')[0],
      });

      const response = await this.httpClient.get(`${this.apiUrl}?${queryParams.toString()}`, {
        headers: { authcode: this.authCode },
      });

      const forecastList: { value: number; time: Date }[] = [];

      if (response.data && Array.isArray(response.data.dies)) {
        for (const dia of response.data.dies) {
          if (Array.isArray(dia.hores)) {
            for (const horaItem of dia.hores) {
              const kwh = horaItem.previsio_solar_kwh ?? 0;
              // Convertim el valor kWh a equivalent de radiació aproximada en W/m2 
              // que espera el calculador intern de Zertipower (factor ~200 W/m2 per kWh generat)
              const estimatedRadiation = kwh * 200;

              forecastList.push({
                value: estimatedRadiation > 0 ? estimatedRadiation : kwh,
                time: new Date(horaItem.data_hora),
              });
            }
          }
        }
      }

      return forecastList;
    } catch (error: any) {
      console.error('Error consultant API de previsió solar:', error?.response?.data || error.message);
      return [];
    }
  }

  public async getRadiation(from?: Date, to?: Date): Promise<{ value: number; time: Date }[]> {
    return this.getRadiationForecast(from, to);
  }
}