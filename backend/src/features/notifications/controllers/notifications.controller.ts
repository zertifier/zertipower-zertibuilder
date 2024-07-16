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
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { SaveNotificationDTO } from "../dtos/save-notification-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import mysql from "mysql2/promise";

export const RESOURCE_NAME = "notifications";

@ApiTags(RESOURCE_NAME)
@Controller("notifications")
export class NotificationsController {

  private conn: mysql.Pool;

  constructor(private prisma: PrismaService, private datatable: Datatable) { }

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.notification.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success(
      "notifications fetched successfully"
    ).withData(mappedData);
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.notification.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "notification fetched successfully"
    ).withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveNotificationDTO) {
    const data = await this.prisma.notification.create({ data: body });
    return HttpResponse.success("notification saved successfully").withData(
      data
    );
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveNotificationDTO) {
    const data = await this.prisma.notification.update({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success(
      "notification updated successfully"
    ).withData(data);
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.notification.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "notification removed successfully"
    ).withData(data);
  }

  @Post('datatable')
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(body, `
        SELECT notifications.id, notifications.notification, notifications.code, notifications.created_dt, notifications.updated_dt, notifications_categories.category AS notification_category
        FROM notifications
        LEFT JOIN notifications_categories
          ON notifications.notification_category_id = notifications_categories.id`);
    return HttpResponse.success('Datatables fetched successfully').withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.notificationCategoryId = data.notificationCategoryId;
    mappedData.notification = data.notification;
    mappedData.code = data.code;
    mappedData.createdDt = data.createdDt;
    mappedData.updatedDt = data.updatedDt;
    return mappedData;
  }

}