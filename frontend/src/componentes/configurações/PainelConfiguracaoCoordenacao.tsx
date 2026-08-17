import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Sliders, Save, CheckCircle2, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { MainLayout } from "../SideBarUniversal";
import { API_BASE_URL } from "../../lib/api";

export default function PainelConfiguracaoCoordenacao() {
  const [minProjetos, setMinProjetos] = useState<number | string>(1);
  const [maxProjetos, setMaxProjetos] = useState<number | string>(3);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function carregarConfiguracoes() {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${API_BASE_URL}/avaliador/configuracao/limites`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Usa ?? para não sobrescrever com padrão se o valor for 0
          setMinProjetos(data.min_projetos_por_avaliador ?? 1);
          setMaxProjetos(data.max_projetos_por_avaliador ?? 3);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setFetching(false);
      }
    }

    carregarConfiguracoes();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const minNum = Number(minProjetos);
    const maxNum = Number(maxProjetos);

    // Validação de intervalo permitido (1 a 20)
    if (minNum < 1 || maxNum > 20) {
      Swal.fire({
        icon: "error",
        title: "Limites inválidos",
        text: "Os valores devem estar entre 1 e 20 projetos por avaliador.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    if (minNum > maxNum) {
      Swal.fire({
        icon: "error",
        title: "Limites inválidos",
        text: "O mínimo não pode ser maior que o máximo. Exemplo: mínimo 1 e máximo 20.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/avaliador/configuracao/limites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          minAvaliacoes: minNum,
          maxProjetosPorAvaliador: maxNum,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar.");

      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Configurações salvas com sucesso.",
        confirmButtonColor: "#15803d",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível salvar agora. Verifique sua conexão e tente novamente.",
        confirmButtonColor: "#15803d",
      });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <MainLayout userRole="coordenador">
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sectec-700" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userRole="coordenador">
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {/* Lado explicativo */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#0b4d2c] px-6 py-6 text-white">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
                  <Sliders size={32} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">Módulo Avaliador</p>
                  <h1 className="text-2xl font-black">Distribuição</h1>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <CheckCircle2 className="text-sectec-700 mt-1" size={18} />
                <p className="text-xs text-slate-600">
                  Aqui você define a quantidade de projetos que <strong>cada avaliador</strong> vai receber.
                  O sistema sorteará os projetos e tentará respeitar esses limites.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Hoje o sistema está configurado para <strong>{minProjetos} a {maxProjetos} projetos por avaliador</strong>.
              </p>
            </div>
          </section>

          {/* Formulário */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-extrabold text-slate-900">Configurar Limites</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Mínimo de projetos por avaliador
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={minProjetos}
                    onChange={(e) => setMinProjetos(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-sectec-500"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-400">Valor entre 1 e 3</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Máximo de projetos por avaliador
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={maxProjetos}
                    onChange={(e) => setMaxProjetos(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-sectec-500"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-400">Valor entre 1 e 3</p>
                </div>
              </div>
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sectec-700 py-3 font-bold text-white hover:bg-sectec-800 disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </MainLayout>
  );
}