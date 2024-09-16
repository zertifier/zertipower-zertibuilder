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
import { SaveNotificationCategoryDTO } from "../dtos/save-notification-category-dto";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";

export const RESOURCE_NAME = "notificationsCategories";

@ApiTags(RESOURCE_NAME)
@Controller("notifications-categories")
export class NotificationsCategoriesController {

    constructor(private prisma: PrismaService, private datatable: Datatable) { }

    @Get()
    @Auth(RESOURCE_NAME)
    async get() {
        const data = await this.prisma.notificationCategory.findMany();
        const mappedData = data.map(this.mapData);
        return HttpResponse.success(
            "notifications_categories fetched successfully"
        ).withData(mappedData);
    }

    @Get(":id")
    @Auth(RESOURCE_NAME)
    async getById(@Param("id") id: string) {
        const data = await this.prisma.notificationCategory.findUnique({
            where: {
                id: parseInt(id),
            },
        });
        return HttpResponse.success(
            "notification_category fetched successfully"
        ).withData(this.mapData(data));
    }

    @Post()
    @Auth(RESOURCE_NAME)
    async create(@Body() body: SaveNotificationCategoryDTO) {
        const data = await this.prisma.notificationCategory.create({ data: body });
        return HttpResponse.success("notification_category saved successfully").withData(
            data
        );
    }

    @Put(":id")
    @Auth(RESOURCE_NAME)
    async update(@Param("id") id: string, @Body() body: SaveNotificationCategoryDTO) {
        const data = await this.prisma.notificationCategory.update({
            where: {
                id: parseInt(id),
            },
            data: body,
        });
        return HttpResponse.success(
            "notification_category updated successfully"
        ).withData(data);
    }

    @Delete(":id")
    @Auth(RESOURCE_NAME)
    async remove(@Param("id") id: string) {
        const data = await this.prisma.notificationCategory.delete({
            where: {
                id: parseInt(id),
            },
        });
        return HttpResponse.success(
            "notification_category removed successfully"
        ).withData(data);
    }

    @Post('datatable')
    @Auth(RESOURCE_NAME)
    async datatables(@Body() body: any) {
        const data = await this.datatable.getData(body, `
    SELECT id, category, created_dt, updated_dt
    FROM notifications_categories`);
        return HttpResponse.success('Datatables fetched successfully').withData(data);
    }

    mapData(data: any) {
        const mappedData: any = {};
        mappedData.id = data.id;
        mappedData.category = data.category;
        mappedData.createdDt = data.createdDt;
        mappedData.updatedDt = data.updatedDt;
        return mappedData;
    }

}