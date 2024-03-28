import { Controller, Post, Get, Delete, Put, Body, Param } from '@nestjs/common';
import { HttpResponse } from 'src/shared/infrastructure/http/HttpResponse';
import { PrismaService } from 'src/shared/infrastructure/services/prisma-service/prisma-service';
import { MysqlService } from 'src/shared/infrastructure/services/mysql-service/mysql.service';
import { Datatable } from 'src/shared/infrastructure/services/datatable/Datatable';
import { SaveProposalsDTO } from './save-proposals-dto';
import * as moment from 'moment';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/features/auth/infrastructure/decorators';

export const RESOURCE_NAME = 'proposals';

@ApiTags(RESOURCE_NAME)
@Controller('proposals')
export class ProposalsController {
  constructor(
    private prisma: PrismaService,
    private datatable: Datatable
  ) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.proposals.findMany();
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('proposals fetched successfully').withData(data);
  }

  @Get(':id')
  @Auth(RESOURCE_NAME)
  async getById(@Param('id') id: string) {
    const data = await this.prisma.proposals.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('proposals fetched successfully').withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveProposalsDTO) {
    const data = await this.prisma.proposals.create({ data: body });
    return HttpResponse.success('proposals saved successfully').withData(data);
  }

  @Put(':id')
  @Auth(RESOURCE_NAME)
  async update(@Param('id') id: string, @Body() body: SaveProposalsDTO) {
    const data = await this.prisma.proposals.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body
    });
    return HttpResponse.success('proposals updated successfully').withData(data);
  }

  @Delete(':id')
  @Auth(RESOURCE_NAME)
  async remove(@Param('id') id: string) {
    const data = await this.prisma.proposals.delete({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('proposals removed successfully').withData(data);
  }

  @Post('datatable')
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(body, `SELECT id, proposal,description,community_id,expiration_dt,status,dao_id
                  FROM proposals`);
    return HttpResponse.success('Datatables fetched successfully').withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
      mappedData.proposal = data.proposal
      mappedData.description = data.description
      mappedData.communityId = data.communityId
      mappedData.expirationDt = data.expirationDt
      mappedData.status = data.status
      mappedData.daoId = data.daoId
    return mappedData;
  }
}
