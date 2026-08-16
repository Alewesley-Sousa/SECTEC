import { FileText, Send, ArrowRight, CheckCircle, Search, Users } from "lucide-react";

export default function ConteudoAjuda() {
  return (
    <div className="space-y-6">
      {/* Seção 1: Relatório de Alunos */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-900">
              Relatório de Alunos na Modalidade Relatório
            </h3>
            <p className="text-xs font-semibold text-emerald-700/70">
              Visualize, filtre e gerencie os alunos que estão na modalidade relatório
            </p>
          </div>
        </div>
        <div className="space-y-3 text-xs font-medium text-slate-600">
          <p>
            Uma nova tela dedicada foi adicionada para a coordenação acompanhar{" "}
            <strong>todos os alunos da modalidade relatório</strong>. Nela você encontra:
          </p>
          <div className="flex items-start gap-2">
            <Search size={14} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>
              <strong>Busca por nome:</strong> digite parte do nome do aluno para localizá-lo rapidamente.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>
              <strong>Filtro por status:</strong> exiba apenas alunos com projeto, sem projeto, ou todos.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Users size={14} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>
              <strong>Lista completa com paginação:</strong> veja o total de alunos e navegue entre as páginas
              usando os controles inferiores.
            </span>
          </div>
          <p>
            Cada aluno exibe seu nome, curso, ano e status atual em relação à distribuição de projetos. O
            botão <strong>"Atualizar"</strong> no topo recarrega os dados sem sair da tela.
          </p>
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle size={14} />
            <span className="font-black">Disponível na aba "Gestão de Projetos" do painel.</span>
          </div>
        </div>
      </div>

      {/* Seção 2: Distribuição de Projetos e Materiais */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Send size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-900">
              Distribuição de Projetos e Materiais Enviados
            </h3>
            <p className="text-xs font-semibold text-amber-700/70">
              Atribua projetos manualmente, em lote e acompanhe os materiais que os alunos enviaram
            </p>
          </div>
        </div>
        <div className="space-y-3 text-xs font-medium text-slate-600">
          <p>
            Além da visualização, agora é possível realizar toda a gestão diretamente pela listagem:
          </p>

          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Atribuir projeto individualmente:</strong> clique no botão{" "}
              <strong>"Atribuir Projeto"</strong> ao lado do aluno, pesquise o projeto desejado e confirme.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Definir quantidade individual:</strong> use <strong>"Definir Qtd"</strong> para
              estabelecer quantos projetos aquele aluno poderá receber.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Atribuição em lote:</strong> selecione múltiplos alunos com o botão{" "}
              <strong>"Lote"</strong>, defina um intervalo de projetos e distribua todos de uma só vez.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Visualizar/remover projetos:</strong> o botão <strong>"Visualizar/Remover"</strong> abre
              um modal onde você vê todos os projetos já atribuídos ao aluno e pode removê-los se necessário.
            </span>
          </div>
          <p>
            Na aba <strong>"Materiais Enviados"</strong>, você acompanha o que cada aluno submeteu: arquivos,
            status, data de envio e pode filtrar por curso/ano. Tudo centralizado para a modalidade relatório.
          </p>
          <div className="flex items-center gap-2 text-amber-700">
            <CheckCircle size={14} />
            <span className="font-black">Todas as ações ficam disponíveis nos cards de cada aluno.</span>
          </div>
        </div>
      </div>
    </div>
  );
}