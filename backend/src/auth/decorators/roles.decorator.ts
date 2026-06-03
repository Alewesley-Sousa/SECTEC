import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ALUNO = 'aluno',
  ORIENTADOR = 'orientador',
  COORDENACAO = 'coordenador',
  COMISSAO = 'comissao',
}

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);