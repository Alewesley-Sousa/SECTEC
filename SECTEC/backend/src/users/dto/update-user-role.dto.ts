// src/users/dto/update-user-role.dto.ts
import { IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateToComissaoDto {
  @IsEnum(UserRole)
  role_cargo: UserRole.COMISSAO = UserRole.COMISSAO;
}
