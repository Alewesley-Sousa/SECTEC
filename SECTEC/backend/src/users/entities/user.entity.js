"use strict";
// src/users/entities/user.entity.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserTurma = exports.UserRole = void 0;
var typeorm_1 = require("typeorm");
/* =====================================================
   🔹 RELAÇÕES (IMPORTS)
===================================================== */
var tema_evento_entity_1 = require("src/evento/entities/tema-evento.entity");
var projeto_aluno_entity_1 = require("src/projetos/entities/projeto-aluno.entity");
var projeto_orientador_entity_1 = require("src/projetos/entities/projeto-orientador.entity");
/* =====================================================
   🔹 ENUMS (REGRAS DE DOMÍNIO)
===================================================== */
/**
 * Define os papéis (roles) do usuário no sistema.
 */
var UserRole;
(function (UserRole) {
    UserRole["ALUNO"] = "aluno";
    UserRole["ORIENTADOR"] = "orientador";
    UserRole["COORDENACAO"] = "coordenador";
    UserRole["COMISSAO"] = "comissao";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
/**
 * Define as turmas disponíveis para alunos.
 */
var UserTurma;
(function (UserTurma) {
    UserTurma["INFORMATICA"] = "informatica";
    UserTurma["ENFERMAGEM"] = "enfermagem";
    UserTurma["CONTABILIDADE"] = "contabilidade";
})(UserTurma = exports.UserTurma || (exports.UserTurma = {}));
/* =====================================================
   🔹 ENTITY
===================================================== */
var User = /** @class */ (function () {
    function User() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)()
    ], User.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.Column)()
    ], User.prototype, "nome", void 0);
    __decorate([
        (0, typeorm_1.Column)({ unique: true })
    ], User.prototype, "email_institucional", void 0);
    __decorate([
        (0, typeorm_1.Column)({
            type: 'enum',
            enum: UserRole,
        })
    ], User.prototype, "role_cargo", void 0);
    __decorate([
        (0, typeorm_1.Column)({ select: false })
    ], User.prototype, "senha", void 0);
    __decorate([
        (0, typeorm_1.Column)({ default: true })
    ], User.prototype, "ativo", void 0);
    __decorate([
        (0, typeorm_1.Column)({ default: 1 })
    ], User.prototype, "ano", void 0);
    __decorate([
        (0, typeorm_1.Column)({
            type: 'enum',
            enum: UserTurma,
            nullable: true,
        })
    ], User.prototype, "turma", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)()
    ], User.prototype, "criado_em", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return projeto_aluno_entity_1.ProjetoAluno; }, function (projetoAluno) { return projetoAluno.aluno; })
    ], User.prototype, "projetosParticipados", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return projeto_orientador_entity_1.ProjetoOrientador; }, function (projetoOrientador) { return projetoOrientador.orientador; })
    ], User.prototype, "solicitacoesOrientacao", void 0);
    __decorate([
        (0, typeorm_1.ManyToMany)(function () { return tema_evento_entity_1.TemaEvento; }, function (tema) { return tema.orientadores; })
    ], User.prototype, "temasSelecionados", void 0);
    User = __decorate([
        (0, typeorm_1.Entity)('usuarios')
    ], User);
    return User;
}());
exports.User = User;
