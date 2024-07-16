import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MysqlService } from 'src/shared/infrastructure/services/mysql-service/mysql.service';
import mysql from 'mysql2/promise';
import * as moment from 'moment';
import { PrismaService } from './prisma-service';
import { EnvironmentService } from './environment-service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private conn: mysql.Pool;

  //TODO 1:
  //create function, to call when user created, to create user_notifications and user_notificatications_categories,
  //to do this function, get notifications and notifications_categories and insert it with the user_id with all inactive

  constructor(
    private mysql: MysqlService,
    private prisma: PrismaService,
    private environmentService: EnvironmentService,
  ) {
    this.conn = this.mysql.pool;
  }

  onModuleInit() {
    this.run();
  }

  async run() {
    await this.sendNotifications();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sendNotifications() {
    const pendingNotifications:any = await this.getPendingNotifications();

    for (const notification of pendingNotifications) {
      const { userId, notificationId } = notification;
      const notificationSent = await this.wasNotificationRecentlySent(
        userId,
        notificationId,
      );

      if (!notificationSent) {
        await this.sendNotification(notification);
        await this.markNotificationAsSent(userId, notificationId);
      }
    }

    await this.cleanNotifications();
  }

  async getPendingNotifications() {
    const [rows] = await this.conn.query(
      'SELECT user_id AS userId, notification_id AS notificationId FROM users_notifications WHERE active = 1',
    );
    return rows;
  }

  async sendNotification(notification:any) {
    // Lógica para enviar la notificación, e.g., enviar un correo electrónico
    console.log(`Enviando notificación ${notification.notificationId} al usuario ${notification.userId}`);
  }

  async wasNotificationRecentlySent(userId: number, notificationId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) AS count FROM users_notifications_historic
      WHERE user_id = ? AND notification_id = ? AND created_dt > DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;
    const [rows]:any = await this.conn.query(query, [userId, notificationId]);
    const result = rows[0];
    return result.count > 0;
  }

  async markNotificationAsSent(userId: number, notificationId: number) {
    const query = `
      INSERT INTO users_notifications_historic (user_id, notification_id, created_dt)
      VALUES (?, ?, NOW())
    `;
    await this.conn.query(query, [userId, notificationId]);
  }

  async cleanNotifications() {
    await this.conn.query('DELETE FROM users_notifications WHERE active = 0');
  }
}