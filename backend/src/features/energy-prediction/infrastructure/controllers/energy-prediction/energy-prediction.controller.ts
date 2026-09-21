import { LocalConsumptionService } from '../../services/local-consumption.service';
import { CalculadoraIntegrationService } from '../../services/calculadora-integration.service';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { EnergyForecastService, SolarForecastPoint } from "../../services/energy-forecast.service";
import * as moment from "moment-timezone";
import { PrismaService } from "../../../../../shared/infrastructure/services";
import { HttpResponse } from "../../../../../shared/infrastructure/http/HttpResponse";
import { BadRequestError, InfrastructureError } from "../../../../../shared/domain/error/common";
import { ConsumptionPredictionService } from '../../services/consumption-prediction.service';
import { ErrorCode } from 'src/shared/domain/error';
import { CommunityPredictionService } from '../../services/community-prediction.service';
import { HistoricalMeterPredictionService } from '../../services/historical-meter-prediction.service';

@Controller('energy-prediction')
export class EnergyPredictionController {
  constructor(
    private energyForecastService: EnergyForecastService,
    private consumptionPrevisionService: ConsumptionPredictionService,
    private prisma: PrismaService,
    private calculator: CalculadoraIntegrationService,
    private localConsumption: LocalConsumptionService,
    private communityPrediction: CommunityPredictionService,
    private historicalMeterPrediction: HistoricalMeterPredictionService,
  ) {
  }

  @Get('/community/:id/consumption')
  async getCommunityConsumptionPrediction(@Param("id") communityId: number, @Query("start_date") startDate: string, @Query("end_date") endDate: string) {
    try {
      if (process.env.CONSUMPTION_LOCAL_TEST_COMMUNITY_ID === String(communityId)) {
        return HttpResponse.success('Local historical community consumption estimate').withData(
          await this.localConsumption.community(Number(communityId), startDate, endDate));
      }
      let predictionResponse = await this.consumptionPrevisionService.getCommunityConsumption(communityId, startDate, endDate)
      return HttpResponse.success('Prediction realized').withData(predictionResponse);
    } catch (err) {
      return HttpResponse.failure('Error happened while getting consumption prediction', ErrorCode.INTERNAL_ERROR)
    }
  }

  @Get('/cups/:id/consumption')
  async getCupsConsumptionPrediction(@Param("id") cupsId: number, @Query("start_date") startDate: string, @Query("end_date") endDate: string) {
    try {
      let predictionResponse = await this.consumptionPrevisionService.getCupsConsumption(cupsId, startDate, endDate)
      return HttpResponse.success('Prediction realized').withData(predictionResponse);
    } catch (err) {
      return HttpResponse.failure('Error happened while getting consumption prediction', ErrorCode.INTERNAL_ERROR)
    }
  }

  @Get()
  async getPrediction(@Query() query: { cups?: string; community?: string; referenceDate?: string }) {
    // Read the whole query: Nest's primitive conversion can turn a missing number into NaN.
    const { cups: cupsId, community: communityId } = query;
    if ((cupsId !== undefined) === (communityId !== undefined)) {
      throw new BadRequestError('Specify exactly one of cups or community');
    }
    const rawId = cupsId ?? communityId;
    if (typeof rawId !== 'string' || !/^[1-9]\d*$/.test(rawId)) {
      throw new BadRequestError('Invalid CUPS or community ID');
    }
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new BadRequestError('Invalid CUPS or community ID');

    if (communityId !== undefined) {
      return HttpResponse.success('Selected community roof production prediction').withData(
        await this.communityPrediction.predict(id));
    }

    // Individual meter prediction is a historical time-series operation. It
    // deliberately does not read calculator roofs, PV geometry or Open-Meteo.
    const meterResult = await this.historicalMeterPrediction.predict(id, query.referenceDate);
    return HttpResponse.success('Historical meter prediction').withData(
      query.referenceDate ? meterResult : meterResult.data,
    );
    /* let configurations;
    if (communityId === undefined) {
      const config = await this.calculator.getSolarConfigFromCalculadora(id);
      if (!config) return HttpResponse.failure('CUPS not found', ErrorCode.NOT_FOUND);
      configurations = [{ latitud: config.lat, longitud: config.lng, kwp: config.kwp,
        potencia_inversor_kw: config.potencia_inversor_kw, graus: config.inclination,
        performance_ratio: config.performance_ratio, azimut: config.orientation }];
    }
    if (!configurations || configurations.length === 0) throw new BadRequestError('No production configurations found');
    const today = moment.tz('Europe/Madrid').startOf('day');
    const startDate = today.format('YYYY-MM-DD');
    const endDate = today.clone().add(6, 'days').format('YYYY-MM-DD');
    const forecasts: SolarForecastPoint[][] = [];
    for (const configuration of configurations) {
      forecasts.push(await this.energyForecastService.getProductionForecast(configuration, startDate, endDate));
    }
    const totals = new Map<string, number>();
    const first = forecasts[0];
    for (const forecast of forecasts) {
      if (forecast.length !== first.length || forecast.some((point, index) => point.time !== first[index].time)) {
        throw new InfrastructureError('Solar installations returned different forecast hours');
      }
      for (const point of forecast) {
        totals.set(point.time, (totals.get(point.time) ?? 0) + point.value);
      }
    }
    const data = Array.from(totals, ([time, value]) => ({ time, value }));
    return HttpResponse.success('Prediction realized').withData(data); */
  }

  @Get('/community/:id/historical-meter-production')
  async getHistoricalCommunityMeterProduction(@Param('id') communityId: number, @Query('referenceDate') referenceDate?: string) {
    const result = await this.historicalMeterPrediction.predictCommunity(Number(communityId), referenceDate);
    return HttpResponse.success('Historical meter community prediction').withData(result);
  }
}
