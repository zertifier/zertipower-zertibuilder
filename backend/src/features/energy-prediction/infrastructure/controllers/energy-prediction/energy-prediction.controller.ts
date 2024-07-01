import {Controller, Get, Query} from '@nestjs/common';
import {EnergyForecastService} from "../../services/energy-forecast.service";
import * as moment from "moment";
import {PrismaService} from "../../../../../shared/infrastructure/services";
import {PredictionPacket} from "./prediction-packet";
import {Predictor} from "./predictor";
import {HttpResponse} from "../../../../../shared/infrastructure/http/HttpResponse";
import {BadRequestError, InfrastructureError} from "../../../../../shared/domain/error/common";

@Controller('energy-prediction')
export class EnergyPredictionController {
  constructor(private energyForecastService: EnergyForecastService, private prisma: PrismaService) {
  }

  @Get()
  async getPrediction(@Query("cups") cupsId: number, @Query("community") communityId: number) {
    const packets: Map<string, PredictionPacket> = new Map();




    let response: {production: number, infoDt: Date}[];
    if (cupsId) {
      response = await this.prisma.$queryRaw`select production, info_dt as infoDt from energy_hourly where cups_id = ${cupsId} order by info_dt desc limit 192`;
    } else if(communityId) {
      response = await this.prisma.$queryRaw`select sum(production) as production, info_dt as infoDt from energy_hourly eh left join cups on eh.cups_id = cups.id where cups.type != 'community' and community_id = ${communityId} group by info_dt order by info_dt desc limit 192`;
    } else {
      throw new BadRequestError('must specify cups or community')
    }

    const now = response[0].infoDt;
    const ago = response[response.length - 1].infoDt;

    let historicRadiation;
    try {
      historicRadiation = await this.energyForecastService.getRadiation(ago, now);
    } catch (err) {
      throw new InfrastructureError('Error happened while getting historic radiation');
    }

    for (const {value, time} of historicRadiation) {
      const date = moment(time).format('YYYY-MM-DD HH:00');
      const packet = packets.get(date) || {radiation: 0, production: 0, coefficient: 0};
      packet.radiation = value;
      packets.set(date, packet);
    }

    for (const item of response) {
      const date = moment(item.infoDt).format("YYYY-MM-DD HH:00");
      const packet = packets.get(date) || {radiation: 0, production: 0, coefficient: 0};
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
    const atThisMoment = new Date();
    const future = moment(atThisMoment).add(2, "days").toDate();
    const radiationPrediction = await this.energyForecastService.getRadiationForecast(atThisMoment, future);

    const predictor = new Predictor(Array.from(packets.values()), [
      {from: 50, to: 250},
      {from: 250, to: 500},
      {from: 500, to: 750},
      {from: 750, to: 1000},
    ]);

    const data = radiationPrediction.map(v => {
      return {time: v.time, value: predictor.getPrediction(v.value)};
    });

    return HttpResponse.success('Prediction realized').withData(data);
  }
}
