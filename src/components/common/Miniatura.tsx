import React, { useState } from 'react';
import { Package } from 'lucide-react';

export interface MiniaturaProps {
  imagem?: string | null;
  tamanho?: 'sm' | 'md';
  /** Ícone exibido quando não há imagem (padrão: caixa). */
  icone?: React.ReactNode;
}

/** Miniatura quadrada de um registro (ilustração ou ícone genérico). */
export const Miniatura: React.FC<MiniaturaProps> = ({ imagem, tamanho = 'sm', icone }) => {
  const [quebrada, setQuebrada] = useState(false);
  const dim = tamanho === 'md' ? 'w-14 h-14' : 'w-10 h-10';
  return (
    <span className={`${dim} shrink-0 rounded-lg bg-abismo border border-linha overflow-hidden flex items-center justify-center text-apagado [&>svg]:w-5 [&>svg]:h-5`}>
      {imagem && !quebrada ? (
        <img src={imagem} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setQuebrada(true)} />
      ) : (
        icone ?? <Package />
      )}
    </span>
  );
};
