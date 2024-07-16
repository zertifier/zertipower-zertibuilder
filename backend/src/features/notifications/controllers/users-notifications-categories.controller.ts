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
import { SaveUsersNotificationCategoryDTO } from "../dtos/save-users-notification-category-dto";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";

export const RESOURCE_NAME = "usersNotificationsCategories";

@ApiTags(RESOURCE_NAME)
@Controller("users-notification-categories")
export class UsersNotificationsCategoriesController {

    constructor(private prisma: PrismaService, private datatable: Datatable) { }

    @Get()
    @Auth(RESOURCE_NAME)
    async get() {
        const data = await this.prisma.usersNotificationCategory.findMany();
        const mappedData = data.map(this.mapData);
        return HttpResponse.success(
            "users_notifications_categories fetched successfully"
        ).withData(mappedData);
    }

    @Get(":id")
    @Auth(RESOURCE_NAME)
    async getById(@Param("id") id: string) {
        const data = await this.prisma.usersNotificationCategory.findUnique({
            where: {
                id: parseInt(id),
            },
        });
        return HttpResponse.success(
            "users_notifications_category fetched successfully"
        ).withData(this.mapData(data));
    }

    @Post()
    @Auth(RESOURCE_NAME)
    async create(@Body() body: SaveUsersNotificationCategoryDTO) {
        const data = await this.prisma.usersNotificationCategory.create({ data: body });
        return HttpResponse.success("users_notifications_category saved successfully").withData(
            data
        );
    }

    @Put(":id")
    @Auth(RESOURCE_NAME)
    async update(@Param("id") id: string, @Body() body: SaveUsersNotificationCategoryDTO) {
        const data = await this.prisma.usersNotificationCategory.update({
            where: {
                id: parseInt(id),
            },
            data: body,
        });
        return HttpResponse.success(
            "users_notifications_category updated successfully"
        ).withData(data);
    }

    @Delete(":id")
    @Auth(RESOURCE_NAME)
    async remove(@Param("id") id: string) {
        const data = await this.prisma.usersNotificationCategory.delete({
            where: {
                id: parseInt(id),
            },
        });
        return HttpResponse.success(
            "users_notifications_category removed successfully"
        ).withData(data);
    }

    @Post('datatable')
    @Auth(RESOURCE_NAME)
    async datatables(@Body() body: any) {
        const data = await this.datatable.getData(body, `
    SELECT users_notifications_categories.id, users.username AS user, notifications_categories.category AS notification_category, users_notifications_categories.active, users_notifications_categories.created_dt, users_notifications_categories.updated_dt
    FROM users_notifications_categories
    LEFT JOIN users
      ON users_notifications_categories.user_id = users.id
    LEFT JOIN notifications_categories
      ON users_notifications_categories.notification_categories_id = notifications_categories.id`);
        return HttpResponse.success('Datatables fetched successfully').withData(data);
    }

    mapData(data: any) {
        const mappedData: any = {};
        mappedData.id = data.id;
        mappedData.userId = data.userId;
        mappedData.notificationCategoriesId = data.notificationCategoriesId;
        mappedData.active = data.active;
        mappedData.createdDt = data.createdDt;
        mappedData.updatedDt = data.updatedDt;
        return mappedData;
    }

}
