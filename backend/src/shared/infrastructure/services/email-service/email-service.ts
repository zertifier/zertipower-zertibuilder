import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { SendEmailError } from "../../../domain/error/common";
import { EnvironmentService } from "../environment-service";

/**
 * Service to send emails
 */
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly user: string;
  private serviceName = this.environment.getEnv().APPLICATION_NAME;

  constructor(private environment: EnvironmentService) {
    const { SMTP_SERVER, SMTP_USER, SMTP_PASSWORD, SMTP_PORT } =
      this.environment.getEnv();
    this.user = SMTP_USER;
    this.transporter = nodemailer.createTransport({
      pool: true,
      host: SMTP_SERVER,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: this.user,
        pass: SMTP_PASSWORD,
      },
    });
  }

  /**
   * Email desired destination
   * @param destination destination address
   * @param subject Email subject
   * @param content HTML content to send
   */
  async sendEmail(
    destination: string,
    subject: string,
    content: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(
        {
          from: `${this.serviceName} <${this.user}>`,
          to: destination,
          subject,
          envelope: {
            from: `${this.serviceName} <${this.user}>`,
            to: destination,
          },
          html: content,
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (error, info) => {
          if (error) {
            reject(new SendEmailError(error.message));
            return;
          }
          resolve();
        }
      );
    });
  }
}
