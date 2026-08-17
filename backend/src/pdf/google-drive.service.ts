// src/pdf/google-drive.service.ts
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private drive;

  constructor() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Erro: As variáveis GOOGLE_DRIVE_CLIENT_ID, CLIENT_SECRET ou REFRESH_TOKEN não foram totalmente definidas no .env',
      );
    }

    // Configura o cliente OAuth2 usando as credenciais do seu console Google Cloud
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground', // URI de redirecionamento usada no teste
    );

    // Passa o Refresh Token para que a biblioteca renove o Access Token em segundo plano automaticamente
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Instancia o Drive usando a autenticação do seu usuário pessoal
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  async uploadFile(
    fileName: string,
    fileStream: Readable,
    mimeType: string,
    parentFolderId?: string,
  ) {
    // Busca o ID da pasta do .env caso não seja passado um ID específico na chamada
    const folderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    const fileMetadata = {
      name: fileName,
      parents: folderId ? [folderId] : [], // Garante que vai para a pasta correta se o ID existir
    };

    const media = {
      mimeType: mimeType,
      body: fileStream,
    };

    // Upload direto usando os seus 15GB de armazenamento pessoal
    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return {
      id: response.data.id,
      webViewLink: response.data.webViewLink,
    };
  }


  /**
 * Obtém o Stream de um arquivo do Google Drive para download
 * @param driveFileId ID do arquivo na nuvem do Google
 */
  async downloadFileStream(driveFileId: string): Promise<Readable> {
    try {
      const response = await this.drive.files.get(
        {
          fileId: driveFileId,
          alt: 'media', // Informa à API que queremos o conteúdo binário do arquivo, não os metadados
        },
        { responseType: 'stream' }, // Configura o Axios interno para retornar um Stream do Node.js
      );

      return response.data as Readable;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Erro no Google Drive:', message);
      throw new Error(`Erro na operação: ${message}`);
    }
  }



  async updateFile(
    driveFileId: string,
    fileName: string,
    fileStream: Readable,
    mimeType: string,
  ) {
    try {
      // Atualiza os metadados (nome) e o corpo do arquivo (mídia)
      const response = await this.drive.files.update({
        fileId: driveFileId,
        requestBody: {
          name: fileName, // Mantém ou atualiza o nome padrão padrãoizado
        },
        media: {
          mimeType: mimeType,
          body: fileStream,
        },
        fields: 'id, webViewLink',
      });

      return {
        id: response.data.id,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Erro no Google Drive:', message);
      throw new Error(`Erro na operação: ${message}`);
    }
  }






  /**
   * Remove permanentemente um arquivo da nuvem do Google Drive
   * @param driveFileId ID do arquivo a ser deletado
   */
  async deleteFile(driveFileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: driveFileId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Erro no Google Drive:', message);
      throw new Error(`Erro na operação: ${message}`);
    }
  }


  // google-drive.service.ts
  async downloadFile(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      response.data.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.data.on('end', () => resolve(Buffer.concat(chunks)));
      response.data.on('error', reject);
    });
  }

  // google-drive.service.ts (adicionar ao final da classe)

  /**
   * Torna um arquivo publicamente acessível (qualquer pessoa com o link pode visualizar).
   */
  async makeFilePublic(fileId: string): Promise<void> {
    await this.drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  }

  /**
   * Upload de PDF de relatório com nome padronizado, permissão pública e retorno dos links.
   * Remove o arquivo local após o envio.
   */
  async uploadRelatorioPdf(
    file: Express.Multer.File,
    alunoNome: string,
    alunoId: number,
  ): Promise<{ id: string; previewLink: string }> {
    const fs = require('fs');
    const path = require('path');

    const filePath = file.path;
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('Arquivo PDF não foi recebido corretamente.');
    }

    const extensao = path.extname(file.originalname);
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const nomeAluno = (alunoNome ?? 'aluno')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
    const driveFileName = `${ano}-${mes}-relatorio-${nomeAluno}-${alunoId}${extensao}`;

    const fileStream = fs.createReadStream(filePath);

    try {
      const driveResponse = await this.uploadFile(
        driveFileName,
        fileStream,
        file.mimetype,
        process.env.GOOGLE_DRIVE_FOLDER_ID,
      );

      await this.makeFilePublic(driveResponse.id);

      const previewLink = `https://drive.google.com/file/d/${driveResponse.id}/preview`;

      return {
        id: driveResponse.id,
        previewLink,
      };
    } finally {
      // Remove arquivo temporário
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
