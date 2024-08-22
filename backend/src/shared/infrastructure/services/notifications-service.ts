import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MysqlService } from 'src/shared/infrastructure/services/mysql-service/mysql.service';
import mysql from 'mysql2/promise';
import * as moment from 'moment';
import { PrismaService } from './prisma-service';
import { EnvironmentService } from './environment-service';
import { SaveUsersNotificationDTO } from 'src/features/notifications/dtos/save-users-notification-dto';
import { EmailService } from './email-service';
import { SaveUsersNotificationHistoricDTO } from 'src/features/notifications/dtos/save-users-notification-historic-dto';

//SELECT users.id as userId, users.email, users.firstname, cups.cups, communities.name as communityName
interface CommunityUsers {
  userId: number;
  email: string;
  cups: string;
  communityName: string;
}

@Injectable()
export class NotificationsService {
  private conn: mysql.Pool;

  defaultNotificationLang: notificationLangs = notificationLangs.ca;

  //TODO 1:
  //create function, to call when user created, to create users_notifications and user_notificatications_categories,
  //to do this function, get notifications and notifications_categories and insert it with the user_id with all inactive

  constructor(
    private mysql: MysqlService,
    private prisma: PrismaService,
    private environmentService: EnvironmentService,
    private mailService: EmailService
  ) {
    this.conn = this.mysql.pool;
  }

  async sendNotification(userId: number, notificationCode: notificationCodes, subject: string, text: string) {
    try {
      if (!userId || !notificationCode || !subject) {
        console.log('error sending notification, parameter not provided',userId,notificationCode,subject)
        //console.log("userId:", userId, "notificationCode", notificationCode, "subject", subject, "text", text)
        return;
      }
      let user = await this.getUserCustomerByUserId(userId)
      const notification: notification = await this.getNotificationByCode(notificationCode);
      const notificationActive = await this.isNotificationActive(userId, notification.id);
      if (!notificationActive) {
        //console.log("notification isn't activated","userId",userId,"notificationId",notification.id,"subject",subject)
        return;
      }
      const notificationSent = await this.isNotificationSent(userId, notification.id, subject);
      if (!notificationSent) {
        await this.sendMail(notification.id, userId, user.email, subject, text);
        await this.registerNotification(userId, notification.id, user.email, subject);
      } else {
        console.log("notification already sent","userId",userId,"notificationId",notification.id,"subject",subject)
        return;
      }
    } catch (error) {
      console.log("Error sending notifications: ", error)
      //throw new Error(`Error sending notification: ${error}`);
    }
  }


  async sendCommunityNotification(communityId: number, notificationCode: notificationCodes, subject: string, text: string) {
    //todo: replace with more eficient version thinking in get and post once;
    const notification: notification = await this.getNotificationByCode(notificationCode);
    let communityUsers: CommunityUsers[] = await this.getUsersByCommunityId(communityId);
    if (!communityUsers.length) {
      return;
    }
    for (const user of communityUsers) {
      await this.sendNotification(user.userId, notificationCode, subject, text)
    }
  }

  async getUsersByCommunityId(communityId: number): Promise<CommunityUsers[]> {
    let communityUsers: CommunityUsers[] = []
    try {
      communityUsers = await this.prisma.$queryRaw<CommunityUsers[]>`
        SELECT users.id as userId, users.email, users.firstname, cups.cups, communities.name as communityName
        FROM users
          LEFT JOIN customers
          ON users.customer_id = customers.id
          LEFT JOIN cups 
          ON customers.id = cups.customer_id
          LEFT JOIN communities
          ON cups.community_id = communities.id
        WHERE community_id = ${communityId}`

      if (communityUsers.length > 0) {
        return communityUsers;
      } else {
        throw new Error('Any community user with this community id');
      }
    } catch (error) {
      console.error('Error fetching community users:', error);
      throw new Error('Error fetching community users');
    }
  }

  async getNotificationByCode(code: notificationCodes) {
    try {
      const [rows]: any = await this.conn.query(
        `SELECT id,notification_category_id as notificationCategoryId,notification,code FROM notifications
        WHERE code = ?`
        , [code]);

      if (rows.length > 0) {
        return rows[0];
      } else {
        throw new Error('Any notification with this code');
      }
    } catch (error) {
      console.error('Error fetching active notifications:', error);
      throw new Error('Error fetching active notifications');
    }
  }

  async getUserCustomerByUserId(userId: number) {
    try {
      const [rows]: any = await this.conn.query(
        `SELECT users.id, users.firstname, users.email
        FROM users
        LEFT JOIN customers
        ON users.customer_id = customers.id
        WHERE users.id = ?`, [userId]
      );
      if (rows.length > 0) {
        return rows[0];
      } else {
        throw new Error('Any user-customer with this userId');
      }
    } catch (error) {
      console.error(`Error getting user-customer by id ${userId}:`, error);
      throw new Error(`Error getting user-customer by id ${userId}:`);
    }
  }

  async getUserByUserId(userId: number) {
    try {
      const [rows]: any = await this.conn.query(
        `SELECT users.id, users.firstname, users.email
        FROM users
        WHERE users.id = ?`, [userId]
      );
      if (rows.length > 0) {
        return rows[0];
      } else {
        throw new Error('Any user with this userId');
      }
    } catch (error) {
      console.error(`Error getting user by id ${userId}:`, error);
      throw new Error(`Error getting user by id ${userId}:`);
    }
  }

  async getActiveNotifications() {

    let activeNotifications: activeUserNotification[];
    try {
      const [rows]: any = await this.conn.query(
        `SELECT un.user_id as userId,un.id userNotificationId, n.code as notificationCode FROM users_notifications un 
      LEFT JOIN notifications n ON un.notification_id = n.id 
      LEFT JOIN users_notifications_categories unc ON n.notification_category_id = unc.notification_categories_id
      WHERE unc.active = 1 AND un.active = 1`
      );
      activeNotifications = rows;
      return activeNotifications;
    } catch (error) {
      console.error('Error fetching active notifications:', error);
      throw new Error('Error fetching active notifications');
    }
  }

  async getActiveNotificationsByUser(userId: number) {
    let activeNotifications: activeUserNotification[];
    try {
      const [rows]: any = await this.conn.query(
        `SELECT un.user_id as userId,un.id as userNotificationId, n.code as notificationCode FROM users_notifications un 
      LEFT JOIN notifications n ON un.notification_id = n.id 
      LEFT JOIN users_notifications_categories unc ON n.notification_category_id = unc.notification_categories_id
      WHERE unc.active = 1 AND un.active = 1 AND un.user_id = ${userId}`,
      );
      activeNotifications = rows;
      return activeNotifications;
    } catch (error) {
      console.error(`Error fetching active notifications for user ${userId}:`, error);
      throw new Error(`Error fetching active notifications for user ${userId}`);
    }
  }

  async getLastSentNotificationsByUser(userId: number) {
    let lastNotifications: notificationHistoric[];
    try {
      const [rows]: any = await this.conn.query(`
        SELECT unh.notification_id as notificationId, unh.subject
        FROM users_notifications_historic unh
        WHERE unh.id IN (
          SELECT MAX(unh2.id)
          FROM users_notifications_historic unh2
          WHERE unh2.user_id = ${userId}
          GROUP BY unh2.notification_id
        )
        ORDER BY unh.notification_id;
      `)
      lastNotifications = rows;
      return lastNotifications;
    } catch (error) {
      console.error(`Error fetching last sent notifications for user ${userId}:`, error);
      throw new Error(`Error fetching last sent notifications for user ${userId}`);
    }
  }

  async isNotificationActive(userId: number, notificationId: number) {
    let activeNotifications: activeUserNotification[];
    try {
      let [rows]: any = await this.conn.query(
        `SELECT un.user_id, un.id, n.code, unc.active as userNotificationCategoryActive, un.active as userNotificationActive
        FROM users_notifications un
        LEFT JOIN notifications n ON un.notification_id = n.id
        LEFT JOIN users_notifications_categories unc ON n.notification_category_id = unc.notification_categories_id AND un.user_id = unc.user_id
        WHERE un.user_id = ? AND n.id = ?`,
        [userId, notificationId]
      );
      // const [rows]: any = await this.conn.query(
      //   `SELECT un.user_id, un.id, n.code, unc.active as userNotificationCategoryActive, un.active as userNotificationActive
      //   FROM users_notifications un
      //   LEFT JOIN notifications n ON un.notification_id = n.id
      //   LEFT JOIN users_notifications_categories unc ON n.notification_category_id = unc.notification_categories_id
      //   WHERE unc.active = 1 AND un.active = 1 AND un.user_id = ? AND un.notification_id = ?`,
      //   [userId, notificationId]
      // );

      if (!rows.length) { //if notification not found, creates inactive database notification register
        [rows] = await this.conn.query(`SELECT nc.id FROM notifications_categories nc LEFT JOIN notifications n on nc.id = n.notification_category_id WHERE n.id = ?`, [notificationId])
        if (rows.length) {
          //insert user notifications:
          let notificationCategoryId = rows[0].id;
          await this.conn.query(`INSERT IGNORE INTO users_notifications (user_id,notification_id,active) VALUES (?,?,?)`, [userId, notificationId, 0]);
          await this.conn.query(`INSERT IGNORE INTO users_notifications_categories (user_id, notification_categories_id, active) VALUES (?,?,?)`, [userId, notificationCategoryId, 0]);
          console.log("users notifications created for the user ", userId)
        } else {
          console.log("notification category not found by notification id", notificationId)
        }
        return false;
      }

      //if category and notification are active, returns true
      if (rows[0].userNotificationCategoryActive && rows[0].userNotificationActive) {
        return true
      }
      //return rows.length > 0;
    } catch (error) {
      console.error(`Error fetching active notifications for user ${userId}:`, error);
      throw new Error(`Error fetching active notifications for user ${userId}`);
    }
  }

  async isNotificationSent(userId: number, notificationId: number, subject: string) {

    //todo: si el subject es el de la notificacion con el id que le pasamos, el subject es redundante. eliminar.
    //si el subject no es notification, qué es?

    try {

      const [rows]: any = await this.conn.query(`
        SELECT unh.subject
        FROM users_notifications_historic unh
        WHERE unh.id = (
          SELECT MAX(unh2.id)
          FROM users_notifications_historic unh2
          WHERE unh2.user_id = ? AND unh2.notification_id = ?
        )
      `, [userId, notificationId]);

      if (rows.length > 0 && rows[0].subject === subject) {
        return true;
      } else {
        return false;
      }

    } catch (error) {
      console.error(`Error checking if notification was sent for user ${userId}, notification ${notificationId}, subject ${subject}:`, error);
      throw new Error(`Error checking if notification was sent for user ${userId}, notification ${notificationId}, subject ${subject}`);
    }

  }

  async sendMail(notificationId: number, userId: number, email: string, subject: string, text: string) {
    //console.log("activar sendMail", notificationId, userId, email, subject, text)
    try{
      console.log(`Enviando notificación ${notificationId} al usuario ${userId}: ${email}`);
      this.mailService.sendEmail(email, subject, text); 
    } catch(error){
      console.log("Error sending mail",error)
    }
  }

  async wasNotificationRecentlySent(userId: number, notificationId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) AS count FROM users_notifications_historic
      WHERE user_id = ? AND notification_id = ? AND created_dt > DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;
    const [rows]: any = await this.conn.query(query, [userId, notificationId]);
    const result = rows[0];
    return result.count > 0;
  }

  /** Register notifications into users_notifications_historic
   * @param userNotifications 
   */
  async registerNotifications(userNotifications: SaveUsersNotificationHistoricDTO[]) {
    try {
      await this.conn.query('INSERT INTO users_notifications_historic (user_id,notification_id,email,subject) VALUES (?)', [userNotifications]);
    } catch (error) {
      console.error(`Error inserting last sent notifications:`, error);
      throw new Error(`Error inserting last sent notifications: ${error}`);
    }
  }

  /** Register notification into users_notifications_historic
 */
  async registerNotification(userId: number, notificationId: number, email: string, subject: string) {
    try {
      await this.conn.query('INSERT INTO users_notifications_historic (user_id,notification_id,email,subject) VALUES (?,?,?,?)', [userId, notificationId, email, subject]);
    } catch (error) {
      console.error(`Error inserting last sent notification:`, error);
      throw new Error(`Error inserting last sent notification: ${error}`);
    }
  }

  getNotificationSubject(notificationCode: notificationCodes, lang: 'ca' | 'en' | 'es', variables: { [key: string]: string } = {}): string {
    const messages = notificationMessages[notificationCode];
    if (!messages) {
      return 'Unknown notification code.';
    }

    let message = messages[lang] || messages['ca'];

    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`\\\${${key}}`, 'g'), value);
    }

    return message;

    return messages[lang] || messages['ca']; // Default to Catalan if the specified language is not found
  }

}

interface notification { notification: string, code: string, notificationCategoryId: number, id: number }
interface activeUserNotification { userId: number, userNotificationId: number, notificationCode: string }
interface mail { email: string, subject: string, message: string }
interface notificationHistoric { notificationId: number, subject: string, text?: string }

enum proposalToNotification {
  'expired' = 'proposalExpired',
  'active' = 'proposalAccepted',
  'executed' = 'proposalExecuted',
  'denied' = 'proposalDenied'
}

export enum notificationCodes {
  createProposal = 'create_proposal',
  deleteProposal = 'delete_proposal',
  proposalExpired = 'proposal_expired',
  proposalAccepted = 'proposal_accepted',
  proposalExecuted = 'proposal_executed',
  proposalDenied = 'proposal_denied',
  sharingReceived = 'sharing_received',
  sharingSent = 'sharing_sent',
  datadisActive = 'datadis_active',
  datadisInactive = 'datadis_inactive',
  insufficientBalance = 'insufficient_balance',
  lowBalance = 'low_balance'
}

export enum notificationLangs {
  ca = 'ca',
  en = 'en',
  es = 'es'
}

const notificationMessages = {
  create_proposal: {
    ca: 'S\'ha creat una nova proposta: ${proposalName}.',
    en: 'A new proposal has been created: ${proposalName}.',
    es: 'Se ha creado una nueva propuesta: ${proposalName}.',
  },
  delete_proposal: {
    ca: 'S\'ha eliminat una proposta: ${proposalName}.',
    en: 'A proposal has been deleted: ${proposalName}.',
    es: 'Se ha eliminado una propuesta: ${proposalName}.',
  },
  proposal_expired: {
    ca: 'Una proposta ha finalitzat: ${proposalName}.',
    en: 'A proposal has expired: ${proposalName}.',
    es: 'Una propuesta ha finalizado: ${proposalName}.',
  },
  proposal_accepted: {
    ca: 'S\'ha acceptat una proposta: ${proposalName}.',
    en: 'A proposal has been accepted: ${proposalName}.',
    es: 'Se ha aceptado una propuesta: ${proposalName}.',
  },
  proposal_executed: {
    ca: 'S\'ha executat una proposta: ${proposalName}.',
    en: 'A proposal has been executed: ${proposalName}.',
    es: 'Se ha ejecutado una propuesta: ${proposalName}.',
  },
  proposal_denied: {
    ca: 'S\'ha rebutjat una proposta: ${proposalName}.',
    en: 'A proposal has been denied: ${proposalName}.',
    es: 'Se ha rechazado una propuesta: ${proposalName}.',
  },
  sharing_received: {
    ca: "S'ha rebut una compartició de ${sharedKW} kW a un cost de ${tradeCost} de part de ${customerName} amb data de ${infoDt}.",
    en: "A sharing of ${sharedKW} kW has been received at a cost of ${tradeCost} from ${customerName} with a date of ${infoDt}.",
    es: "Se ha recibido una compartición de ${sharedKW} kW a un costo de ${tradeCost} de parte de ${customerName} con fecha de ${infoDt}."
  },
  sharing_sent: {
    ca: "S'ha enviat una compartició de ${sharedKW} kW al destinatari ${customerName} a un preu de ${tradeCost} amb data de ${infoDt}.",
    en: "A sharing of ${sharedKW} kW has been sent to the recipient ${customerName} at a price of ${tradeCost} with a date of ${infoDt}.",
    es: "Se ha enviado una compartición de ${sharedKW} kW al destinatario ${customerName} a un precio de ${tradeCost} con fecha de ${infoDt}."
  },
  datadis_active: {
    ca: 'Datadis està actiu.',
    en: 'Datadis is active.',
    es: 'Datadis está activo.',
  },
  datadis_inactive: {
    ca: 'Datadis està inactiu.',
    en: 'Datadis is inactive.',
    es: 'Datadis está inactivo.',
  },
  insufficient_balance: {
    ca: 'Saldo insuficient per comprar ${sharedKW} KW al destinatari ${customerName} a un preu de ${tradeCost} amb data de ${infoDt}.',
    en: 'Insufficient balance for buying ${sharedKW} kW at a cost of ${tradeCost} from ${customerName} with a date of ${infoDt}.',
    es: 'Saldo insuficiente para comprar ${sharedKW} kW a un costo de ${tradeCost} de parte de ${customerName} con fecha de ${infoDt}.'
  },
  low_balance: {
    ca: 'El saldo de dins de la comunitat és baix a data de ${infoDt}.',
    en: 'The balance within the community is low with a date of ${infoDt}',
    es: 'El saldo de dentro de la comunidad es bajo con fecha de ${infoDt}'
  }
};

// async run() {
//   await this.sendNotifications();
// }

//@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
// async sendNotifications() {

//   const activeNotifications: activeNotifications[] = await this.getActiveNotifications();

//   for (const notification of activeNotifications) {
//     const { userId, userNotificationId, notificationCode } = notification;
//     const notificationSent = await this.wasNotificationRecentlySent(
//       userId,
//       notificationId,
//     );

//     if (!notificationSent) {
//       await this.sendNotification(notification);
//       await this.markNotificationAsSent(userId, notificationId);
//     }
//   }

//   await this.cleanNotifications();
// }

// sendNotificationsByUser(notification: any) {
//const activeNotifications: activeNotifications[] = await this.getActiveNotificationsByUser(notification.userId);
//const lastSentNotifications: notificationHistoric[] = await this.getLastSentNotificationsByUser(notification.userId)
//for (const notification of activeNotifications) {
// }