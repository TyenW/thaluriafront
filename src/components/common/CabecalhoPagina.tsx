import React from 'react';

export interface CabecalhoPaginaProps {
  titulo: React.ReactNode;
  icone?: React.ReactNode;
  descricao?: React.ReactNode;
  /** Botões à direita; no celular descem para baixo do título. */
  acoes?: React.ReactNode;
}

/** Cabeçalho padrão das páginas: título, descrição curta e ações. */
export const CabecalhoPagina: React.FC<CabecalhoPaginaProps> = ({ titulo, icone, descricao, acoes }) => (
  <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-linha pb-4">
    <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-cinzel font-bold text-pergaminho flex items-center gap-2.5">
        {icone && <span className="text-amber-400 shrink-0 [&>svg]:w-6 [&>svg]:h-6">{icone}</span>}
        <span className="min-w-0 break-words">{titulo}</span>
      </h1>
      {descricao && <p className="text-xs sm:text-sm text-nevoa font-sans-clean mt-1 max-w-3xl">{descricao}</p>}
    </div>
    {acoes && <div className="flex flex-wrap items-center gap-2 shrink-0">{acoes}</div>}
  </header>
);
