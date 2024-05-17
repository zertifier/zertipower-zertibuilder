import { Controller, Post, Get, Delete, Put, Body, Param } from '@nestjs/common';
import { HttpResponse } from 'src/shared/infrastructure/http/HttpResponse';
import { PrismaService } from 'src/shared/infrastructure/services/prisma-service/prisma-service';
import { MysqlService } from 'src/shared/infrastructure/services/mysql-service/mysql.service';
import { Datatable } from 'src/shared/infrastructure/services/datatable/Datatable';
import { SaveVotesDTO } from './save-votes-dto';
import * as moment from 'moment';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/features/auth/infrastructure/decorators';
import {BadRequestError, InvalidArgumentError} from "../../shared/domain/error/common";

export const RESOURCE_NAME = 'votes';

@ApiTags(RESOURCE_NAME)
@Controller('votes')
export class VotesController {
  constructor(
    private prisma: PrismaService,
    private datatable: Datatable
  ) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.votes.findMany();
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('proposals_options fetched successfully').withData(data);
  }

  @Get(':id')
  @Auth(RESOURCE_NAME)
  async getById(@Param('id') id: string) {
    const data = await this.prisma.votes.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('proposals_options fetched successfully').withData(this.mapData(data));
  }
  @Get('proposal/:proposalId')
  @Auth(RESOURCE_NAME)
  async getVotesByProposalId(@Param('proposalId') proposalId: string) {
    const data: any = await this.prisma.$queryRaw`
      SELECT option_id, COUNT(option_id) qty  FROM votes WHERE proposal_id = ${proposalId} GROUP BY option_id
    `
    return HttpResponse.success('proposals_options fetched successfully').withData(data.map(this.mapData));
  }

  @Get('proposal/:proposalId/user/:userId')
  @Auth(RESOURCE_NAME)
  async getVotesByProposalIdAndUserId(@Param('proposalId') proposalId: string, @Param('userId') userId: string) {
    const data: any = await this.prisma.$queryRaw`
      SELECT option_id FROM votes WHERE proposal_id = ${proposalId} AND user_id = ${userId}
    `
    return HttpResponse.success('proposals_options fetched successfully').withData(this.mapData(data[0] || []));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveVotesDTO) {
    const getVotes = await this.prisma.votes.findMany({
      where: {
        proposalId: body.proposalId,
        userId: body.userId,
        optionId: body.optionId
      }
    })
    if (getVotes.length)
      throw new BadRequestError("Your already voted");

    const proposal: any = await this.prisma.$queryRaw`
      SELECT pr.id
      FROM users
      LEFT JOIN cups 
      ON users.customer_id = cups.customer_id
      LEFT JOIN proposals pr
      ON pr.community_id = cups.community_id
      WHERE users.id = ${body.userId} AND pr.id = ${body.proposalId}
      GROUP BY cups.community_id
    `
    if (!proposal.length)
      throw new BadRequestError("Wrong community from user");

    if (proposal[0].id != body.proposalId)
      throw new BadRequestError("Wrong community from user");

    const data = await this.prisma.votes.createMany({ data: body });
    return HttpResponse.success('proposals_options saved successfully').withData(data);
  }

  @Put(':id')
  @Auth(RESOURCE_NAME)
  async update(@Param('id') id: string, @Body() body: SaveVotesDTO) {
    const data = await this.prisma.votes.updateMany({
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
    const data = await this.prisma.votes.delete({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('proposals_options removed successfully').withData(data);
  }

  @Post('datatable')
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(body, `
      SELECT po.id,
             proposal_id,
            option,
            proposal  
      FROM proposals_options po
        LEFT JOIN proposals
      ON proposals.id = proposal_id`);
    return HttpResponse.success('Datatables fetched successfully').withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
      mappedData.proposalId = data.proposalId || data.proposal_id
      mappedData.optionId = data.optionId || data.option_id
      mappedData.userId = data.userId || data.user_id
      mappedData.option = data.option
      mappedData.qty = data.qty ? parseInt(data.qty) : undefined
    return mappedData;
  }
}
