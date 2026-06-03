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
exports.EventoController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
var swagger_1 = require("@nestjs/swagger");
// Remova o "Param as ApiParam" que estava dando erro
var EventoController = /** @class */ (function () {
    function EventoController(eventoService) {
        this.eventoService = eventoService;
    }
    EventoController.prototype.create = function (createEventoDto) {
        return this.eventoService.create(createEventoDto);
    };
    EventoController.prototype.addTemas = function (id, createTemasDto) {
        return this.eventoService.addTemas(id, createTemasDto);
    };
    EventoController.prototype.findAll = function () {
        return this.eventoService.findAll();
    };
    EventoController.prototype.findAtual = function () {
        return this.eventoService.eventoAtual();
    };
    EventoController.prototype.findOne = function (id) {
        return this.eventoService.findOne(id);
    };
    // modulos/eventos/evento.controller.ts
    EventoController.prototype.getProfessoresByTema = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventoService.findProfessoresPorTema(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EventoController.prototype.update = function (id, updateEventoDto) {
        return this.eventoService.update(id, updateEventoDto);
    };
    EventoController.prototype.remove = function (id) {
        return this.eventoService.remove(id);
    };
    EventoController.prototype.sincronizar = function (temasIds, orientadorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventoService.sincronizarTemas(orientadorId, temasIds)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EventoController.prototype.removeTema = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventoService.removeTema(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Post)(),
        (0, swagger_1.ApiOperation)({ summary: 'Cria um novo evento com cronograma completo' }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Evento criado com sucesso.' }),
        __param(0, (0, common_1.Body)())
    ], EventoController.prototype, "create", null);
    __decorate([
        (0, common_1.Post)(':id/temas'),
        (0, swagger_1.ApiOperation)({ summary: 'Adiciona eixos temáticos ao evento' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)())
    ], EventoController.prototype, "addTemas", null);
    __decorate([
        (0, common_1.Get)(),
        (0, swagger_1.ApiOperation)({ summary: 'Lista todos os eventos cadastrados' })
    ], EventoController.prototype, "findAll", null);
    __decorate([
        (0, common_1.Get)('atual/vigente'),
        (0, swagger_1.ApiOperation)({ summary: 'Busca o evento mais recente do ano atual' })
    ], EventoController.prototype, "findAtual", null);
    __decorate([
        (0, common_1.Get)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Busca detalhes de um evento específico' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], EventoController.prototype, "findOne", null);
    __decorate([
        (0, common_1.Get)('temas/:id/professores'),
        (0, swagger_1.ApiOperation)({
            summary: 'Busca professores por tema',
            description: 'Retorna todos os orientadores vinculados a um tema específico.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de professores retornada com sucesso.' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], EventoController.prototype, "getProfessoresByTema", null);
    __decorate([
        (0, common_1.Patch)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Atualiza dados e prazos de um evento' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)())
    ], EventoController.prototype, "update", null);
    __decorate([
        (0, common_1.Delete)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Desativa um evento (Exclusão lógica)' }) // Texto atualizado
        ,
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Evento marcado como inativo.' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], EventoController.prototype, "remove", null);
    __decorate([
        (0, common_1.Post)('temas/sincronizar'),
        (0, swagger_1.ApiOperation)({
            summary: 'Sincroniza os temas do orientador',
            description: 'Envia uma lista completa de IDs de temas para o orientador.'
        }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Temas sincronizados com sucesso.' }),
        (0, swagger_1.ApiBody)({
            schema: {
                type: 'object',
                properties: {
                    temasIds: {
                        type: 'array',
                        items: { type: 'number' },
                        example: [1, 2, 3]
                    }
                }
            }
        }),
        __param(0, (0, common_1.Body)('temasIds')),
        __param(1, (0, get_user_decorator_1.GetUser)('userId'))
    ], EventoController.prototype, "sincronizar", null);
    __decorate([
        (0, common_1.Delete)('temas/:id'),
        (0, swagger_1.ApiOperation)({
            summary: 'Remove um tema do evento',
            description: 'Deleta um eixo temático caso não haja orientadores ou projetos vinculados a ele.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Tema removido com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 400, description: 'Tema possui dependências ativas no sistema e não pode ser apagado.' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Tema não encontrado.' }),
        (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do tema que deseja remover', type: Number }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], EventoController.prototype, "removeTema", null);
    EventoController = __decorate([
        (0, swagger_1.ApiTags)('evento'),
        (0, common_1.Controller)('evento'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard) // Comentado para testes iniciais
    ], EventoController);
    return EventoController;
}());
exports.EventoController = EventoController;
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
exports.EventoController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
var swagger_1 = require("@nestjs/swagger");
// Remova o "Param as ApiParam" que estava dando erro
var EventoController = /** @class */ (function () {
    function EventoController(eventoService) {
        this.eventoService = eventoService;
    }
    EventoController.prototype.create = function (createEventoDto) {
        return this.eventoService.create(createEventoDto);
    };
    EventoController.prototype.addTemas = function (id, createTemasDto) {
        return this.eventoService.addTemas(id, createTemasDto);
    };
    EventoController.prototype.findAll = function () {
        return this.eventoService.findAll();
    };
    EventoController.prototype.findAtual = function () {
        return this.eventoService.eventoAtual();
    };
    EventoController.prototype.findOne = function (id) {
        return this.eventoService.findOne(id);
    };
    // modulos/eventos/evento.controller.ts
    EventoController.prototype.getProfessoresByTema = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventoService.findProfessoresPorTema(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EventoController.prototype.update = function (id, updateEventoDto) {
        return this.eventoService.update(id, updateEventoDto);
    };
    EventoController.prototype.remove = function (id) {
        return this.eventoService.remove(id);
    };
    EventoController.prototype.sincronizar = function (temasIds, orientadorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventoService.sincronizarTemas(orientadorId, temasIds)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EventoController.prototype.removeTema = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventoService.removeTema(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Post)(),
        (0, swagger_1.ApiOperation)({ summary: 'Cria um novo evento com cronograma completo' }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Evento criado com sucesso.' }),
        __param(0, (0, common_1.Body)())
    ], EventoController.prototype, "create", null);
    __decorate([
        (0, common_1.Post)(':id/temas'),
        (0, swagger_1.ApiOperation)({ summary: 'Adiciona eixos temáticos ao evento' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)())
    ], EventoController.prototype, "addTemas", null);
    __decorate([
        (0, common_1.Get)(),
        (0, swagger_1.ApiOperation)({ summary: 'Lista todos os eventos cadastrados' })
    ], EventoController.prototype, "findAll", null);
    __decorate([
        (0, common_1.Get)('atual/vigente'),
        (0, swagger_1.ApiOperation)({ summary: 'Busca o evento mais recente do ano atual' })
    ], EventoController.prototype, "findAtual", null);
    __decorate([
        (0, common_1.Get)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Busca detalhes de um evento específico' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], EventoController.prototype, "findOne", null);
    __decorate([
        (0, common_1.Get)('temas/:id/professores'),
        (0, swagger_1.ApiOperation)({
            summary: 'Busca professores por tema',
            description: 'Retorna todos os orientadores vinculados a um tema específico.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de professores retornada com sucesso.' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], EventoController.prototype, "getProfessoresByTema", null);
    __decorate([
        (0, common_1.Patch)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Atualiza dados e prazos de um evento' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)())
    ], EventoController.prototype, "update", null);
    __decorate([
        (0, common_1.Delete)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Desativa um evento (Exclusão lógica)' }) // Texto atualizado
        ,
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Evento marcado como inativo.' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], EventoController.prototype, "remove", null);
    __decorate([
        (0, common_1.Post)('temas/sincronizar'),
        (0, swagger_1.ApiOperation)({
            summary: 'Sincroniza os temas do orientador',
            description: 'Envia uma lista completa de IDs de temas para o orientador.'
        }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Temas sincronizados com sucesso.' }),
        (0, swagger_1.ApiBody)({
            schema: {
                type: 'object',
                properties: {
                    temasIds: {
                        type: 'array',
                        items: { type: 'number' },
                        example: [1, 2, 3]
                    }
                }
            }
        }),
        __param(0, (0, common_1.Body)('temasIds')),
        __param(1, (0, get_user_decorator_1.GetUser)('userId'))
    ], EventoController.prototype, "sincronizar", null);
    __decorate([
        (0, common_1.Delete)('temas/:id'),
        (0, swagger_1.ApiOperation)({
            summary: 'Remove um tema do evento',
            description: 'Deleta um eixo temático caso não haja orientadores ou projetos vinculados a ele.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Tema removido com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 400, description: 'Tema possui dependências ativas no sistema e não pode ser apagado.' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Tema não encontrado.' }),
        (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do tema que deseja remover', type: Number }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], EventoController.prototype, "removeTema", null);
    EventoController = __decorate([
        (0, swagger_1.ApiTags)('evento'),
        (0, common_1.Controller)('evento'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard) // Comentado para testes iniciais
    ], EventoController);
    return EventoController;
}());
exports.EventoController = EventoController;
>>>>>>> 65e89bc5d5b878c13e2cbdad46896699fc25e14d
