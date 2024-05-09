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
    // const data = await this.prisma.proposals.findMany();
    const data: any = await this.prisma.$queryRaw`
      SELECT pr.*, users.email, users.wallet_address, users.firstname FROM proposals pr LEFT JOIN users ON user_id = users.id ORDER BY pr.created_at DESC
    `;
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('proposals fetched successfully').withData(mappedData);
  }
  @Get('/filter/:word')
  @Auth(RESOURCE_NAME)
  async getByFilter(@Param('word') word: string) {
    console.log(`SELECT pr.*, users.email, users.wallet_address, users.firstname
      FROM proposals pr
             LEFT JOIN users ON user_id = users.id
      WHERE pr.proposal LIKE CONCAT('%', ${word}, '%')
      ORDER BY pr.created_at DESC`)
    console.log(word, "WORD")

    const data: any = await this.prisma.$queryRaw`
      SELECT pr.*, users.email, users.wallet_address, users.firstname
      FROM proposals pr
             LEFT JOIN users ON user_id = users.id
      WHERE pr.proposal LIKE CONCAT('%', ${word}, '%')
      ORDER BY pr.created_at DESC
    `;
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('proposals fetched successfully').withData(mappedData);
  }
  @Get('/filter/:word/status/:status')
  @Auth(RESOURCE_NAME)
  async getByFilterAndStatus(@Param('word') word: string, @Param('status') status: string) {
    const data: any = await this.prisma.$queryRaw`
      SELECT pr.*, users.email, users.wallet_address, users.firstname
      FROM proposals pr
             LEFT JOIN users ON user_id = users.id
      WHERE pr.proposal LIKE CONCAT('%', ${word}, '%')
      AND status = ${status.toUpperCase()}
      ORDER BY pr.created_at DESC
    `;
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('proposals fetched successfully').withData(mappedData);
  }

  @Get('/status/:status')
  // @Auth(RESOURCE_NAME)
  async getByStatus(@Param('status') status: string) {
    /*const data = await this.prisma.proposals.findMany({
      where: {
        status: status.toUpperCase()
      }
    });*/
    const data: any = await this.prisma.$queryRaw`
      SELECT pr.*, users.email, users.wallet_address, users.firstname FROM proposals pr LEFT JOIN users ON user_id = users.id WHERE status = ${status.toUpperCase()}
    `;
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('proposals fetched successfully').withData(mappedData);
  }

  @Get(':id')
  @Auth(RESOURCE_NAME)
  async getById(@Param('id') id: string) {
    /*const data = await this.prisma.proposals.findUnique({
      where: {
        id: parseInt(id)
      }
    });*/

    const data: any = await this.prisma.$queryRaw`
      SELECT pr.*, users.email, users.wallet_address, users.firstname FROM proposals pr LEFT JOIN users ON user_id = users.id WHERE pr.id = ${id}
    `;
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
    const data = await this.datatable.getData(body, `
      SELECT proposals.id, proposal, description, community_id, expiration_dt, status, dao_id, name
      FROM proposals
        LEFT JOIN communities
            ON community_id = communities.id`);
    return HttpResponse.success('Datatables fetched successfully').withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
      mappedData.proposal = data.proposal
      mappedData.description = data.description
      mappedData.userId = data.userId || data.user_id
      mappedData.email = data.email
      mappedData.firstname = data.firstname
      mappedData.walletAddress = data.walletAddress || data.wallet_address
      mappedData.communityId = data.communityId || data.community_id
      mappedData.expirationDt = data.expirationDt || data.expiration_dt
      mappedData.status = data.status
      mappedData.type = data.type
      mappedData.transparent = data.transparent
      mappedData.quroum = data.quroum
    return mappedData;
  }
}
