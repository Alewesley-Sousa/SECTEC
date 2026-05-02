import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ALUNO = 'aluno',
  ORIENTADOR = 'orientador',
  COORDENACAO = 'coordenador',
}

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);