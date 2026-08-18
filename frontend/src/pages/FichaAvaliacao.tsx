import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Gauge, Star, Loader2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { MainLayout } from '../componentes/SideBarUniversal';

const criterios = [
  { key: 'apresentacao', label: 'Apresentação', descricao: 'Clareza, organização e postura' },
  { key: 'metodologia', label: 'Metodologia', descricao: 'Estrutura e rigor do processo' },
  { key: 'conteudo', label: 'Conteúdo', descricao: 'Qualidade e profundidade do material' },
  { key: 'resultado', label: 'Resultado', descricao: 'Impacto, conclusão e entrega' },
] as const;

type CriticoKey = (typeof criterios)[number]['key'];
type NotasState = Record<CriticoKey, number>;

function formatarNota(valor: number) {
  return valor.toFixed(1).replace('.0', '');
}

function calcularMedia(notas: NotasState) {
  const valores = criterios.map((criterio) => notas[criterio.key]);
  const soma = valores.reduce((total, valor) => total + valor, 0);
  return Number((soma / criterios.length).toFixed(1));
}

// ===== Slider customizado com bolinhas =====
function NotaSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const values = useMemo(() => Array.from({ length: 21 }, (_, i) => i * 0.5), []);

  const updateFromClientX = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.min(Math.max(ratio, 0), 1);
    const index = Math.round(clamped * (values.length - 1));
    const newValue = values[index];
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setDragging(true);
    updateFromClientX(event.clientX);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (dragging) updateFromClientX(event.clientX);
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-8 flex items-center cursor-pointer select-none touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) updateFromClientX(touch.clientX);
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (touch) updateFromClientX(touch.clientX);
      }}
    >
      <div className="absolute left-0 right-0 h-1.5 rounded-full bg-slate-200" />
      <div
        className="absolute left-0 h-1.5 rounded-full bg-[#15803d]"
        style={{ width: `${(value / 10) * 100}%` }}
      />
      <div className="absolute left-0 right-0 flex justify-between items-center">
        {values.map((v) => (
          <span
            key={v}
            className={`w-2.5 h-2.5 rounded-full transition-all ${v <= value ? 'bg-[#15803d]' : 'bg-slate-300'
              } ${v === value ? 'w-3.5 h-3.5' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function FichaAvaliacao() {
  const navigate = useNavigate();
  const { projetoId: projetoIdParam } = useParams();
  const projetoId = Number(projetoIdParam);

  const [notas, setNotas] = useState<NotasState>({
    apresentacao: 0,
    metodologia: 0,
    conteudo: 0,
    resultado: 0,
  });
  const [enviada, setEnviada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoEnvio, setCarregandoEnvio] = useState(false);

  const [validandoProjeto, setValidandoProjeto] = useState(true);
  const [projetoValido, setProjetoValido] = useState(false);
  const [projetoInfo, setProjetoInfo] = useState<{
    id: number;
    titulo: string;
    descricao: string;
    local: string;
    autores: string;
    tag: string;
    status: string;
  } | null>(null);

  const media = useMemo(() => calcularMedia(notas), [notas]);

  useEffect(() => {
    async function validarProjeto() {
      if (!projetoId) {
        navigate('/dashboard/avaliador');
        return;
      }

      try {
        const data = await apiRequest<{
          id: number;
          titulo: string;
          descricao: string;
          local: string;
          autores: string;
          tag: string;
          status: string;
        }>(`/avaliador/projetos/${projetoId}/designado`);

        setProjetoInfo(data);
        setProjetoValido(true);
      } catch {
        // Se não for designado, redireciona para o painel
        navigate('/dashboard/avaliador');
      } finally {
        setValidandoProjeto(false);
      }
    }

    validarProjeto();
  }, [projetoId, navigate]);

  const handleNotaChange = (key: CriticoKey, valor: number) => {
    if (Number.isNaN(valor) || valor < 0 || valor > 10) {
      return;
    }
    setEnviada(false);
    setNotas((atual) => ({ ...atual, [key]: valor }));
  };

  const handleSubmit = async () => {
    if (!projetoId || !projetoValido) return;

    try {
      setCarregandoEnvio(true);
      setErro(null);

      const payload = {
        projetoId,
        avaliadorId: Number(localStorage.getItem('userId') ?? 0),
        apresentacao: notas.apresentacao,
        metodologia: notas.metodologia,
        conteudo: notas.conteudo,
        resultado: notas.resultado,
      };

      await apiRequest('/avaliacao', {
        method: 'POST',
        body: payload,
      });

      setEnviada(true);

      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate('/dashboard/avaliador');
      }, 2000);
    } catch (error) {
      setEnviada(false);
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar a avaliação.');
    } finally {
      setCarregandoEnvio(false);
    }
  };

  const statusMedia =
    media >= 9
      ? 'Excelente'
      : media >= 7
        ? 'Bom'
        : media >= 5
          ? 'Regular'
          : 'Insuficiente';

  if (validandoProjeto) {
    return (
      <MainLayout userRole="avaliador">
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
        </main>
      </MainLayout>
    );
  }

  if (!projetoValido || !projetoInfo) {
    return null;
  }

  return (
    <MainLayout userRole="avaliador">
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          {/* Cabeçalho da página com dados do projeto escaneado */}
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15803d]">
                  Avaliação de projeto #{projetoInfo.id}
                </p>
                <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                  {projetoInfo.titulo}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{projetoInfo.autores}</span>
                  <span className="rounded-full bg-[#15803d]/10 px-3 py-1 text-[#15803d]">{projetoInfo.tag}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{projetoInfo.local}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#15803d]/20 bg-[#15803d]/5 px-4 py-3 text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#15803d]">
                  Média atual
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0b4d2c]">
                    {media.toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">/ 10</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            {/* Critérios */}
            <div className="space-y-4">
              {criterios.map((criterio) => (
                <div
                  key={criterio.key}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#15803d]/10 p-1.5 text-[#15803d]">
                          {criterio.key === 'apresentacao' ? <Star size={14} /> : <Gauge size={14} />}
                        </span>
                        <h2 className="text-base font-bold text-slate-800">{criterio.label}</h2>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{criterio.descricao}</p>
                    </div>

                    <div className="min-w-[92px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Nota
                      </span>
                      <div className="mt-1 text-lg font-black text-slate-800">
                        {formatarNota(notas[criterio.key])}
                      </div>
                    </div>
                  </div>

                  <NotaSlider
                    value={notas[criterio.key]}
                    onChange={(valor) => handleNotaChange(criterio.key, valor)}
                  />
                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo e envio */}
            <aside className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Resumo
                </p>

                <div className="mt-4 space-y-3">
                  {criterios.map((criterio) => (
                    <div key={criterio.key} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-600">{criterio.label}</span>
                      <span className="text-sm font-bold text-slate-800">
                        {formatarNota(notas[criterio.key])}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-[#15803d]/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#15803d]">
                    Resultado
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="text-3xl font-black text-[#0b4d2c]">
                      {media.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-slate-600">/ 10</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {statusMedia}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Envio
                </p>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={carregandoEnvio}
                  className="mt-4 w-full rounded-2xl bg-[#15803d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0b4d2c] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {carregandoEnvio ? 'Enviando...' : enviada ? 'Avaliação enviada' : 'Enviar avaliação'}
                </button>

                {erro && (
                  <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {erro}
                  </div>
                )}

                {enviada && (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 size={16} />
                    Avaliação registrada no backend.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </MainLayout>
  );
} 