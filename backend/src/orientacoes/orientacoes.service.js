<<<<<<< HEAD
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
exports.OrientacoesService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var typeorm_2 = require("typeorm");
var evento_entity_1 = require("../evento/entities/evento.entity");
var projeto_orientador_entity_1 = require("./entities/projeto-orientador.entity");
var user_entity_1 = require("../users/entities/user.entity"); // Ajuste o caminho correto se necessário
var projeto_entity_1 = require("../projetos/entities/projeto.entity"); // Ajuste o caminho correto se necessário
var OrientacoesService = /** @class */ (function () {
    function OrientacoesService(orientacoesRepository, userRepository, // 👈 Adicionado
    projetoRepository) {
        this.orientacoesRepository = orientacoesRepository;
        this.userRepository = userRepository;
        this.projetoRepository = projetoRepository;
    }
    OrientacoesService.prototype.findMinhasPendentes = function (orientadorId) {
        return __awaiter(this, void 0, Promise, function () {
            var anoAtual, totalAceitosEsteAno;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        return [4 /*yield*/, this.orientacoesRepository.createQueryBuilder('po')
                                .innerJoin('po.projeto', 'projeto')
                                .innerJoin('projeto.evento', 'evento')
                                .where('po.orientador_id = :orientadorId', { orientadorId: orientadorId })
                                .andWhere('po.status = :statusAceito', { statusAceito: projeto_orientador_entity_1.StatusOrientacao.ACEITO })
                                .andWhere('evento.status = :eventoStatus', { eventoStatus: 'ativo' })
                                .andWhere('evento.prazoInicial BETWEEN :inicioAno AND :fimAno', {
                                inicioAno: "".concat(anoAtual, "-01-01"),
                                fimAno: "".concat(anoAtual, "-12-31"),
                            })
                                .getCount()];
                    case 1:
                        totalAceitosEsteAno = _a.sent();
                        // Se já atingiu a meta de 4 ou mais orientações aceitas, esconde as pendências ocultando a lista
                        if (totalAceitosEsteAno >= 4) {
                            return [2 /*return*/, []];
                        }
                        // Se tiver menos de 4 aceitos, continua a execução normal da sua query existente
                        return [2 /*return*/, this.orientacoesRepository.createQueryBuilder('projetoOrientador')
                                .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
                                .leftJoinAndSelect('projetoOrientador.projeto', 'projeto')
                                .leftJoinAndSelect('projeto.evento', 'evento')
                                .leftJoinAndSelect('projeto.tema', 'tema')
                                .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
                                .leftJoinAndSelect('projeto.projetoAlunos', 'projetoAlunos')
                                .leftJoinAndSelect('projetoAlunos.aluno', 'aluno')
                                // 1. Filtros básicos: id do orientador e status pendente
                                .where('orientador.id = :orientadorId', { orientadorId: orientadorId })
                                .andWhere('projetoOrientador.status = :statusPendente', { statusPendente: projeto_orientador_entity_1.StatusOrientacao.PENDENTE })
                                // 2. FILTRO DO ANO ATUAL: Filtra pelo status ATIVO do evento e garante que ele está no range do ano corrente
                                .andWhere('evento.status = :eventoStatus', { eventoStatus: 'ativo' })
                                .andWhere('evento.prazoInicial BETWEEN :inicioAno AND :fimAno', {
                                inicioAno: "".concat(anoAtual, "-01-01"),
                                fimAno: "".concat(anoAtual, "-12-31"),
                            })
                                // 3. Validação de concorrência (Se outra pessoa já aceitou, limpa da lista)
                                .andWhere(function (qb) {
                                var subQuery = qb
                                    .subQuery()
                                    .select('1')
                                    .from(projeto_orientador_entity_1.ProjetoOrientador, 'subPo')
                                    .where('subPo.projeto_id = projeto.id')
                                    .andWhere('subPo.status = :statusAceito', { statusAceito: projeto_orientador_entity_1.StatusOrientacao.ACEITO })
                                    .getQuery();
                                return "NOT EXISTS ".concat(subQuery);
                            })
                                .getMany()];
                }
            });
        });
    };
    OrientacoesService.prototype.findMinhasOrientacoes = function (orientadorId) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.orientacoesRepository.find({
                        where: { orientador: { id: orientadorId } },
                        relations: [
                            'projeto',
                            'projeto.evento',
                            'projeto.tema',
                            'projeto.alunoAutor',
                            'projeto.projetoAlunos',
                            'projeto.projetoAlunos.aluno',
                            'orientador',
                        ],
                        order: { criadoEm: 'DESC' },
                    })];
            });
        });
    };
    OrientacoesService.prototype.responder = function (id, orientadorId, dto) {
        return __awaiter(this, void 0, Promise, function () {
            var orientacao, jaPossuiOrientador;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.orientacoesRepository.findOne({
                            where: { id: id },
                            relations: [
                                'projeto',
                                'projeto.evento',
                                'projeto.tema',
                                'projeto.alunoAutor',
                                'projeto.projetoAlunos',
                                'projeto.projetoAlunos.aluno',
                                'orientador',
                            ],
                        })];
                    case 1:
                        orientacao = _a.sent();
                        if (!orientacao) {
                            throw new common_1.NotFoundException('Orientação não encontrada');
                        }
                        if (orientacao.orientador.id !== orientadorId) {
                            throw new common_1.ForbiddenException('Você não pode responder esta orientação');
                        }
                        if (orientacao.status !== projeto_orientador_entity_1.StatusOrientacao.PENDENTE) {
                            throw new common_1.BadRequestException('Esta orientação já foi respondida');
                        }
                        if (!(dto.action === projeto_orientador_entity_1.StatusOrientacao.ACEITO)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.orientacoesRepository.exists({
                                where: {
                                    projeto: { id: orientacao.projeto.id },
                                    status: projeto_orientador_entity_1.StatusOrientacao.ACEITO,
                                },
                            })];
                    case 2:
                        jaPossuiOrientador = _a.sent();
                        if (jaPossuiOrientador) {
                            throw new common_1.BadRequestException('Este projeto já foi aceito por outro orientador.');
                        }
                        // Se passou na checagem, recusa todas as outras solicitações pendentes deste projeto
                        return [4 /*yield*/, this.orientacoesRepository
                                .createQueryBuilder()
                                .update(projeto_orientador_entity_1.ProjetoOrientador)
                                .set({ status: projeto_orientador_entity_1.StatusOrientacao.RECUSADO, respondidoEm: new Date() })
                                .where('projeto_id = :projetoId', { projetoId: orientacao.projeto.id })
                                .andWhere('status = :status', { status: projeto_orientador_entity_1.StatusOrientacao.PENDENTE })
                                .andWhere('id != :id', { id: orientacao.id })
                                .execute()];
                    case 3:
                        // Se passou na checagem, recusa todas as outras solicitações pendentes deste projeto
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        // Atualiza o status da solicitação atual
                        orientacao.status = dto.action;
                        orientacao.respondidoEm = new Date();
                        return [2 /*return*/, this.orientacoesRepository.save(orientacao)];
                }
            });
        });
    };
    OrientacoesService.prototype.listarDisponiveisParaAluno = function (alunoId) {
        return __awaiter(this, void 0, void 0, function () {
            var anoAtual, projetoAluno, orientadoresRecusadosIds, vinculosRecusados, query, orientadores;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        return [4 /*yield*/, this.projetoRepository.findOne({
                                where: {
                                    alunoAutor: { id: alunoId },
                                    evento: {
                                        status: evento_entity_1.EventoStatus.ATIVO,
                                        prazoInicial: (0, typeorm_2.Between)(new Date("".concat(anoAtual, "-01-01T00:00:00")), new Date("".concat(anoAtual, "-12-31T23:59:59")))
                                    }
                                },
                                relations: ['evento'],
                            })];
                    case 1:
                        projetoAluno = _a.sent();
                        orientadoresRecusadosIds = [];
                        if (!projetoAluno) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.orientacoesRepository.find({
                                where: {
                                    projeto: { id: projetoAluno.id },
                                    status: projeto_orientador_entity_1.StatusOrientacao.RECUSADO,
                                },
                                relations: ['orientador'],
                            })];
                    case 2:
                        vinculosRecusados = _a.sent();
                        orientadoresRecusadosIds = vinculosRecusados.map(function (v) { return v.orientador.id; });
                        _a.label = 3;
                    case 3:
                        query = this.userRepository.createQueryBuilder('orientador')
                            .innerJoinAndSelect('orientador.temasSelecionados', 'tema')
                            .innerJoin('tema.evento', 'evento')
                            .where('orientador.role_cargo = :role', { role: 'orientador' }) // Busca TODOS do cargo orientador
                            .andWhere('evento.status = :eventoStatus', { eventoStatus: evento_entity_1.EventoStatus.ATIVO })
                            .andWhere('evento.prazo_inicial BETWEEN :inicioAno AND :fimAno', {
                            inicioAno: "".concat(anoAtual, "-01-01 00:00:00"),
                            fimAno: "".concat(anoAtual, "-12-31 23:59:59"),
                        });
                        // 4. Regra de Exclusão: Retira da lista Geral APENAS quem recusou (se houver alguém)
                        if (orientadoresRecusadosIds.length > 0) {
                            query.andWhere('orientador.id NOT IN (:...recusados)', { recusados: orientadoresRecusadosIds });
                        }
                        return [4 /*yield*/, query.getMany()];
                    case 4:
                        orientadores = _a.sent();
                        // 5. Retorna a lista completa com id, nome e temas mapeados
                        return [2 /*return*/, orientadores.map(function (ori) { return ({
                                id: ori.id,
                                nome: ori.nome,
                                temas: ori.temasSelecionados.map(function (t) { return ({
                                    id: t.id,
                                    nome: t.nome,
                                }); }),
                            }); })];
                }
            });
        });
    };
    OrientacoesService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(projeto_orientador_entity_1.ProjetoOrientador)),
        __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
        __param(2, (0, typeorm_1.InjectRepository)(projeto_entity_1.Projeto))
    ], OrientacoesService);
    return OrientacoesService;
}());
exports.OrientacoesService = OrientacoesService;
=======
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
exports.OrientacoesService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var typeorm_2 = require("typeorm");
var evento_entity_1 = require("../evento/entities/evento.entity");
var projeto_orientador_entity_1 = require("./entities/projeto-orientador.entity");
var user_entity_1 = require("../users/entities/user.entity"); // Ajuste o caminho correto se necessário
var projeto_entity_1 = require("../projetos/entities/projeto.entity"); // Ajuste o caminho correto se necessário
var OrientacoesService = /** @class */ (function () {
    function OrientacoesService(orientacoesRepository, userRepository, // 👈 Adicionado
    projetoRepository) {
        this.orientacoesRepository = orientacoesRepository;
        this.userRepository = userRepository;
        this.projetoRepository = projetoRepository;
    }
    OrientacoesService.prototype.findMinhasPendentes = function (orientadorId) {
        return __awaiter(this, void 0, Promise, function () {
            var anoAtual, totalAceitosEsteAno;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        return [4 /*yield*/, this.orientacoesRepository.createQueryBuilder('po')
                                .innerJoin('po.projeto', 'projeto')
                                .innerJoin('projeto.evento', 'evento')
                                .where('po.orientador_id = :orientadorId', { orientadorId: orientadorId })
                                .andWhere('po.status = :statusAceito', { statusAceito: projeto_orientador_entity_1.StatusOrientacao.ACEITO })
                                .andWhere('evento.status = :eventoStatus', { eventoStatus: 'ativo' })
                                .andWhere('evento.prazoInicial BETWEEN :inicioAno AND :fimAno', {
                                inicioAno: "".concat(anoAtual, "-01-01"),
                                fimAno: "".concat(anoAtual, "-12-31"),
                            })
                                .getCount()];
                    case 1:
                        totalAceitosEsteAno = _a.sent();
                        // Se já atingiu a meta de 4 ou mais orientações aceitas, esconde as pendências ocultando a lista
                        if (totalAceitosEsteAno >= 4) {
                            return [2 /*return*/, []];
                        }
                        // Se tiver menos de 4 aceitos, continua a execução normal da sua query existente
                        return [2 /*return*/, this.orientacoesRepository.createQueryBuilder('projetoOrientador')
                                .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
                                .leftJoinAndSelect('projetoOrientador.projeto', 'projeto')
                                .leftJoinAndSelect('projeto.evento', 'evento')
                                .leftJoinAndSelect('projeto.tema', 'tema')
                                .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
                                .leftJoinAndSelect('projeto.projetoAlunos', 'projetoAlunos')
                                .leftJoinAndSelect('projetoAlunos.aluno', 'aluno')
                                // 1. Filtros básicos: id do orientador e status pendente
                                .where('orientador.id = :orientadorId', { orientadorId: orientadorId })
                                .andWhere('projetoOrientador.status = :statusPendente', { statusPendente: projeto_orientador_entity_1.StatusOrientacao.PENDENTE })
                                // 2. FILTRO DO ANO ATUAL: Filtra pelo status ATIVO do evento e garante que ele está no range do ano corrente
                                .andWhere('evento.status = :eventoStatus', { eventoStatus: 'ativo' })
                                .andWhere('evento.prazoInicial BETWEEN :inicioAno AND :fimAno', {
                                inicioAno: "".concat(anoAtual, "-01-01"),
                                fimAno: "".concat(anoAtual, "-12-31"),
                            })
                                // 3. Validação de concorrência (Se outra pessoa já aceitou, limpa da lista)
                                .andWhere(function (qb) {
                                var subQuery = qb
                                    .subQuery()
                                    .select('1')
                                    .from(projeto_orientador_entity_1.ProjetoOrientador, 'subPo')
                                    .where('subPo.projeto_id = projeto.id')
                                    .andWhere('subPo.status = :statusAceito', { statusAceito: projeto_orientador_entity_1.StatusOrientacao.ACEITO })
                                    .getQuery();
                                return "NOT EXISTS ".concat(subQuery);
                            })
                                .getMany()];
                }
            });
        });
    };
    OrientacoesService.prototype.findMinhasOrientacoes = function (orientadorId) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.orientacoesRepository.find({
                        where: { orientador: { id: orientadorId } },
                        relations: [
                            'projeto',
                            'projeto.evento',
                            'projeto.tema',
                            'projeto.alunoAutor',
                            'projeto.projetoAlunos',
                            'projeto.projetoAlunos.aluno',
                            'orientador',
                        ],
                        order: { criadoEm: 'DESC' },
                    })];
            });
        });
    };
    OrientacoesService.prototype.responder = function (id, orientadorId, dto) {
        return __awaiter(this, void 0, Promise, function () {
            var orientacao, jaPossuiOrientador;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.orientacoesRepository.findOne({
                            where: { id: id },
                            relations: [
                                'projeto',
                                'projeto.evento',
                                'projeto.tema',
                                'projeto.alunoAutor',
                                'projeto.projetoAlunos',
                                'projeto.projetoAlunos.aluno',
                                'orientador',
                            ],
                        })];
                    case 1:
                        orientacao = _a.sent();
                        if (!orientacao) {
                            throw new common_1.NotFoundException('Orientação não encontrada');
                        }
                        if (orientacao.orientador.id !== orientadorId) {
                            throw new common_1.ForbiddenException('Você não pode responder esta orientação');
                        }
                        if (orientacao.status !== projeto_orientador_entity_1.StatusOrientacao.PENDENTE) {
                            throw new common_1.BadRequestException('Esta orientação já foi respondida');
                        }
                        if (!(dto.action === projeto_orientador_entity_1.StatusOrientacao.ACEITO)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.orientacoesRepository.exists({
                                where: {
                                    projeto: { id: orientacao.projeto.id },
                                    status: projeto_orientador_entity_1.StatusOrientacao.ACEITO,
                                },
                            })];
                    case 2:
                        jaPossuiOrientador = _a.sent();
                        if (jaPossuiOrientador) {
                            throw new common_1.BadRequestException('Este projeto já foi aceito por outro orientador.');
                        }
                        // Se passou na checagem, recusa todas as outras solicitações pendentes deste projeto
                        return [4 /*yield*/, this.orientacoesRepository
                                .createQueryBuilder()
                                .update(projeto_orientador_entity_1.ProjetoOrientador)
                                .set({ status: projeto_orientador_entity_1.StatusOrientacao.RECUSADO, respondidoEm: new Date() })
                                .where('projeto_id = :projetoId', { projetoId: orientacao.projeto.id })
                                .andWhere('status = :status', { status: projeto_orientador_entity_1.StatusOrientacao.PENDENTE })
                                .andWhere('id != :id', { id: orientacao.id })
                                .execute()];
                    case 3:
                        // Se passou na checagem, recusa todas as outras solicitações pendentes deste projeto
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        // Atualiza o status da solicitação atual
                        orientacao.status = dto.action;
                        orientacao.respondidoEm = new Date();
                        return [2 /*return*/, this.orientacoesRepository.save(orientacao)];
                }
            });
        });
    };
    OrientacoesService.prototype.listarDisponiveisParaAluno = function (alunoId) {
        return __awaiter(this, void 0, void 0, function () {
            var anoAtual, projetoAluno, orientadoresRecusadosIds, vinculosRecusados, query, orientadores;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        return [4 /*yield*/, this.projetoRepository.findOne({
                                where: {
                                    alunoAutor: { id: alunoId },
                                    evento: {
                                        status: evento_entity_1.EventoStatus.ATIVO,
                                        prazoInicial: (0, typeorm_2.Between)(new Date("".concat(anoAtual, "-01-01T00:00:00")), new Date("".concat(anoAtual, "-12-31T23:59:59")))
                                    }
                                },
                                relations: ['evento'],
                            })];
                    case 1:
                        projetoAluno = _a.sent();
                        orientadoresRecusadosIds = [];
                        if (!projetoAluno) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.orientacoesRepository.find({
                                where: {
                                    projeto: { id: projetoAluno.id },
                                    status: projeto_orientador_entity_1.StatusOrientacao.RECUSADO,
                                },
                                relations: ['orientador'],
                            })];
                    case 2:
                        vinculosRecusados = _a.sent();
                        orientadoresRecusadosIds = vinculosRecusados.map(function (v) { return v.orientador.id; });
                        _a.label = 3;
                    case 3:
                        query = this.userRepository.createQueryBuilder('orientador')
                            .innerJoinAndSelect('orientador.temasSelecionados', 'tema')
                            .innerJoin('tema.evento', 'evento')
                            .where('orientador.role_cargo = :role', { role: 'orientador' }) // Busca TODOS do cargo orientador
                            .andWhere('evento.status = :eventoStatus', { eventoStatus: evento_entity_1.EventoStatus.ATIVO })
                            .andWhere('evento.prazo_inicial BETWEEN :inicioAno AND :fimAno', {
                            inicioAno: "".concat(anoAtual, "-01-01 00:00:00"),
                            fimAno: "".concat(anoAtual, "-12-31 23:59:59"),
                        });
                        // 4. Regra de Exclusão: Retira da lista Geral APENAS quem recusou (se houver alguém)
                        if (orientadoresRecusadosIds.length > 0) {
                            query.andWhere('orientador.id NOT IN (:...recusados)', { recusados: orientadoresRecusadosIds });
                        }
                        return [4 /*yield*/, query.getMany()];
                    case 4:
                        orientadores = _a.sent();
                        // 5. Retorna a lista completa com id, nome e temas mapeados
                        return [2 /*return*/, orientadores.map(function (ori) { return ({
                                id: ori.id,
                                nome: ori.nome,
                                temas: ori.temasSelecionados.map(function (t) { return ({
                                    id: t.id,
                                    nome: t.nome,
                                }); }),
                            }); })];
                }
            });
        });
    };
    OrientacoesService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(projeto_orientador_entity_1.ProjetoOrientador)),
        __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
        __param(2, (0, typeorm_1.InjectRepository)(projeto_entity_1.Projeto))
    ], OrientacoesService);
    return OrientacoesService;
}());
exports.OrientacoesService = OrientacoesService;
>>>>>>> 65e89bc5d5b878c13e2cbdad46896699fc25e14d
