// hooks/useRelatorioAluno.ts
import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../../lib/api';

type DadosRelatorio = {
  status: string;
  quantidade_projetos: number;
  total_atribuidos: number;
  total_visualizados: number;
  data_ativacao: string;
  data_envio: string | null;
} | null;

type ProjetoRelatorio = {
  id: number;
  titulo: string;
  descricao: string;
  area: string;
  autores: { id: number; nome: string; turma: string; tipo: string }[];
  visualizado: boolean;
  data_atribuicao: string;
};

type MaterialInfo = {
  materialId: number;
  status: string;
  opiniao: string | null;
};

type PdfInfo = MaterialInfo & { projetoId: number };

type MeusMateriaisResponse = {
  video: MaterialInfo | null;
  pdf: PdfInfo | null;
};

export function useRelatorioAluno(deveBuscar: boolean) {
  const [dadosRelatorio, setDadosRelatorio] = useState<DadosRelatorio>(null);
  const [projetosRelatorio, setProjetosRelatorio] = useState<ProjetoRelatorio[]>([]);
  const [videoMaterialId, setVideoMaterialId] = useState<number | null>(null);
  const [pdfMateriais, setPdfMateriais] = useState<Map<number, number>>(new Map());
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [videoOpiniao, setVideoOpiniao] = useState<string | null>(null);
  const [pdfOpiniao, setPdfOpiniao] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      const [statusRes, projetosRes, materiaisRes] = await Promise.all([
        apiRequest<any>('/relatorio-aluno/aluno/relatorio/status').catch(() => null),
        apiRequest<any>('/relatorio-aluno/aluno/relatorio/meus-projetos').catch(() => null),
        apiRequest<MeusMateriaisResponse>('/relatorio-aluno/aluno/relatorio/meus-materiais').catch(() => null),
      ]);

      setDadosRelatorio(statusRes);
      setProjetosRelatorio(projetosRes?.projetos || []);

      if (materiaisRes) {
        if (materiaisRes.video) {
          setVideoMaterialId(materiaisRes.video.materialId);
          setVideoStatus(materiaisRes.video.status);
          setVideoOpiniao(materiaisRes.video.opiniao);
        } else {
          setVideoMaterialId(null);
          setVideoStatus(null);
          setVideoOpiniao(null);
        }

        const novoMap = new Map<number, number>();
        if (materiaisRes.pdf) {
          novoMap.set(materiaisRes.pdf.projetoId, materiaisRes.pdf.materialId);
          setPdfStatus(materiaisRes.pdf.status);
          setPdfOpiniao(materiaisRes.pdf.opiniao);
        } else {
          setPdfStatus(null);
          setPdfOpiniao(null);
        }
        setPdfMateriais(novoMap);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    }
  }, []);

  useEffect(() => {
    if (!deveBuscar) return;
    carregarDados();
  }, [deveBuscar, carregarDados]);

  return {
    dadosRelatorio,
    projetosRelatorio,
    videoMaterialId,
    pdfMateriais,
    videoStatus,
    pdfStatus,
    videoOpiniao,
    pdfOpiniao,
    carregarDados,
  };
}