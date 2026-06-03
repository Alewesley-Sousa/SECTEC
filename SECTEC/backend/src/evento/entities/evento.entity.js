"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Evento = exports.Periodo = exports.EventoStatus = void 0;
var typeorm_1 = require("typeorm");
//  COMO DEVE FICAR (Import Relativo)
var projeto_entity_1 = require("../../projetos/entities/projeto.entity");
var tema_evento_entity_1 = require("./tema-evento.entity");
var user_entity_1 = require("../../users/entities/user.entity");
var comissao_evento_entity_1 = require("./comissao-evento.entity");
var EventoStatus;
(function (EventoStatus) {
    EventoStatus["ATIVO"] = "ativo";
    EventoStatus["INATIVO"] = "inativo";
})(EventoStatus = exports.EventoStatus || (exports.EventoStatus = {}));
// Value Object ajustado para apenas DATA
var Periodo = /** @class */ (function () {
    function Periodo() {
    }
    __decorate([
        (0, typeorm_1.Column)({ type: 'datetime', nullable: true }) // Mudança para 'date'
    ], Periodo.prototype, "inicio", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'datetime', nullable: true }) // Mudança para 'date'
    ], Periodo.prototype, "fim", void 0);
    return Periodo;
}());
exports.Periodo = Periodo;
var Evento = /** @class */ (function () {
    function Evento() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)()
    ], Evento.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    ], Evento.prototype, "titulo", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'text', nullable: true })
    ], Evento.prototype, "descricao", void 0);
    __decorate([
        (0, typeorm_1.Column)(function () { return Periodo; })
    ], Evento.prototype, "inscricao", void 0);
    __decorate([
        (0, typeorm_1.Column)(function () { return Periodo; })
    ], Evento.prototype, "submissao", void 0);
    __decorate([
        (0, typeorm_1.Column)(function () { return Periodo; })
    ], Evento.prototype, "avaliacao", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: 'coordenador_id', nullable: true })
    ], Evento.prototype, "coordenadorId", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: 'prazo_inicial', type: 'datetime', nullable: true }) // Adicione o nullable aqui
    ], Evento.prototype, "prazoInicial", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: 'prazo_final', type: 'datetime', nullable: true }) // Adicione o nullable aqui
    ], Evento.prototype, "prazoFinal", void 0);
    __decorate([
        (0, typeorm_1.Column)({
            type: 'enum',
            enum: EventoStatus,
            default: EventoStatus.ATIVO,
        })
    ], Evento.prototype, "status", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: 'criado_em' })
    ], Evento.prototype, "criadoEm", void 0);
    __decorate([
        (0, typeorm_1.UpdateDateColumn)({ name: 'atualizado_em' })
    ], Evento.prototype, "atualizadoEm", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }),
        (0, typeorm_1.JoinColumn)({ name: 'coordenador_id' })
    ], Evento.prototype, "coordenador", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return projeto_entity_1.Projeto; }, function (projeto) { return projeto.evento; })
    ], Evento.prototype, "projetos", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return tema_evento_entity_1.TemaEvento; }, function (tema) { return tema.evento; })
    ], Evento.prototype, "temas", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return comissao_evento_entity_1.ComissaoEvento; }, function (comissao) { return comissao.evento; })
    ], Evento.prototype, "comissaoAlunos", void 0);
    Evento = __decorate([
        (0, typeorm_1.Entity)('eventos')
    ], Evento);
    return Evento;
}());
exports.Evento = Evento;
