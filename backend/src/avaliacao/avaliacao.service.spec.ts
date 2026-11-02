import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Repository, DataSource } from 'typeorm';
import { AvaliacaoService, calcularMedia, validarNota } from './avaliacao.service';
import { Projeto, TipoProjeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { Avaliacao } from './entities/avaliacao.entity';
import { AvaliacaoCriterio } from './entities/avaliacao-criterio.entity';
import { Evento } from '../evento/entities/evento.entity';
import { AvaliacaoController } from './avaliacao.controller';

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

  return { service, projetoRepo, avaliadorProjetoRepo, avaliacaoRepo, criterioRepo, eventoRepo, manager, dataSource };
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

describe('AvaliacaoService — B05 Estrutura de avaliação', () => {
  const projetoNormal = { id: 5, eventoId: 1, tipo: TipoProjeto.PROJETO, titulo: 'Robô' };
  const notas = { apresentacao: 8, metodologia: 7, conteudo: 9, resultado: 6 };

  /** Sequência padrão do criarAvaliacao: projeto, evento, avaliação existente, atribuição. */
  function prepararFluxo(manager: any, { evento = null, jaAvaliado = null } = {}) {
    manager.findOne
      .mockResolvedValueOnce(projetoNormal)
      .mockResolvedValueOnce(evento)
      .mockResolvedValueOnce(jaAvaliado)
      .mockResolvedValueOnce({ avaliadorId: 10, projetoId: 5, status: 'pendente' });
  }

  it('associa a avaliação ao projeto e ao avaliador, com a média calculada', async () => {
    const { service, manager } = criarServico();
    prepararFluxo(manager);

    const resultado = await service.criarAvaliacao({ avaliadorId: 10, projetoId: 5, ...notas });

    expect(manager.save).toHaveBeenCalledWith(
      Avaliacao,
      expect.objectContaining({ avaliadorId: 10, projeto: { id: 5 }, nota: 7.5 }),
    );
    expect(resultado.avaliacao).toMatchObject({ avaliadorId: 10, projetoId: 5, notaFinal: 7.5 });
  });

  it('salva uma linha de critério para cada uma das quatro notas', async () => {
    const { service, manager } = criarServico();
    prepararFluxo(manager);

    await service.criarAvaliacao({ avaliadorId: 10, projetoId: 5, ...notas });

    const chamadaCriterios = manager.save.mock.calls.find((args: unknown[]) => args[0] === AvaliacaoCriterio);
    expect(chamadaCriterios).toBeDefined();
    const criterios = chamadaCriterios![1] as Array<{ criterio: string; nota: number }>;
    expect(criterios.map(({ criterio, nota }) => [criterio, nota])).toEqual([
      ['apresentacao', 8],
      ['metodologia', 7],
      ['conteudo', 9],
      ['resultado', 6],
    ]);
  });

  it('marca a atribuição do avaliador como avaliada', async () => {
    const { service, manager } = criarServico();
    prepararFluxo(manager);

    await service.criarAvaliacao({ avaliadorId: 10, projetoId: 5, ...notas });

    expect(manager.update).toHaveBeenCalledWith(
      AvaliadorProjeto,
      { avaliadorId: 10, projetoId: 5 },
      { status: 'avaliado' },
    );
  });

  it('impede a segunda avaliação do mesmo avaliador no mesmo projeto', async () => {
    const { service, manager } = criarServico();
    prepararFluxo(manager, { jaAvaliado: { id: 1 } });

    await expect(
      service.criarAvaliacao({ avaliadorId: 10, projetoId: 5, ...notas }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rejeita nota fora do passo de 0,5 sem tocar no banco', async () => {
    const { service, manager, dataSource } = criarServico();

    await expect(
      service.criarAvaliacao({ avaliadorId: 10, projetoId: 5, ...notas, conteudo: 7.3 }),
    ).rejects.toThrow('Conteúdo deve seguir o passo de 0,5.');
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rejeita avaliação depois do fim do período do evento', async () => {
    const { service, manager } = criarServico();
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    prepararFluxo(manager, {
      evento: { avaliacao: { inicio: new Date(2020, 0, 1), fim: ontem } },
    });

    await expect(
      service.criarAvaliacao({ avaliadorId: 10, projetoId: 5, ...notas }),
    ).rejects.toThrow('O prazo de avaliação do evento já foi encerrado.');
    expect(manager.save).not.toHaveBeenCalled();
  });
});

describe('AvaliacaoController — rotas', () => {
  it('expõe o contrato /avaliacoes além das rotas atuais', () => {
    const caminhos: string[] = Reflect.getMetadata(PATH_METADATA, AvaliacaoController);
    expect(caminhos).toEqual(expect.arrayContaining(['avaliacao', 'avaliacoes', 'avaliador']));
  });
});

describe('nota.util', () => {
  describe('validarNota', () => {
    it.each([0, 0.5, 7, 9.5, 10])('aceita %p', (nota) => {
      expect(() => validarNota(nota, 'Conteúdo')).not.toThrow();
    });

    it.each([-0.5, 10.5, 11, NaN])('rejeita faixa inválida %p', (nota) => {
      expect(() => validarNota(nota, 'Conteúdo')).toThrow(BadRequestException);
    });

    it.each([7.3, 0.25, 9.7])('rejeita passo diferente de 0,5 (%p)', (nota) => {
      expect(() => validarNota(nota, 'Conteúdo')).toThrow('passo de 0,5');
    });

    it('mensagem cita o nome do campo', () => {
      expect(() => validarNota(12, 'Metodologia')).toThrow('Metodologia deve estar entre 0 e 10.');
    });
  });

  describe('calcularMedia', () => {
    it('faz a média dos quatro critérios', () => {
      expect(calcularMedia([8, 7, 9, 6])).toBe(7.5);
    });

    it('arredonda para uma casa decimal', () => {
      expect(calcularMedia([10, 10, 9, 9.5])).toBe(9.6); // 38.5 / 4 = 9.625
    });

    it('retorna a própria nota quando todas são iguais', () => {
      expect(calcularMedia([5, 5, 5, 5])).toBe(5);
    });
  });
});
