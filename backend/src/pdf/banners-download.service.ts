import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';

const archiver = require('archiver');

import { Projeto } from '../projetos/entities/projeto.entity';
import { ProjetoMaterial, StatusMaterial, TipoMaterial } from '../materiais/entities/projeto-material.entity';
import { ProjectFile } from './entities/project-file.entity';
import { GoogleDriveService } from './google-drive.service';
import { EventoStatus } from '../evento/entities/evento.entity';

type ArchiverType = InstanceType<typeof archiver.ZipArchive>;

@Injectable()
export class BannersDownloadService {

    private readonly logger = new Logger(BannersDownloadService.name);

    constructor(
        @InjectRepository(Projeto)
        private readonly projetoRepo: Repository<Projeto>,
        @InjectRepository(ProjetoMaterial)
        private readonly materialRepo: Repository<ProjetoMaterial>,
        @InjectRepository(ProjectFile)
        private readonly projectFileRepo: Repository<ProjectFile>,
        private readonly googleDriveService: GoogleDriveService,
    ) { }

    // ---------------------------------------------------------------
    // Validação pré‑download
    // ---------------------------------------------------------------
    async validar(curso?: string, serie?: string) {
        this.logger.log(`[validar] Iniciando validação. curso=${curso}, serie=${serie}`);
        const [comBanner, semBanner] = await Promise.all([
            this.buscarProjetosComBanner(curso, serie),
            this.buscarProjetosSemBanner(curso, serie),
        ]);

        this.logger.log(`[validar] Resultado: comBanner=${comBanner.length}, semBanner=${semBanner.length}`);

        const faltando = {
            total: semBanner.length,
            primeiros: semBanner.slice(0, 5).map(p => `"${p.titulo}" (ID ${p.id})`),
            restante: Math.max(0, semBanner.length - 5),
        };

        return { incluidos: comBanner.length, faltando };
    }

    // ---------------------------------------------------------------
    // Download do ZIP em streaming
    // ---------------------------------------------------------------
    async gerarZip(res: Response, curso?: string, serie?: string) {
        this.logger.log(`[gerarZip] Iniciando geração do ZIP. curso=${curso}, serie=${serie}`);

        const nomeZip = curso
            ? `banners-sectec-${this.sanitizarNome(curso)}.zip`
            : `banners-sectec.zip`;

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${nomeZip}"`,
        });

        if (res.connection) {
            res.connection.setTimeout(10 * 60 * 1000);
        }

        // Cria uma instância de ZipArchive diretamente (archiver v6+)
        const archive = new archiver.ZipArchive({ zlib: { level: 6 } });

        archive.on('error', (err) => {
            this.logger.error('[gerarZip] Erro no archive', err);
            if (!res.headersSent) res.status(500).end();
        });

        archive.pipe(res);

        const cursos = curso ? [curso] : await this.buscarTodosCursos();
        this.logger.log(`[gerarZip] Cursos a processar: ${cursos.join(', ') || 'nenhum'}`);

        for (const nomeCurso of cursos) {
            await this.adicionarCursoAoZip(archive, nomeCurso, serie);
        }

        this.logger.log('[gerarZip] Finalizando archive...');
        await archive.finalize();
        this.logger.log('[gerarZip] Archive finalizado com sucesso.');
    }

    // ---------------------------------------------------------------
    // Métodos privados
    // ---------------------------------------------------------------

    private async adicionarCursoAoZip(
        archive: ArchiverType,
        nomeCurso: string,
        serieFiltro?: string,
    ) {
        this.logger.log(`[adicionarCursoAoZip] Processando curso=${nomeCurso}, serie=${serieFiltro}`);
        const projetos = await this.buscarProjetosComBanner(nomeCurso, serieFiltro);
        this.logger.log(`[adicionarCursoAoZip] Projetos encontrados: ${projetos.length}`);

        const porSerie = new Map<string, Projeto[]>();
        for (const projeto of projetos) {
            const ano = projeto.alunoAutor.ano;
            const chave = `${ano}º Ano`;
            if (!porSerie.has(chave)) porSerie.set(chave, []);
            porSerie.get(chave)!.push(projeto);
        }

        for (const [serie, projetosDaSerie] of porSerie.entries()) {
            const pastaSerie = `${nomeCurso}/${serie}`;
            this.logger.log(`[adicionarCursoAoZip] Série ${serie}: ${projetosDaSerie.length} projetos`);
            for (const projeto of projetosDaSerie) {
                await this.adicionarBannerAoZip(archive, projeto, pastaSerie);
            }
        }
    }

    private async adicionarBannerAoZip(
        archive: ArchiverType,
        projeto: Projeto,
        pastaSerie: string,
    ) {
        try {
            this.logger.debug(`[adicionarBannerAoZip] Projeto ID=${projeto.id}, título="${projeto.titulo}"`);

            const material = projeto.materiais.find(
                m => m.tipo === TipoMaterial.PDF && m.status === StatusMaterial.APROVADO,
            );
            if (!material) {
                this.logger.warn(`[adicionarBannerAoZip] Projeto ${projeto.id} sem material PDF aprovado`);
                return;
            }

            const arquivo = await this.projectFileRepo.findOne({
                where: { materialId: material.id },
                order: { criadoEm: 'DESC' },
            });
            if (!arquivo?.driveFileId) {
                this.logger.warn(`[adicionarBannerAoZip] Projeto ${projeto.id} sem arquivo no Drive (materialId=${material.id})`);
                return;
            }

            this.logger.debug(`[adicionarBannerAoZip] Baixando stream do Drive: fileId=${arquivo.driveFileId}`);
            const driveStream = await this.googleDriveService.downloadFileStream(arquivo.driveFileId);

            const tituloSanitizado = this.sanitizarNome(projeto.titulo);
            const nomeAluno = this.sanitizarNome(projeto.alunoAutor.nome);
            const nomeArquivo = `banner_${tituloSanitizado}_${nomeAluno}.pdf`;
            const caminhoCompleto = `${pastaSerie}/${nomeArquivo}`;

            this.logger.log(`[adicionarBannerAoZip] Adicionando ao ZIP: ${caminhoCompleto}`);
            archive.append(driveStream, { name: caminhoCompleto });
        } catch (error) {
            this.logger.error(`[adicionarBannerAoZip] Falha ao adicionar banner do projeto ${projeto.id}: ${error.message}`, error.stack);
        }
    }

    // ---------------------------------------------------------------
    // Queries (CORRIGIDAS)
    // ---------------------------------------------------------------

    private async buscarProjetosComBanner(curso?: string, serie?: string) {
        this.logger.debug(`[buscarProjetosComBanner] curso=${curso}, serie=${serie}`);

        const qb = this.projetoRepo.createQueryBuilder('projeto')
            .leftJoinAndSelect('projeto.alunoAutor', 'aluno')
            .leftJoinAndSelect('projeto.materiais', 'material')
            .leftJoinAndSelect('projeto.evento', 'evento')
            .where('evento.status = :statusAtivo', { statusAtivo: EventoStatus.ATIVO })
            .andWhere('material.tipo = :tipo', { tipo: TipoMaterial.PDF })
            .andWhere('material.status = :status', { status: StatusMaterial.APROVADO });

        // CORREÇÃO: usar 'aluno.turma' em vez de 'aluno.curso'
        if (curso) {
            qb.andWhere('aluno.turma = :turma', { turma: curso });
        }
        if (serie) {
            qb.andWhere('aluno.ano = :ano', { ano: serie });
        }

        const result = await qb.getMany();
        this.logger.debug(`[buscarProjetosComBanner] Retornou ${result.length} projetos`);
        return result;
    }

    private async buscarProjetosSemBanner(curso?: string, serie?: string) {
        this.logger.debug(`[buscarProjetosSemBanner] curso=${curso}, serie=${serie}`);

        const comBanner = await this.buscarProjetosComBanner(curso, serie);
        const idsComBanner = comBanner.map(p => p.id);

        const qb = this.projetoRepo.createQueryBuilder('projeto')
            .leftJoinAndSelect('projeto.alunoAutor', 'aluno')
            .leftJoinAndSelect('projeto.evento', 'evento')
            .where('evento.status = :statusAtivo', { statusAtivo: EventoStatus.ATIVO });

        // CORREÇÃO: usar 'aluno.turma'
        if (curso) qb.andWhere('aluno.turma = :turma', { turma: curso });
        if (serie) qb.andWhere('aluno.ano = :ano', { ano: serie });

        if (idsComBanner.length) {
            qb.andWhere('projeto.id NOT IN (:...ids)', { ids: idsComBanner });
        }

        const result = await qb.getMany();
        this.logger.debug(`[buscarProjetosSemBanner] Retornou ${result.length} projetos`);
        return result;
    }

    private async buscarTodosCursos(): Promise<string[]> {
        this.logger.debug('[buscarTodosCursos] Buscando cursos com projetos no evento ativo...');
        const projetos = await this.buscarProjetosComBanner();
        const cursosSet = new Set<string>();
        for (const projeto of projetos) {
            // O campo 'turma' da entidade User contém o nome do curso
            const nomeTurma = projeto.alunoAutor?.turma;
            if (nomeTurma) {
                cursosSet.add(nomeTurma);
            }
        }
        const cursos = Array.from(cursosSet);
        this.logger.log(`[buscarTodosCursos] Cursos encontrados: ${cursos.join(', ') || 'nenhum'}`);
        return cursos;
    }

    // Sanitização para nomes de arquivos/pastas
    private sanitizarNome(texto: string): string {
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .toLowerCase();
    }
}