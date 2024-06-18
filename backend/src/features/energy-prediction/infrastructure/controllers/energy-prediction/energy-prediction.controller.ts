import {Controller, Get} from '@nestjs/common';
import {EnergyForecastService} from "../../services/energy-forecast.service";
import moment from "moment";

@Controller('energy-prediction')
export class EnergyPredictionController {
  constructor(private energyForecastService: EnergyForecastService) {
  }

  @Get()
  async getPrediction() {
    // Get historic energy and radiation
    const now = new Date();
    const ago = moment(now).subtract(1, 'week').toDate();
    const historicRadiation = await this.energyForecastService.getRadiation(now, ago);

    // Calculate coefficients
    // Get radiation prediction
    // Apply coefficient
    // return prediction
  }
}
