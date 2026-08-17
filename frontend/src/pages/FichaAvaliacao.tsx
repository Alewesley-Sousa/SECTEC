import { useMemo, useState } from 'react';
import { CheckCircle2, Gauge, Star } from 'lucide-react';
import { apiRequest } from '../lib/api';

const criterios = [
  { key: 'apresentacao', label: 'Apresentação', descricao: 'Clareza, organização e postura' },
  { key: 'metodologia', label: 'Metodologia', descricao: 'Estrutura e rigor do processo' },
  { key: 'conteudo', label: 'Conteúdo', descricao: 'Qualidade e profundidade do material' },
  { key: 'resultado', label: 'Resultado', descricao: 'Impacto, conclusão e entrega' },
] as const;

type CriticoKey = (typeof criterios)[number]['key'];
type NotasState = Record<CriticoKey, number | ''>;

const opcoesNota = Array.from({ length: 21 }, (_, index) => index / 2);

function formatarNota(valor: number | '') {
  if (valor === '') return '—';
  return Number(valor).toFixed(1).replace('.0', '');
}

function calcularMedia(notas: NotasState) {
  const valores = criterios
    .map((criterio) => notas[criterio.key])
    .filter((valor): valor is number => valor !== '');

  if (valores.length !== criterios.length) {
    return null;
  }

  const soma = valores.reduce((total, valor) => total + valor, 0);
  return Number((soma / criterios.length).toFixed(1));
}

export default function FichaAvaliacao() {
  const [notas, setNotas] = useState<NotasState>({
    apresentacao: '',
    metodologia: '',
    conteudo: '',
    resultado: '',
  });
  const [projetoId, setProjetoId] = useState<number | ''>(1);
  const [enviada, setEnviada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoEnvio, setCarregandoEnvio] = useState(false);

  const media = useMemo(() => calcularMedia(notas), [notas]);

  const todasPreenchidas = criterios.every((criterio) => notas[criterio.key] !== '');

  const handleNotaChange = (key: CriticoKey, valor: string) => {
    const valorNumerico = valor === '' ? '' : Number(valor);

    if (valor !== '' && (Number.isNaN(valorNumerico) || valorNumerico < 0 || valorNumerico > 10)) {
      return;
    }

    setEnviada(false);
    setNotas((atual) => ({ ...atual, [key]: valor === '' ? '' : valorNumerico }));
  };

  const handleSubmit = async () => {
    if (!todasPreenchidas || projetoId === '') {
      return;
    }

    try {
      setCarregandoEnvio(true);
      setErro(null);

      const payload = {
        projetoId: Number(projetoId),
        avaliadorId: Number(localStorage.getItem('userId') ?? 0),
        apresentacao: Number(notas.apresentacao),
        metodologia: Number(notas.metodologia),
        conteudo: Number(notas.conteudo),
        resultado: Number(notas.resultado),
      };

      await apiRequest('/avaliacao', {
        method: 'POST',
        body: payload,
      });

      setEnviada(true);
    } catch (error) {
      setEnviada(false);
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar a avaliação.');
    } finally {
      setCarregandoEnvio(false);
    }
  };

  const statusMedia =
    media === null
      ? 'Preencha todos os critérios'
      : media >= 9
        ? 'Excelente'
        : media >= 7
          ? 'Bom'
          : media >= 5
            ? 'Regular'
            : 'Insuficiente';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sectec-700">
                Avaliação de projeto
              </p>
              <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                Ficha de Avaliação
              </h1>
            </div>

            <div className="rounded-2xl border border-sectec-200 bg-sectec-50 px-4 py-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sectec-700">
                Média atual
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-sectec-800">
                  {media === null ? '—' : media.toFixed(1)}
                </span>
                <span className="text-sm font-medium text-slate-500">/ 10</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {criterios.map((criterio) => (
              <div
                key={criterio.key}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sectec-100 p-1.5 text-sectec-700">
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

                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Selecionar nota
                </label>
                <select
                  value={notas[criterio.key]}
                  onChange={(event) => handleNotaChange(criterio.key, event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-800 shadow-sm outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-200"
                  aria-label={criterio.label}
                >
                  <option value="">Selecione</option>
                  {opcoesNota.map((valor) => (
                    <option key={valor} value={valor}>
                      {valor.toFixed(1).replace('.0', '')}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

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

              <div className="mt-5 rounded-2xl bg-sectec-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sectec-700">
                  Resultado
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <span className="text-3xl font-black text-sectec-800">
                    {media === null ? '—' : media.toFixed(1)}
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
                disabled={!todasPreenchidas || projetoId === '' || carregandoEnvio}
                className="mt-4 w-full rounded-2xl bg-sectec-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-sectec-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {carregandoEnvio ? 'Enviando...' : enviada ? 'Avaliação enviada' : 'Enviar avaliação'}
              </button>

              {!todasPreenchidas && (
                <p className="mt-3 text-xs text-amber-700">
                  Preencha as quatro notas para habilitar o envio.
                </p>
              )}

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
    </div>
  );
}
