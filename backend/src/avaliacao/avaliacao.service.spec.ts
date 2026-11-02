import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Repository, DataSource } from 'typeorm';
import { AvaliacaoService, calcularMedia, validarNota, validarPeriodoAvaliacao } from './avaliacao.service';
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
    find: jest.fn(),
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

describe('AvaliacaoService — B06 Edição de avaliação', () => {
  const avaliacaoBase = {
    id: 7,
    avaliadorId: 10,
    nota: 7.5,
    createdAt: new Date('2026-06-10T10:00:00'),
    projeto: { id: 5, eventoId: 1 },
  };
  const linhasCompletas = () => [
    { id: 1, criterio: 'apresentacao', nota: 8 },
    { id: 2, criterio: 'metodologia', nota: 7 },
    { id: 3, criterio: 'conteudo', nota: 9 },
    { id: 4, criterio: 'resultado', nota: 6 },
  ];
  const eventoAberto = { avaliacao: { inicio: new Date('2020-01-01'), fim: new Date('2099-12-31') } };
  const eventoEncerrado = { avaliacao: { inicio: new Date('2020-01-01'), fim: new Date('2020-12-31') } };
  const autor = { userId: 10, role: 'avaliador' };
  const coordenacao = { userId: 1, role: 'coordenador' };

  /** Prepara o fluxo transacional: avaliação, evento e critérios existentes. */
  function preparar({ avaliacao = avaliacaoBase as any, evento = eventoAberto as any, linhas = linhasCompletas() as any[] } = {}) {
    const ctx = criarServico();
    ctx.manager.findOne.mockResolvedValueOnce(avaliacao).mockResolvedValueOnce(evento);
    ctx.manager.find.mockResolvedValue(linhas);
    return ctx;
  }

  describe('obterAvaliacao (GET)', () => {
    it('retorna a avaliação com as notas por critério', async () => {
      const { service, avaliacaoRepo, criterioRepo } = criarServico();
      avaliacaoRepo.findOne.mockResolvedValue(avaliacaoBase);
      criterioRepo.find.mockResolvedValue(linhasCompletas());

      await expect(service.obterAvaliacao(7)).resolves.toEqual({
        id: 7,
        projetoId: 5,
        avaliadorId: 10,
        nota: 7.5,
        criterios: { apresentacao: 8, metodologia: 7, conteudo: 9, resultado: 6 },
        createdAt: avaliacaoBase.createdAt,
      });
    });

    it('lança 404 quando a avaliação não existe', async () => {
      const { service, avaliacaoRepo } = criarServico();
      avaliacaoRepo.findOne.mockResolvedValue(null);

      await expect(service.obterAvaliacao(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('atualizarAvaliacao (PATCH)', () => {
    it('autor atualiza uma nota e a média é recalculada', async () => {
      const { service, manager, avaliacaoRepo, criterioRepo } = preparar();
      // Após a atualização, a leitura final devolve o estado novo
      avaliacaoRepo.findOne.mockResolvedValue({ ...avaliacaoBase, nota: 7.8 });
      criterioRepo.find.mockResolvedValue([...linhasCompletas().slice(0, 2), { id: 3, criterio: 'conteudo', nota: 10 }, linhasCompletas()[3]]);

      const resultado = await service.atualizarAvaliacao(7, { conteudo: 10 }, autor);

      expect(manager.update).toHaveBeenCalledWith(AvaliacaoCriterio, { id: 3 }, { nota: 10 });
      // (8 + 7 + 10 + 6) / 4 = 7.75 -> 7.8
      expect(manager.update).toHaveBeenCalledWith(Avaliacao, { id: 7 }, { nota: 7.8 });
      expect(resultado.nota).toBe(7.8);
      expect(resultado.criterios.conteudo).toBe(10);
    });

    it('atualiza várias notas de uma vez', async () => {
      const { service, manager, avaliacaoRepo, criterioRepo } = preparar();
      avaliacaoRepo.findOne.mockResolvedValue({ ...avaliacaoBase, nota: 8 });
      criterioRepo.find.mockResolvedValue([]);

      await service.atualizarAvaliacao(7, { apresentacao: 10, resultado: 6 }, autor);

      // (10 + 7 + 9 + 6) / 4 = 8
      expect(manager.update).toHaveBeenCalledWith(Avaliacao, { id: 7 }, { nota: 8 });
      expect(manager.update).toHaveBeenCalledWith(AvaliacaoCriterio, { id: 1 }, { nota: 10 });
    });

    it('coordenação edita avaliação de outro avaliador, mesmo fora do período', async () => {
      const { service, manager, avaliacaoRepo, criterioRepo } = preparar({ evento: eventoEncerrado as any });
      avaliacaoRepo.findOne.mockResolvedValue(avaliacaoBase);
      criterioRepo.find.mockResolvedValue(linhasCompletas());

      await expect(service.atualizarAvaliacao(7, { metodologia: 8 }, coordenacao)).resolves.toBeDefined();
      expect(manager.update).toHaveBeenCalledWith(AvaliacaoCriterio, { id: 2 }, { nota: 8 });
    });

    it('outro avaliador (não autor) não pode editar', async () => {
      const { service, manager } = preparar();

      await expect(
        service.atualizarAvaliacao(7, { conteudo: 10 }, { userId: 99, role: 'avaliador' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('autor não pode editar depois do fim do período do evento', async () => {
      const { service, manager } = preparar({ evento: eventoEncerrado as any });

      await expect(service.atualizarAvaliacao(7, { conteudo: 10 }, autor)).rejects.toThrow(
        'O prazo de avaliação do evento já foi encerrado.',
      );
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('rejeita nota fora do passo de 0,5 sem abrir transação', async () => {
      const { service, dataSource } = criarServico();

      await expect(service.atualizarAvaliacao(7, { resultado: 6.3 }, autor)).rejects.toThrow(
        'Resultado deve seguir o passo de 0,5.',
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejeita atualização sem nenhuma nota', async () => {
      const { service, dataSource } = criarServico();

      await expect(service.atualizarAvaliacao(7, {}, autor)).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('lança 404 quando a avaliação não existe', async () => {
      const { service, manager } = criarServico();
      manager.findOne.mockResolvedValueOnce(null);

      await expect(service.atualizarAvaliacao(999, { conteudo: 10 }, autor)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('avaliação incompleta (legado) não aceita atualização parcial', async () => {
      const incompleta = linhasCompletas().filter((l) => l.criterio !== 'resultado');
      const { service, manager } = preparar({ linhas: incompleta as any });

      await expect(service.atualizarAvaliacao(7, { conteudo: 10 }, autor)).rejects.toThrow(
        'falta a nota de Resultado',
      );
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('avaliação incompleta (legado) é completada quando a nota faltante é enviada', async () => {
      const incompleta = linhasCompletas().filter((l) => l.criterio !== 'resultado');
      const { service, manager, avaliacaoRepo, criterioRepo } = preparar({ linhas: incompleta as any });
      avaliacaoRepo.findOne.mockResolvedValue(avaliacaoBase);
      criterioRepo.find.mockResolvedValue(linhasCompletas());

      await service.atualizarAvaliacao(
        7,
        { apresentacao: 8, metodologia: 7, conteudo: 9, resultado: 6 },
        autor,
      );

      expect(manager.save).toHaveBeenCalledWith(AvaliacaoCriterio, {
        avaliacao: { id: 7 },
        criterio: 'resultado',
        nota: 6,
      });
    });
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

const agora = new Date('2026-06-15T12:00:00');
const ontem = new Date('2026-06-14T12:00:00');
const amanha = new Date('2026-06-16T12:00:00');

describe('validarPeriodoAvaliacao', () => {
  it('não bloqueia quando o evento não tem período', () => {
    expect(() => validarPeriodoAvaliacao(null, agora)).not.toThrow();
    expect(() => validarPeriodoAvaliacao({ avaliacao: undefined as any }, agora)).not.toThrow();
  });

  it('não bloqueia dentro do período', () => {
    expect(() =>
      validarPeriodoAvaliacao({ avaliacao: { inicio: ontem, fim: amanha } } as any, agora),
    ).not.toThrow();
  });

  it('bloqueia antes do início', () => {
    expect(() =>
      validarPeriodoAvaliacao({ avaliacao: { inicio: amanha, fim: null } } as any, agora),
    ).toThrow(new BadRequestException('O período de avaliação ainda não começou.'));
  });

  it('bloqueia depois do fim', () => {
    expect(() =>
      validarPeriodoAvaliacao({ avaliacao: { inicio: null, fim: ontem } } as any, agora),
    ).toThrow(new BadRequestException('O prazo de avaliação do evento já foi encerrado.'));
  });
});

