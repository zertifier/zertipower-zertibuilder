import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EnvironmentService } from './environment-service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private environmentService: EnvironmentService) {
    this.transporter = nodemailer.createTransport({
      host: this.environmentService.getEnv().SMTP_SERVER, 
      port: this.environmentService.getEnv().SMTP_PORT, 
      secure: false, 
      auth: {
        user:  this.environmentService.getEnv().SMTP_USER, 
        pass: this.environmentService.getEnv().SMTP_PASSWORD, 
      },
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    const mailOptions = {
      from: this.environmentService.getEnv().SMTP_USER, 
      to: to,
      subject: subject,
      text: text,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}