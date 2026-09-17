import { CalculatorCommunitySelectionsService, CalculatorSelection } from '../services/calculator-community-selections.service';
import { CalculatorConsumptionService } from '../services/calculator-consumption.service';
import { CommunityPredictionService } from '../services/community-prediction.service';
import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RoofInput, RoofSimulationService } from '../services/roof-simulation.service';
import { HttpResponse } from '../../../../shared/infrastructure/http/HttpResponse';
import { CommunityRoofRecord, CommunitySolarRoofStoreService } from '../services/community-solar-roof-store.service';
import { CommunityRoofSimulationService } from '../services/community-roof-simulation.service';
import { AccessTokenGuard, DecodedToken } from '../../../auth/infrastructure/guards/access-token-guard/access-token-guard';
import { UserAccessToken } from '../../../auth/domain/tokens/UserAccessToken';

@Controller('roof-simulation')
export class RoofSimulationController {
  constructor(private simulation: RoofSimulationService, private communityRoofs: CommunitySolarRoofStoreService,
    private communitySimulation: CommunityRoofSimulationService, private selections: CalculatorCommunitySelectionsService,
    private consumption: CalculatorConsumptionService, private prediction: CommunityPredictionService) {}

  @Get('calculator-consumption')
  async calculatorConsumption(@Query('community') community:string,@Query('cups') cups?:string) {
    return HttpResponse.success('Calculator consumption source').withData(await this.consumption.get(Number(community),cups?Number(cups):undefined));
  }
  @Get('community-selections')
  async selected(@Query('community') community:string) {
    return HttpResponse.success('Selected calculator areas').withData(await this.selections.list(Number(community)));
  }
  @Post('community-selections')
  async select(@Body() input:CalculatorSelection) {
    return HttpResponse.success('Calculator area selected for community simulation').withData(await this.selections.save(input));
  }
  @Delete('community-selections')
  async unselect(@Query('community') community:string,@Query('area') area:string) {
    await this.selections.remove(Number(community),Number(area));
    return HttpResponse.success('Calculator area removed from simulation');
  }
  @Get('community-production-details')
  async productionDetails(@Query('community') community:string) {
    return HttpResponse.success('Selected roof production details').withData(await this.prediction.details(Number(community)));
  }

  @Post()
  async simulate(@Body() input: RoofInput) {
    return HttpResponse.success('Calculator solar simulation').withData(await this.simulation.simulate(input));
  }

  @Get('community')
  async simulateCommunity(@Query('community') community: string) {
    return HttpResponse.success('Community solar simulation').withData(await this.communitySimulation.simulate(Number(community)));
  }

  @Post('community-roof')
  @UseGuards(AccessTokenGuard)
  async saveCommunityRoof(@Body() input: CommunityRoofRecord, @DecodedToken() token: UserAccessToken) {
    return HttpResponse.success('Member solar configuration saved').withData(await this.communityRoofs.save(input, token.user.id!));
  }

  @Get('community-roofs')
  @UseGuards(AccessTokenGuard)
  async listCommunityRoofs(@Query('community') community: string, @DecodedToken() token: UserAccessToken) {
    const customerId = await this.communityRoofs.customerForUser(token.user.id!, Number(community));
    const roofs = await this.communityRoofs.list(Number(community));
    return HttpResponse.success('Own solar configurations').withData(roofs.filter(roof => roof.customerId === customerId));
  }

  @Delete('community-roof')
  @UseGuards(AccessTokenGuard)
  async deleteCommunityRoof(@Query('community') community: string, @Query('reference') reference: string,
    @DecodedToken() token: UserAccessToken) {
    await this.communityRoofs.remove(Number(community), reference, token.user.id!);
    return HttpResponse.success('Member solar configuration removed');
  }
}
