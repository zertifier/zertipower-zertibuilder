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
    private communitySimulation: CommunityRoofSimulationService) {}

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
