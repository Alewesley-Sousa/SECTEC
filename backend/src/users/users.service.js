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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var typeorm_2 = require("typeorm");
var user_entity_1 = require("./entities/user.entity");
var evento_entity_1 = require("src/evento/entities/evento.entity");
var comissao_evento_entity_1 = require("src/evento/entities/comissao-evento.entity");
var sync_1 = require("csv-parse/sync");
var projeto_orientador_entity_1 = require("src/projetos/entities/projeto-orientador.entity");
var UsersService = /** @class */ (function () {
    function UsersService(usersRepository, eventoRepository, comissaoRepository, hashingProvider, projetoOrientadorRepository) {
        this.usersRepository = usersRepository;
        this.eventoRepository = eventoRepository;
        this.comissaoRepository = comissaoRepository;
        this.hashingProvider = hashingProvider;
        this.projetoOrientadorRepository = projetoOrientadorRepository;
    }
    UsersService.prototype.findOneByEmail = function (email) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersRepository
                        .createQueryBuilder('user')
                        .addSelect('user.senha')
                        .where('user.email_institucional = :email', { email: email })
                        .getOne()];
            });
        });
    };
    UsersService.prototype.findAllAlunos = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersRepository.find({
                        where: { role_cargo: user_entity_1.UserRole.ALUNO, ativo: true },
                        select: ['id', 'nome', 'email_institucional', 'turma', 'ano'],
                    })];
            });
        });
    };
    UsersService.prototype.findAllComissao = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersRepository.find({
                        where: { role_cargo: user_entity_1.UserRole.COMISSAO, ativo: true },
                        select: ['id', 'nome', 'email_institucional', 'turma', 'ano'],
                    })];
            });
        });
    };
    UsersService.prototype.findAllOrientadores = function () {
        return __awaiter(this, void 0, void 0, function () {
            var orientadores, counts, countMap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.usersRepository.find({
                            where: { role_cargo: user_entity_1.UserRole.ORIENTADOR, ativo: true },
                            select: ['id', 'nome', 'email_institucional'],
                            relations: ['temasSelecionados'],
                        })];
                    case 1:
                        orientadores = _a.sent();
                        return [4 /*yield*/, this.projetoOrientadorRepository
                                .createQueryBuilder('po')
                                .select('po.orientador_id', 'orientadorId')
                                .addSelect('COUNT(*)', 'total')
                                .where('po.status = :status', { status: 'aceito' })
                                .groupBy('po.orientador_id')
                                .getRawMany()];
                    case 2:
                        counts = _a.sent();
                        countMap = new Map(counts.map(function (c) { return [Number(c.orientadorId), Number(c.total)]; }));
                        return [2 /*return*/, orientadores.filter(function (o) { var _a; return ((_a = countMap.get(o.id)) !== null && _a !== void 0 ? _a : 0) < 4; })];
                }
            });
        });
    };
    UsersService.prototype.processarCsv = function (file, tipo) {
        return __awaiter(this, void 0, void 0, function () {
            var csvString, registros, emailsNoCsv, usuariosExistentes, emailsExistentesSet, registrosFiltrados, totalIgnorados, mapaTurmas, dadosFormatados, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!file || !file.buffer) {
                            throw new common_1.BadRequestException('Arquivo não enviado ou corrompido.');
                        }
                        csvString = file.buffer.toString('utf-8');
                        try {
                            registros = (0, sync_1.parse)(csvString, {
                                columns: function (header) { return header.map(function (h) { return h.toLowerCase().trim(); }); },
                                skip_empty_lines: true,
                                trim: true,
                                bom: true,
                                delimiter: [',', ';'],
                                skip_records_with_error: true,
                                relax_column_count: true,
                            });
                        }
                        catch (e) {
                            throw new common_1.BadRequestException('Erro ao formatar CSV. Verifique o cabeçalho.');
                        }
                        emailsNoCsv = registros
                            .map(function (reg) {
                            var emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
                            return emailBruto ? String(emailBruto).trim().toLowerCase() : null;
                        })
                            .filter(Boolean);
                        return [4 /*yield*/, this.usersRepository.find({
                                where: { email_institucional: (0, typeorm_2.In)(emailsNoCsv) },
                                select: ['email_institucional'],
                            })];
                    case 1:
                        usuariosExistentes = _a.sent();
                        emailsExistentesSet = new Set(usuariosExistentes.map(function (u) { return u.email_institucional.toLowerCase(); }));
                        registrosFiltrados = registros.filter(function (reg) {
                            var emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
                            if (!emailBruto)
                                return false;
                            return !emailsExistentesSet.has(String(emailBruto).trim().toLowerCase());
                        });
                        totalIgnorados = registros.length - registrosFiltrados.length;
                        // Se após filtrar, todos os e-mails já existirem, encerra sem dar erro
                        if (registrosFiltrados.length === 0) {
                            return [2 /*return*/, {
                                    filename: file.originalname,
                                    totalCadastrados: 0,
                                    totalIgnorados: totalIgnorados,
                                    tipo: tipo,
                                    mensagem: 'Todos os e-mails do CSV já constavam no sistema.',
                                }];
                        }
                        mapaTurmas = {
                            INFO: user_entity_1.UserTurma.INFORMATICA,
                            CONT: user_entity_1.UserTurma.CONTABILIDADE,
                            ENF: user_entity_1.UserTurma.ENFERMAGEM,
                        };
                        return [4 /*yield*/, Promise.all(registrosFiltrados.map(function (reg, index) { return __awaiter(_this, void 0, void 0, function () {
                                var emailBruto, nomeBruto, primeiroNome, primeiroEmail, primeiraTurma, primeiroAnoStr, senhaFinal, turmaFinal, roleFinal, anoFinal, chaveBusca, primeiraSenha, senhaHasheada;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
                                            nomeBruto = reg.nome;
                                            if (!nomeBruto || !emailBruto) {
                                                throw new common_1.BadRequestException("Erro na linha ".concat(index + 2, ": Colunas Nome e Email s\u00E3o obrigat\u00F3rias (Verificado: ").concat(nomeBruto, ", ").concat(emailBruto, ")."));
                                            }
                                            primeiroNome = String(nomeBruto).trim();
                                            primeiroEmail = String(emailBruto).trim();
                                            primeiraTurma = (reg.turma || '').trim();
                                            primeiroAnoStr = (reg.ano || '').trim();
                                            turmaFinal = null;
                                            anoFinal = 0;
                                            if (tipo === user_entity_1.UserRole.ALUNO) {
                                                senhaFinal = primeiroEmail;
                                                roleFinal = user_entity_1.UserRole.ALUNO;
                                                anoFinal = primeiroAnoStr ? Number(primeiroAnoStr) : 1;
                                                chaveBusca = primeiraTurma.toUpperCase();
                                                turmaFinal = mapaTurmas[chaveBusca] || user_entity_1.UserTurma.INFORMATICA;
                                            }
                                            else {
                                                primeiraSenha = reg.senha || '';
                                                senhaFinal = primeiraSenha || primeiroEmail;
                                                roleFinal = user_entity_1.UserRole.ORIENTADOR;
                                                turmaFinal = null;
                                                anoFinal = 0;
                                            }
                                            return [4 /*yield*/, this.hashingProvider.hash(senhaFinal)];
                                        case 1:
                                            senhaHasheada = _a.sent();
                                            return [2 /*return*/, {
                                                    nome: primeiroNome,
                                                    email_institucional: primeiroEmail,
                                                    senha: senhaHasheada,
                                                    turma: turmaFinal,
                                                    ano: anoFinal,
                                                    role_cargo: roleFinal,
                                                    ativo: true,
                                                }];
                                    }
                                });
                            }); }))];
                    case 2:
                        dadosFormatados = _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        // 5. Salva apenas os novos usuários
                        return [4 /*yield*/, this.usersRepository.save(dadosFormatados)];
                    case 4:
                        // 5. Salva apenas os novos usuários
                        _a.sent();
                        return [2 /*return*/, {
                                filename: file.originalname,
                                totalCadastrados: dadosFormatados.length,
                                totalIgnorados: totalIgnorados,
                                tipo: tipo,
                            }];
                    case 5:
                        error_1 = _a.sent();
                        if (error_1.code === 'ER_DUP_ENTRY' || error_1.errno === 1062) {
                            throw new common_1.BadRequestException('O arquivo enviado possui linhas com e-mails repetidos entre si.');
                        }
                        throw new common_1.InternalServerErrorException('Erro ao salvar novos usuários no banco de dados.');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UsersService.prototype.promoteToComissao = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var user, anoAtual, inicioAno, fimAno, eventoAtual, usuarioAtualizado, jaEstaNaComissao, historico;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.usersRepository.findOne({ where: { id: id } })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new common_1.NotFoundException("Usu\u00E1rio com ID ".concat(id, " n\u00E3o encontrado."));
                        }
                        if (user.role_cargo !== user_entity_1.UserRole.ALUNO) {
                            throw new common_1.BadRequestException('Apenas usuários com cargo de ALUNO podem ser movidos para a COMISSÃO.');
                        }
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO,
                                },
                            })];
                    case 2:
                        eventoAtual = _a.sent();
                        if (!eventoAtual) {
                            throw new common_1.BadRequestException("N\u00E3o \u00E9 poss\u00EDvel promover o aluno pois n\u00E3o h\u00E1 nenhum evento ATIVO cadastrado para o ano de ".concat(anoAtual, "."));
                        }
                        user.role_cargo = user_entity_1.UserRole.COMISSAO;
                        return [4 /*yield*/, this.usersRepository.save(user)];
                    case 3:
                        usuarioAtualizado = _a.sent();
                        return [4 /*yield*/, this.comissaoRepository.exists({
                                where: {
                                    evento: { id: eventoAtual.id },
                                    user: { id: usuarioAtualizado.id },
                                },
                            })];
                    case 4:
                        jaEstaNaComissao = _a.sent();
                        if (!!jaEstaNaComissao) return [3 /*break*/, 6];
                        historico = this.comissaoRepository.create({
                            evento: eventoAtual,
                            user: usuarioAtualizado,
                        });
                        return [4 /*yield*/, this.comissaoRepository.save(historico)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, usuarioAtualizado];
                }
            });
        });
    };
    UsersService.prototype.createIndividual = function (dto) {
        return __awaiter(this, void 0, void 0, function () {
            var nome, email_institucional, role_cargo, senha, turma, ano, emailExiste, senhaFinal, turmaFinal, anoFinal, senhaHasheada, novoUsuario, salvo, _, usuarioSemSenha, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nome = dto.nome, email_institucional = dto.email_institucional, role_cargo = dto.role_cargo, senha = dto.senha, turma = dto.turma, ano = dto.ano;
                        return [4 /*yield*/, this.usersRepository.exists({
                                where: { email_institucional: email_institucional.trim() }
                            })];
                    case 1:
                        emailExiste = _a.sent();
                        if (emailExiste) {
                            throw new common_1.BadRequestException("O e-mail ".concat(email_institucional, " j\u00E1 est\u00E1 cadastrado."));
                        }
                        turmaFinal = null;
                        anoFinal = 0;
                        if (role_cargo === user_entity_1.UserRole.ALUNO) {
                            senhaFinal = email_institucional.trim();
                            anoFinal = ano ? Number(ano) : 1;
                            turmaFinal = turma || user_entity_1.UserTurma.INFORMATICA;
                        }
                        else {
                            senhaFinal = senha || email_institucional.trim();
                            turmaFinal = null;
                            anoFinal = 0;
                        }
                        return [4 /*yield*/, this.hashingProvider.hash(senhaFinal)];
                    case 2:
                        senhaHasheada = _a.sent();
                        novoUsuario = this.usersRepository.create({
                            nome: nome.trim(),
                            email_institucional: email_institucional.trim(),
                            senha: senhaHasheada,
                            role_cargo: role_cargo,
                            turma: turmaFinal,
                            ano: anoFinal,
                            ativo: true,
                        });
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.usersRepository.save(novoUsuario)];
                    case 4:
                        salvo = _a.sent();
                        _ = salvo.senha, usuarioSemSenha = __rest(salvo, ["senha"]);
                        return [2 /*return*/, usuarioSemSenha];
                    case 5:
                        error_2 = _a.sent();
                        throw new common_1.InternalServerErrorException('Erro ao salvar o usuário individual no banco de dados.');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UsersService.prototype.demoteFromComissao = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var user, anoAtual, inicioAno, fimAno, eventoAtual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.usersRepository.findOne({ where: { id: id } })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new common_1.NotFoundException("Usu\u00E1rio com ID ".concat(id, " n\u00E3o encontrado."));
                        }
                        // Regra de negócio: Só pode ser rebaixado quem for da COMISSÃO atualmente
                        if (user.role_cargo !== user_entity_1.UserRole.COMISSAO) {
                            throw new common_1.BadRequestException('Este usuário não faz parte do cargo de COMISSÃO.');
                        }
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO,
                                },
                            })];
                    case 2:
                        eventoAtual = _a.sent();
                        if (!eventoAtual) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.comissaoRepository.delete({
                                evento: { id: eventoAtual.id },
                                user: { id: user.id },
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        // 3. Atualiza o cargo de volta para ALUNO
                        user.role_cargo = user_entity_1.UserRole.ALUNO;
                        return [2 /*return*/, this.usersRepository.save(user)];
                }
            });
        });
    };
    UsersService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
        __param(1, (0, typeorm_1.InjectRepository)(evento_entity_1.Evento)),
        __param(2, (0, typeorm_1.InjectRepository)(comissao_evento_entity_1.ComissaoEvento)),
        __param(4, (0, typeorm_1.InjectRepository)(projeto_orientador_entity_1.ProjetoOrientador))
    ], UsersService);
    return UsersService;
}());
exports.UsersService = UsersService;
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var typeorm_2 = require("typeorm");
var user_entity_1 = require("./entities/user.entity");
var evento_entity_1 = require("src/evento/entities/evento.entity");
var comissao_evento_entity_1 = require("src/evento/entities/comissao-evento.entity");
var sync_1 = require("csv-parse/sync");
var projeto_orientador_entity_1 = require("src/projetos/entities/projeto-orientador.entity");
var UsersService = /** @class */ (function () {
    function UsersService(usersRepository, eventoRepository, comissaoRepository, hashingProvider, projetoOrientadorRepository) {
        this.usersRepository = usersRepository;
        this.eventoRepository = eventoRepository;
        this.comissaoRepository = comissaoRepository;
        this.hashingProvider = hashingProvider;
        this.projetoOrientadorRepository = projetoOrientadorRepository;
    }
    UsersService.prototype.findOneByEmail = function (email) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersRepository
                        .createQueryBuilder('user')
                        .addSelect('user.senha')
                        .where('user.email_institucional = :email', { email: email })
                        .getOne()];
            });
        });
    };
    UsersService.prototype.findAllAlunos = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersRepository.find({
                        where: { role_cargo: user_entity_1.UserRole.ALUNO, ativo: true },
                        select: ['id', 'nome', 'email_institucional', 'turma', 'ano'],
                    })];
            });
        });
    };
    UsersService.prototype.findAllComissao = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersRepository.find({
                        where: { role_cargo: user_entity_1.UserRole.COMISSAO, ativo: true },
                        select: ['id', 'nome', 'email_institucional', 'turma', 'ano'],
                    })];
            });
        });
    };
    UsersService.prototype.findAllOrientadores = function () {
        return __awaiter(this, void 0, void 0, function () {
            var orientadores, counts, countMap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.usersRepository.find({
                            where: { role_cargo: user_entity_1.UserRole.ORIENTADOR, ativo: true },
                            select: ['id', 'nome', 'email_institucional'],
                            relations: ['temasSelecionados'],
                        })];
                    case 1:
                        orientadores = _a.sent();
                        return [4 /*yield*/, this.projetoOrientadorRepository
                                .createQueryBuilder('po')
                                .select('po.orientador_id', 'orientadorId')
                                .addSelect('COUNT(*)', 'total')
                                .where('po.status = :status', { status: 'aceito' })
                                .groupBy('po.orientador_id')
                                .getRawMany()];
                    case 2:
                        counts = _a.sent();
                        countMap = new Map(counts.map(function (c) { return [Number(c.orientadorId), Number(c.total)]; }));
                        return [2 /*return*/, orientadores.filter(function (o) { var _a; return ((_a = countMap.get(o.id)) !== null && _a !== void 0 ? _a : 0) < 4; })];
                }
            });
        });
    };
    UsersService.prototype.processarCsv = function (file, tipo) {
        return __awaiter(this, void 0, void 0, function () {
            var csvString, registros, emailsNoCsv, usuariosExistentes, emailsExistentesSet, registrosFiltrados, totalIgnorados, mapaTurmas, dadosFormatados, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!file || !file.buffer) {
                            throw new common_1.BadRequestException('Arquivo não enviado ou corrompido.');
                        }
                        csvString = file.buffer.toString('utf-8');
                        try {
                            registros = (0, sync_1.parse)(csvString, {
                                columns: function (header) { return header.map(function (h) { return h.toLowerCase().trim(); }); },
                                skip_empty_lines: true,
                                trim: true,
                                bom: true,
                                delimiter: [',', ';'],
                                skip_records_with_error: true,
                                relax_column_count: true,
                            });
                        }
                        catch (e) {
                            throw new common_1.BadRequestException('Erro ao formatar CSV. Verifique o cabeçalho.');
                        }
                        emailsNoCsv = registros
                            .map(function (reg) {
                            var emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
                            return emailBruto ? String(emailBruto).trim().toLowerCase() : null;
                        })
                            .filter(Boolean);
                        return [4 /*yield*/, this.usersRepository.find({
                                where: { email_institucional: (0, typeorm_2.In)(emailsNoCsv) },
                                select: ['email_institucional'],
                            })];
                    case 1:
                        usuariosExistentes = _a.sent();
                        emailsExistentesSet = new Set(usuariosExistentes.map(function (u) { return u.email_institucional.toLowerCase(); }));
                        registrosFiltrados = registros.filter(function (reg) {
                            var emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
                            if (!emailBruto)
                                return false;
                            return !emailsExistentesSet.has(String(emailBruto).trim().toLowerCase());
                        });
                        totalIgnorados = registros.length - registrosFiltrados.length;
                        // Se após filtrar, todos os e-mails já existirem, encerra sem dar erro
                        if (registrosFiltrados.length === 0) {
                            return [2 /*return*/, {
                                    filename: file.originalname,
                                    totalCadastrados: 0,
                                    totalIgnorados: totalIgnorados,
                                    tipo: tipo,
                                    mensagem: 'Todos os e-mails do CSV já constavam no sistema.',
                                }];
                        }
                        mapaTurmas = {
                            INFO: user_entity_1.UserTurma.INFORMATICA,
                            CONT: user_entity_1.UserTurma.CONTABILIDADE,
                            ENF: user_entity_1.UserTurma.ENFERMAGEM,
                        };
                        return [4 /*yield*/, Promise.all(registrosFiltrados.map(function (reg, index) { return __awaiter(_this, void 0, void 0, function () {
                                var emailBruto, nomeBruto, primeiroNome, primeiroEmail, primeiraTurma, primeiroAnoStr, senhaFinal, turmaFinal, roleFinal, anoFinal, chaveBusca, primeiraSenha, senhaHasheada;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
                                            nomeBruto = reg.nome;
                                            if (!nomeBruto || !emailBruto) {
                                                throw new common_1.BadRequestException("Erro na linha ".concat(index + 2, ": Colunas Nome e Email s\u00E3o obrigat\u00F3rias (Verificado: ").concat(nomeBruto, ", ").concat(emailBruto, ")."));
                                            }
                                            primeiroNome = String(nomeBruto).trim();
                                            primeiroEmail = String(emailBruto).trim();
                                            primeiraTurma = (reg.turma || '').trim();
                                            primeiroAnoStr = (reg.ano || '').trim();
                                            turmaFinal = null;
                                            anoFinal = 0;
                                            if (tipo === user_entity_1.UserRole.ALUNO) {
                                                senhaFinal = primeiroEmail;
                                                roleFinal = user_entity_1.UserRole.ALUNO;
                                                anoFinal = primeiroAnoStr ? Number(primeiroAnoStr) : 1;
                                                chaveBusca = primeiraTurma.toUpperCase();
                                                turmaFinal = mapaTurmas[chaveBusca] || user_entity_1.UserTurma.INFORMATICA;
                                            }
                                            else {
                                                primeiraSenha = reg.senha || '';
                                                senhaFinal = primeiraSenha || primeiroEmail;
                                                roleFinal = user_entity_1.UserRole.ORIENTADOR;
                                                turmaFinal = null;
                                                anoFinal = 0;
                                            }
                                            return [4 /*yield*/, this.hashingProvider.hash(senhaFinal)];
                                        case 1:
                                            senhaHasheada = _a.sent();
                                            return [2 /*return*/, {
                                                    nome: primeiroNome,
                                                    email_institucional: primeiroEmail,
                                                    senha: senhaHasheada,
                                                    turma: turmaFinal,
                                                    ano: anoFinal,
                                                    role_cargo: roleFinal,
                                                    ativo: true,
                                                }];
                                    }
                                });
                            }); }))];
                    case 2:
                        dadosFormatados = _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        // 5. Salva apenas os novos usuários
                        return [4 /*yield*/, this.usersRepository.save(dadosFormatados)];
                    case 4:
                        // 5. Salva apenas os novos usuários
                        _a.sent();
                        return [2 /*return*/, {
                                filename: file.originalname,
                                totalCadastrados: dadosFormatados.length,
                                totalIgnorados: totalIgnorados,
                                tipo: tipo,
                            }];
                    case 5:
                        error_1 = _a.sent();
                        if (error_1.code === 'ER_DUP_ENTRY' || error_1.errno === 1062) {
                            throw new common_1.BadRequestException('O arquivo enviado possui linhas com e-mails repetidos entre si.');
                        }
                        throw new common_1.InternalServerErrorException('Erro ao salvar novos usuários no banco de dados.');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UsersService.prototype.promoteToComissao = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var user, anoAtual, inicioAno, fimAno, eventoAtual, usuarioAtualizado, jaEstaNaComissao, historico;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.usersRepository.findOne({ where: { id: id } })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new common_1.NotFoundException("Usu\u00E1rio com ID ".concat(id, " n\u00E3o encontrado."));
                        }
                        if (user.role_cargo !== user_entity_1.UserRole.ALUNO) {
                            throw new common_1.BadRequestException('Apenas usuários com cargo de ALUNO podem ser movidos para a COMISSÃO.');
                        }
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO,
                                },
                            })];
                    case 2:
                        eventoAtual = _a.sent();
                        if (!eventoAtual) {
                            throw new common_1.BadRequestException("N\u00E3o \u00E9 poss\u00EDvel promover o aluno pois n\u00E3o h\u00E1 nenhum evento ATIVO cadastrado para o ano de ".concat(anoAtual, "."));
                        }
                        user.role_cargo = user_entity_1.UserRole.COMISSAO;
                        return [4 /*yield*/, this.usersRepository.save(user)];
                    case 3:
                        usuarioAtualizado = _a.sent();
                        return [4 /*yield*/, this.comissaoRepository.exists({
                                where: {
                                    evento: { id: eventoAtual.id },
                                    user: { id: usuarioAtualizado.id },
                                },
                            })];
                    case 4:
                        jaEstaNaComissao = _a.sent();
                        if (!!jaEstaNaComissao) return [3 /*break*/, 6];
                        historico = this.comissaoRepository.create({
                            evento: eventoAtual,
                            user: usuarioAtualizado,
                        });
                        return [4 /*yield*/, this.comissaoRepository.save(historico)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, usuarioAtualizado];
                }
            });
        });
    };
    UsersService.prototype.createIndividual = function (dto) {
        return __awaiter(this, void 0, void 0, function () {
            var nome, email_institucional, role_cargo, senha, turma, ano, emailExiste, senhaFinal, turmaFinal, anoFinal, senhaHasheada, novoUsuario, salvo, _, usuarioSemSenha, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nome = dto.nome, email_institucional = dto.email_institucional, role_cargo = dto.role_cargo, senha = dto.senha, turma = dto.turma, ano = dto.ano;
                        return [4 /*yield*/, this.usersRepository.exists({
                                where: { email_institucional: email_institucional.trim() }
                            })];
                    case 1:
                        emailExiste = _a.sent();
                        if (emailExiste) {
                            throw new common_1.BadRequestException("O e-mail ".concat(email_institucional, " j\u00E1 est\u00E1 cadastrado."));
                        }
                        turmaFinal = null;
                        anoFinal = 0;
                        if (role_cargo === user_entity_1.UserRole.ALUNO) {
                            senhaFinal = email_institucional.trim();
                            anoFinal = ano ? Number(ano) : 1;
                            turmaFinal = turma || user_entity_1.UserTurma.INFORMATICA;
                        }
                        else {
                            senhaFinal = senha || email_institucional.trim();
                            turmaFinal = null;
                            anoFinal = 0;
                        }
                        return [4 /*yield*/, this.hashingProvider.hash(senhaFinal)];
                    case 2:
                        senhaHasheada = _a.sent();
                        novoUsuario = this.usersRepository.create({
                            nome: nome.trim(),
                            email_institucional: email_institucional.trim(),
                            senha: senhaHasheada,
                            role_cargo: role_cargo,
                            turma: turmaFinal,
                            ano: anoFinal,
                            ativo: true,
                        });
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.usersRepository.save(novoUsuario)];
                    case 4:
                        salvo = _a.sent();
                        _ = salvo.senha, usuarioSemSenha = __rest(salvo, ["senha"]);
                        return [2 /*return*/, usuarioSemSenha];
                    case 5:
                        error_2 = _a.sent();
                        throw new common_1.InternalServerErrorException('Erro ao salvar o usuário individual no banco de dados.');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UsersService.prototype.demoteFromComissao = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var user, anoAtual, inicioAno, fimAno, eventoAtual;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.usersRepository.findOne({ where: { id: id } })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new common_1.NotFoundException("Usu\u00E1rio com ID ".concat(id, " n\u00E3o encontrado."));
                        }
                        // Regra de negócio: Só pode ser rebaixado quem for da COMISSÃO atualmente
                        if (user.role_cargo !== user_entity_1.UserRole.COMISSAO) {
                            throw new common_1.BadRequestException('Este usuário não faz parte do cargo de COMISSÃO.');
                        }
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO,
                                },
                            })];
                    case 2:
                        eventoAtual = _a.sent();
                        if (!eventoAtual) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.comissaoRepository.delete({
                                evento: { id: eventoAtual.id },
                                user: { id: user.id },
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        // 3. Atualiza o cargo de volta para ALUNO
                        user.role_cargo = user_entity_1.UserRole.ALUNO;
                        return [2 /*return*/, this.usersRepository.save(user)];
                }
            });
        });
    };
    UsersService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
        __param(1, (0, typeorm_1.InjectRepository)(evento_entity_1.Evento)),
        __param(2, (0, typeorm_1.InjectRepository)(comissao_evento_entity_1.ComissaoEvento)),
        __param(4, (0, typeorm_1.InjectRepository)(projeto_orientador_entity_1.ProjetoOrientador))
    ], UsersService);
    return UsersService;
}());
exports.UsersService = UsersService;
>>>>>>> 65e89bc5d5b878c13e2cbdad46896699fc25e14d
