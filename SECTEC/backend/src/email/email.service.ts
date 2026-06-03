import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      // 🚀 CORREÇÃO: Definindo explicitamente o host e a porta segura
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true para porta 465 (SSL)
      auth: {
        user: this.config.get<string>('GMAIL_USER'),
        pass: this.config.get<string>('GMAIL_APP_PASS'),
      },
      // ⚙️ CONFIGURAÇÃO DE REDE: Força timeouts saudáveis
      connectionTimeout: 10000, // 10 segundos para conectar
      greetingTimeout: 10000,   // 10 segundos aguardando saudação do SMTP
      socketTimeout: 15000,     // 15 segundos de inatividade máxima no socket
    });
  }

  async sendPasswordReset(
    email: string,
    resetLink: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `SECTEC <${this.config.get<string>('GMAIL_USER')}>`,
      to: email,
      subject: 'SECTEC – Redefinição de senha',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#1e3a5f;">Redefinição de senha</h2>

          <p>
            Clique no botão abaixo para redefinir sua senha.
            O link expira em <strong>1 hora</strong>.
          </p>

          <a href="${resetLink}" style="
            display:inline-block;
            margin:16px 0;
            padding:12px 28px;
            background:#1e3a5f;
            color:#fff;
            border-radius:6px;
            text-decoration:none;
            font-weight:bold;
          ">
            Redefinir minha senha
          </a>

          <p style="color:#888;font-size:12px;">
            Se você não solicitou isso, ignore este email.
          </p>
        </div>
      `,
    });
  }
}
