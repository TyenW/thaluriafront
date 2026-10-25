import React from 'react';

export interface AbaDef<T extends string> {
  id: T;
  rotulo: string;
  icone?: React.ReactNode;
  contagem?: number;
}

export interface AbasProps<T extends string> {
  abas: AbaDef<T>[];
  ativa: T;
  onTrocar: (id: T) => void;
  rotulo: string;
  /** Prefixo dos ids (aba-x / painel-x) para ligar abas e painéis. */
  prefixo?: string;
}

/** Barra de abas rolável no celular, navegável com as setas do teclado. */
export function Abas<T extends string>({ abas, ativa, onTrocar, rotulo, prefixo = 'aba' }: AbasProps<T>) {
  return (
    <div role="tablist" aria-label={rotulo} className="abas-rolaveis flex gap-1 overflow-x-auto border-b border-linha">
      {abas.map((aba, i) => {
        const selecionada = aba.id === ativa;
        return (
          <button
            key={aba.id}
            id={`${prefixo}-${aba.id}`}
            role="tab"
            type="button"
            aria-selected={selecionada}
            aria-controls={`${prefixo}-painel-${aba.id}`}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => onTrocar(aba.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              const prox = abas[(i + (e.key === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length];
              onTrocar(prox.id);
              document.getElementById(`${prefixo}-${prox.id}`)?.focus();
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 -mb-px border-b-2 font-cinzel text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
              selecionada ? 'border-amber-400 text-pergaminho' : 'border-transparent text-nevoa hover:text-texto'
            }`}
          >
            {aba.icone && <span className={selecionada ? 'text-amber-400' : ''}>{aba.icone}</span>}
            {aba.rotulo}
            {!!aba.contagem && <span className="text-[10px] font-mono text-nevoa">({aba.contagem})</span>}
          </button>
        );
      })}
    </div>
  );
}
