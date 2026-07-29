// hooks/useRelatorioAlunos.ts
import { useState, useEffect, useCallback } from 'react';
import { listarAlunosRelatorio, type AlunoRelatorioItem } from '../relatorios';

export function useRelatorioAlunos() {
  const [alunos, setAlunos] = useState<AlunoRelatorioItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const limit = windowWidth < 640 ? 4 : 10; // 4 no mobile, 10 no desktop

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [nomeFiltro, setNomeFiltro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const data = await listarAlunosRelatorio({
        status: statusFiltro || undefined,
        nome: nomeFiltro || undefined,
        page,
        limit,
      });
      setAlunos(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      setErro('Erro ao carregar dados.');
    } finally {
      setCarregando(false);
    }
  }, [statusFiltro, nomeFiltro, page, limit]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return {
    alunos, total, page, setPage, totalPages: Math.ceil(total / limit),
    statusFiltro, setStatusFiltro, nomeFiltro, setNomeFiltro,
    carregando, erro, carregarDados,
  };
}