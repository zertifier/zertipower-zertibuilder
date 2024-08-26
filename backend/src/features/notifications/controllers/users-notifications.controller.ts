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
import { UsersNotificationsCategoriesController } from "./users-notifications-categories.controller";

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
        console.log(req.decodedToken)
        console.log(req.decodedToken.user._id)

        let userId = req.decodedToken.user._id;

        let userNotifications = await this.prisma.usersNotification.findMany({
            where: {
                userId: parseInt(userId),
            }
        });
        let userCategories = await this.prisma.usersNotificationCategory.findMany({
            where: {
                userId: parseInt(userId),
            }
        });

        const notifications = await this.prisma.notification.findMany();
        const categories = await this.prisma.notificationCategory.findMany();

        //todo: check if all notifications exists
        if (userNotifications.length < notifications.length || userCategories.length < categories.length) {
            await UsersNotificationsController.insertDefaultNotificationsByUser(userId!, this.prisma);
            await UsersNotificationsCategoriesController.insertDefaultNotificationCategoriesByUser(userId!, this.prisma);
            userNotifications = await this.prisma.usersNotification.findMany({
                where: {
                    userId: parseInt(userId),
                }
            });
            userCategories = await this.prisma.usersNotificationCategory.findMany({
                where: {
                    userId: parseInt(userId),
                }
            });
        }

        return HttpResponse.success(
            "users_notifications and user_notifications_categories fetched successfully"
        ).withData({ notifications, userNotifications, categories, userCategories });
    }

    @Put()
    @Auth(RESOURCE_NAME)
    async updateByUserId(@Req() req: Request | any, @Body() body: any) {
        let userId = req.decodedToken.user._id;
        let promises: any = [];

        if (!body.userNnotifications && !body.userCategories) {
            return HttpResponse.failure("check if body has userNotifications or userCategories", ErrorCode.BAD_REQUEST);
        }

        if (body.userNotifications) {
            try {
                for (const userNotification of body.userNotifications) {
                    if (!userNotification.id) {
                        console.log("notification id not provided.",userNotification)
                        return HttpResponse.failure("notification id not provided.", ErrorCode.BAD_REQUEST);
                    }
                    if (userNotification.active !== 0 && userNotification.active !== 1) {
                        console.log("Invalid 'active' value. Must be 0 or 1.",userNotification)
                        return HttpResponse.failure("Invalid 'active' value. Must be 0 or 1.", ErrorCode.BAD_REQUEST);
                    }

                    if(userNotification.createdDt){
                        delete userNotification.createdDt
                    }

                    if(userNotification.updated_Dt){
                        delete userNotification.updatedDt
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
            } catch (error) {
                console.log(error)
                return HttpResponse.failure("error updating user notifications", ErrorCode.BAD_REQUEST);
            }
        }

        if (body.userCategories) {
            try {
                for (const userNotificationCategory of body.userCategories) {
                    if (!userNotificationCategory.id) {
                        console.log("notification category id not provided.",userNotificationCategory)
                        return HttpResponse.failure("notification category id not provided.", ErrorCode.BAD_REQUEST);
                    }
                    if (userNotificationCategory.active !== 0 && userNotificationCategory.active !== 1) {
                        console.log("Invalid 'active' value. Must be 0 or 1.",userNotificationCategory)
                        return HttpResponse.failure("Invalid 'active' value. Must be 0 or 1.", ErrorCode.BAD_REQUEST);
                    }
                    if(userNotificationCategory.createdDt){
                        delete userNotificationCategory.createdDt
                    }

                    if(userNotificationCategory.updated_Dt){
                        delete userNotificationCategory.updatedDt
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
            } catch (error) {
                console.log(error)
                return HttpResponse.failure("error updating user notification categories", ErrorCode.BAD_REQUEST);
            }
        }

        if (promises.length === 0) {
            return HttpResponse.failure("No valid user notifications to update.", ErrorCode.UNEXPECTED);
        }

        try {
            await Promise.all(promises)
        } catch (error) {
            console.log(error);
            return HttpResponse.failure(error, ErrorCode.UNEXPECTED);
        }

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

    static async insertDefaultNotificationsByUser(userId: number, prisma: PrismaService) {

        try {
            // Recuperar todas las notificaciones
            const notifications = await prisma.notification.findMany();

            if (notifications.length === 0) {
                return;
            }

            // Crear una lista de datos para insertar
            const userNotificationsData = notifications.map((notification:any) => ({
                userId: userId,
                notificationId: notification.id,
                active: 0
            }));

            // Insertar todas las notificaciones para el usuario
            await prisma.usersNotification.createMany({
                data: userNotificationsData,
                skipDuplicates: true, // Evita insertar duplicados en caso de que ya existan
            });

        } catch (error) {
            console.error("Error inserting default notifications by user:", error);
        }
    }


}
