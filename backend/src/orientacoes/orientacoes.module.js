<<<<<<< HEAD
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrientacoesModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var projeto_orientador_entity_1 = require("./entities/projeto-orientador.entity");
var orientacoes_service_1 = require("./orientacoes.service");
var orientacoes_controller_1 = require("./orientacoes.controller");
// Importações corretas de todas as entidades tocadas pelo Service
var projeto_entity_1 = require("../projetos/entities/projeto.entity");
var projeto_aluno_entity_1 = require("../projetos/entities/projeto-aluno.entity");
var user_entity_1 = require("../users/entities/user.entity"); // 🚀 IMPORTANTE: Adicionado para o userRepository funcionar
var OrientacoesModule = /** @class */ (function () {
    function OrientacoesModule() {
    }
    OrientacoesModule = __decorate([
        (0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forFeature([
                    projeto_orientador_entity_1.ProjetoOrientador,
                    projeto_entity_1.Projeto,
                    projeto_aluno_entity_1.ProjetoAluno,
                    user_entity_1.User // 🚀 IMPORTANTE: Injetando o repositório de usuários no escopo deste módulo
                ]),
            ],
            providers: [orientacoes_service_1.OrientacoesService],
            controllers: [orientacoes_controller_1.OrientacoesController],
            exports: [orientacoes_service_1.OrientacoesService],
        })
    ], OrientacoesModule);
    return OrientacoesModule;
}());
exports.OrientacoesModule = OrientacoesModule;
=======
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrientacoesModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var projeto_orientador_entity_1 = require("./entities/projeto-orientador.entity");
var orientacoes_service_1 = require("./orientacoes.service");
var orientacoes_controller_1 = require("./orientacoes.controller");
// Importações corretas de todas as entidades tocadas pelo Service
var projeto_entity_1 = require("../projetos/entities/projeto.entity");
var projeto_aluno_entity_1 = require("../projetos/entities/projeto-aluno.entity");
var user_entity_1 = require("../users/entities/user.entity"); // 🚀 IMPORTANTE: Adicionado para o userRepository funcionar
var OrientacoesModule = /** @class */ (function () {
    function OrientacoesModule() {
    }
    OrientacoesModule = __decorate([
        (0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forFeature([
                    projeto_orientador_entity_1.ProjetoOrientador,
                    projeto_entity_1.Projeto,
                    projeto_aluno_entity_1.ProjetoAluno,
                    user_entity_1.User // 🚀 IMPORTANTE: Injetando o repositório de usuários no escopo deste módulo
                ]),
            ],
            providers: [orientacoes_service_1.OrientacoesService],
            controllers: [orientacoes_controller_1.OrientacoesController],
            exports: [orientacoes_service_1.OrientacoesService],
        })
    ], OrientacoesModule);
    return OrientacoesModule;
}());
exports.OrientacoesModule = OrientacoesModule;
>>>>>>> 65e89bc5d5b878c13e2cbdad46896699fc25e14d
