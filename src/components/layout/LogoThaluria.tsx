import React, { useId } from 'react';

/**
 * Marca de Thalúria: a espada faz as vezes do "T" e a guarda cobre o início de "haluria".
 * Vetorial, então escala em qualquer altura (defina pela className, ex.: h-10).
 */
export interface LogoThaluriaProps {
  className?: string;
  /** Só a espada, para espaços muito estreitos. */
  soEspada?: boolean;
}

const CONTORNO = '#140b06';

export const Espada: React.FC<{ preenchimento: string }> = ({ preenchimento }) => (
  <g stroke={CONTORNO} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
    {/* Lâmina com o sulco central */}
    <path d="M9.5 31.5 H18.5 L17.2 68 L14 78.5 L10.8 68 Z" fill={preenchimento} />
    <path d="M14 34 V69" fill="none" strokeWidth={0.9} opacity={0.7} />
    {/* Guarda: curta à esquerda, longa à direita, como a barra do T */}
    <path d="M2.5 25.5 H39 Q40.5 25.5 40.5 27 V30.5 Q40.5 32 39 32 H2.5 Q1 32 1 30.5 V27 Q1 25.5 2.5 25.5 Z" fill={preenchimento} />
    {/* Empunhadura enrolada */}
    <rect x={11} y={14} width={6} height={11.5} rx={1} fill={preenchimento} />
    <path d="M11 17 L17 15.5 M11 20 L17 18.5 M11 23 L17 21.5" fill="none" strokeWidth={0.9} />
    {/* Pomo com roseta */}
    <circle cx={14} cy={8} r={6.2} fill={preenchimento} />
    <circle cx={14} cy={8} r={3} fill="none" strokeWidth={1} />
    <circle cx={14} cy={8} r={0.9} fill={CONTORNO} stroke="none" />
  </g>
);

export const LogoThaluria: React.FC<LogoThaluriaProps> = ({ className = 'h-10', soEspada = false }) => {
  const id = useId();
  const ouro = `ouro-${id}`;

  return (
    <svg
      viewBox={soEspada ? '0 0 42 80' : '0 0 122 80'}
      className={`w-auto shrink-0 overflow-visible drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)] ${className}`}
      role="img"
      aria-label="Thalúria"
    >
      <defs>
        <linearGradient id={ouro} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1dcaa" />
          <stop offset="0.55" stopColor="#d8b676" />
          <stop offset="1" stopColor="#a87c3d" />
        </linearGradient>
      </defs>
      <Espada preenchimento={`url(#${ouro})`} />
      {!soEspada && (
        <text
          x={21.5}
          y={56}
          fontFamily="'Uncial Antiqua', 'Cinzel', serif"
          fontSize={30}
          textLength={98}
          lengthAdjust="spacingAndGlyphs"
          fill={`url(#${ouro})`}
          stroke={CONTORNO}
          strokeWidth={2.4}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          haluria
        </text>
      )}
    </svg>
  );
};
