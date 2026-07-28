// services/aluno/relatorios.ts
import { apiRequest } from '../../../lib/api';

/**
 * Resposta do endpoint de envio de material (link ou PDF).
 */
export type RelatorioMaterialResponse = {
  mensagem: string;
  material: {
    id: number;
    tipo: string;
    conteudo: string;
    criadoEm: string;
  };
};

/**
 * Envia um link (YouTube) para o relatório.
 */
export async function enviarLinkRelatorio(
  link: string,
): Promise<RelatorioMaterialResponse> {
  return apiRequest('/relatorio-aluno/aluno/relatorio/enviar', {
    method: 'POST',
    body: { tipo: 'link', conteudo: link },
  });
}

/**
 * Envia um arquivo PDF para o relatório.
 * Utiliza fetch com FormData porque apiRequest não suporta multipart.
 */
export async function enviarPdfRelatorio(
  file: File,
): Promise<RelatorioMaterialResponse> {
  const token = localStorage.getItem('token');

  // Garante que a URL base sempre termine com "/api"
  const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const baseUrl = rawBase.replace(/\/+$/, '') + '/api';

  const formData = new FormData();
  formData.append('tipo', 'pdf');
  formData.append('file', file);

  const res = await fetch(
    `${baseUrl}/relatorio-aluno/aluno/relatorio/enviar`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erro ao enviar PDF');
  }

  return res.json();
}

/**
 * Cancela o envio de um material do relatório (dentro de 24h).
 */
export async function cancelarMaterialRelatorio(
  materialId: number,
): Promise<{ mensagem: string }> {
  return apiRequest(
    `/relatorio-aluno/aluno/relatorio/cancelar/${materialId}`,
    { method: 'DELETE' },
  );
}