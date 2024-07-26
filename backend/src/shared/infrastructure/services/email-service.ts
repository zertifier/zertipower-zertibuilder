import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { SendEmailError } from "../../domain/error/common";
import { EnvironmentService } from "./environment-service";

/**
 * Service to send emails
 */
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly user: string;
  private serviceName = this.environment.getEnv().APPLICATION_NAME;
  private readonly displayEmail: string;

  constructor(private environment: EnvironmentService) {
    const { SMTP_SERVER, SMTP_USER, SMTP_PASSWORD, SMTP_PORT, SMTP_DISPLAY_EMAIL } = this.environment.getEnv();
    this.user = SMTP_USER;
    this.displayEmail = SMTP_DISPLAY_EMAIL
    this.transporter = nodemailer.createTransport({
      pool: true, 
      host: SMTP_SERVER,
      port: SMTP_PORT,
      secure: false, // false para utilizar STARTTLS en el puerto 587
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
  async sendEmail(destination: string, subject: string, content: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `${this.serviceName} <${this.displayEmail}>`,
        to: destination,
        subject,
        envelope: {
          from: `${this.serviceName} <${this.displayEmail}>`,
          to: destination,
        },
        html: content,
      });
    } catch (error) {
      console.log(error)
      throw new SendEmailError(error.message);
    }
  }
}
