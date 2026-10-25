import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  aberto: boolean;
  titulo: React.ReactNode;
  icone?: React.ReactNode;
  onFechar: () => void;
  /** Bloqueia Esc e o botão fechar (ex.: enquanto salva). */
  bloqueado?: boolean;
  tamanho?: 'sm' | 'md' | 'lg' | 'xl';
  tom?: 'gold' | 'danger';
  children: React.ReactNode;
}

/** Janela modal padrão: fecha com Esc ou no X, nunca ao clicar fora (evita perder formulários). */
export const Modal: React.FC<ModalProps> = ({
  aberto,
  titulo,
  icone,
  onFechar,
  bloqueado = false,
  tamanho = 'md',
  tom = 'gold',
  children,
}) => {
  const tituloId = useId();
  const painelRef = useRef<HTMLDivElement>(null);
  // Refs evitam reexecutar o efeito (e roubar o foco dos campos) a cada renderização.
  const fecharRef = useRef(onFechar);
  const bloqueadoRef = useRef(bloqueado);
  useEffect(() => {
    fecharRef.current = onFechar;
    bloqueadoRef.current = bloqueado;
  });

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !bloqueadoRef.current) fecharRef.current();
    };
    document.addEventListener('keydown', aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    painelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto) return null;

  const largura = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl' }[tamanho];
  const borda = tom === 'danger' ? 'border-red-500/50' : 'border-amber-600/50';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto animate-fade-in">
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={`w-full ${largura} bg-painel border ${borda} rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-6 text-left sm:my-6 max-h-[92vh] sm:max-h-none overflow-y-auto sm:overflow-visible outline-none`}
      >
        <div className="sticky -top-4 sm:static z-10 -mx-4 px-4 sm:mx-0 sm:px-0 bg-painel flex items-center justify-between gap-3 border-b border-linha pb-3 pt-1 sm:pt-0 mb-4">
          <h3 id={tituloId} className="flex items-center gap-2 font-cinzel text-base sm:text-lg font-bold text-pergaminho min-w-0">
            {icone && <span className="shrink-0">{icone}</span>}
            <span className="truncate">{titulo}</span>
          </h3>
          <button
            type="button"
            onClick={onFechar}
            disabled={bloqueado}
            className="p-1.5 text-gray-400 hover:text-amber-400 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
