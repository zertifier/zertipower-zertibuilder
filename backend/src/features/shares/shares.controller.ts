import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
} from "@nestjs/common";
import {HttpResponse} from "src/shared/infrastructure/http/HttpResponse";
import {PrismaService} from "src/shared/infrastructure/services/prisma-service/prisma-service";
import {MysqlService} from "src/shared/infrastructure/services/mysql-service/mysql.service";
import {Datatable} from "src/shared/infrastructure/services/datatable/Datatable";
import {SaveSharesDto} from "./save-shares-dto";
import * as moment from "moment";
import {ApiTags} from "@nestjs/swagger";
import {Auth} from "src/features/auth/infrastructure/decorators";
import {BadRequestError} from "../../shared/domain/error/common";
import {SaveParticipantDto} from "./save-participant-dto";

export const RESOURCE_NAME = "shares";

@ApiTags(RESOURCE_NAME)
@Controller("shares")
export class SharesController {
  constructor(private prisma: PrismaService, private datatable: Datatable) {
  }

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.shares.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success("providers fetched successfully").withData(
      data
    );
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.shares.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("providers fetched successfully").withData(
      this.mapData(data)
    );
  }

  @Get("/community/:communityId/customer/:customerId")
  @Auth(RESOURCE_NAME)
  async getByCommunityAndCustomer(@Param("communityId") communityId: string, @Param("customerId") customerId: string) {
    /*const data = await this.prisma.shares.findUnique({
      where: {
        customerId: parseInt(customerId) || null,
        communityId: parseInt(communityId) || null
      },
    });*/

    const data: any = await this.prisma.$queryRaw`
      SELECT shares
      from shares
      WHERE customer_id = ${customerId}
        AND community_id = ${communityId}
    `

    if (!data.length)
      throw new BadRequestError("User does not have shares");

    return HttpResponse.success("providers fetched successfully").withData(
      {shares: data[0].shares}
    );
  }

  @Get("/participants/community/:communityId/status/:status")
  @Auth(RESOURCE_NAME)
  async getParticipants(@Param("communityId") communityId: string, @Param("status") status: string) {
    const data: any = await this.prisma.$queryRaw`
      SELECT shares.*, customers.name, customers.email
      from shares
             LEFT JOIN customers ON shares.customer_id = customers.id
      WHERE status = ${status.toUpperCase()}
        AND community_id = ${communityId}
    `

    if (!data.length)
      throw new BadRequestError("There isn't any customer with this status on this community");

    return HttpResponse.success("providers fetched successfully").withData(
      data.map(this.mapDataParticipants)
    );
  }

  @Get('/participants/community/:communityId/status/:status/filter/:word')
  @Auth(RESOURCE_NAME)
  async getParticipantsByFilter(@Param('communityId') communityId: string, @Param('status') status: string, @Param('word') word: string) {
    const data: any = await this.prisma.$queryRaw`
      SELECT shares.*, customers.name, customers.email
      from shares
             LEFT JOIN customers ON shares.customer_id = customers.id
      WHERE status = ${status.toUpperCase()}
        AND community_id = ${communityId}
        AND (name LIKE CONCAT('%', ${word}, '%') OR email LIKE CONCAT('%', ${word}, '%'))
    `

    return HttpResponse.success('proposals fetched successfully').withData(data.map(this.mapDataParticipants));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveSharesDto) {
    const data = await this.prisma.shares.create({data: body});
    return HttpResponse.success("providers saved successfully").withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveSharesDto) {
    const data = await this.prisma.shares.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success("providers updated successfully").withData(
      data
    );
  }

  @Put("/participants/:id")
  @Auth(RESOURCE_NAME)
  async updateParticipant(@Param("id") id: string, @Body() body: SaveParticipantDto) {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.shares.update({
        where: {
          id: parseInt(id),
        },
        data: {
          shares: parseFloat(body.shares.toString())
        },
      });

      await prisma.customers.update({
        where: {
          id: body.customerId,
        },
        data: {
          name: body.name,
          email: body.email
        },
      })

    })
    /*const data = await this.prisma.shares.updateMany({
      where: {
        id: parseInt(id),
      },
      data: {
        shares: body.shares
      },
    });*/
    return HttpResponse.success("providers updated successfully").withData(
      body
    );
  }

  @Put("/participants/:id/activate")
  @Auth(RESOURCE_NAME)
  async activateParticipant(@Param("id") id: string, @Body() body: SaveSharesDto) {
    const data = await this.prisma.shares.updateMany({
      where: {
        id: parseInt(id),
      },
      data: {
        status: 'ACTIVE',
        shares: parseFloat(body.shares.toString())
      },
    });
    return HttpResponse.success("participant updated successfully").withData(
      data
    );
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.shares.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("shares removed successfully").withData(
      data
    );
  }

  @Delete("/participants/:id")
  @Auth(RESOURCE_NAME)
  async removeParticipant(@Param("id") id: string) {

    const result =
      await this.prisma.$transaction(async (prisma) => {
        // First query: Delete from shares and get the deleted record data
        const deletedShare = await prisma.shares.delete({
          where: {
            id: parseInt(id),
          },
        });

        // Second query: Use data from deletedShare in the raw update query
        const updatedCups = await prisma.$executeRaw`
          UPDATE cups
          SET community_id = null
          WHERE community_id = ${deletedShare.communityId}
            AND customer_id = ${deletedShare.customerId};
        `;

        return {
          deletedShare,
          updatedCups,
        };
      });

    return HttpResponse.success("shares removed successfully").withData(
      result.deletedShare
    );
  }

  /*@Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT id,provider
                  FROM providers`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }*/

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.communityId = data.communityId || data.community_id;
    mappedData.customerId = data.customerId || data.customer_id;
    mappedData.shares = data.shares;
    mappedData.status = data.status;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    return mappedData;
  }

  mapDataParticipants(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.communityId = data.communityId || data.community_id;
    mappedData.customerId = data.customerId || data.customer_id;
    mappedData.shares = data.shares;
    mappedData.status = data.status;
    mappedData.name = data.name;
    mappedData.email = data.email;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    return mappedData;
  }
}
