import { useEffect, useState, useRef, createContext, useContext, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  User,
  MapPin,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  QrCode,
  X,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { MainLayout } from '../componentes/SideBarUniversal';
import { Pagination } from '../componentes/PaginationUniversal';
import { apiRequest } from '../lib/api';

// ===== Tipos =====
type ProjetoDesignado = {
  id: number;
  titulo: string;
  descricao: string;
  local: string;
  autores: string;
  tag: string;
  status: 'Pendente' | 'Avaliado';
  atribuicaoId: number;
};

// ===== Componentes UI locais =====
type CardProps = {
  className?: string;
  children: ReactNode;
};

function Card({ className = '', children }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ className = '', children }: CardProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

type BadgeProps = {
  className?: string;
  variant?: 'outline' | 'default';
  children: ReactNode;
};

function Badge({ className = '', variant = 'default', children }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium';
  const variantStyles =
    variant === 'outline'
      ? 'border border-orange-200 bg-orange-50 text-orange-500'
      : 'bg-[#15803d]/10 text-[#15803d]';

  return (
    <span className={`${base} ${variantStyles} ${className}`}>
      {children}
    </span>
  );
}

// ===== Tabs locais (agora controlado) =====
type TabsContextType = {
  activeTab: string;
  setActiveTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
  return ctx;
}

type TabsProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
  children: ReactNode;
};

function Tabs({ value, onValueChange, defaultValue, className = '', children }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue ?? '');
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (newTab: string) => {
    if (value === undefined) {
      setInternalTab(newTab);
    }
    onValueChange?.(newTab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`flex ${className}`}>{children}</div>;
}

function TabsTrigger({
  value,
  className = '',
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition ${
        isActive
          ? 'bg-[#15803d]/10 text-[#0b4d2c]'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ===== Modal de Leitor QR Code (com correção para câmera duplicada) =====
function QrCodeScannerModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (result: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    const container = document.getElementById('qr-reader');
    if (container) {
      container.innerHTML = '';
    }

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(console.error);
          onSuccessRef.current(decodedText);
        },
        () => {},
      )
      .catch((err) => {
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
        console.error(err);
      });

    return () => {
      const scannerInstance = scannerRef.current;
      if (scannerInstance) {
        if (scannerInstance.isScanning) {
          scannerInstance
            .stop()
            .then(() => {
              scannerInstance.clear();
              if (container) container.innerHTML = '';
            })
            .catch(() => {
              scannerInstance.clear();
              if (container) container.innerHTML = '';
            });
        } else {
          scannerInstance.clear();
          if (container) container.innerHTML = '';
        }
      }
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Escanear QR Code</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Aponte a câmera para o QR Code do projeto.
        </p>

        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : (
          <div
            id="qr-reader"
            className="mt-4 overflow-hidden rounded-2xl"
            style={{ maxHeight: '300px' }}
          />
        )}
      </div>
    </div>
  );
}

// ===== Página =====
export function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjetoDesignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'painel' | 'avaliados'>('painel');

  const [gerando, setGerando] = useState(false);
  const [geracaoSucesso, setGeracaoSucesso] = useState<string | null>(null);
  const [geracaoErro, setGeracaoErro] = useState<string | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrSuccess, setQrSuccess] = useState<string | null>(null);

  const itemsPerPage = 6;

  // Filtra projetos conforme a aba ativa
  const filteredProjects = activeTab === 'painel'
    ? projects.filter((p) => p.status === 'Pendente')
    : projects.filter((p) => p.status === 'Avaliado');

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const visibleProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

  async function carregarProjetos() {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<{ projetos: ProjetoDesignado[] }>(
        '/avaliador/projetos/designados',
      );
      setProjects(data.projetos ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os projetos designados.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProjetos();
  }, []);

  // Reinicia a página quando a aba muda
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  async function handleGerarProjetos() {
    setGerando(true);
    setGeracaoSucesso(null);
    setGeracaoErro(null);

    try {
      const response = await apiRequest<{ mensagem: string }>(
        '/avaliador/projetos/gerar',
        { method: 'POST' },
      );

      setGeracaoSucesso(response.mensagem || 'Projetos gerados com sucesso!');
      await carregarProjetos();
    } catch (err) {
      setGeracaoErro(
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar os projetos.',
      );
    } finally {
      setGerando(false);
    }
  }

  async function handleQrSuccess(decodedText: string) {
    setQrModalOpen(false);

    const match = decodedText.match(/(\d+)\/?$/);
    if (!match) {
      setQrSuccess('QR Code lido, mas não foi possível identificar o projeto.');
      return;
    }

    const projetoId = match[1];

    try {
      await apiRequest<{ id: number; titulo: string }>(
        `/avaliador/projetos/${projetoId}/designado`,
      );
      navigate(`/dashboard/avaliador/avaliacao/${projetoId}`);
    } catch (err) {
      setQrSuccess('Este projeto não está designado a você.');
      navigate('/dashboard/avaliador');
    }
  }

  const totalDesignados = projects.length;
  const totalAvaliar = projects.filter((p) => p.status === 'Pendente').length;

  return (
    <MainLayout userRole="avaliador">
      <main className="min-h-screen bg-[#f4f9f6] px-4 py-6 sm:px-6 lg:px-10">
        {/* Abas controladas */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'painel' | 'avaliados')}
          className="w-full"
        >
          <TabsList className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-1 h-12">
            <TabsTrigger value="painel" className="flex-1">
              <FileText className="w-4 h-4" /> Painel
            </TabsTrigger>
            <TabsTrigger value="avaliados" className="flex-1">
              <User className="w-4 h-4" /> Avaliados
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Ações e Cards de números */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleGerarProjetos}
              disabled={gerando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#15803d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b4d2c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {gerando ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {gerando ? 'Gerando...' : 'Gerar Projetos'}
            </button>

            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#15803d]/30 bg-white px-5 py-3 text-sm font-bold text-[#15803d] transition hover:bg-[#15803d]/5"
            >
              <QrCode size={18} />
              Ler QR Code do Projeto
            </button>
          </div>

          {geracaoSucesso && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={16} />
              {geracaoSucesso}
            </div>
          )}

          {geracaoErro && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} />
              {geracaoErro}
            </div>
          )}

          {qrSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={16} />
              {qrSuccess}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-slate-900">{totalDesignados}</div>
                <div className="text-xs text-slate-500 mt-1">Designados</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-slate-900">{totalAvaliar}</div>
                <div className="text-xs text-slate-500 mt-1">A avaliar</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista filtrada */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 px-1 mb-3">
            {activeTab === 'painel' ? 'Projetos pendentes' : 'Projetos avaliados'}
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {!loading && !error && filteredProjects.length === 0 && (
            <div className="text-sm text-slate-500 py-8 text-center">
              {activeTab === 'painel'
                ? 'Nenhum projeto pendente.'
                : 'Nenhum projeto avaliado ainda.'}
            </div>
          )}

          {!loading && !error && filteredProjects.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleProjects.map((project) => (
                  <Card key={project.id} className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-slate-400 font-mono">
                          #{String(project.id).padStart(4, '0')}
                        </span>
                        <Badge
                          variant={project.status === 'Pendente' ? 'outline' : 'default'}
                          className={
                            project.status === 'Pendente'
                              ? 'text-orange-500 border-orange-200 bg-orange-50'
                              : 'bg-[#15803d]/10 text-[#15803d]'
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 leading-tight mb-3">
                        {project.titulo}
                      </h3>
                      <div className="space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{project.local}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{project.autores}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Badge className="bg-[#15803d]/10 text-[#15803d] text-[10px] font-medium rounded-full px-3 py-0.5">
                          {project.tag}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={filteredProjects.length}
                limit={itemsPerPage}
              />
            </>
          )}
        </div>
      </main>

      {qrModalOpen && (
        <QrCodeScannerModal
          onClose={() => setQrModalOpen(false)}
          onSuccess={handleQrSuccess}
        />
      )}
    </MainLayout>
  );
}