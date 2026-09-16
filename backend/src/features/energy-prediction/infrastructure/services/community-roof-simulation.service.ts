import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { RoofSimulationService } from './roof-simulation.service';
import { CommunityMemberRoofsService } from './community-member-roofs.service';

@Injectable()
export class CommunityRoofSimulationService {
  private readonly logger = new Logger(CommunityRoofSimulationService.name);
  constructor(private roofs: RoofSimulationService, private memberRoofs: CommunityMemberRoofsService) {}

  async simulate(communityId: number) {
    const { roofs, ...diagnostic } = await this.memberRoofs.getCalculatorRoofs(communityId);
    const window = this.roofs.forecastWindow();
    const totals = new Map<string, number>();
    let dates: string[] | undefined;
    const forecastCache = new Map<string, Awaited<ReturnType<RoofSimulationService['simulate']>>>();
    // Process every owned configuration. Serial requests avoid provider bursts without truncating members.
    for (const roof of roofs) {
      // Open-Meteo radiation is identical for roofs sharing the same plane in
      // the same 0.01° Montolivet grid cell. Keep tilt/azimuth in the key so
      // distinct calculator planes are never collapsed.
      const cacheKey = `${roof.tilt}:${roof.azimuth}:${roof.latitude.toFixed(2)}:${roof.longitude.toFixed(2)}`;
      let prediction = forecastCache.get(cacheKey);
      if (!prediction) {
        prediction = await this.roofs.simulate(roof, window);
        forecastCache.set(cacheKey, prediction);
      }
      const currentDates = prediction.daily.map(day => day.date);
      if (dates && (dates.length !== currentDates.length || dates.some((date, i) => date !== currentDates[i]))) {
        throw new BadGatewayException('Solar configurations returned different forecast days');
      }
      dates = currentDates;
      for (const day of prediction.daily) totals.set(day.date, (totals.get(day.date) ?? 0) + day.kwh);
    }
    const forecast = [...totals].map(([date, kwh]) => ({ time: `${date}T12:00:00`, value: Number(kwh.toFixed(2)) }));
    this.logger.log(JSON.stringify({ communityId, simulatedConfigurations: roofs.length, simulatedWeatherRequests: forecastCache.size, days: forecast.length,
      totalProductionKwh: forecast.reduce((sum, point) => sum + point.value, 0) }));
    return { ...diagnostic, roofs, roofsSimulated: roofs.length, forecast, source: 'Open-Meteo', model: 'calculator-gti-v1',
      status: roofs.length ? 'complete' : 'no-calculator-roofs' };
  }
}
