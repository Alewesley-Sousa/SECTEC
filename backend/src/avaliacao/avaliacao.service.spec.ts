import { ForbiddenException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { AvaliacaoService } from './avaliacao.service';
import { Projeto, TipoProjeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { Avaliacao } from './entities/avaliacao.entity';
import { AvaliacaoCriterio } from './entities/avaliacao-criterio.entity';
import { Evento } from '../evento/entities/evento.entity';

type Mock = jest.Mock;

/** Monta o serviço com repositórios simulados (sem banco). */
function criarServico() {
  const projetoRepo = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const avaliadorProjetoRepo = { find: jest.fn(), update: jest.fn(), findOne: jest.fn() };
  const avaliacaoRepo = { find: jest.fn(), findOne: jest.fn() };
  const criterioRepo = { find: jest.fn(), delete: jest.fn() };
  const eventoRepo = { findOne: jest.fn() };

  // Gerenciador da transação: findOne/save/update usados em criarAvaliacao
  const manager = {
    findOne: jest.fn(),
    save: jest.fn(async (_entidade: unknown, dados: any) => (Array.isArray(dados) ? dados : { id: 99, ...dados })),
    update: jest.fn(async () => ({ affected: 1 })),
  };
  const dataSource = {
    transaction: jest.fn(async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager)),
  };

  const service = new AvaliacaoService(
    projetoRepo as unknown as Repository<Projeto>,
    avaliadorProjetoRepo as unknown as Repository<AvaliadorProjeto>,
    avaliacaoRepo as unknown as Repository<Avaliacao>,
    criterioRepo as unknown as Repository<AvaliacaoCriterio>,
    eventoRepo as unknown as Repository<Evento>,
    dataSource as unknown as DataSource,
  );

  return { service, projetoRepo, avaliadorProjetoRepo, avaliacaoRepo, criterioRepo, eventoRepo, manager };
}

const notasValidas = { apresentacao: 8, metodologia: 7, conteudo: 9, resultado: 6 };

describe('AvaliacaoService — B04 Oficinas', () => {
  describe('criarAvaliacao', () => {
    it('recusa avaliar uma oficina e não salva nada', async () => {
      const { service, manager } = criarServico();
      manager.findOne.mockResolvedValueOnce({ id: 5, eventoId: 1, tipo: TipoProjeto.OFICINA });

      await expect(
        service.criarAvaliacao({ avaliadorId: 10, projetoId: 5, ...notasValidas }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('aceita avaliar um projeto normal', async () => {
      const { service, manager } = criarServico();
      manager.findOne
        .mockResolvedValueOnce({ id: 5, eventoId: 1, tipo: TipoProjeto.PROJETO, titulo: 'X' }) // projeto
        .mockResolvedValueOnce(null) // evento (sem período: não bloqueia)
        .mockResolvedValueOnce(null) // avaliação já existente
        .mockResolvedValueOnce(null); // atribuição

      const resultado = await service.criarAvaliacao({ avaliadorId: 10, projetoId: 5, ...notasValidas });

      expect(resultado.avaliacao.notaFinal).toBe(7.5);
      expect(manager.save).toHaveBeenCalled();
    });
  });

  describe('listagens separam oficinas dos projetos', () => {
    it('listarMediasProjetos busca somente tipo PROJETO', async () => {
      const { service, projetoRepo } = criarServico();
      projetoRepo.find.mockResolvedValue([]);

      await service.listarMediasProjetos(1);

      expect(projetoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventoId: 1, tipo: TipoProjeto.PROJETO }),
        }),
      );
    });

    it('listarProjetosDesignados ignora oficinas', async () => {
      const { service, eventoRepo, avaliadorProjetoRepo } = criarServico();
      eventoRepo.findOne.mockResolvedValue({ id: 1 });
      avaliadorProjetoRepo.find.mockResolvedValue([]);

      await service.listarProjetosDesignados(10);

      expect(avaliadorProjetoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { avaliadorId: 10, projeto: { eventoId: 1, tipo: TipoProjeto.PROJETO } },
        }),
      );
    });

    it('ranking de orientadores filtra tipo PROJETO', async () => {
      const { service, projetoRepo } = criarServico();
      const qb: Record<string, Mock> = {};
      for (const metodo of ['leftJoinAndSelect', 'select', 'groupBy', 'addGroupBy', 'orderBy', 'andWhere']) {
        qb[metodo] = jest.fn().mockReturnThis();
      }
      qb.getRawMany = jest.fn().mockResolvedValue([]);
      projetoRepo.createQueryBuilder.mockReturnValue(qb);

      await service.listarRankingOrientadores(1);

      expect(qb.andWhere).toHaveBeenCalledWith('projeto.tipo = :tipo', { tipo: TipoProjeto.PROJETO });
    });
  });
});
