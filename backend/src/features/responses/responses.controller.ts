import { Controller, Post, Get, Delete, Put, Body, Param } from '@nestjs/common';
import { HttpResponse } from 'src/shared/infrastructure/http/HttpResponse';
import { PrismaService } from 'src/shared/infrastructure/services/prisma-service/prisma-service';
import { MysqlService } from 'src/shared/infrastructure/services/mysql-service/mysql.service';
import { Datatable } from 'src/shared/infrastructure/services/datatable/Datatable';
import { SaveResponsesDTO } from './save-responses-dto';
import * as moment from 'moment';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/features/auth/infrastructure/decorators';

export const RESOURCE_NAME = 'responses';

@ApiTags(RESOURCE_NAME)
@Controller('responses')
export class ResponsesController {
  constructor(
    private prisma: PrismaService,
    private datatable: Datatable
  ) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.responses.findMany();
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('responses fetched successfully').withData(data);
  }

  @Get(':id')
  @Auth(RESOURCE_NAME)
  async getById(@Param('id') id: string) {
    const data = await this.prisma.responses.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('responses fetched successfully').withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveResponsesDTO) {
    const data = await this.prisma.responses.create({ data: body });
    return HttpResponse.success('responses saved successfully').withData(data);
  }

  @Put(':id')
  @Auth(RESOURCE_NAME)
  async update(@Param('id') id: string, @Body() body: SaveResponsesDTO) {
    const data = await this.prisma.responses.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body
    });
    return HttpResponse.success('responses updated successfully').withData(data);
  }

  @Delete(':id')
  @Auth(RESOURCE_NAME)
  async remove(@Param('id') id: string) {
    const data = await this.prisma.responses.delete({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('responses removed successfully').withData(data);
  }

  @Post('datatable')
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(body, `
      SELECT resp.id,
             resp.proposal_id,
             proposal_option_id,
             resp.user_id,
             email,
             po.option,
             proposals.proposal
      FROM responses resp
             LEFT JOIN users
                       ON resp.user_id = users.id
             LEFT JOIN proposals
                       ON resp.proposal_id = proposals.id
             LEFT JOIN proposals_options po
                       ON proposal_option_id = po.id`);
    return HttpResponse.success('Datatables fetched successfully').withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
      mappedData.proposalId = data.proposalId
      mappedData.proposalOptionId = data.proposalOptionId
      mappedData.userId = data.userId
    return mappedData;
  }
}
