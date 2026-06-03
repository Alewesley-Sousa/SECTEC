"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioService = exports.OrientacaoStatus = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var typeorm_2 = require("typeorm");
var user_entity_1 = require("src/users/entities/user.entity");
var evento_entity_1 = require("src/evento/entities/evento.entity");
var projeto_entity_1 = require("src/projetos/entities/projeto.entity");
var projeto_aluno_entity_1 = require("src/projetos/entities/projeto-aluno.entity");
var comissao_evento_entity_1 = require("src/evento/entities/comissao-evento.entity");
var tema_evento_entity_1 = require("src/evento/entities/tema-evento.entity");
// ============================================================================
// ENUMS & INTERFACES
// ============================================================================
var OrientacaoStatus;
(function (OrientacaoStatus) {
    OrientacaoStatus["PENDENTE"] = "pendente";
    OrientacaoStatus["ACEITO"] = "aceito";
})(OrientacaoStatus = exports.OrientacaoStatus || (exports.OrientacaoStatus = {}));
// ============================================================================
// SERVICE
// ============================================================================
var RelatorioService = /** @class */ (function () {
    function RelatorioService(userRepository, eventoRepository, comissaoRepository, temaRepository, projetoRepository) {
        this.userRepository = userRepository;
        this.eventoRepository = eventoRepository;
        this.comissaoRepository = comissaoRepository;
        this.temaRepository = temaRepository;
        this.projetoRepository = projetoRepository;
    }
    /**
     * Busca alunos ativos que não estão vinculados a nenhum projeto do evento vigente.
     * Agrupa o resultado por uma chave combinada de curso e ano.
     */
    RelatorioService.prototype.obterAlunosSemProjeto = function () {
        return __awaiter(this, void 0, Promise, function () {
            var eventoAtual, alunosSemProjeto, agrupado, _i, alunosSemProjeto_1, aluno, curso, ano, chaveTurma;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.obterEventoAtivoAnoCorrente()];
                    case 1:
                        eventoAtual = _a.sent();
                        return [4 /*yield*/, this.userRepository
                                .createQueryBuilder('user')
                                .select(['user.id', 'user.nome', 'user.email_institucional', 'user.ano', 'user.turma'])
                                .where('user.role_cargo = :role', { role: user_entity_1.UserRole.ALUNO })
                                .andWhere('user.ativo = :ativo', { ativo: true })
                                // Garante que o aluno não seja autor de projetos no evento atual
                                .andWhere(function (qb) {
                                var subQueryAutor = qb
                                    .subQuery()
                                    .select('1')
                                    .from(projeto_entity_1.Projeto, 'p')
                                    .where('p.aluno_autor_id = user.id')
                                    .andWhere('p.evento_id = :eventoId', { eventoId: eventoAtual.id })
                                    .getQuery();
                                return "NOT EXISTS ".concat(subQueryAutor);
                            })
                                // Garante que o aluno não seja integrante de projetos no evento atual
                                .andWhere(function (qb) {
                                var subQueryIntegrante = qb
                                    .subQuery()
                                    .select('1')
                                    .from(projeto_aluno_entity_1.ProjetoAluno, 'pa')
                                    .innerJoin('pa.projeto', 'proj')
                                    .where('pa.aluno_id = user.id')
                                    .andWhere('proj.evento_id = :eventoId', { eventoId: eventoAtual.id })
                                    .getQuery();
                                return "NOT EXISTS ".concat(subQueryIntegrante);
                            })
                                .orderBy('user.turma', 'ASC')
                                .addOrderBy('user.ano', 'ASC')
                                .getMany()];
                    case 2:
                        alunosSemProjeto = _a.sent();
                        agrupado = {};
                        for (_i = 0, alunosSemProjeto_1 = alunosSemProjeto; _i < alunosSemProjeto_1.length; _i++) {
                            aluno = alunosSemProjeto_1[_i];
                            curso = aluno.turma ? String(aluno.turma).toLowerCase().trim() : 'indefinido';
                            ano = aluno.ano || '';
                            chaveTurma = "".concat(curso).concat(ano);
                            if (!agrupado[chaveTurma]) {
                                agrupado[chaveTurma] = [];
                            }
                            agrupado[chaveTurma].push({
                                id: aluno.id,
                                nome: aluno.nome,
                                email: aluno.email_institucional,
                                ano: aluno.ano,
                                turma: aluno.turma,
                            });
                        }
                        return [2 /*return*/, agrupado];
                }
            });
        });
    };
    /**
     * Retorna todo o histórico de membros da comissão organizadora agrupados por evento.
     */
    RelatorioService.prototype.obterHistoricoComissao = function () {
        return __awaiter(this, void 0, Promise, function () {
            var historicoBruto, agrupado, _i, historicoBruto_1, registro, evento, aluno, chaveEvento;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.comissaoRepository.find({
                            relations: ['evento', 'user'],
                            order: {
                                evento: { criadoEm: 'DESC' },
                                user: { nome: 'ASC' },
                            },
                        })];
                    case 1:
                        historicoBruto = _a.sent();
                        agrupado = {};
                        for (_i = 0, historicoBruto_1 = historicoBruto; _i < historicoBruto_1.length; _i++) {
                            registro = historicoBruto_1[_i];
                            evento = registro.evento, aluno = registro.user;
                            if (!evento || !aluno)
                                continue;
                            chaveEvento = evento.titulo;
                            if (!agrupado[chaveEvento]) {
                                agrupado[chaveEvento] = {
                                    eventoId: evento.id,
                                    alunos: [],
                                };
                            }
                            agrupado[chaveEvento].alunos.push({
                                id: aluno.id,
                                nome: aluno.nome,
                                email: aluno.email_institucional,
                                turma: aluno.turma,
                                ano: aluno.ano,
                            });
                        }
                        return [2 /*return*/, agrupado];
                }
            });
        });
    };
    /**
     * Calcula métricas quantitativas de projetos (totais, pendentes e aceitos)
     * distribuídas por eixos temáticos e separadas por evento.
     */
    RelatorioService.prototype.obterMetricasEixosTematicos = function () {
        return __awaiter(this, void 0, Promise, function () {
            var resultados, agrupado, _i, resultados_1, row, chaveEvento;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.temaRepository
                            .createQueryBuilder('tema')
                            .innerJoin('tema.evento', 'evento')
                            .select([
                            'tema.id AS temaId',
                            'tema.nome AS temaNome',
                            'evento.id AS eventoId',
                            'evento.titulo AS eventoTitulo',
                        ])
                            // Total de projetos no tema e evento específicos
                            .addSelect(function (qb) {
                            return qb
                                .select('COUNT(p.id)', 'total')
                                .from(projeto_entity_1.Projeto, 'p')
                                .where('p.tema_id = tema.id')
                                .andWhere('p.evento_id = evento.id');
                        }, 'totalProjetos')
                            // Total de projetos com orientações pendentes
                            .addSelect(function (qb) {
                            return qb
                                .select('COUNT(DISTINCT p_pend.id)', 'pendentes')
                                .from(projeto_entity_1.Projeto, 'p_pend')
                                .innerJoin('p_pend.orientadores', 'po_pend')
                                .where('p_pend.tema_id = tema.id')
                                .andWhere('p_pend.evento_id = evento.id')
                                .andWhere('po_pend.status = :statusPendente', { statusPendente: OrientacaoStatus.PENDENTE });
                        }, 'projetosPendentes')
                            // Total de projetos com orientações aceitas
                            .addSelect(function (qb) {
                            return qb
                                .select('COUNT(DISTINCT p_aceito.id)', 'aceitos')
                                .from(projeto_entity_1.Projeto, 'p_aceito')
                                .innerJoin('p_aceito.orientadores', 'po_aceito')
                                .where('p_aceito.tema_id = tema.id')
                                .andWhere('p_aceito.evento_id = evento.id')
                                .andWhere('po_aceito.status = :statusAceito', { statusAceito: OrientacaoStatus.ACEITO });
                        }, 'projetosAceitos')
                            .orderBy('evento.criado_em', 'DESC')
                            .addOrderBy('tema.nome', 'ASC')
                            .getRawMany()];
                    case 1:
                        resultados = _a.sent();
                        agrupado = {};
                        for (_i = 0, resultados_1 = resultados; _i < resultados_1.length; _i++) {
                            row = resultados_1[_i];
                            chaveEvento = row.eventoTitulo;
                            if (!agrupado[chaveEvento]) {
                                agrupado[chaveEvento] = {
                                    eventoId: Number(row.eventoId),
                                    eixos: [],
                                };
                            }
                            agrupado[chaveEvento].eixos.push({
                                temaId: Number(row.temaId),
                                temaNome: row.temaNome,
                                totalProjetos: Number(row.totalProjetos || 0),
                                projetosPendentes: Number(row.projetosPendentes || 0),
                                projetosAceitos: Number(row.projetosAceitos || 0),
                            });
                        }
                        return [2 /*return*/, agrupado];
                }
            });
        });
    };
    /**
     * Lista todos os orientadores ativos e a relação de títulos de projetos
     * aprovados/aceitos sob sua orientação no ano vigente.
     */
    RelatorioService.prototype.obterProjetosPorOrientador = function () {
        return __awaiter(this, void 0, Promise, function () {
            var eventoAtual, orientadoresComProjetos;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.obterEventoAtivoAnoCorrente()];
                    case 1:
                        eventoAtual = _a.sent();
                        return [4 /*yield*/, this.userRepository
                                .createQueryBuilder('user')
                                .leftJoinAndSelect('user.solicitacoesOrientacao', 'solicitacao', 'solicitacao.status = :status', { status: OrientacaoStatus.ACEITO })
                                .leftJoinAndSelect('solicitacao.projeto', 'projeto', 'projeto.evento_id = :eventoId', { eventoId: eventoAtual.id })
                                .where('user.role_cargo = :role', { role: user_entity_1.UserRole.ORIENTADOR })
                                .andWhere('user.ativo = :ativo', { ativo: true })
                                .orderBy('user.nome', 'ASC')
                                .getMany()];
                    case 2:
                        orientadoresComProjetos = _a.sent();
                        return [2 /*return*/, orientadoresComProjetos.map(function (orientador) {
                                var projetosFiltrados = orientador.solicitacoesOrientacao
                                    .filter(function (solicitacao) { return solicitacao.projeto !== null; })
                                    .map(function (solicitacao) { return solicitacao.projeto.titulo; });
                                return {
                                    orientadorId: orientador.id,
                                    orientadorNome: orientador.nome,
                                    email: orientador.email_institucional,
                                    totalProjetosAceitos: projetosFiltrados.length,
                                    projetos: projetosFiltrados,
                                };
                            })];
                }
            });
        });
    };
    /**
     * Consolida métricas de projetos criados vs. aprovados
     * segmentados pela turma e ano do aluno autor.
     */
    RelatorioService.prototype.obterProjetosPorTurma = function () {
        return __awaiter(this, void 0, Promise, function () {
            var eventoAtual, projetos, agrupado, _i, projetos_1, projeto, autor, curso, ano, chaveTurma, possuiAprovacao;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.obterEventoAtivoAnoCorrente()];
                    case 1:
                        eventoAtual = _a.sent();
                        return [4 /*yield*/, this.projetoRepository
                                .createQueryBuilder('projeto')
                                .innerJoinAndSelect('projeto.alunoAutor', 'autor')
                                .leftJoinAndSelect('projeto.orientadores', 'orientador')
                                .where('projeto.evento_id = :eventoId', { eventoId: eventoAtual.id })
                                .getMany()];
                    case 2:
                        projetos = _a.sent();
                        agrupado = {};
                        for (_i = 0, projetos_1 = projetos; _i < projetos_1.length; _i++) {
                            projeto = projetos_1[_i];
                            autor = projeto.alunoAutor;
                            if (!autor)
                                continue;
                            curso = autor.turma ? String(autor.turma).toLowerCase().trim() : 'indefinido';
                            ano = autor.ano || 1;
                            chaveTurma = "".concat(curso).concat(ano);
                            if (!agrupado[chaveTurma]) {
                                agrupado[chaveTurma] = {
                                    turma: curso,
                                    ano: ano,
                                    totalCriados: 0,
                                    totalAprovados: 0,
                                };
                            }
                            agrupado[chaveTurma].totalCriados++;
                            possuiAprovacao = projeto.orientadores.some(function (orientador) { return orientador.status === OrientacaoStatus.ACEITO; });
                            if (possuiAprovacao) {
                                agrupado[chaveTurma].totalAprovados++;
                            }
                        }
                        return [2 /*return*/, agrupado];
                }
            });
        });
    };
    // ============================================================================
    // MÉTODOS AUXILIARES PRIVADOS
    // ============================================================================
    /**
     * Método utilitário reaproveitável para obter o evento ativo do ano vigente.
     * Evita duplicidade de código e facilita manutenções futuras.
     */
    RelatorioService.prototype.obterEventoAtivoAnoCorrente = function () {
        return __awaiter(this, void 0, Promise, function () {
            var anoAtual, inicioAno, fimAno, eventoAtual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        inicioAno = new Date("".concat(anoAtual, "-01-01"));
                        fimAno = new Date("".concat(anoAtual, "-12-31"));
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO,
                                },
                            })];
                    case 1:
                        eventoAtual = _a.sent();
                        if (!eventoAtual) {
                            throw new common_1.NotFoundException("Nenhum evento ativo encontrado para o ano de ".concat(anoAtual, "."));
                        }
                        return [2 /*return*/, eventoAtual];
                }
            });
        });
    };
    RelatorioService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
        __param(1, (0, typeorm_1.InjectRepository)(evento_entity_1.Evento)),
        __param(2, (0, typeorm_1.InjectRepository)(comissao_evento_entity_1.ComissaoEvento)),
        __param(3, (0, typeorm_1.InjectRepository)(tema_evento_entity_1.TemaEvento)),
        __param(4, (0, typeorm_1.InjectRepository)(projeto_entity_1.Projeto))
    ], RelatorioService);
    return RelatorioService;
}());
exports.RelatorioService = RelatorioService;
