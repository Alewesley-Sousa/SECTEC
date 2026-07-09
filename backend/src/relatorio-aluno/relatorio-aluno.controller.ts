import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { RelatorioAlunoService } from './relatorio-aluno.service';
import { CreateRelatorioAlunoDto, UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto } from './dto';

@Controller('relatorio-aluno')
export class RelatorioAlunoController {
  constructor(private readonly relatorioAlunoService: RelatorioAlunoService) {}

  /**
   * Lista todos os alunos da modalidade relatório no evento atual
   * com seus respectivos status, quantidade de projetos e projetos já atribuídos.
   * 
   * Endpoint para a coordenação gerenciar os alunos em modalidade relatório.
   * 
   * @param filtros - DTO com filtros (status, nome, page, limit)
   * @returns Lista paginada de alunos com seus relatórios e projetos atribuídos
   */
  @Get('coordenador/alunos-relatorio')
  async listarAlunosRelatorio(
    @Query() filtros: ListarRelatorioAlunoDto,
  ) {
    return this.relatorioAlunoService.listarAlunosRelatorio(filtros);
  }
}