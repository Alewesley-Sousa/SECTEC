import { Controller, Get, Post, Body, Patch, Param, Req, Delete, Query, Put } from '@nestjs/common';
import { RelatorioAlunoService } from './relatorio-aluno.service';
import { CreateRelatorioAlunoDto, UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto } from './dto';

@Controller('relatorio-aluno')
export class RelatorioAlunoController {
  constructor(private readonly relatorioAlunoService: RelatorioAlunoService) { }

  /**
   * ============================================================
   *                ENDPOINTS PARA COORDENAÇÃO
   * ============================================================
   */

  /**
   * Lista todos os alunos da modalidade relatório no evento atual
   * com seus respectivos status, quantidade de projetos e projetos já atribuídos.
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

  /**
   * Atualiza os dados de um aluno na modalidade relatório.
   * 
   * Permite:
   * - Atualizar a quantidade de projetos que o aluno deve relatar
   * - Resetar o status (ex: de 'enviado' para 'distribuido' para reenvio)
   * 
   * @param id - ID do registro em relatorio_aluno
   * @param updateRelatorioAlunoDto - Dados para atualização (quantidade_projetos, status)
   * @returns Registro atualizado
   */
  @Put('coordenador/alunos-relatorio/:id')
  async atualizarRelatorioAluno(
    @Param('id') id: string,
    @Body() updateRelatorioAlunoDto: UpdateRelatorioAlunoDto,
  ) {
    return this.relatorioAlunoService.atualizarRelatorioAluno(+id, updateRelatorioAlunoDto);
  }



  /**
  * Dispara a distribuição automática de projetos para todos os alunos
  * que já têm quantidade_projetos > 0 e status = 'pendente'.
  * 
  * A distribuição é cruzada: prioriza projetos de turmas diferentes,
  * mas com baixa probabilidade permite projetos da mesma turma.
  */
  @Post('coordenador/alunos-relatorio/distribuir')
  async distribuirProjetos() {
    return this.relatorioAlunoService.distribuirProjetos();
  }


  /**
 * ============================================================
 *                ENDPOINTS PARA ALUNOs
 * ============================================================
 */


  /**
* Retorna a lista de projetos atribuídos ao aluno logado
* com informações básicas (título, área, autores, etc.).
* 
* @param req - Requisição com o usuário logado (aluno)
* @returns Lista de projetos atribuídos ao aluno
*/
  @Get('aluno/relatorio/meus-projetos')
  async meusProjetos(@Req() req: any) {
    const alunoId = req.user.id;
    return this.relatorioAlunoService.meusProjetos(alunoId);
  }
}