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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrientacoesController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../auth/decorators/roles.decorator");
var get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
var swagger_1 = require("@nestjs/swagger");
var OrientacoesController = /** @class */ (function () {
    function OrientacoesController(orientacoesService) {
        this.orientacoesService = orientacoesService;
    }
    OrientacoesController.prototype.findPendentes = function (userId) {
        return this.orientacoesService.findMinhasPendentes(userId);
    };
    OrientacoesController.prototype.findMinhas = function (userId) {
        return this.orientacoesService.findMinhasOrientacoes(userId);
    };
    OrientacoesController.prototype.responder = function (id, userId, dto) {
        return this.orientacoesService.responder(id, userId, dto);
    };
    OrientacoesController.prototype.listarParaAluno = function (alunoId) {
        return this.orientacoesService.listarDisponiveisParaAluno(alunoId);
    };
    __decorate([
        (0, common_1.Get)('pendentes'),
        __param(0, (0, get_user_decorator_1.GetUser)('userId'))
    ], OrientacoesController.prototype, "findPendentes", null);
    __decorate([
        (0, common_1.Get)(),
        __param(0, (0, get_user_decorator_1.GetUser)('userId'))
    ], OrientacoesController.prototype, "findMinhas", null);
    __decorate([
        (0, common_1.Patch)(':id/responder'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, get_user_decorator_1.GetUser)('userId')),
        __param(2, (0, common_1.Body)())
    ], OrientacoesController.prototype, "responder", null);
    __decorate([
        (0, common_1.Get)('disponiveis'),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ALUNO) // Garante que apenas alunos usem essa listagem
        ,
        __param(0, (0, get_user_decorator_1.GetUser)('userId'))
    ], OrientacoesController.prototype, "listarParaAluno", null);
    OrientacoesController = __decorate([
        (0, common_1.Controller)('orientacoes'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
        (0, swagger_1.ApiBearerAuth)('token-jwt'),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ORIENTADOR)
    ], OrientacoesController);
    return OrientacoesController;
}());
exports.OrientacoesController = OrientacoesController;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrientacoesController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../auth/decorators/roles.decorator");
var get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
var swagger_1 = require("@nestjs/swagger");
var OrientacoesController = /** @class */ (function () {
    function OrientacoesController(orientacoesService) {
        this.orientacoesService = orientacoesService;
    }
    OrientacoesController.prototype.findPendentes = function (userId) {
        return this.orientacoesService.findMinhasPendentes(userId);
    };
    OrientacoesController.prototype.findMinhas = function (userId) {
        return this.orientacoesService.findMinhasOrientacoes(userId);
    };
    OrientacoesController.prototype.responder = function (id, userId, dto) {
        return this.orientacoesService.responder(id, userId, dto);
    };
    OrientacoesController.prototype.listarParaAluno = function (alunoId) {
        return this.orientacoesService.listarDisponiveisParaAluno(alunoId);
    };
    __decorate([
        (0, common_1.Get)('pendentes'),
        __param(0, (0, get_user_decorator_1.GetUser)('userId'))
    ], OrientacoesController.prototype, "findPendentes", null);
    __decorate([
        (0, common_1.Get)(),
        __param(0, (0, get_user_decorator_1.GetUser)('userId'))
    ], OrientacoesController.prototype, "findMinhas", null);
    __decorate([
        (0, common_1.Patch)(':id/responder'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, get_user_decorator_1.GetUser)('userId')),
        __param(2, (0, common_1.Body)())
    ], OrientacoesController.prototype, "responder", null);
    __decorate([
        (0, common_1.Get)('disponiveis'),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ALUNO) // Garante que apenas alunos usem essa listagem
        ,
        __param(0, (0, get_user_decorator_1.GetUser)('userId'))
    ], OrientacoesController.prototype, "listarParaAluno", null);
    OrientacoesController = __decorate([
        (0, common_1.Controller)('orientacoes'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
        (0, swagger_1.ApiBearerAuth)('token-jwt'),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ORIENTADOR)
    ], OrientacoesController);
    return OrientacoesController;
}());
exports.OrientacoesController = OrientacoesController;
>>>>>>> 65e89bc5d5b878c13e2cbdad46896699fc25e14d
