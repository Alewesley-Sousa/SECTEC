import { SetMetadata } from '@nestjs/common';
<<<<<<< HEAD
export { UserRole } from 'src/users/entities/user.entity'; // 👈 Adicionou 'export' aqui!

export const ROLES_KEY = 'roles';
export const Roles = (...roles: any[]) => SetMetadata(ROLES_KEY, roles);
=======
import { UserRole } from '../../users/entities/user.entity';

export { UserRole };
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
>>>>>>> feature/tarefa-1-banco-dados
