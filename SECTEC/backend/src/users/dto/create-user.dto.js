"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserDto = void 0;
// src/users/dto/create-user.dto.ts
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var user_entity_1 = require("../entities/user.entity");
var CreateUserDto = /** @class */ (function () {
    function CreateUserDto() {
    }
    __decorate([
        (0, swagger_1.ApiProperty)({ example: 'Fulano de Tal' }),
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsNotEmpty)({ message: 'O nome é obrigatório.' })
    ], CreateUserDto.prototype, "nome", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ example: 'fulano@escola.com' }),
        (0, class_validator_1.IsEmail)({}, { message: 'O e-mail informado é inválido.' }),
        (0, class_validator_1.IsNotEmpty)({ message: 'O e-mail institucional é obrigatório.' })
    ], CreateUserDto.prototype, "email_institucional", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ enum: user_entity_1.UserRole, example: user_entity_1.UserRole.ALUNO }),
        (0, class_validator_1.IsEnum)(user_entity_1.UserRole, { message: 'Cargo/Role inválido.' }),
        (0, class_validator_1.IsNotEmpty)({ message: 'O cargo é obrigatório.' })
    ], CreateUserDto.prototype, "role_cargo", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ example: 'SenhaSegura123', required: false }),
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsOptional)()
    ], CreateUserDto.prototype, "senha", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ enum: user_entity_1.UserTurma, example: user_entity_1.UserTurma.INFORMATICA, required: false }),
        (0, class_validator_1.IsEnum)(user_entity_1.UserTurma, { message: 'Turma inválida.' }),
        (0, class_validator_1.IsOptional)()
    ], CreateUserDto.prototype, "turma", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ example: 3, required: false }),
        (0, class_validator_1.IsInt)(),
        (0, class_validator_1.Min)(1),
        (0, class_validator_1.IsOptional)()
    ], CreateUserDto.prototype, "ano", void 0);
    return CreateUserDto;
}());
exports.CreateUserDto = CreateUserDto;
