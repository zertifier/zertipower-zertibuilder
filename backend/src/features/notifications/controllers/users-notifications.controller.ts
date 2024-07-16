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
import { SaveUsersNotificationDTO } from "../dtos/save-users-notification-dto";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";

export const RESOURCE_NAME = "usersNotifications";

@ApiTags(RESOURCE_NAME)
@Controller("users-notifications")
export class UsersNotificationsController {

    constructor(private prisma: PrismaService, private datatable: Datatable) { }

    @Get()
    @Auth(RESOURCE_NAME)
    async get() {
        const data = await this.prisma.usersNotification.findMany();
        const mappedData = data.map(this.mapData);
        return HttpResponse.success(
            "users_notifications fetched successfully"
        ).withData(mappedData);
    }

    @Get(":id")
    @Auth(RESOURCE_NAME)
    async getById(@Param("id") id: string) {
        const data = await this.prisma.usersNotification.findUnique({
            where: {
                id: parseInt(id),
            },
        });
        return HttpResponse.success(
            "users_notifications fetched successfully"
        ).withData(this.mapData(data));
    }

    @Post()
    @Auth(RESOURCE_NAME)
    async create(@Body() body: SaveUsersNotificationDTO) {
        const data = await this.prisma.usersNotification.create({ data: body });
        return HttpResponse.success("users_notifications saved successfully").withData(
            data
        );
    }

    @Put(":id")
    @Auth(RESOURCE_NAME)
    async update(@Param("id") id: string, @Body() body: SaveUsersNotificationDTO) {
        const data = await this.prisma.usersNotification.update({
            where: {
                id: parseInt(id),
            },
            data: body,
        });
        return HttpResponse.success(
            "users_notifications updated successfully"
        ).withData(data);
    }

    @Delete(":id")
    @Auth(RESOURCE_NAME)
    async remove(@Param("id") id: string) {
        const data = await this.prisma.usersNotification.delete({
            where: {
                id: parseInt(id),
            },
        });
        return HttpResponse.success(
            "users_notifications removed successfully"
        ).withData(data);
    }

    @Post('datatable')
    @Auth(RESOURCE_NAME)
    async datatables(@Body() body: any) {
        const data = await this.datatable.getData(body, `
        SELECT users_notifications.id, users.username AS user, notifications.notification, users_notifications.active, users_notifications.created_dt, users_notifications.updated_dt
        FROM users_notifications
        LEFT JOIN users
          ON users_notifications.user_id = users.id
        LEFT JOIN notifications
          ON users_notifications.notification_id = notifications.id`);
        return HttpResponse.success('Datatables fetched successfully').withData(data);
    }

    mapData(data: any) {
        const mappedData: any = {};
        mappedData.id = data.id;
        mappedData.userId = data.userId;
        mappedData.notificationId = data.notificationId;
        mappedData.active = data.active;
        mappedData.createdDt = data.createdDt;
        mappedData.updatedDt = data.updatedDt;
        return mappedData;
    }

}
