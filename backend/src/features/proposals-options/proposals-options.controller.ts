import { Controller, Post, Get, Delete, Put, Body, Param } from '@nestjs/common';
import { HttpResponse } from 'src/shared/infrastructure/http/HttpResponse';
import { PrismaService } from 'src/shared/infrastructure/services/prisma-service/prisma-service';
import { MysqlService } from 'src/shared/infrastructure/services/mysql-service/mysql.service';
import { Datatable } from 'src/shared/infrastructure/services/datatable/Datatable';
import { SaveProposalsOptionsDTO } from './save-proposals-options-dto';
import * as moment from 'moment';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/features/auth/infrastructure/decorators';

export const RESOURCE_NAME = 'proposalsOptions';

@ApiTags(RESOURCE_NAME)
@Controller('proposals-options')
export class ProposalsOptionsController {
  constructor(
    private prisma: PrismaService,
    private datatable: Datatable
  ) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.proposalsOptions.findMany();
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('proposals_options fetched successfully').withData(data);
  }

  @Get(':id')
  @Auth(RESOURCE_NAME)
  async getById(@Param('id') id: string) {
    const data = await this.prisma.proposalsOptions.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('proposals_options fetched successfully').withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveProposalsOptionsDTO) {
    const data = await this.prisma.proposalsOptions.create({ data: body });
    return HttpResponse.success('proposals_options saved successfully').withData(data);
  }

  @Put(':id')
  @Auth(RESOURCE_NAME)
  async update(@Param('id') id: string, @Body() body: SaveProposalsOptionsDTO) {
    const data = await this.prisma.proposalsOptions.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body
    });
    return HttpResponse.success('proposals_options updated successfully').withData(data);
  }

  @Delete(':id')
  @Auth(RESOURCE_NAME)
  async remove(@Param('id') id: string) {
    const data = await this.prisma.proposalsOptions.delete({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('proposals_options removed successfully').withData(data);
  }

  @Post('datatable')
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(body, `SELECT id, proposal_id,option
                  FROM proposals_options`);
    return HttpResponse.success('Datatables fetched successfully').withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
      mappedData.proposalId = data.proposalId
      mappedData.option = data.option
    return mappedData;
  }
}
