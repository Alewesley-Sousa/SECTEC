  // src/componentes/Pagination.tsx
  import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

  interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    total?: number;
    limit?: number;
    showInfo?: boolean;
  }

  export function Pagination({
    page,
    totalPages,
    onPageChange,
    total,
    limit,
    showInfo = true,
  }: PaginationProps) {
    if (totalPages <= 0) return null;

    const startItem = total && limit ? (page - 1) * limit + 1 : null;
    const endItem = total && limit ? Math.min(page * limit, total) : null;

    // Gera os números de página visíveis
    const generatePageNumbers = () => {
      const pages: (number | 'ellipsis')[] = [];
      const delta = 2; // quantas páginas ao redor da atual
      const left = Math.max(2, page - delta);
      const right = Math.min(totalPages - 1, page + delta);

      pages.push(1);

      if (left > 2) pages.push('ellipsis');

      for (let i = left; i <= right; i++) {
        pages.push(i);
      }

      if (right < totalPages - 1) pages.push('ellipsis');

      if (totalPages > 1) pages.push(totalPages);

      return pages;
    };

    const pageNumbers = generatePageNumbers();

    const buttonBase =
      'inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-200 border border-transparent';
    const activeStyle =
      'bg-gradient-to-br from-sectec-700 to-emerald-700 text-white shadow-md shadow-sectec-200 border-sectec-500';
    const inactiveStyle =
      'text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-sectec-700';
    const disabledStyle = 'opacity-30 cursor-not-allowed pointer-events-none text-slate-400';

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200 px-4 py-3 text-sm">
        {/* Informações de registros */}
        {showInfo && startItem && endItem && total ? (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{startItem}–{endItem}</span>
            <span className="text-slate-400">de</span>
            <span className="font-semibold text-slate-700">{total}</span>
          </div>
        ) : (
          showInfo && (
            <span className="text-xs sm:text-sm text-slate-500">
              Página {page} de {totalPages}
            </span>
          )
        )}

        {/* Controles de navegação */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Primeira página */}
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className={`${buttonBase} ${page <= 1 ? disabledStyle : inactiveStyle}`}
            aria-label="Primeira página"
            title="Primeira página"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Anterior */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={`${buttonBase} ${page <= 1 ? disabledStyle : inactiveStyle}`}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Números de página */}
          {pageNumbers.map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400 select-none">
                •••
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`${buttonBase} ${
                  p === page ? activeStyle : inactiveStyle
                }`}
                aria-label={`Ir para página ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

          {/* Próxima */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={`${buttonBase} ${page >= totalPages ? disabledStyle : inactiveStyle}`}
            aria-label="Próxima página"
            title="Próxima página"
          >
            <ChevronRight size={14} />
          </button>

          {/* Última página */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className={`${buttonBase} ${page >= totalPages ? disabledStyle : inactiveStyle}`}
            aria-label="Última página"
            title="Última página"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    );
  }