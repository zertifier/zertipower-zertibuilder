import {
    Controller,
    Post,
    Get,
    Delete,
    Put,
    Body,
    Param,
  } from "@nestjs/common";
  import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
  import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";

  import { ApiTags } from "@nestjs/swagger";
  import { Auth } from "src/features/auth/infrastructure/decorators";
import { SaveUsersNotificationHistoricDTO } from "../dtos/save-users-notification-historic-dto";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
  
  export const RESOURCE_NAME = "usersNotificationsHistoric";
  
  @ApiTags(RESOURCE_NAME)
  @Controller("users-notifications-historic")
  export class UsersNotificationsHistoricController {
  
    constructor(private prisma: PrismaService,private datatable: Datatable) {}
  
    @Get()
    @Auth(RESOURCE_NAME)
    async get() {
      const data = await this.prisma.usersNotificationHistoric.findMany();
      const mappedData = data.map(this.mapData);
      return HttpResponse.success(
        "users_notifications_historic fetched successfully"
      ).withData(mappedData);
    }
  
    @Get(":id")
    @Auth(RESOURCE_NAME)
    async getById(@Param("id") id: string) {
      const data = await this.prisma.usersNotificationHistoric.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      return HttpResponse.success(
        "users_notifications_historic fetched successfully"
      ).withData(this.mapData(data));
    }
  
    @Post()
    @Auth(RESOURCE_NAME)
    async create(@Body() body: SaveUsersNotificationHistoricDTO) {
      const data = await this.prisma.usersNotificationHistoric.create({ data: body });
      return HttpResponse.success("users_notifications_historic saved successfully").withData(
        data
      );
    }
  
    @Put(":id")
    @Auth(RESOURCE_NAME)
    async update(@Param("id") id: string, @Body() body: SaveUsersNotificationHistoricDTO) {
      const data = await this.prisma.usersNotificationHistoric.update({
        where: {
          id: parseInt(id),
        },
        data: body,
      });
      return HttpResponse.success(
        "users_notifications_historic updated successfully"
      ).withData(data);
    }
  
    @Delete(":id")
    @Auth(RESOURCE_NAME)
    async remove(@Param("id") id: string) {
      const data = await this.prisma.usersNotificationHistoric.delete({
        where: {
          id: parseInt(id),
        },
      });
      return HttpResponse.success(
        "users_notifications_historic removed successfully"
      ).withData(data);
    }
  
    @Post('datatable')
    @Auth(RESOURCE_NAME)
    async datatables(@Body() body: any) {
      const data = await this.datatable.getData(body, `
        SELECT users_notifications_historic.id, users.username AS user, notifications.notification, users_notifications_historic.email, users_notifications_historic.subject, users_notifications_historic.created_dt, users_notifications_historic.updated_dt
        FROM users_notifications_historic
        LEFT JOIN users
          ON users_notifications_historic.user_id = users.id
        LEFT JOIN notifications
          ON users_notifications_historic.notification_id = notifications.id`);
      return HttpResponse.success('Datatables fetched successfully').withData(data);
    }

    mapData(data: any) {
      const mappedData: any = {};
      mappedData.id = data.id;
      mappedData.userId = data.userId;
      mappedData.notificationId = data.notificationId;
      mappedData.email = data.email;
      mappedData.subject = data.subject;
      mappedData.createdDt = data.createdDt;
      mappedData.updatedDt = data.updatedDt;
      return mappedData;
    }
  
  }
  