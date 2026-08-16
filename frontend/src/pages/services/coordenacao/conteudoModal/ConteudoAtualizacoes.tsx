import { Download, FolderTree, Users, Search, ArrowRight, CheckCircle } from "lucide-react";

export default function ConteudoAtualizacoes() {
  return (
    <div className="space-y-6">
      {/* Seção 1: Download de Banners */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Download size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-900">Download de Banners em Lote</h3>
            <p className="text-xs font-semibold text-emerald-700/70">
              Baixe todos os banners aprovados de uma só vez
            </p>
          </div>
        </div>
        <div className="space-y-3 text-xs font-medium text-slate-600">
          <p>
            Agora é possível baixar <strong>todos os banners</strong> que os alunos enviaram e que já foram
            aprovados pelos orientadores. Os arquivos são organizados automaticamente em pastas com a
            estrutura:
          </p>
          <div className="rounded-xl bg-white p-3 font-mono text-[11px] text-slate-700 shadow-sm">
            <FolderTree size={14} className="inline mr-1 text-slate-400" />
            curso / ano / arquivo
            <br />
            <span className="text-slate-400">Exemplo:</span> informatica / 1ºano / banner-projeto_joaosilva.pdf
          </div>
          <p>
            Você também pode filtrar por <strong>curso específico</strong> ou <strong>anos específicos</strong>,
            baixando apenas o que realmente precisa.
          </p>
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle size={14} />
            <span className="font-black">Disponível no botão "Baixar banners" na tela de projetos.</span>
          </div>
        </div>
      </div>

      {/* Seção 2: Gerenciamento de Orientadores */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-blue-900">Gerenciamento de Orientadores</h3>
            <p className="text-xs font-semibold text-blue-700/70">
              Troque ou remova orientadores dos projetos
            </p>
          </div>
        </div>
        <div className="space-y-3 text-xs font-medium text-slate-600">
          <p>
            Agora a coordenação pode <strong>trocar</strong> ou <strong>remover</strong> o orientador de qualquer
            projeto diretamente pelo painel de detalhes.
          </p>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <span>
              Acesse um projeto clicando em <strong>"Ver"</strong> no card desejado.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <span>
              No painel lateral, vá até a seção <strong>"Orientador aceito"</strong>.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <span>
              Use o campo de seleção para pesquisar orientadores por <strong>nome</strong> ou{" "}
              <strong>e-mail institucional</strong> e escolha o novo orientador.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Search size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <span>
              A busca é inteligente: digite parte do nome ou e-mail para encontrar rapidamente.
            </span>
          </div>
          <p>
            Após selecionar, clique em <strong>"Trocar"</strong>. Para remover o orientador atual, use o botão
            vermelho <strong>"Remover orientador"</strong> (ele será marcado como recusado e não perderá o
            histórico).
          </p>
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle size={14} />
            <span className="font-black">Funcionalidade disponível apenas para coordenadores.</span>
          </div>
        </div>
      </div>
    </div>
  );
}