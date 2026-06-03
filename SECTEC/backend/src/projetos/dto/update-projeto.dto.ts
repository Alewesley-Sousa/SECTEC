import { PartialType } from '@nestjs/mapped-types';
import { CreateProjetoDto } from './create-projeto.dto';

export class UpdateProjetoDto extends PartialType(CreateProjetoDto) {
  // Não precisa adicionar nada aqui, o PartialType já cuidou de tudo!
}
