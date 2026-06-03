<<<<<<< HEAD
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventoModule = void 0;
var common_1 = require("@nestjs/common");
var evento_service_1 = require("./evento.service");
var evento_controller_1 = require("./evento.controller");
var typeorm_1 = require("@nestjs/typeorm");
var evento_entity_1 = require("./entities/evento.entity");
var tema_evento_entity_1 = require("./entities/tema-evento.entity");
var user_entity_1 = require("../users/entities/user.entity");
var projeto_orientador_entity_1 = require("../projetos/entities/projeto-orientador.entity");
// 💡 NOTA: Ajuste o caminho relativo acima se a pasta do módulo de projetos não for essa exatamente.
var EventoModule = /** @class */ (function () {
    function EventoModule() {
    }
    EventoModule = __decorate([
        (0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forFeature([evento_entity_1.Evento, tema_evento_entity_1.TemaEvento, user_entity_1.User, projeto_orientador_entity_1.ProjetoOrientador])
            ],
            controllers: [evento_controller_1.EventoController],
            providers: [evento_service_1.EventoService],
        })
    ], EventoModule);
    return EventoModule;
}());
exports.EventoModule = EventoModule;
=======
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventoModule = void 0;
var common_1 = require("@nestjs/common");
var evento_service_1 = require("./evento.service");
var evento_controller_1 = require("./evento.controller");
var typeorm_1 = require("@nestjs/typeorm");
var evento_entity_1 = require("./entities/evento.entity");
var tema_evento_entity_1 = require("./entities/tema-evento.entity");
var user_entity_1 = require("../users/entities/user.entity");
var projeto_orientador_entity_1 = require("../projetos/entities/projeto-orientador.entity");
// 💡 NOTA: Ajuste o caminho relativo acima se a pasta do módulo de projetos não for essa exatamente.
var EventoModule = /** @class */ (function () {
    function EventoModule() {
    }
    EventoModule = __decorate([
        (0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forFeature([evento_entity_1.Evento, tema_evento_entity_1.TemaEvento, user_entity_1.User, projeto_orientador_entity_1.ProjetoOrientador])
            ],
            controllers: [evento_controller_1.EventoController],
            providers: [evento_service_1.EventoService],
        })
    ], EventoModule);
    return EventoModule;
}());
exports.EventoModule = EventoModule;
>>>>>>> 65e89bc5d5b878c13e2cbdad46896699fc25e14d
