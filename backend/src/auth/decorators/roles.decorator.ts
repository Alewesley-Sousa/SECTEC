import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export { UserRole };
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);