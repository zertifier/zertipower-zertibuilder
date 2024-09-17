import { Controller, Get, Param, Query } from '@nestjs/common';
import { EnergyForecastService } from "../../services/energy-forecast.service";
import * as moment from "moment";
import { PrismaService } from "../../../../../shared/infrastructure/services";
import { PredictionPacket } from "./prediction-packet";
import { Predictor } from "./predictor";
import { HttpResponse } from "../../../../../shared/infrastructure/http/HttpResponse";
import { BadRequestError, InfrastructureError } from "../../../../../shared/domain/error/common";
import { AxiosError } from "axios";
import { ShareService } from "../../../../../shared/infrastructure/services/share/share.service";
import { ConsumptionPredictionService } from '../../services/consumption-prediction.service';
import { ErrorCode } from 'src/shared/domain/error';

@Controller('energy-prediction')
export class EnergyPredictionController {
  constructor(
    private energyForecastService: EnergyForecastService,
    private consumptionPrevisionService: ConsumptionPredictionService,
    private prisma: PrismaService,
  ) {
  }

  @Get('/community/:id/consumption')
  async getCommunityConsumptionPrediction(@Param("id") communityId: number, @Query("start_date") startDate: string, @Query("end_date") endDate: string) {
    try {
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
  async getPrediction(@Query("cups") cupsId: number, @Query("community") communityId: number) {
    const packets: Map<string, PredictionPacket> = new Map();

    let response: { production: number, infoDt: Date }[];
    if (cupsId) {
      response = await this.prisma.$queryRaw`select production, info_dt as infoDt from energy_hourly where cups_id = ${cupsId} AND production IS NOT NULL order by info_dt desc limit 192`;
    } else if (communityId) {
      response = await this.prisma.$queryRaw`select SUM(kwh_out) as production, info_dt as infoDt from energy_hourly eh left join cups on eh.cups_id = cups.id where cups.type = 'community' and community_id = ${communityId} and kwh_out IS NOT NULL group by info_dt order by info_dt desc LIMIT 200`;
    } else {
      throw new BadRequestError('must specify cups or community')
    }

    if(!response.length || !response[0]){
      return HttpResponse.failure('Cannot predict without data',ErrorCode.NOT_FOUND);
    }

    const now = response[0].infoDt;
    const ago = response[response.length - 1].infoDt;
    let historicRadiation;

    try {
      historicRadiation = await this.energyForecastService.getRadiation(ago, now);
      // console.log({historicRadiation});
    } catch (err) {
      if (err instanceof AxiosError) {
        console.log(err.response?.data);
      }
      throw new InfrastructureError('Error happened while getting historic radiation');
    }

    for (const { value, time } of historicRadiation) {
      const date = moment(time).format('YYYY-MM-DD HH:00');
      const packet = packets.get(date) || { radiation: 0, production: 0, coefficient: 0 };
      packet.radiation = value;
      packets.set(date, packet);
    }

    for (const item of response) {
      const date = moment(item.infoDt).format("YYYY-MM-DD HH:00");
      const packet = packets.get(date) || { radiation: 0, production: 0, coefficient: 0 };
      packet.production = item.production || 0;
      packets.set(date, packet);
    }

    // Calculate coefficients
    for (const [date, packet] of packets.entries()) {
      if (packet.radiation <= 50) {
        packet.production = 0;
        packet.radiation = 0;
        packet.coefficient = 0;
        packets.set(date, packet);
        continue;
      }

      packet.coefficient = packet.production / packet.radiation;
      packets.set(date, packet);
    }


    // Get radiation prediction
    const atThisMoment = moment(moment().format('YYYY-MM-DD 00:00')).toDate();
    const future = moment(moment(atThisMoment).add(1, "days").format('YYYY-MM-DD 23:59')).toDate();
    const radiationPrediction = await this.energyForecastService.getRadiationForecast(atThisMoment, future);

    const predictor = new Predictor(Array.from(packets.values()), [
      { from: 50, to: 250 },
      { from: 250, to: 500 },
      { from: 500, to: 750 },
      { from: 750, to: 1000 },
    ]);

    let data = radiationPrediction.map(v => {
      return { time: v.time, value: predictor.getPrediction(v.value) };
    });

    return HttpResponse.success('Prediction realized').withData(data);
  }
}
