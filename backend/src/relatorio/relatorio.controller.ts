import { Controller, Get, UseGuards } from '@nestjs/common';
import { RelatorioService, AlunosAgrupados, ComissaoPorEvento,
EixosPorEvento, ProjetosPorOrientador, ProjetosPorTurma } from './relatorio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator'; // 👈 Importado o UserRole
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';




@ApiTags('relatorios')
@Controller('relatorio')
//@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('token-jwt')
@Roles(UserRole.COORDENACAO) // 👈 Alterado para usar o Enum correto
export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) {}

  @Get('alunos-sem-projeto')
  @ApiOperation({ summary: 'Lista os alunos que não possuem projeto no ano atual agrupados por turma' })
  obterAlunosSemProjeto(): Promise<AlunosAgrupados> { // 👈 Tipado explicitamente o retorno do método
    return this.relatorioService.obterAlunosSemProjeto();
  }
  
  @Get('comissao-por-evento')
  @ApiOperation({ summary: 'Retorna o histórico de alunos da comissão organizadora agrupados por evento' })
  obterHistoricoComissao(): Promise<ComissaoPorEvento> {
    return this.relatorioService.obterHistoricoComissao();
  }
  
  
    @Get('eixos-tematicos')
  @ApiOperation({ summary: 'Retorna estatísticas quantitativas (totais, pendentes, aceitos) por Eixo Temático do evento ativo' })
  obterMetricasEixosTematicos(): Promise<EixosPorEvento> {
    return this.relatorioService.obterMetricasEixosTematicos();
  }


	 @Get('projetos-por-orientador')
  @ApiOperation({ summary: 'Lista a quantidade e os títulos dos projetos aceitos por orientador no evento atual' })
  obterProjetosPorOrientador(): Promise<ProjetosPorOrientador[]> {
    return this.relatorioService.obterProjetosPorOrientador();
  }
  
  @Get('projetos-por-turma')
  @ApiOperation({ summary: 'Retorna a quantidade de projetos criados e aprovados agrupados por turma e ano' })
  obterProjetosPorTurma(): Promise<ProjetosPorTurma> {
    return this.relatorioService.obterProjetosPorTurma();
  }
  
  
  

}
