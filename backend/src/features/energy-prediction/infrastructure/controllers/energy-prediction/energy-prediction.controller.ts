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
import { UserPredictionIntegrationService } from '../../services/user-prediction-integration.service';

@Controller('energy-prediction')
export class EnergyPredictionController {
  constructor(
    private energyForecastService: EnergyForecastService,
    private consumptionPrevisionService: ConsumptionPredictionService,
    private prisma: PrismaService,
    private calculator: CalculadoraIntegrationService,
    private localConsumption: LocalConsumptionService,
    private historicalPrediction: UserPredictionIntegrationService,
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
      if (!query.referenceDate) {
        const automatic = await this.historicalPrediction.predictProductionForCommunityWithFallback(id, UserPredictionIntegrationService.HISTORICAL_VALIDATION_MODE);
        const totals = new Map<string, number>();
        automatic.predictions.forEach(item => (item.prediction?.data || []).forEach((point: SolarForecastPoint) => {
          const day = point.time.slice(0, 10); totals.set(day, (totals.get(day) || 0) + point.value);
        }));
        const forecast = [...totals].map(([date, value]) => ({ time: `${date}T12:00:00`, value: Number(value.toFixed(2)) }));
        const actual = automatic.actual || [];
        const actualMap = new Map(actual.map((point: any) => [point.date, point.productionKwh]));
        const errors = forecast.map(point => point.value - (actualMap.get(point.time.slice(0, 10)) || 0));
        const mae = errors.length ? errors.reduce((sum, value) => sum + Math.abs(value), 0) / errors.length : null;
        const rmse = errors.length ? Math.sqrt(errors.reduce((sum, value) => sum + value * value, 0) / errors.length) : null;
        return HttpResponse.success('Historical community production prediction').withData({ mode: 'historical-validation', referenceDate: automatic.referenceDate, forecast, actual, mae, rmse });
      }
      const reference = query.referenceDate && moment.utc(query.referenceDate, 'YYYY-MM-DD', true).isValid()
        ? moment.utc(query.referenceDate).format('YYYY-MM-DD') : moment.tz('Europe/Madrid').format('YYYY-MM-DD');
      const start = moment.utc(reference).add(1, 'day').format('YYYY-MM-DD');
      const end = moment.utc(reference).add(7, 'days').format('YYYY-MM-DD');
      const predictions = await this.historicalPrediction.predictProductionForCommunity(id, start, end);
      const totals = new Map<string, number>();
      predictions.forEach(item => (item.prediction?.data || []).forEach((point: SolarForecastPoint) => {
        const day = point.time.slice(0, 10); totals.set(day, (totals.get(day) || 0) + point.value);
      }));
      const forecast = [...totals].map(([date, value]) => ({ date, productionKwh: Number(value.toFixed(2)) }));
      if (query.referenceDate) {
        const actual = await this.historicalPrediction.getActualCommunityProduction(id, start, end);
        const actualByDate = new Map(actual.map(point => [point.date, point.productionKwh]));
        const errors = forecast.map(point => (point.productionKwh - (actualByDate.get(point.date) || 0)));
        const mae = errors.length ? errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length : null;
        const rmse = errors.length ? Math.sqrt(errors.reduce((sum, error) => sum + error * error, 0) / errors.length) : null;
        return HttpResponse.success('Historical community production backtest').withData({ mode: 'historical-validation', referenceDate: reference, forecast, actual, mae, rmse, metrics: { mae, rmse } });
      }
      return HttpResponse.success('Historical community production prediction').withData(
        forecast.map(point => ({ time: `${point.date}T12:00:00`, value: point.productionKwh })));
    }

    let configurations;
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
    return HttpResponse.success('Prediction realized').withData(data);
  }
}
