import {
    Controller,
    Post,
    Get,
    Delete,
    Put,
    Body,
    Param,
    Req,
} from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import { SaveUsersNotificationDTO } from "../dtos/save-users-notification-dto";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { ErrorCode } from "src/shared/domain/error";

export const RESOURCE_NAME = "users-notifications";

@ApiTags(RESOURCE_NAME)
@Controller("user-notifications")
export class UsersNotificationsController {

    constructor(private prisma: PrismaService, private datatable: Datatable) { }

    @Get()
    @Auth(RESOURCE_NAME)
    async getByUserId(@Req() req: Request | any) {
        let userId = req.decodedToken.user.id;
        const data = await this.prisma.usersNotification.findMany({
            where: {
                userId: parseInt(userId),
            }
        });
        return HttpResponse.success(
            "users_notifications fetched successfully"
        ).withData(data);
    }

    @Get("categorized")
    @Auth(RESOURCE_NAME)
    async getWithCategoriesByUserId(@Req() req: Request | any) {
        let userId = req.decodedToken.user.id;
        const notifications = await this.prisma.usersNotification.findMany({
            where: {
                userId: parseInt(userId),
            }
        });
        const categories = await this.prisma.usersNotificationCategory.findMany({
            where: {
                userId: parseInt(userId),
            }
        });
        return HttpResponse.success(
            "users_notifications and user_notifications_categories fetched successfully"
        ).withData({notifications,categories});
    }

    @Put()
    @Auth(RESOURCE_NAME)
    async updateByUserId(@Req() req: Request | any, @Body() body: any) {
        let userId = req.decodedToken.user.id;
        let promises: any = [];

        if (!body.notifications && !body.notificationCategories) {
            return HttpResponse.failure("check if body has notifications or notificationsCategories", ErrorCode.BAD_REQUEST);
        }

        console.log(body)

        if (body.notifications) {
            for (const userNotification of body.notifications) {
                if (!userNotification.id) {
                    return HttpResponse.failure("notification id not provided.", ErrorCode.BAD_REQUEST);
                }
                if (userNotification.active !== 0 && userNotification.active !== 1) {
                    return HttpResponse.failure("Invalid 'active' value. Must be 0 or 1.", ErrorCode.BAD_REQUEST);
                }
                let promise = this.prisma.usersNotification.update({
                    where: {
                        id: parseInt(userNotification.id),
                        userId: userId
                    },
                    data: {
                        active: userNotification.active,
                    }
                });
                promises.push(promise)
            }
        }

        if (body.notificationCategories) {
            for (const userNotificationCategory of body.notificationCategories) {
                if (!userNotificationCategory.id) {
                    return HttpResponse.failure("notification category id not provided.", ErrorCode.BAD_REQUEST);
                }
                if (userNotificationCategory.active !== 0 && userNotificationCategory.active !== 1) {
                    return HttpResponse.failure("Invalid 'active' value. Must be 0 or 1.", ErrorCode.BAD_REQUEST);
                }
                let promise = this.prisma.usersNotificationCategory.update({
                    where: {
                        id: parseInt(userNotificationCategory.id),
                        userId: userId
                    },
                    data: {
                        active: userNotificationCategory.active,
                    }
                });
                promises.push(promise)
            }
        }

        if (promises.length === 0) {
            return HttpResponse.failure("No valid user notifications to update.", ErrorCode.UNEXPECTED);
        }

        await Promise.all(promises)

        return HttpResponse.success(
            "User notifications updated successfully."
        );
    }

    @Get("all")
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

    // @Post()
    // @Auth(RESOURCE_NAME)
    // async create(@Body() body: SaveUsersNotificationDTO) {
    //     const data = await this.prisma.usersNotification.create({ data: body });
    //     return HttpResponse.success("users_notifications saved successfully").withData(
    //         data
    //     );
    // }

    // @Put(":id")
    // @Auth(RESOURCE_NAME)
    // async update(@Param("id") id: string, @Body() body: SaveUsersNotificationDTO) {
    //     const data = await this.prisma.usersNotification.update({
    //         where: {
    //             id: parseInt(id),
    //         },
    //         data: body,
    //     });
    //     return HttpResponse.success(
    //         "users_notifications updated successfully"
    //     ).withData(data);
    // }

    // @Delete(":id")
    // @Auth(RESOURCE_NAME)
    // async remove(@Param("id") id: string) {
    //     const data = await this.prisma.usersNotification.delete({
    //         where: {
    //             id: parseInt(id),
    //         },
    //     });
    //     return HttpResponse.success(
    //         "users_notifications removed successfully"
    //     ).withData(data);
    // }

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
