// src/materiais/materiais.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';

import {
  ProjetoMaterial,
  StatusMaterial,
  TipoMaterial,
} from './entities/projeto-material.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { PdfService } from '../pdf/pdf.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { AvaliarMaterialDto, DecisaoAvaliacao } from
'./dto/avaliar-material.dto'; // <- Importe o DTO e o Enum
import { Repository, Between } from 'typeorm'; // 🚀 ADICIONE O BETWEEN AQUI
import { EventoStatus } from '../evento/entities/evento.entity'; // 🚀 ADICIONE ESTA LINHA

const PRAZO_CANCELAMENTO_MATERIAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MateriaisService {
  constructor(
    @InjectRepository(ProjetoMaterial)
    private readonly materiaisRepository: Repository<ProjetoMaterial>,

    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,

    private readonly pdfService: PdfService,
  ) {}

  /**
   * Orquestra o fluxo de gerenciamento de materiais acadêmicos.
   * Identifica automaticamente se a requisição se trata de uma primeira entrega ou de uma substituição.
   * 
   * @param file Arquivo binário opcional enviado via interceptor (Multer).
   * @param dto Dados de transferência contendo o ID do projeto, tipo e conteúdo do material.
   * @param userId ID do aluno autenticado realizando a ação.
   * @returns Resposta padronizada com o status do processamento local e na nuvem.
   */
  async criarMaterial(
    file: Express.Multer.File | undefined,
    dto: CreateMaterialDto,
    userId: number,
  ) {
    const projetoIdNum = Number(dto.projetoId);

    // 1. Validações preliminares obrigatórias
    const projeto = await this.buscarEValidarProjeto(projetoIdNum, file);
    this.validarPeriodoAberto(projeto.evento?.submissao, 'submissao');
    this.validarPayloadPorTipo(dto.tipo, dto.conteudo, file);

    // 2. Busca se já existe um material do mesmo tipo para o projeto
    const materialExistente = await this.materiaisRepository.findOne({
      where: { projeto: { id: projetoIdNum }, tipo: dto.tipo },
    });

    // 3. Desvia o fluxo baseado na existência do material (Substituição vs Criação)
    if (materialExistente) {
      return this.processarSubstituicaoMaterial(materialExistente, projeto, file, dto, userId);
    }

    return this.processarCriacaoMaterial(projeto, file, dto, userId);
  }

  /**
   * Permite ao aluno cancelar o envio de um material acadêmico feito por engano.
   * Valida se a entrega ainda está em análise e se foi realizada há menos de 1 dia.
   * Remove de forma limpa o registro e expurga o arquivo binário do Google Drive.
   * 
   * @param materialId ID numérico do material a ser cancelado.
   * @returns Resposta de confirmação da remoção.
   */
  async cancelarMaterial(materialId: number, userId: number): Promise<{ mensagem: string }> {
    // 1. Busca o material alvo no banco de dados
    const material = await this.materiaisRepository.findOne({
      where: { id: materialId },
      relations: ['projeto', 'projeto.alunoAutor'],
    });

    if (!material) {
      throw new NotFoundException(`Material com ID ${materialId} não foi encontrado.`);
    }

	if (material.projeto && material.projeto.alunoAutor.id !== userId) {
		console.log('ID do Aluno Logado (JWT):', typeof userId, userId);
console.log('ID do Autor no Banco:', typeof material.projeto.alunoAutor.id, material.projeto.alunoAutor.id);

  throw new ForbiddenException(
    'Você não tem permissão para cancelar este material, pois não é o autor do projeto.',
  );
}
	
	
    // 2. Impede o cancelamento caso o orientador já tenha alterado o status (aprovado/recusado)
    if (material.status !== StatusMaterial.EM_ANALISE) {
      throw new ConflictException(
        `Este material não pode ser cancelado pois já foi avaliado ou está com status '${material.status}'.`,
      );
    }

    // 3. Validação matemática do teto limite de 1 dia.
    const agora = new Date();
    const tempoDecorridoMs = agora.getTime() - new Date(material.criadoEm).getTime();

    if (tempoDecorridoMs > PRAZO_CANCELAMENTO_MATERIAL_MS) {
      throw new BadRequestException(
        'O prazo limite de 1 dia para o cancelamento deste material expirou.',
      );
    }

    // 4. Se o tipo exigir arquivo binário, faz a limpeza na nuvem (Google Drive) e na tabela de arquivos
    if (this.verificarSeTipoExigeArquivo(material.tipo)) {
      const arquivoBanco = await this.pdfService.projectFileRepository.findOne({
        where: { materialId: material.id },
        order: { criadoEm: 'DESC' },
      });

      if (arquivoBanco && arquivoBanco.driveFileId) {
        try {
          // Acessa dinamicamente a propriedade privada ou instanciada do googleDriveService contida no PdfService
          await this.pdfService['googleDriveService'].deleteFile(arquivoBanco.driveFileId);
        } catch (driveError) {
          // Silencia o erro caso o arquivo físico já tenha sido removido manualmente ou não seja localizado
        }
        // Remove os metadados do arquivo atrelado
        await this.pdfService.projectFileRepository.remove(arquivoBanco);
      }
    }

    // 5. Deleta definitivamente o material da tabela
    await this.materiaisRepository.remove(material);

    return {
      mensagem: 'Entrega do material cancelada e removida com sucesso.',
    };
  }

  async findMateriaisPorOrientador(
    orientadorId: number,
  ): Promise<ProjetoMaterial[]> {
    return this.materiaisRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.projeto', 'projeto')
      .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
      .leftJoinAndSelect('projeto.projetoAlunos', 'projetoAlunos')
      .leftJoinAndSelect('projetoAlunos.aluno', 'aluno')
      .leftJoinAndSelect('projeto.tema', 'tema')
      .leftJoinAndSelect('projeto.orientadores', 'projetoOrientador')
      .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
      .where('orientador.id = :orientadorId', { orientadorId })
      .andWhere('projetoOrientador.status = :statusAceito', { statusAceito: 'aceito' })
      .orderBy('material.criadoEm', 'DESC')
      .getMany();
  }

  // =========================================================================
  // MÉTODOS PRIVADOS DE FLUXO DE NEGÓCIO (CORE LOGIC)
  // =========================================================================

  /**
   * Trata o fluxo de reentrega de um material que foi previamente recusado pelo orientador.
   */
  // src/materiais/materiais.service.ts -> Método: processarSubstituicaoMaterial

  private async processarSubstituicaoMaterial(
    material: ProjetoMaterial,
    projeto: Projeto,
    file: Express.Multer.File | undefined,
    dto: CreateMaterialDto,
    userId: number,
  ) {
    if (material.status !== StatusMaterial.RECUSADO) {
      this.removerArquivoTemporario(file);
      throw new ConflictException(
        `Já existe um material do tipo '${dto.tipo}' pendente de análise ou já aprovado.`,
      );
    }

    // 1. CORREÇÃO CRÍTICA: Em vez de usar .save() no objeto carregado (que arrasta relações zumbis),
    // usamos o .update() cirúrgico passando apenas as colunas que pertencem estritamente a esta tabela.
    await this.materiaisRepository.update(material.id, {
      status: StatusMaterial.EM_ANALISE,
      opiniao: '',
      conteudo: dto.conteudo || `Arquivo ${dto.tipo} atualizado enviado para avaliação.`,
      criadoEm: new Date(),
    });

    // Recarrega o material limpo, sem nenhuma propriedade mutada que confunda o ORM
    const materialAtualizado = await this.materiaisRepository.findOne({
      where: { id: material.id }
    });

    if (!materialAtualizado) {
      throw new NotFoundException('Erro ao recarregar o material atualizado.');
    }

    if (this.verificarSeTipoExigeArquivo(dto.tipo) && file) {
      try {
        let dadosArquivoDrive;

        const possuiArquivoNoBanco = await this.pdfService.projectFileRepository.findOne({
          where: { 
            materialId: materialAtualizado.id,
            projetoId: projeto.id 
          },
          order: { criadoEm: 'DESC' }
        });

        if (possuiArquivoNoBanco && possuiArquivoNoBanco.driveFileId) {
          dadosArquivoDrive = await this.pdfService.substituirProjectPdf(file, {
            materialId: materialAtualizado.id,
            projetoId: projeto.id,
            uploadedBy: userId,
          }, projeto);
        } else {
          dadosArquivoDrive = await this.pdfService.uploadExistingProjectPdf(file, {
            materialId: materialAtualizado.id,
            projetoId: projeto.id,
            uploadedBy: userId,
          });
        }

        return {
          mensagem: 'Nova versão do arquivo PDF substituída e enviada com sucesso!',
          material: materialAtualizado,
          arquivo: dadosArquivoDrive,
        };
      } catch (error) {
        await this.tratarFalhaEnvioDrive(materialAtualizado, `Falha na substituição do arquivo na nuvem: ${error.message}`);
        throw new BadRequestException({
          message: 'Material updated locally, but disk or cloud substitution failed.',
          detalheDoErroReal: error.message
        });
      }
    }

    return {
      mensagem: 'Link do material atualizado com sucesso!',
      material: materialAtualizado,
    };
  }


  /**
   * Trata o fluxo de primeira entrega de um material para o projeto.
   */
  private async processarCriacaoMaterial(
    projeto: Projeto,
    file: Express.Multer.File | undefined,
    dto: CreateMaterialDto,
    userId: number,
  ) {
    // Valida o teto regulamentar de entregas do projeto
    await this.validarLimiteMaximoMateriais(projeto.id, file);

    const novoMaterial = this.materiaisRepository.create({
      projeto: projeto,
      tipo: dto.tipo,
      status: StatusMaterial.EM_ANALISE,
      conteudo: dto.conteudo || `Arquivo ${dto.tipo} enviado para avaliação.`,
      opiniao: 'Aguardando avaliação do orientador.',
    });
    
    const materialSalvo = await this.materiaisRepository.save(novoMaterial);

    // Se o tipo exigir arquivo, faz o upload inicial para o Google Drive
    if (this.verificarSeTipoExigeArquivo(dto.tipo) && file) {
      try {
        const dadosArquivoDrive = await this.pdfService.uploadExistingProjectPdf(file, {
          materialId: materialSalvo.id,
          projetoId: projeto.id,
          uploadedBy: userId,
        });

        return {
          mensagem: 'Material e arquivo PDF salvos com sucesso!',
          material: materialSalvo,
          arquivo: dadosArquivoDrive,
        };
      } catch (error) {
        await this.tratarFalhaEnvioDrive(materialSalvo, `Falha crítica de upload: ${error.message}`);
        throw new BadRequestException('Material criado localmente, mas o envio ao Drive failed.');
      }
    }

    return {
      mensagem: 'Material do tipo link registrado com sucesso!',
      material: materialSalvo,
    };
  }

  // =========================================================================
  // MÉTODOS PRIVADOS DE VALIDAÇÃO E SUPORTE (HELPERS)
  // =========================================================================

  /**
   * Garante a existência do projeto alvo no banco de dados.
   */
  private async buscarEValidarProjeto(projetoId: number, file: Express.Multer.File | undefined): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
      relations: ['evento'],
    });
    if (!projeto) {
      this.removerArquivoTemporario(file);
      throw new NotFoundException(`Projeto com ID ${projetoId} não foi encontrado.`);
    }
    return projeto;
  }

  private normalizarDataPeriodo(
    value?: Date | string | null,
    endOfDay = false,
  ): Date | null {
    if (!value) return null;

    const date = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date;
  }

  private validarPeriodoAberto(
    periodo: { inicio?: Date | string | null; fim?: Date | string | null } | null | undefined,
    nomePeriodo: string,
  ) {
    const inicio = this.normalizarDataPeriodo(periodo?.inicio);
    const fim = this.normalizarDataPeriodo(periodo?.fim, true);
    const agora = new Date();

    if (!inicio || !fim) {
      throw new BadRequestException(`O prazo de ${nomePeriodo} nao esta definido.`);
    }

    if (agora < inicio) {
      throw new BadRequestException(
        `O prazo de ${nomePeriodo} ainda nao comecou. (Inicio: ${inicio.toLocaleString()})`,
      );
    }

    if (agora > fim) {
      throw new BadRequestException(
        `O prazo de ${nomePeriodo} encerrou em ${fim.toLocaleString()}.`,
      );
    }
  }

  /**
   * Aplica as regras de integridade do payload de acordo com a categoria do material entregue.
   */
  private validarPayloadPorTipo(tipo: TipoMaterial, conteudo: string | undefined, file: Express.Multer.File | undefined): void {
    if (tipo === TipoMaterial.LINK && !conteudo) {
      throw new BadRequestException('Para materiais do tipo link, o campo conteúdo (URL) é obrigatório.');
    }

    if (this.verificarSeTipoExigeArquivo(tipo) && !file) {
      throw new BadRequestException(`O envio do arquivo físico PDF é obrigatório para o tipo '${tipo}'.`);
    }
  }

  /**
   * Valida se o projeto respeita a restrição acadêmica de no máximo 3 entregas de materiais.
   */
  private async validarLimiteMaximoMateriais(projetoId: number, file: Express.Multer.File | undefined): Promise<void> {
    const totalMateriais = await this.materiaisRepository.count({
      where: { projeto: { id: projetoId } },
    });

    if (totalMateriais >= 3) {
      this.removerArquivoTemporario(file);
      throw new BadRequestException('Este projeto já atingiu o limite máximo de 3 materiais entregues.');
    }
  }

  /**
   * Determina de forma centralizada se um determinado tipo de material exige persistência de arquivo físico.
   */
  private verificarSeTipoExigeArquivo(tipo: TipoMaterial): boolean {
    return tipo === TipoMaterial.PDF || tipo === TipoMaterial.RELATORIO;
  }

  /**
   * Executa o rollback parcial de status caso ocorra um erro de comunicação com a API do Google Drive.
   */
  private async tratarFalhaEnvioDrive(material: ProjetoMaterial, motivoErro: string): Promise<void> {
    material.status = StatusMaterial.RECUSADO;
    material.opiniao = motivoErro;
    await this.materiaisRepository.save(material);
  }

  /**
   * Remove arquivos órfãos do armazenamento local temporário para evitar desperdício de espaço em disco.
   */
  private removerArquivoTemporario(file: Express.Multer.File | undefined): void {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
  
    /**
   * Permite ao orientador avaliar um material acadêmico enviado pelo aluno.
   * Altera o status para APROVADO ou RECUSADO. Caso seja recusado, exige uma opinião descritiva.
   * 
   * @param materialId ID do material enviado.
   * @param dto Dados da avaliação (Decisão e Opinião).
   */
  async avaliarMaterial(materialId: number, dto: AvaliarMaterialDto) {
    // 1. Busca o material alvo no banco de dados
    const material = await this.materiaisRepository.findOne({
      where: { id: materialId },
      relations: ['projeto', 'projeto.evento'],
    });

    if (!material) {
      throw new NotFoundException(`Material com ID ${materialId} não foi encontrado.`);
    }


    if (material.status !== StatusMaterial.EM_ANALISE) {
      throw new ConflictException(
        `Este material não pode ser avaliado pois já encontra-se com o status '${material.status}'.`,
      );
    }

    // 3. Aplica a alteração de estado com base na decisão do DTO
    if (dto.decisao === DecisaoAvaliacao.APROVAR) {
      material.status = StatusMaterial.APROVADO;
      material.opiniao = 'Material avaliado e aprovado pelo orientador responsável.';
    } else {
      material.status = StatusMaterial.RECUSADO;
      material.opiniao = dto.opiniao!; // Garantido pelo ValidateIf do class-validator
    }

    // 4. Salva a nova situação do material no banco
    const materialAvaliado = await this.materiaisRepository.save(material);

    return {
      mensagem: `Material avaliado com sucesso! Status atualizado para: ${materialAvaliado.status}.`,
      material: materialAvaliado,
    };
  }
  
  
  
  
    /**
   * Retorna todos os projetos do evento atual nos quais o professor logado é o orientador aceito,
   * trazendo anexados apenas os materiais que estão aguardando avaliação (status 'em_analise').
   * 
   * @param orientadorId ID do professor extraído do token JWT.
   */
  async listarMateriaisPendentesPorOrientador(orientadorId: number): Promise<Projeto[]> {
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01 00:00:00`;
    const fimAno = `${anoAtual}-12-31 23:59:59`;

    // Buscamos os projetos direto da tabela de projetos aplicando os filtros cruzados
    const projetosComMateriaisPendentes = await this.projetoRepository.find({
      where: {
        // 1. Filtra apenas projetos do evento ativo do ano corrente
        evento: {
          status: EventoStatus.ATIVO,
          inscricao: {
            inicio: Between(new Date(inicioAno), new Date(fimAno)),
          },
        },
        // 2. Garante a segurança: o orientador logado precisa ter dado "aceito" na solicitação
        orientadores: {
          orientador: { id: orientadorId },
          status: 'aceito',
        },
        // 3. Só traz o projeto se ele tiver pelo menos um material pendente
        materiais: {
          status: StatusMaterial.EM_ANALISE,
        },
      },
      // Carrega as relações necessárias para o orientador saber o que está avaliando
      relations: {
        alunoAutor: true,
        materiais: true,
      },
      // Seleciona campos limpos para não expor senhas ou dados desnecessários
      select: {
        id: true,
        titulo: true,
        descricao: true,
        alunoAutor: {
          id: true,
          nome: true,
          turma: true,
          ano: true,
        },
        materiais: {
          id: true,
          tipo: true,
          status: true,
          conteudo: true,
          criadoEm: true,
        },
      },
      // Ordena pelos materiais mais antigos primeiro (fila de prioridade por chegada)
      order: {
        materiais: {
          criadoEm: 'ASC',
        },
      },
    });

    return projetosComMateriaisPendentes;
  }


async listarPorProjeto(projetoId: number) {
  const materiais = await this.materiaisRepository.find({
    where: { projeto: { id: projetoId } },
    order: { criadoEm: 'DESC' },
  });

  // Busca os arquivos do Drive para cada material
  const materiaisComLink = await Promise.all(
    materiais.map(async (material) => {
      const arquivo = await this.pdfService.projectFileRepository.findOne({
        where: { materialId: material.id },
        order: { criadoEm: 'DESC' },
      });
      return {
        ...material,
        driveLink: arquivo?.driveWebViewLink ?? null,
      };
    })
  );

  return materiaisComLink;
}


}
