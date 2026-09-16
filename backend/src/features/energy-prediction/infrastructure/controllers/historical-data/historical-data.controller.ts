import { Controller, Get, Query, Param } from '@nestjs/common';
import { HistoricalDataExtractionService } from '../../services/historical-data-extraction.service';
import { HttpResponse } from '../../../../../shared/infrastructure/http/HttpResponse';
import { ErrorCode } from '../../../../../shared/domain/error';

@Controller('historical-data')
export class HistoricalDataController {
  constructor(
    private historicalDataExtractionService: HistoricalDataExtractionService,
  ) {}

  @Get('cups/:cupsId/production')
  async getCupsProductionData(
    @Param('cupsId') cupsId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    try {
      const data = await this.historicalDataExtractionService.getHistoricalProductionData(
        parseInt(cupsId),
        startDate,
        endDate,
      );
      return HttpResponse.success('Production data fetched successfully').withData(data);
    } catch (error) {
      return HttpResponse.failure('Error fetching production data', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Get('cups/:cupsId/production-with-weather')
  async getCupsProductionWithWeather(
    @Param('cupsId') cupsId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    try {
      const data = await this.historicalDataExtractionService.getHistoricalProductionWithWeather(
        parseInt(cupsId),
        startDate,
        endDate,
        parseFloat(lat),
        parseFloat(lng),
      );
      return HttpResponse.success('Production with weather data fetched successfully').withData(data);
    } catch (error) {
      return HttpResponse.failure('Error fetching production with weather data', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Get('community/:communityId/historical')
  async getCommunityHistoricalData(
    @Param('communityId') communityId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    try {
      const data = await this.historicalDataExtractionService.getCommunityHistoricalData(
        parseInt(communityId),
        startDate,
        endDate,
      );
      return HttpResponse.success('Community historical data fetched successfully').withData(data);
    } catch (error) {
      return HttpResponse.failure('Error fetching community historical data', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Get('cups/:cupsId/config')
  async getCupsSolarConfig(@Param('cupsId') cupsId: string) {
    try {
      const config = await this.historicalDataExtractionService.getSolarInstallationConfig(
        parseInt(cupsId),
      );
      if (!config) {
        return HttpResponse.failure('CUPS not found', ErrorCode.NOT_FOUND);
      }
      return HttpResponse.success('Solar config fetched successfully').withData(config);
    } catch (error) {
      return HttpResponse.failure('Error fetching solar config', ErrorCode.INTERNAL_ERROR);
    }
  }
}