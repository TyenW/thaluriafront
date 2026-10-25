import React from 'react';
import { Loader2 } from 'lucide-react';

/** Indicador exibido enquanto o código de uma página é baixado. */
export const CarregandoPagina: React.FC = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-label="Carregando página">
    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
  </div>
);
