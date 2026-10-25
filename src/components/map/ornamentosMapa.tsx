import React from 'react';
import { REINOS, type TipoCidade } from '../../data/atlasThaluria';
import type { AtlasConstruido, SimboloTerreno } from './construirAtlas';
import { FONTE_MAPA, FONTE_MAPA_SC, PAPEL_CLARO, TINTA, TINTA_SUAVE, TINTA_VERMELHA } from './estiloMapa';

// ---------------------------------------------------------------------------
// Símbolos de terreno (desenhados à mão em coordenadas locais)
// ---------------------------------------------------------------------------
export function SimboloTerrenoSvg({ simbolo }: { simbolo: SimboloTerreno }) {
  const { tipo, x, y, s } = simbolo;
  const t = `translate(${x.toFixed(1)} ${y.toFixed(1)})`;

  switch (tipo) {
    case 'montanha':
    case 'pico_nevado': {
      const topo = -s * 1.15;
      const hachuras = [0.3, 0.55, 0.8]
        .map((u) => {
          const px = s * u;
          const py = topo * (1 - u);
          return `M${px.toFixed(1)},${py.toFixed(1)}L${(px - s * 0.22).toFixed(1)},${(py + s * 0.3).toFixed(1)}`;
        })
        .join('');
      return (
        <g transform={t}>
          <path
            d={`M${-s},0L${-s * 0.1},${topo}L${s * 0.25},${topo * 0.8}L${s},0`}
            fill={tipo === 'pico_nevado' ? '#f8f1dc' : '#e8d9ae'}
            stroke={TINTA}
            strokeWidth={0.9}
            strokeLinejoin="round"
          />
          <path d={hachuras} stroke={TINTA_SUAVE} strokeWidth={0.7} fill="none" />
        </g>
      );
    }
    case 'vulcao':
      return (
        <g transform={t}>
          <path
            d={`M${-s},0L${-s * 0.28},${-s}L${s * 0.28},${-s}L${s},0`}
            fill="#d9b79b"
            stroke={TINTA}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <path
            d={`M${-s * 0.2},${-s}Q${-s * 0.5},${-s * 1.5} ${0},${-s * 1.7}T${s * 0.3},${-s * 2.4}`}
            stroke={TINTA_VERMELHA}
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    case 'floresta':
      return (
        <g transform={t}>
          <path d={`M0,0V${-s * 0.45}`} stroke={TINTA} strokeWidth={0.8} />
          <circle cx={0} cy={-s * 0.85} r={s * 0.55} fill="#cdd1a0" stroke={TINTA} strokeWidth={0.8} />
          <path d={`M${-s * 0.25},${-s * 0.9}Q0,${-s * 0.5} ${s * 0.3},${-s * 0.95}`} stroke={TINTA_SUAVE} strokeWidth={0.5} fill="none" />
        </g>
      );
    case 'colina':
      return (
        <g transform={t}>
          <path d={`M${-s},0Q0,${-s * 0.95} ${s},0`} fill="none" stroke={TINTA} strokeWidth={0.9} strokeLinecap="round" />
          <path d={`M${s * 0.15},${-s * 0.35}L${s * 0.02},${-s * 0.08}`} stroke={TINTA_SUAVE} strokeWidth={0.6} />
        </g>
      );
    case 'arvore_morta':
      return (
        <g transform={t} stroke={TINTA} strokeWidth={0.8} fill="none" strokeLinecap="round">
          <path d={`M0,0V${-s}M0,${-s * 0.55}L${-s * 0.4},${-s * 0.85}M0,${-s * 0.7}L${s * 0.4},${-s * 1.05}`} />
        </g>
      );
    case 'capim':
      return (
        <g transform={t} stroke={TINTA_SUAVE} strokeWidth={0.7} fill="none" strokeLinecap="round">
          <path d={`M0,0L${-s * 0.5},${-s}M0,0V${-s * 1.15}M0,0L${s * 0.5},${-s}`} />
        </g>
      );
  }
}

const SimboloTerrenoMemo = React.memo(SimboloTerrenoSvg);

// ---------------------------------------------------------------------------
// Ícones de assentamentos
// ---------------------------------------------------------------------------
export function GlifoCidade({ tipo, parcial }: { tipo: TipoCidade; parcial: boolean }) {
  const comum = {
    fill: parcial ? 'none' : PAPEL_CLARO,
    stroke: TINTA,
    strokeWidth: 1.1,
    strokeLinejoin: 'round' as const,
    strokeDasharray: parcial ? '2 2' : undefined,
  };
  switch (tipo) {
    case 'capital':
      return (
        <path
          {...comum}
          d="M-8,7V0H-6V-3H-4V0H-2V-7L0,-10L2,-7V0H4V-3H6V0H8V7Z"
        />
      );
    case 'fortaleza':
      return <path {...comum} d="M-5,6V-5H-3V-3H-1V-5H1V-3H3V-5H5V6Z" />;
    case 'porto':
      return (
        <g {...comum} fill="none">
          <circle cx={0} cy={-5.5} r={1.8} fill={parcial ? 'none' : PAPEL_CLARO} />
          <path d="M0,-3.7V6M-3.5,-1H3.5M-6,2Q-5.5,6.5 0,6.5Q5.5,6.5 6,2" strokeLinecap="round" />
        </g>
      );
    case 'cidade':
      return (
        <g {...comum}>
          <circle cx={0} cy={0} r={5} />
          <circle cx={0} cy={0} r={1.6} fill={parcial ? 'none' : TINTA} stroke="none" />
        </g>
      );
    case 'vila':
      return <circle cx={0} cy={0} r={2.6} {...comum} fill={parcial ? 'none' : TINTA} />;
  }
}

// ---------------------------------------------------------------------------
// Decorações cartográficas
// ---------------------------------------------------------------------------
export function RosaDosVentos({ x, y }: { x: number; y: number }) {
  const rExt = 38;
  const rInt = 14;
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none" opacity={0.88}>
      <circle cx={0} cy={0} r={rExt + 6} fill="none" stroke={TINTA} strokeWidth={0.8} />
      <circle cx={0} cy={0} r={rExt + 3} fill="none" stroke={TINTA_SUAVE} strokeWidth={0.5} strokeDasharray="1 2" />
      <circle cx={0} cy={0} r={rInt} fill="none" stroke={TINTA} strokeWidth={0.7} />
      {/* 4 pontas cardeais */}
      <path d={`M0,0L${-rInt * 0.4},${-rInt * 0.4}L0,${-rExt}Z`} fill={TINTA} />
      <path d={`M0,0L${rInt * 0.4},${-rInt * 0.4}L0,${-rExt}Z`} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.5} />
      <path d={`M0,0L${rInt * 0.4},${rInt * 0.4}L0,${rExt}Z`} fill={TINTA} />
      <path d={`M0,0L${-rInt * 0.4},${rInt * 0.4}L0,${rExt}Z`} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.5} />
      <path d={`M0,0L${-rInt * 0.4},${rInt * 0.4}L${-rExt},0Z`} fill={TINTA} />
      <path d={`M0,0L${-rInt * 0.4},${-rInt * 0.4}L${-rExt},0Z`} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.5} />
      <path d={`M0,0L${rInt * 0.4},${-rInt * 0.4}L${rExt},0Z`} fill={TINTA} />
      <path d={`M0,0L${rInt * 0.4},${rInt * 0.4}L${rExt},0Z`} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.5} />
      {/* 4 pontas colaterais menores */}
      <path d={`M0,0L0,${-rInt * 0.5}L${rExt * 0.65},${-rExt * 0.65}Z`} fill={TINTA_SUAVE} />
      <path d={`M0,0L0,${rInt * 0.5}L${-rExt * 0.65},${rExt * 0.65}Z`} fill={TINTA_SUAVE} />
      <path d={`M0,0L${rInt * 0.5},0L${rExt * 0.65},${rExt * 0.65}Z`} fill={TINTA_SUAVE} />
      <path d={`M0,0L${-rInt * 0.5},0L${-rExt * 0.65},${-rExt * 0.65}Z`} fill={TINTA_SUAVE} />
      <circle cx={0} cy={0} r={2.5} fill={TINTA} />
      <text x={0} y={-rExt - 8} textAnchor="middle" fontSize={13} fontFamily={FONTE_MAPA_SC} fill={TINTA} fontWeight={700}>
        N
      </text>
      <text x={0} y={rExt + 16} textAnchor="middle" fontSize={11} fontFamily={FONTE_MAPA_SC} fill={TINTA_SUAVE}>
        S
      </text>
      <text x={rExt + 10} y={4} textAnchor="start" fontSize={11} fontFamily={FONTE_MAPA_SC} fill={TINTA_SUAVE}>
        L
      </text>
      <text x={-rExt - 10} y={4} textAnchor="end" fontSize={11} fontFamily={FONTE_MAPA_SC} fill={TINTA_SUAVE}>
        O
      </text>
    </g>
  );
}

export function BarraEscala({ x, y }: { x: number; y: number }) {
  // No mapa, 1536 px ~ 1200 km; 128 px = 100 km; barra de 200 km = 256 px
  const comp = 200;
  const segmentos = 4;
  const segW = comp / segmentos;
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none" opacity={0.85}>
      <rect x={0} y={0} width={comp} height={6} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.8} />
      {Array.from({ length: segmentos }).map((_, i) => (
        <rect
          key={i}
          x={i * segW}
          y={0}
          width={segW}
          height={6}
          fill={i % 2 === 0 ? TINTA : PAPEL_CLARO}
          stroke={TINTA}
          strokeWidth={0.5}
        />
      ))}
      <text x={0} y={-4} textAnchor="middle" fontSize={9.5} fontFamily={FONTE_MAPA} fill={TINTA}>
        0
      </text>
      <text x={comp / 2} y={-4} textAnchor="middle" fontSize={9.5} fontFamily={FONTE_MAPA} fill={TINTA}>
        100
      </text>
      <text x={comp} y={-4} textAnchor="middle" fontSize={9.5} fontFamily={FONTE_MAPA} fill={TINTA}>
        200 km
      </text>
      <text x={comp / 2} y={17} textAnchor="middle" fontSize={9} fontStyle="italic" fontFamily={FONTE_MAPA} fill={TINTA_SUAVE}>
        Escala Cartográfica
      </text>
    </g>
  );
}

export function Titulo({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <rect
        x={-8}
        y={-28}
        width={310}
        height={68}
        fill={PAPEL_CLARO}
        fillOpacity={0.88}
        stroke={TINTA}
        strokeWidth={1.2}
      />
      <rect x={-5} y={-25} width={304} height={62} fill="none" stroke={TINTA_SUAVE} strokeWidth={0.6} />
      <text x={147} y={-2} textAnchor="middle" fontFamily={FONTE_MAPA_SC} fontSize={22} letterSpacing={4} fill={TINTA} fontWeight={700}>
        CONTINENTE DE THALÚRIA
      </text>
      <text x={147} y={20} textAnchor="middle" fontStyle="italic" fontSize={11.5} letterSpacing={1} fill={TINTA_SUAVE}>
        Cartografia dos Cinco Reinos &amp; Terras Além
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Camada base do atlas (memorizada para evitar refazer caminhos pesados)
// ---------------------------------------------------------------------------
export const CamadaBase: React.FC<{ atlas: AtlasConstruido; idClip: string }> = React.memo(function CamadaBase({ atlas, idClip }) {
  return (
    <>
      {/* Sombra da costa (costal wash no mar) */}
      <path d={atlas.terra} fill="none" stroke="#2a1f14" strokeWidth={18} strokeOpacity={0.08} />
      <path d={atlas.terra} fill="none" stroke="#2a1f14" strokeWidth={10} strokeOpacity={0.12} />
      <path d={atlas.terra} fill="none" stroke="#2a1f14" strokeWidth={4} strokeOpacity={0.2} />

      {/* Terra firme */}
      <path d={atlas.terra} fill="#e5d4a4" stroke={TINTA} strokeWidth={1.4} strokeLinejoin="round" />

      {/* Territórios dos cinco reinos (cores muito lavadas) */}
      <g clipPath={`url(#${idClip})`}>
        {atlas.territorios.map((t) => {
          const r = REINOS.find((x) => x.id === t.id);
          return (
            <path
              key={t.id}
              d={t.d}
              fill={r?.cor ?? '#c8b486'}
              fillOpacity={0.16}
              stroke={TINTA_VERMELHA}
              strokeWidth={1.2}
              strokeDasharray="8 4 2 4"
              strokeOpacity={0.55}
            />
          );
        })}
      </g>

      {/* Lago interior */}
      <path d={atlas.lago} fill="none" stroke="#2a1f14" strokeWidth={4} strokeOpacity={0.15} />
      <path d={atlas.lago} fill="#e9d9ab" stroke={TINTA} strokeWidth={1.2} />

      {/* Ilhas costeiras */}
      {atlas.ilhas.map((ilha) => (
        <path key={ilha.id} d={ilha.d} fill="#e5d4a4" stroke={TINTA} strokeWidth={1.2} strokeLinejoin="round" />
      ))}

      {/* Rios */}
      <g fill="none" stroke={TINTA} strokeLinecap="round" strokeLinejoin="round">
        {atlas.rios.map((d, i) => (
          <path key={i} d={d} strokeWidth={1.4} strokeOpacity={0.85} />
        ))}
      </g>

      {/* Símbolos desenhados (montanhas, florestas, colinas...) */}
      <g pointerEvents="none">
        {atlas.simbolos.map((s) => (
          <SimboloTerrenoMemo key={s.chave} simbolo={s} />
        ))}
      </g>

      {/* Ondas decorativas no oceano */}
      <g stroke={TINTA_SUAVE} strokeWidth={0.7} fill="none" strokeLinecap="round" opacity={0.45} pointerEvents="none">
        {atlas.ondas.map((p, i) => (
          <path key={i} d={`M${p.x - 7},${p.y}Q${p.x - 3.5},${p.y - 3} ${p.x},${p.y}Q${p.x + 3.5},${p.y - 3} ${p.x + 7},${p.y}`} />
        ))}
      </g>
    </>
  );
});

