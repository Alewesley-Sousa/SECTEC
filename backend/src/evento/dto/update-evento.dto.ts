import { PartialType } from '@nestjs/swagger';
import { CreateEventoDto } from './create-evento.dto';

export class UpdateEventoDto extends PartialType(CreateEventoDto) {}
