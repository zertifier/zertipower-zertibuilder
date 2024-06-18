import {Controller, Get} from '@nestjs/common';
import {EnergyForecastService} from "../../services/energy-forecast.service";
import * as moment from "moment";
import {PrismaService} from "../../../../../shared/infrastructure/services";
import {PredictionPacket} from "./prediction-packet";
import {Predictor} from "./predictor";
import {HttpResponse} from "../../../../../shared/infrastructure/http/HttpResponse";

@Controller('energy-prediction')
export class EnergyPredictionController {
  constructor(private energyForecastService: EnergyForecastService, private prisma: PrismaService) {
  }

  @Get()
  async getPrediction() {
    const packets: Map<string, PredictionPacket> = new Map();

    // Get historic energy and radiation
    const now = new Date();
    const ago = moment(now).subtract(4, 'days').toDate();
    const historicRadiation = await this.energyForecastService.getRadiation(now, ago);
    for (const {value, time} of historicRadiation) {
      const date = moment(time).format('YYYY-MM-DD HH:00');
      const packet = packets.get(date) || {radiation: 0, production: 0, coefficient: 0};
      packet.radiation = value;
      packets.set(date, packet);
    }
    const response = await this.prisma.energyHourly.findMany({
      where: {
        infoDt: {
          gte: now,
          lt: ago,
        }
      }
    });
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

    const predictor = new Predictor(packets, [
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
