import { SetMetadata } from '@nestjs/common';
export { UserRole } from 'src/users/entities/user.entity'; // 👈 Adicionou 'export' aqui!

export const ROLES_KEY = 'roles';
export const Roles = (...roles: any[]) => SetMetadata(ROLES_KEY, roles);