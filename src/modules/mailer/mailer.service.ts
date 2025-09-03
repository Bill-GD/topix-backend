import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import hbs from 'handlebars';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transport: nodemailer.Transporter;

  private get tranport() {
    if (!this.transport) {
      this.transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transport;
  }

  sendMail(
    username: string,
    email: string,
    subject: string,
    template: string,
    data: Record<string, string>,
  ): void {
    const compiler = hbs.compile(
      fs.readFileSync(`${__dirname}/../templates/${template}.hbs`, 'utf-8'),
    );

    void this.tranport.sendMail({
      to: `${username} <${email}>`,
      subject,
      from: process.env.EMAIL_FROM,
      html: compiler(data),
    });
  }
}
