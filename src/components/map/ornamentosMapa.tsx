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
      // Encosta da direita na sombra (luz vindo da esquerda): a cordilheira ganha volume.
      const sombra = `M${-s * 0.1},${topo}L${s * 0.25},${topo * 0.8}L${s},0L${s * 0.12},0Q${s * 0.02},${topo * 0.45} ${-s * 0.1},${topo}Z`;
      return (
        <g transform={t}>
          <path
            d={`M${-s},0L${-s * 0.1},${topo}L${s * 0.25},${topo * 0.8}L${s},0`}
            fill={tipo === 'pico_nevado' ? '#f8f1dc' : '#e8d9ae'}
            stroke="none"
          />
          <path d={sombra} fill={tipo === 'pico_nevado' ? '#9fb0b8' : '#a88a5c'} fillOpacity={tipo === 'pico_nevado' ? 0.45 : 0.5} />
          <path d={hachuras} stroke={TINTA_SUAVE} strokeWidth={0.7} fill="none" />
          <path
            d={`M${-s},0L${-s * 0.1},${topo}L${s * 0.25},${topo * 0.8}L${s},0`}
            fill="none"
            stroke={TINTA}
            strokeWidth={0.9}
            strokeLinejoin="round"
          />
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
      {/* textLength: a fonte de época varia de largura conforme o aparelho; o título sempre cabe na moldura */}
      <text x={147} y={-2} textAnchor="middle" fontFamily={FONTE_MAPA_SC} fontSize={22} textLength={284} lengthAdjust="spacingAndGlyphs" fill={TINTA} fontWeight={700}>
        CONTINENTE DE THALÚRIA
      </text>
      <text x={147} y={20} textAnchor="middle" fontStyle="italic" fontSize={11.5} textLength={250} lengthAdjust="spacingAndGlyphs" fill={TINTA_SUAVE}>
        Cartografia dos Cinco Reinos &amp; Terras Além
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Camada base do atlas (memorizada para evitar refazer caminhos pesados)
// ---------------------------------------------------------------------------
/** Linhas de maré: 3 linhas finas acompanhando a costa, cada vez mais fracas mar adentro. */
const MARES = [
  { dist: 5, opacidade: 0.5 },
  { dist: 11, opacidade: 0.32 },
  { dist: 18, opacidade: 0.18 },
];

function LinhasDeMare({ id, d }: { id: string; d: string }) {
  const caixa = { x: -200, y: -200, width: 1936, height: 1424 };
  return (
    <g pointerEvents="none">
      <defs>
        {/* Anel = traço largo branco menos traço um pouco mais estreito preto, na máscara */}
        {MARES.map((m, i) => (
          <mask key={i} id={`${id}-${i}`} maskUnits="userSpaceOnUse" {...caixa}>
            <rect {...caixa} fill="black" />
            <path d={d} fill="none" stroke="white" strokeWidth={m.dist * 2 + 1} strokeLinejoin="round" />
            <path d={d} fill="none" stroke="black" strokeWidth={m.dist * 2 - 1} strokeLinejoin="round" />
          </mask>
        ))}
      </defs>
      {MARES.map((m, i) => (
        <rect key={i} {...caixa} fill={TINTA} fillOpacity={m.opacidade} mask={`url(#${id}-${i})`} />
      ))}
    </g>
  );
}

/** Florestas em maciços: contorno de todas as copas por baixo e o miolo por cima, fundindo as bordas. */
function Florestas({ copas }: { copas: SimboloTerreno[] }) {
  const copa = (c: SimboloTerreno) => ({ cx: c.x, cy: c.y - c.s * 0.85, r: c.s * 0.58 });
  return (
    <g pointerEvents="none">
      <g stroke={TINTA} strokeWidth={0.9} strokeLinecap="round">
        {copas.filter((c) => c.base).map((c) => (
          <path key={`t-${c.chave}`} d={`M${c.x.toFixed(1)},${c.y.toFixed(1)}V${(c.y - c.s * 0.5).toFixed(1)}`} />
        ))}
      </g>
      <g fill={TINTA}>
        {copas.map((c) => {
          const { cx, cy, r } = copa(c);
          return <circle key={`o-${c.chave}`} cx={cx} cy={cy} r={r + 1} />;
        })}
      </g>
      <g fill="#cdd1a0">
        {copas.map((c) => {
          const { cx, cy, r } = copa(c);
          return <circle key={`f-${c.chave}`} cx={cx} cy={cy} r={r} />;
        })}
      </g>
      {/* Sombra discreta embaixo de cada copa, para o maciço não virar um borrão chapado */}
      <g fill="none" stroke={TINTA_SUAVE} strokeWidth={0.55} strokeLinecap="round" opacity={0.8}>
        {copas.map((c) => {
          const { cx, cy, r } = copa(c);
          return <path key={`s-${c.chave}`} d={`M${(cx - r * 0.55).toFixed(1)},${(cy + r * 0.2).toFixed(1)}Q${cx.toFixed(1)},${(cy + r * 0.75).toFixed(1)} ${(cx + r * 0.6).toFixed(1)},${(cy + r * 0.1).toFixed(1)}`} />;
        })}
      </g>
    </g>
  );
}

export const CamadaBase: React.FC<{ atlas: AtlasConstruido; idClip: string }> = React.memo(function CamadaBase({ atlas, idClip }) {
  const florestas = atlas.simbolos.filter((s) => s.tipo === 'floresta');
  const outros = atlas.simbolos.filter((s) => s.tipo !== 'floresta');
  const contornoTerras = atlas.terra + atlas.ilhas.map((i) => i.d).join('');
  return (
    <>
      <defs>
        <clipPath id={`${idClip}-lago`}>
          <path d={atlas.lago} />
        </clipPath>
        {/* Rios só em terra firme: fora do lago e do mar, para as fozes encostarem limpas na água */}
        <mask id={`${idClip}-rios`} maskUnits="userSpaceOnUse" x={-50} y={-50} width={1636} height={1124}>
          <rect x={-50} y={-50} width={1636} height={1124} fill="black" />
          <path d={atlas.terra} fill="white" />
          <path d={atlas.lago} fill="black" />
        </mask>
        {atlas.territorios.map((t) => (
          <clipPath key={t.id} id={`${idClip}-t-${t.id}`}>
            <path d={t.d} />
          </clipPath>
        ))}
      </defs>

      {/* Linhas de maré em volta do continente e das ilhas (a parte de dentro fica sob a terra) */}
      <LinhasDeMare id={`${idClip}-mare`} d={contornoTerras} />
      <path d={atlas.terra} fill="none" stroke="#2a1f14" strokeWidth={4} strokeOpacity={0.18} />

      {/* Terra firme */}
      <path d={atlas.terra} fill="#e5d4a4" stroke={TINTA} strokeWidth={1.4} strokeLinejoin="round" />

      {/* Reinos: o miolo fica no papel; só uma faixa esfumada da cor do reino, por dentro da fronteira */}
      <g clipPath={`url(#${idClip})`} pointerEvents="none">
        {atlas.territorios.map((t) => {
          const r = REINOS.find((x) => x.id === t.id);
          return (
            <g key={t.id} clipPath={`url(#${idClip}-t-${t.id})`}>
              <path d={t.d} fill="none" stroke={r?.cor ?? '#c8b486'} strokeWidth={34} strokeOpacity={0.16} strokeLinejoin="round" />
              <path d={t.d} fill="none" stroke={r?.cor ?? '#c8b486'} strokeWidth={14} strokeOpacity={0.22} strokeLinejoin="round" />
            </g>
          );
        })}
        <path d={atlas.fronteiras} fill="none" stroke={TINTA_VERMELHA} strokeWidth={1.3} strokeDasharray="8 4 2 4" strokeOpacity={0.6} strokeLinecap="round" />
      </g>

      {/* Lago interior, com as linhas de maré por dentro */}
      <path d={atlas.lago} fill="#e9d9ab" stroke={TINTA} strokeWidth={1.2} />
      <g clipPath={`url(#${idClip}-lago)`}>
        <LinhasDeMare id={`${idClip}-mare-lago`} d={atlas.lago} />
      </g>

      {/* Ilhas costeiras */}
      {atlas.ilhas.map((ilha) => (
        <path key={ilha.id} d={ilha.d} fill="#e5d4a4" stroke={TINTA} strokeWidth={1.2} strokeLinejoin="round" />
      ))}

      {/* Rios em bico de pena: margem clara por baixo, leito em tinta azulada por cima */}
      <g mask={`url(#${idClip}-rios)`} pointerEvents="none">
        {atlas.rios.map((d, i) => (
          <path key={`m-${i}`} d={d} fill="none" stroke="#efe2bb" strokeWidth={2.2} strokeOpacity={0.9} strokeLinejoin="round" />
        ))}
        {atlas.rios.map((d, i) => (
          <path key={`r-${i}`} d={d} fill="#3e5f6e" fillOpacity={0.9} stroke="#2c4450" strokeWidth={0.4} strokeLinejoin="round" />
        ))}
      </g>

      {/* Símbolos desenhados, recortados pela costa: picos na beira do continente não escapam por
          cima da névoa nem do mar */}
      <g pointerEvents="none" clipPath={`url(#${idClip})`}>
        <Florestas copas={florestas} />
        {outros.map((s) => (
          <SimboloTerrenoMemo key={s.chave} simbolo={s} />
        ))}
      </g>

      {/* Ondas decorativas no oceano */}
      <g stroke={TINTA_SUAVE} strokeWidth={0.7} fill="none" strokeLinecap="round" opacity={0.45} pointerEvents="none">
        {atlas.ondas.map((p, i) => (
          <path key={i} d={`M${p.x - 7},${p.y}Q${p.x - 3.5},${p.y - 3} ${p.x},${p.y}Q${p.x + 3.5},${p.y - 3} ${p.x + 7},${p.y}`} />
        ))}
      </g>

      <IlustracoesNauticas />
    </>
  );
});

// ---------------------------------------------------------------------------
// Gravuras náuticas discretas nos mares vazios
// ---------------------------------------------------------------------------
function IlustracoesNauticas() {
  return (
    <g pointerEvents="none" fill="none" stroke={TINTA} strokeLinecap="round" strokeLinejoin="round" opacity={0.2}>
      {/* Caravela no Mar do Oeste */}
      <g transform="translate(70 300) scale(1.1)">
        <path d="M-22,8Q0,18 24,8L20,14Q0,22 -18,14Z" fill={TINTA_SUAVE} fillOpacity={0.4} strokeWidth={1.2} />
        <path d="M-2,8V-30M10,8V-20" strokeWidth={1.2} />
        <path d="M-2,-28Q12,-20 -2,-6Z M10,-18Q20,-12 10,-2Z" fill={PAPEL_CLARO} strokeWidth={1} />
        <path d="M-2,-30L-12,-34L-2,-36" strokeWidth={0.9} />
        <path d="M-30,20Q-24,17 -18,20M18,22Q24,19 30,22" strokeWidth={0.8} />
      </g>
      {/* Serpente marinha no Mar Sombrio */}
      <g transform="translate(1440 735) scale(1.15)">
        <path d="M-40,6Q-34,-10 -26,6Q-18,22 -10,6Q-2,-12 6,6" strokeWidth={1.6} />
        <path d="M6,6Q12,-14 22,-12Q30,-10 28,-2Q24,2 18,-2" strokeWidth={1.6} />
        <path d="M22,-12L26,-20M18,-11L19,-19" strokeWidth={0.9} />
        <circle cx={23} cy={-7} r={0.9} fill={TINTA} />
        <path d="M-46,10Q-40,7 -34,10M-6,12Q0,9 6,12M0,16Q6,13 12,16" strokeWidth={0.8} />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// "Sua cidade": coroa de louros dourada, bandeirola e fita de pergaminho
// ---------------------------------------------------------------------------
const OURO_VELHO = '#c5a059';

export function MarcadorSuaCidade({ escala }: { escala: number }) {
  const folhas = (lado: 1 | -1) =>
    [0.15, 0.4, 0.65, 0.9, 1.15].map((a, i) => {
      const ang = Math.PI / 2 + lado * a * 1.25;
      const x = Math.cos(ang) * 13;
      const y = Math.sin(ang) * 13;
      const rot = (ang * 180) / Math.PI + (lado === 1 ? 0 : 180);
      return <ellipse key={`${lado}-${i}`} cx={x} cy={y} rx={3.4} ry={1.5} transform={`rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})`} />;
    });
  return (
    <g transform={`scale(${escala})`} pointerEvents="none">
      {/* brilho dourado lento */}
      <circle r={15} fill={OURO_VELHO} fillOpacity={0.18}>
        <animate attributeName="fill-opacity" values="0.1;0.28;0.1" dur="3s" repeatCount="indefinite" />
      </circle>
      <g fill={OURO_VELHO} stroke={TINTA} strokeWidth={0.45}>
        {folhas(1)}
        {folhas(-1)}
      </g>
      {/* bandeirola */}
      <path d="M11,-6V-26" stroke={TINTA} strokeWidth={1} />
      <path d="M11,-26L23,-22.5L11,-19Z" fill="#8f2a1c" stroke={TINTA} strokeWidth={0.6} />
      {/* fita "Sua cidade" */}
      <g transform="translate(0 22)">
        <path d="M-25,-5L-30,0L-25,5Z M25,-5L30,0L25,5Z" fill="#d9c08a" stroke={TINTA} strokeWidth={0.5} />
        <rect x={-25} y={-5.5} width={50} height={11} rx={1} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.6} />
        <text y={3} textAnchor="middle" fontSize={7.2} fontFamily={FONTE_MAPA_SC} fill={TINTA} fontWeight={700} letterSpacing={0.4}>
          Sua cidade
        </text>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Moldura de atlas: filete duplo, graduação alternada e cantoneiras (em pixels de tela)
// ---------------------------------------------------------------------------
export function MolduraAtlas({ largura, altura }: { largura: number; altura: number }) {
  if (!largura || !altura) return null;
  const m = 7; // filete interno
  const f = 5; // espessura da faixa graduada
  const passo = 34;
  const segmentos = (comprimento: number) => Math.max(2, Math.round((comprimento - 2 * (m + f)) / passo));
  const faixa = (x: number, y: number, comprimento: number, horizontal: boolean) => {
    const n = segmentos(comprimento);
    const tam = (comprimento - 2 * (m + f)) / n;
    return Array.from({ length: n }, (_, i) =>
      i % 2 === 0 ? (
        <rect
          key={`${x}-${y}-${i}`}
          x={horizontal ? x + i * tam : x}
          y={horizontal ? y : y + i * tam}
          width={horizontal ? tam : f}
          height={horizontal ? f : tam}
          fill={TINTA}
          fillOpacity={0.75}
        />
      ) : null
    );
  };
  const canto = (x: number, y: number, k: string) => (
    <g key={k} transform={`translate(${x} ${y})`}>
      <rect x={-f / 2 - 3} y={-f / 2 - 3} width={f + 6} height={f + 6} fill="#e9d9ab" stroke={TINTA} strokeWidth={1} />
      <path d={`M${-f / 2 - 3},${-f / 2 - 3}L${f / 2 + 3},${f / 2 + 3}M${f / 2 + 3},${-f / 2 - 3}L${-f / 2 - 3},${f / 2 + 3}`} stroke={TINTA} strokeWidth={0.7} />
      <circle r={1.6} fill={TINTA_VERMELHA} />
    </g>
  );
  const ini = m + f;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <rect x={1.5} y={1.5} width={largura - 3} height={altura - 3} fill="none" stroke={TINTA} strokeWidth={3} strokeOpacity={0.8} />
      <rect x={m} y={m} width={largura - 2 * m} height={altura - 2 * m} fill="none" stroke={TINTA} strokeWidth={0.8} strokeOpacity={0.7} />
      <rect x={m + f} y={m + f} width={largura - 2 * (m + f)} height={altura - 2 * (m + f)} fill="none" stroke={TINTA} strokeWidth={0.8} strokeOpacity={0.7} />
      {faixa(ini, m, largura, true)}
      {faixa(ini, altura - m - f, largura, true)}
      {faixa(m, ini, altura, false)}
      {faixa(largura - m - f, ini, altura, false)}
      {canto(m + f / 2, m + f / 2, 'a')}
      {canto(largura - m - f / 2, m + f / 2, 'b')}
      {canto(m + f / 2, altura - m - f / 2, 'c')}
      {canto(largura - m - f / 2, altura - m - f / 2, 'd')}
    </svg>
  );
}

