import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { CalculadoraIntegrationService } from '../../services/calculadora-integration.service';
import { HttpResponse } from '../../../../../shared/infrastructure/http/HttpResponse';
import { ErrorCode } from '../../../../../shared/domain/error';

@Controller('calculadora-sync')
export class CalculadoraSyncController {
  constructor(
    private calculadoraIntegration: CalculadoraIntegrationService,
  ) {}

  @Get('cups/:cupsId/config')
  async getCupsConfigFromCalculadora(@Param('cupsId') cupsId: string) {
    try {
      const config = await this.calculadoraIntegration.getSolarConfigFromCalculadora(
        parseInt(cupsId),
      );
      if (!config) {
        return HttpResponse.failure('Configuration not found for this CUPS', ErrorCode.NOT_FOUND);
      }
      return HttpResponse.success('Config fetched from calculadora successfully').withData(config);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error fetching config from calculadora', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Post('sync/all')
  async syncAllCups(@Query('communityId') communityId?: string) {
    try {
      const configs = await this.calculadoraIntegration.syncAllCupsWithCalculadora(
        communityId ? parseInt(communityId) : undefined,
      );
      return HttpResponse.success('All CUPS synced with calculadora successfully').withData({
        total: configs.length,
        configs,
      });
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error syncing CUPS with calculadora', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Post('sync/community/:communityId')
  async syncCommunityCups(@Param('communityId') communityId: string) {
    try {
      const configs = await this.calculadoraIntegration.syncAllCupsWithCalculadora(
        parseInt(communityId),
      );
      return HttpResponse.success('Community CUPS synced with calculadora successfully').withData({
        communityId: parseInt(communityId),
        total: configs.length,
        configs,
      });
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error syncing community CUPS with calculadora', ErrorCode.INTERNAL_ERROR);
    }
  }
}