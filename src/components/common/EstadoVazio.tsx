import React from 'react';

export interface EstadoVazioProps {
  icone: React.ReactNode;
  titulo: string;
  children?: React.ReactNode;
  acao?: React.ReactNode;
}

/** Aviso centralizado para listas sem registros. */
export const EstadoVazio: React.FC<EstadoVazioProps> = ({ icone, titulo, children, acao }) => (
  <div className="text-center py-12 px-6 rounded-xl border border-dashed border-linha bg-abismo/60">
    <div className="text-amber-500/40 flex justify-center mb-3 [&>svg]:w-12 [&>svg]:h-12">{icone}</div>
    <h3 className="text-lg font-cinzel font-bold text-pergaminho mb-1">{titulo}</h3>
    {children && <p className="text-xs text-nevoa font-sans-clean max-w-md mx-auto">{children}</p>}
    {acao && <div className="mt-4 flex justify-center">{acao}</div>}
  </div>
);
