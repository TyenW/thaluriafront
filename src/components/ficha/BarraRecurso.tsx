import React from 'react';

export interface TemaRecurso {
  borda: string;
  rotulo: string;
  valor: string;
  trilho: string;
  barra: string;
  botao: string;
}

export const TEMAS_RECURSO: Record<'hp' | 'san' | 'energia' | 'mana', TemaRecurso> = {
  hp: {
    borda: 'border-red-900/40 from-red-950/20',
    rotulo: 'text-red-400',
    valor: 'text-red-200',
    trilho: 'bg-red-950/60 border-red-900/40',
    barra: 'from-red-700 via-rose-600 to-red-400',
    botao: 'bg-red-950/50 hover:bg-red-900 border-red-800 text-red-200',
  },
  san: {
    borda: 'border-purple-900/40 from-purple-950/20',
    rotulo: 'text-purple-400',
    valor: 'text-purple-200',
    trilho: 'bg-purple-950/60 border-purple-900/40',
    barra: 'from-purple-700 via-violet-600 to-indigo-400',
    botao: 'bg-purple-950/50 hover:bg-purple-900 border-purple-800 text-purple-200',
  },
  energia: {
    borda: 'border-emerald-900/40 from-emerald-950/20',
    rotulo: 'text-emerald-400',
    valor: 'text-emerald-200',
    trilho: 'bg-emerald-950/60 border-emerald-900/40',
    barra: 'from-emerald-700 via-emerald-500 to-teal-400',
    botao: 'bg-emerald-950/50 hover:bg-emerald-900 border-emerald-800 text-emerald-200',
  },
  mana: {
    borda: 'border-blue-900/40 from-blue-950/20',
    rotulo: 'text-cyan-400',
    valor: 'text-cyan-200',
    trilho: 'bg-blue-950/60 border-blue-900/40',
    barra: 'from-blue-700 via-cyan-500 to-sky-300',
    botao: 'bg-blue-950/50 hover:bg-blue-900 border-blue-800 text-cyan-200',
  },
};

export interface BarraRecursoProps {
  nome: string;
  icone: React.ReactNode;
  atual: number;
  maximo: number;
  tema: TemaRecurso;
  rodape?: React.ReactNode;
  onAjustar: (delta: number) => void;
}

export const BarraRecurso: React.FC<BarraRecursoProps> = ({ nome, icone, atual, maximo, tema, rodape, onAjustar }) => {
  const pct = Math.min(100, Math.max(0, (atual / (maximo || 1)) * 100));
  return (
    <div className={`rounded-lg border p-3 sm:p-4 bg-gradient-to-br via-[#12141c] to-[#0d0f15] ${tema.borda}`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className={`flex items-center gap-1.5 text-xs font-cinzel font-bold ${tema.rotulo}`}>
          {icone}
          <span>{nome}</span>
        </span>
        <span className={`text-xs font-mono font-bold tabular-nums ${tema.valor}`}>
          {atual} / {maximo}
        </span>
      </div>

      <div
        className={`w-full h-2.5 rounded-full overflow-hidden border p-[1px] mb-2.5 ${tema.trilho}`}
        role="progressbar"
        aria-label={nome}
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-valuenow={atual}
      >
        <div className={`bg-gradient-to-r h-full rounded-full transition-all duration-500 ${tema.barra}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {[-5, -1, 1, 5].map((delta) => (
          <button
            key={delta}
            type="button"
            onClick={() => onAjustar(delta)}
            disabled={(delta < 0 && atual <= 0) || (delta > 0 && atual >= maximo)}
            className={`py-1.5 sm:py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${tema.botao}`}
            aria-label={`${delta > 0 ? 'Recuperar' : 'Reduzir'} ${Math.abs(delta)} de ${nome}`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </div>

      {rodape && <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-[#8c93a4] font-cinzel">{rodape}</div>}
    </div>
  );
};
