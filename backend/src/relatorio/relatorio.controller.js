"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.RelatorioController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard"); // Ajuste o caminho se necessário
var roles_decorator_1 = require("../auth/decorators/roles.decorator");
var RelatorioController = /** @class */ (function () {
    function RelatorioController(relatorioService) {
        this.relatorioService = relatorioService;
    }
    /**
     * Obtém a lista de alunos sem projeto no ano corrente.
     * Agrupa os resultados por turma e ano.
     */
    RelatorioController.prototype.obterAlunosSemProjeto = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.relatorioService.obterAlunosSemProjeto()];
            });
        });
    };
    /**
     * Retorna o histórico da comissão organizadora.
     * Agrupa os alunos que participaram por evento.
     */
    RelatorioController.prototype.obterHistoricoComissao = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.relatorioService.obterHistoricoComissao()];
            });
        });
    };
    /**
     * Retorna as métricas quantitativas de cada eixo temático.
     */
    RelatorioController.prototype.obterMetricasEixosTematicos = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.relatorioService.obterMetricasEixosTematicos()];
            });
        });
    };
    /**
     * Lista a quantidade e os títulos dos projetos aceitos de cada orientador.
     */
    RelatorioController.prototype.obterProjetosPorOrientador = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.relatorioService.obterProjetosPorOrientador()];
            });
        });
    };
    /**
     * Retorna o balanço de projetos criados e aprovados segmentados por turma.
     */
    RelatorioController.prototype.obterProjetosPorTurma = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.relatorioService.obterProjetosPorTurma()];
            });
        });
    };
    __decorate([
        (0, common_1.Get)('alunos-sem-projeto'),
        (0, swagger_1.ApiOperation)({
            summary: 'Listar alunos sem projeto',
            description: 'Retorna todos os alunos ativos que não possuem vínculo com nenhum projeto no evento ativo do ano atual, agrupados por turma.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de alunos sem projeto retornada com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Nenhum evento ativo encontrado para o ano corrente.' })
    ], RelatorioController.prototype, "obterAlunosSemProjeto", null);
    __decorate([
        (0, common_1.Get)('comissao-por-evento'),
        (0, swagger_1.ApiOperation)({
            summary: 'Histórico da comissão por evento',
            description: 'Retorna o histórico completo de todos os membros da comissão organizadora agrupados por seus respectivos eventos.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Histórico da comissão retornado com sucesso.' })
    ], RelatorioController.prototype, "obterHistoricoComissao", null);
    __decorate([
        (0, common_1.Get)('eixos-tematicos'),
        (0, swagger_1.ApiOperation)({
            summary: 'Métricas por eixo temático',
            description: 'Retorna estatísticas quantitativas (total de projetos, projetos pendentes e projetos aceitos) distribuídas por Eixo Temático de cada evento.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Métricas dos eixos temáticos calculadas com sucesso.' })
    ], RelatorioController.prototype, "obterMetricasEixosTematicos", null);
    __decorate([
        (0, common_1.Get)('projetos-por-orientador'),
        (0, swagger_1.ApiOperation)({
            summary: 'Projetos aceitos por orientador',
            description: 'Lista todos os orientadores ativos com a quantidade e a relação de títulos dos projetos que eles aceitaram orientar no evento do ano atual.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de projetos por orientador retornada com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Nenhum evento ativo encontrado para o ano corrente.' })
    ], RelatorioController.prototype, "obterProjetosPorOrientador", null);
    __decorate([
        (0, common_1.Get)('projetos-por-turma'),
        (0, swagger_1.ApiOperation)({
            summary: 'Projetos criados e aprovados por turma',
            description: 'Consolida a quantidade de projetos criados e quantos deles já foram aprovados (possuem orientação aceita), agrupados por turma e ano do aluno autor.'
        }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Métricas de projetos por turma calculadas com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Nenhum evento ativo encontrado para o ano corrente.' })
    ], RelatorioController.prototype, "obterProjetosPorTurma", null);
    RelatorioController = __decorate([
        (0, swagger_1.ApiTags)('Relatórios'),
        (0, common_1.Controller)('relatorios'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
        (0, swagger_1.ApiBearerAuth)('token-jwt'),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COORDENACAO)
    ], RelatorioController);
    return RelatorioController;
}());
exports.RelatorioController = RelatorioController;
