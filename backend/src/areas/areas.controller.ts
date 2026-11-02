import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@ApiTags('áreas')
@ApiBearerAuth('token-jwt')
@UseGuards(JwtAuthGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areas: AreasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as áreas' })
  findAll() { return this.areas.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.areas.findOne(id); }

  @Post()
  create(@Body() dto: CreateAreaDto, @GetUser('role') role: string) {
    this.assertCoordinator(role);
    return this.areas.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAreaDto, @GetUser('role') role: string) {
    this.assertCoordinator(role);
    return this.areas.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser('role') role: string) {
    this.assertCoordinator(role);
    return this.areas.remove(id);
  }

  private assertCoordinator(role: string) {
    if (role !== 'coordenador') throw new ForbiddenException('Apenas coordenadores podem gerenciar áreas.');
  }
}
