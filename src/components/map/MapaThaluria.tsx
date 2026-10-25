import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Compass,
  Eye,
  EyeOff,
  Locate,
  MapPin,
  Minus,
  Navigation,
  Plus,
  X,
} from 'lucide-react';
import {
  ALTURA_MAPA,
  CIDADES_ATLAS,
  LARGURA_MAPA,
  REINOS,
  ROTULOS_MAR,
  type CidadeAtlas,
  type TipoCidade,
} from '../../data/atlasThaluria';
import type { CidadeVisivel, RotaConexao } from '../../types/monstro';
import { construirAtlas, type AtlasConstruido, type SimboloTerreno } from './construirAtlas';

type NivelVisibilidade = CidadeVisivel['visibilidade'];

export interface MapaThaluriaProps {
  cidades: CidadeVisivel[];
  rotas: RotaConexao[];
  /** 'mestre' permite alterar a visibilidade das cidades e enxerga cidades ocultas. */
  modo?: 'jogador' | 'mestre';
  /** Revela o atlas inteiro, ignorando o Fog-of-War (usado quando a API está indisponível). */
  demonstracao?: boolean;
  onAlterarVisibilidade?: (cidade: string, nivel: NivelVisibilidade) => Promise<void>;
  /** Cidade atual do jogador para destaque com farol e atalho de navegação. */
  cidadeAtual?: string;
  /** Notifica componente pai quando o modo de pré-visualização mudar. */
  onTogglePreviewJogador?: (ativo: boolean) => void;
}

// ---------------------------------------------------------------------------
// Paleta "tinta ferrogálica sobre pergaminho"
// ---------------------------------------------------------------------------
const TINTA = '#3a2a1a';
const TINTA_SUAVE = '#6b5436';
const TINTA_VERMELHA = '#8a3b2a';
const PAPEL_CLARO = '#f3e7c3';
const PAPEL_NEVOA = '#e3d3a6';
const FONTE_MAPA = "'IM Fell English', 'IM Fell DW Pica', Georgia, 'Times New Roman', serif";
const FONTE_MAPA_SC = "'IM Fell English SC', 'IM Fell English', Georgia, serif";

const ROTULO_TIPO: Record<TipoCidade, string> = {
  capital: 'Capital do Reino',
  cidade: 'Cidade',
  vila: 'Vila',
  porto: 'Porto',
  fortaleza: 'Fortaleza',
};

const ROTULO_VISIBILIDADE: Record<NivelVisibilidade, string> = {
  OCULTO: 'Oculto',
  ROTA_E_NOME_APENAS: 'Só nome e rota',
  INFORMACOES_COMPLETAS: 'Revelado',
};

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface Vista {
  x: number;
  y: number;
  k: number;
}

const VISTA_INICIAL: Vista = { x: 0, y: 0, k: 1 };
const ZOOM_MAX = 7;

function ajustarVista(v: Vista): Vista {
  const k = limitar(v.k, 1, ZOOM_MAX);
  const w = LARGURA_MAPA / k;
  const h = ALTURA_MAPA / k;
  return { k, x: limitar(v.x, 0, LARGURA_MAPA - w), y: limitar(v.y, 0, ALTURA_MAPA - h) };
}

const CENTROS_REINOS: Record<string, { x: number; y: number; zoom: number }> = {
  frosthelm: { x: 540, y: 190, zoom: 2.2 },
  sylvanor: { x: 1040, y: 220, zoom: 2.2 },
  aurelia: { x: 440, y: 440, zoom: 2.2 },
  drakos: { x: 1260, y: 440, zoom: 2.2 },
  valthera: { x: 700, y: 700, zoom: 2.2 },
  campos: { x: 1100, y: 680, zoom: 2.2 },
  ilhas: { x: 768, y: 512, zoom: 1.4 },
};

function getCorPerigo(perigo: number) {
  if (perigo <= 3) {
    return {
      texto: 'text-emerald-700',
      bg: 'bg-emerald-600/15',
      borda: 'border-emerald-700/30',
      rotulo: 'Segura',
    };
  }
  if (perigo <= 6) {
    return {
      texto: 'text-amber-700',
      bg: 'bg-amber-600/15',
      borda: 'border-amber-700/30',
      rotulo: 'Moderada',
    };
  }
  return {
    texto: 'text-rose-700',
    bg: 'bg-rose-600/15',
    borda: 'border-rose-700/30',
    rotulo: 'Perigosa',
  };
}

interface RotaHoverInfo {
  de: string;
  para: string;
  maritima: boolean;
  principal?: boolean;
  distanciaKm: number;
  perigo: number;
  bloqueada: boolean;
  visivelParaJogador: boolean;
  screenX: number;
  screenY: number;
}

// ---------------------------------------------------------------------------
// Símbolos de terreno (desenhados à mão em coordenadas locais)
// ---------------------------------------------------------------------------
function SimboloTerrenoSvg({ simbolo }: { simbolo: SimboloTerreno }) {
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
function GlifoCidade({ tipo, parcial }: { tipo: TipoCidade; parcial: boolean }) {
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
function RosaDosVentos({ x, y }: { x: number; y: number }) {
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

function BarraEscala({ x, y }: { x: number; y: number }) {
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

function Titulo({ x, y }: { x: number; y: number }) {
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
const CamadaBase: React.FC<{ atlas: AtlasConstruido; idClip: string }> = React.memo(function CamadaBase({ atlas, idClip }) {
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

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
interface CidadeResolvida {
  atlas: CidadeAtlas;
  api?: CidadeVisivel;
  /** O que os jogadores enxergam desta cidade. */
  vis: NivelVisibilidade;
}

export const MapaThaluria: React.FC<MapaThaluriaProps> = ({
  cidades,
  rotas,
  modo = 'jogador',
  demonstracao = false,
  onAlterarVisibilidade,
  cidadeAtual,
  onTogglePreviewJogador,
}) => {
  const idBase = useId().replace(/[^a-zA-Z0-9]/g, '');
  const atlas = useMemo(() => construirAtlas(), []);
  const mestre = modo === 'mestre';

  // Modo de pré-visualização como jogador (para o Mestre)
  const [previewJogador, setPreviewJogador] = useState(false);
  const ehVisaoMestre = mestre && !previewJogador;

  const [vista, setVista] = useState<Vista>(VISTA_INICIAL);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sobrepor, setSobrepor] = useState<Record<string, NivelVisibilidade>>({});
  const [menuReinosAberto, setMenuReinosAberto] = useState(false);
  const [rotaHover, setRotaHover] = useState<RotaHoverInfo | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const arrastando = useRef(false);
  const movido = useRef(false);
  const distPinch = useRef(0);
  const animacao = useRef<number | null>(null);

  // Notifica pai quando preview muda
  useEffect(() => {
    onTogglePreviewJogador?.(previewJogador);
  }, [previewJogador, onTogglePreviewJogador]);

  // --- Resolve o que cada cidade do atlas mostra ---------------------------
  const cidadesResolvidas = useMemo<CidadeResolvida[]>(() => {
    const porNome = new Map(cidades.map((c) => [normalizar(c.nome), c]));
    return CIDADES_ATLAS.map((atlasCidade) => {
      const api = porNome.get(normalizar(atlasCidade.nome));
      let vis: NivelVisibilidade;
      if (demonstracao) {
        vis = 'INFORMACOES_COMPLETAS';
      } else if (sobrepor[atlasCidade.nome]) {
        vis = sobrepor[atlasCidade.nome];
      } else if (ehVisaoMestre) {
        // Para o Mestre, ele sempre vê as cidades, mas 'vis' armazena o status que o jogador tem
        vis = api?.visibilidadeJogador ?? (api ? api.visibilidade : 'OCULTO');
      } else {
        // Para o Jogador (ou Mestre no modo pré-visualização de Jogador)
        vis = api?.visibilidadeJogador ?? api?.visibilidade ?? 'OCULTO';
      }
      return { atlas: atlasCidade, api, vis };
    });
  }, [cidades, demonstracao, ehVisaoMestre, sobrepor]);

  const resolvidaPorNome = useMemo(() => new Map(cidadesResolvidas.map((c) => [c.atlas.nome, c])), [cidadesResolvidas]);

  /** Cidades da API que não existem no atlas (nome diferente) — úteis para o mestre acertar os dados. */
  const semCoordenadas = useMemo(() => {
    const nomesAtlas = new Set(CIDADES_ATLAS.map((c) => normalizar(c.nome)));
    return cidades.filter((c) => c.nome !== '???' && !nomesAtlas.has(normalizar(c.nome)));
  }, [cidades]);

  const visivel = (c: CidadeResolvida) => c.vis !== 'OCULTO';

  const reinoRevelado = useMemo(() => {
    const m = new Set<string>();
    for (const c of cidadesResolvidas) if (visivel(c)) m.add(c.atlas.reino);
    return m;
  }, [cidadesResolvidas]);

  const totalVisiveis = cidadesResolvidas.filter(visivel).length;

  // --- Rotas ---------------------------------------------------------------
  const rotaApi = useMemo(() => {
    const m = new Map<string, RotaConexao>();
    for (const r of rotas) m.set([normalizar(r.origem), normalizar(r.destino)].sort().join('|'), r);
    return m;
  }, [rotas]);

  const buscarRota = useCallback(
    (a: string, b: string) => rotaApi.get([normalizar(a), normalizar(b)].sort().join('|')),
    [rotaApi]
  );

  const estimarDistancia = useCallback((aNome: string, bNome: string): number => {
    const ca = resolvidaPorNome.get(aNome)?.atlas;
    const cb = resolvidaPorNome.get(bNome)?.atlas;
    if (!ca || !cb) return 60;
    return Math.round(Math.hypot(ca.x - cb.x, ca.y - cb.y) * 1.35);
  }, [resolvidaPorNome]);

  const isCidadeVisivelParaJogador = useCallback((nome: string): boolean => {
    if (demonstracao) return true;
    const c = resolvidaPorNome.get(nome);
    return !!c && c.vis !== 'OCULTO';
  }, [demonstracao, resolvidaPorNome]);

  const isRotaVisivelParaJogador = useCallback((de: string, para: string): boolean => {
    if (demonstracao) return true;
    return isCidadeVisivelParaJogador(de) && isCidadeVisivelParaJogador(para);
  }, [demonstracao, isCidadeVisivelParaJogador]);

  // Lista de estradas com dados e visibilidade calculados
  const estradasRenderizadas = useMemo(() => {
    return atlas.estradas
      .map((e) => {
        const a = resolvidaPorNome.get(e.de);
        const b = resolvidaPorNome.get(e.para);
        const visivelJog = isRotaVisivelParaJogador(e.de, e.para);
        // O mestre vê todas as rotas; o jogador vê apenas as reveladas
        const deveExibir = ehVisaoMestre || visivelJog;
        if (!deveExibir || !a || !b) return null;
        const info = buscarRota(e.de, e.para);
        return {
          ...e,
          a,
          b,
          visivelJog,
          info,
        };
      })
      .filter(Boolean) as (typeof atlas.estradas[0] & {
        a: CidadeResolvida;
        b: CidadeResolvida;
        visivelJog: boolean;
        info?: RotaConexao;
      })[];
  }, [atlas.estradas, resolvidaPorNome, isRotaVisivelParaJogador, ehVisaoMestre, buscarRota]);

  // Lista de rotas marítimas com dados e visibilidade calculados
  const rotasMaritimasRenderizadas = useMemo(() => {
    return atlas.rotasMaritimas
      .map((r) => {
        const a = resolvidaPorNome.get(r.de);
        const b = resolvidaPorNome.get(r.para);
        const visivelJog = isRotaVisivelParaJogador(r.de, r.para);
        const deveExibir = ehVisaoMestre || visivelJog;
        if (!deveExibir || !a || !b) return null;
        const info = buscarRota(r.de, r.para);
        return {
          ...r,
          a,
          b,
          visivelJog,
          info,
        };
      })
      .filter(Boolean) as (typeof atlas.rotasMaritimas[0] & {
        a: CidadeResolvida;
        b: CidadeResolvida;
        visivelJog: boolean;
        info?: RotaConexao;
      })[];
  }, [atlas.rotasMaritimas, resolvidaPorNome, isRotaVisivelParaJogador, ehVisaoMestre, buscarRota]);

  // --- Navegação (zoom / pan) ---------------------------------------------
  const cancelarAnimacao = () => {
    if (animacao.current !== null) {
      cancelAnimationFrame(animacao.current);
      animacao.current = null;
    }
  };

  const irPara = useCallback((alvo: Vista) => {
    cancelarAnimacao();
    const origem = vistaRef.current;
    const destino = ajustarVista(alvo);
    const inicio = performance.now();
    const duracao = 380;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao);
      const e = 1 - Math.pow(1 - t, 3);
      setVista({
        x: origem.x + (destino.x - origem.x) * e,
        y: origem.y + (destino.y - origem.y) * e,
        k: origem.k + (destino.k - origem.k) * e,
      });
      animacao.current = t < 1 ? requestAnimationFrame(passo) : null;
    };
    animacao.current = requestAnimationFrame(passo);
  }, []);

  useEffect(() => cancelarAnimacao, []);

  const zoomEm = useCallback((fx: number, fy: number, fator: number) => {
    const v = vistaRef.current;
    const k = limitar(v.k * fator, 1, ZOOM_MAX);
    const wx = v.x + fx * (LARGURA_MAPA / v.k);
    const wy = v.y + fy * (ALTURA_MAPA / v.k);
    setVista(ajustarVista({ k, x: wx - fx * (LARGURA_MAPA / k), y: wy - fy * (ALTURA_MAPA / k) }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const aoRolar = (e: WheelEvent) => {
      e.preventDefault();
      cancelarAnimacao();
      const r = el.getBoundingClientRect();
      zoomEm((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, Math.exp(-e.deltaY * 0.0016));
    };
    el.addEventListener('wheel', aoRolar, { passive: false });
    return () => el.removeEventListener('wheel', aoRolar);
  }, [zoomEm]);

  const aoPressionar = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelarAnimacao();
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movido.current = false;
    arrastando.current = true;
    setRotaHover(null);
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      distPinch.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const aoMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const anterior = ponteiros.current.get(e.pointerId);
    if (!anterior || !arrastando.current) return;
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const atual = { x: e.clientX, y: e.clientY };

    if (ponteiros.current.size === 2) {
      ponteiros.current.set(e.pointerId, atual);
      const [a, b] = [...ponteiros.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (distPinch.current > 0) {
        const cx = ((a.x + b.x) / 2 - r.left) / r.width;
        const cy = ((a.y + b.y) / 2 - r.top) / r.height;
        zoomEm(cx, cy, dist / distPinch.current);
      }
      distPinch.current = dist;
      movido.current = true;
      return;
    }

    const dx = atual.x - anterior.x;
    const dy = atual.y - anterior.y;
    if (!movido.current && Math.hypot(dx, dy) < 4) return;
    if (!movido.current) {
      movido.current = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignora */
      }
    }
    ponteiros.current.set(e.pointerId, atual);
    const v = vistaRef.current;
    setVista(
      ajustarVista({
        k: v.k,
        x: v.x - (dx / r.width) * (LARGURA_MAPA / v.k),
        y: v.y - (dy / r.height) * (ALTURA_MAPA / v.k),
      }),
    );
  };

  const aoSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    ponteiros.current.delete(e.pointerId);
    if (ponteiros.current.size < 2) distPinch.current = 0;
    if (ponteiros.current.size === 0) arrastando.current = false;
    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignora */
    }
  };

  const zoomBotao = (fator: number) => {
    cancelarAnimacao();
    zoomEm(0.5, 0.5, fator);
  };

  // --- Seleção e Navegação ---------------------------------------------------
  const selecionar = (nome: string, focar = false) => {
    setSelecionada(nome);
    setErro(null);
    const c = resolvidaPorNome.get(nome);
    if (focar && c) {
      const k = Math.max(vistaRef.current.k, 2.6);
      irPara({ k, x: c.atlas.x - LARGURA_MAPA / k / 2, y: c.atlas.y - ALTURA_MAPA / k / 2 });
    }
  };

  const aoClicarCidade = (nome: string) => {
    if (movido.current) return;
    selecionar(nome);
  };

  const focarReino = (reinoId: string) => {
    setMenuReinosAberto(false);
    const alvo = CENTROS_REINOS[reinoId];
    if (!alvo) return;
    const k = alvo.zoom;
    irPara({
      k,
      x: alvo.x - LARGURA_MAPA / k / 2,
      y: alvo.y - ALTURA_MAPA / k / 2,
    });
  };

  const alterarVisibilidade = async (nome: string, nivel: NivelVisibilidade) => {
    if (!onAlterarVisibilidade) return;
    setSalvando(true);
    setErro(null);
    try {
      await onAlterarVisibilidade(nome, nivel);
      setSobrepor((s) => ({ ...s, [nome]: nivel }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível alterar a visibilidade.');
    } finally {
      setSalvando(false);
    }
  };

  // --- Eventos de Rotas -----------------------------------------------------
  const aoEntrarRota = (
    de: string,
    para: string,
    maritima: boolean,
    principal: boolean | undefined,
    visivelParaJogador: boolean,
    e: React.PointerEvent
  ) => {
    if (arrastando.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const info = buscarRota(de, para);
    setRotaHover({
      de,
      para,
      maritima,
      principal,
      distanciaKm: info?.distanciaKm ?? estimarDistancia(de, para),
      perigo: info?.perigo ?? (maritima ? 4 : principal ? 2 : 5),
      bloqueada: !!info?.bloqueada,
      visivelParaJogador,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    });
  };

  const aoMoverRota = (e: React.PointerEvent) => {
    if (arrastando.current) {
      if (rotaHover) setRotaHover(null);
      return;
    }
    const container = containerRef.current;
    if (!container || !rotaHover) return;
    const rect = container.getBoundingClientRect();
    setRotaHover((prev) =>
      prev
        ? {
            ...prev,
            screenX: e.clientX - rect.left,
            screenY: e.clientY - rect.top,
          }
        : null
    );
  };

  const aoSairRota = () => {
    setRotaHover(null);
  };

  const aoClicarRota = (de: string, para: string) => {
    if (movido.current) return;
    // Se a cidade atual já for uma das pontas, foca na outra
    if (selecionada === de) {
      selecionar(para, true);
    } else {
      selecionar(de, true);
    }
  };

  const atual = selecionada ? resolvidaPorNome.get(selecionada) : undefined;
  const reinoAtual = atual ? REINOS.find((r) => r.id === atual.atlas.reino) : undefined;

  const rotasDaCidade = useMemo(() => {
    if (!atual) return [];
    const lista: { destino: string; maritima: boolean; info?: RotaConexao; visivel: boolean; distanciaKm: number }[] = [];
    atlas.estradas.forEach((e) => {
      if (e.de === atual.atlas.nome || e.para === atual.atlas.nome) {
        const destino = e.de === atual.atlas.nome ? e.para : e.de;
        const d = resolvidaPorNome.get(destino);
        const info = buscarRota(e.de, e.para);
        const dist = info?.distanciaKm ?? estimarDistancia(e.de, e.para);
        lista.push({
          destino,
          maritima: false,
          info,
          distanciaKm: dist,
          visivel: !!d && visivel(d),
        });
      }
    });
    atlas.rotasMaritimas.forEach((e) => {
      if (e.de === atual.atlas.nome || e.para === atual.atlas.nome) {
        const destino = e.de === atual.atlas.nome ? e.para : e.de;
        const d = resolvidaPorNome.get(destino);
        const info = buscarRota(e.de, e.para);
        const dist = info?.distanciaKm ?? estimarDistancia(e.de, e.para);
        lista.push({
          destino,
          maritima: true,
          info,
          distanciaKm: dist,
          visivel: !!d && visivel(d),
        });
      }
    });
    return ehVisaoMestre ? lista : lista.filter((r) => r.visivel);
  }, [atual, atlas, resolvidaPorNome, ehVisaoMestre, buscarRota, estimarDistancia]);

  // --- Escalas dependentes do zoom ------------------------------------------
  const k = vista.k;
  const escalaGlifo = Math.pow(k, -0.62);
  const escalaTexto = Math.pow(k, -0.55);
  const opacidadeReinos = limitar(1.25 - (k - 1.3) * 0.55, 0.1, 1);

  const viewBox = `${vista.x.toFixed(2)} ${vista.y.toFixed(2)} ${(LARGURA_MAPA / k).toFixed(2)} ${(ALTURA_MAPA / k).toFixed(2)}`;

  const idClip = `${idBase}-clip`;
  const idHachura = `${idBase}-hachura`;
  const idPapel = `${idBase}-papel`;

  const posRotulo = (c: CidadeAtlas, s: number) => {
    const folga = (c.tipo === 'capital' ? 14 : 10) * s;
    switch (c.rotulo ?? 'direita') {
      case 'esquerda':
        return { x: -folga, y: 4 * s, anchor: 'end' as const };
      case 'abaixo':
        return { x: 0, y: folga + 10 * s, anchor: 'middle' as const };
      case 'acima':
        return { x: 0, y: -folga - 2 * s, anchor: 'middle' as const };
      default:
        return { x: folga, y: 4 * s, anchor: 'start' as const };
    }
  };

  const corPerigoHover = rotaHover ? getCorPerigo(rotaHover.perigo) : null;

  return (
    <div className="space-y-4">
      {/* Container principal do pergaminho */}
      <div className="relative aspect-[3/2] w-full select-none overflow-hidden rounded-lg bg-[#d9c593] shadow-2xl">
        {/* Textura de fundo e manchas de tinta */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <filter id={idPapel} x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="7" result="ruido" />
              <feColorMatrix
                in="ruido"
                type="matrix"
                values="0 0 0 0 0.42  0 0 0 0 0.28  0 0 0 0 0.1  1.1 0 0 0 -0.47"
                result="manchasTinta"
              />
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="grao" />
              <feColorMatrix
                in="grao"
                type="matrix"
                values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.08  0 0 0 0.35 -0.1"
                result="graoTinta"
              />
              <feMerge>
                <feMergeNode in="manchasTinta" />
                <feMergeNode in="graoTinta" />
              </feMerge>
            </filter>
            <radialGradient id={`${idPapel}-vinheta`} cx="50%" cy="50%" r="75%">
              <stop offset="55%" stopColor="#6b4a1f" stopOpacity="0" />
              <stop offset="100%" stopColor="#4a2f0f" stopOpacity="0.38" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="#e9d9ab" />
          <rect width="100%" height="100%" filter={`url(#${idPapel})`} />
          <rect width="100%" height="100%" fill={`url(#${idPapel}-vinheta)`} />
        </svg>

        {/* Camada interativa */}
        <div
          ref={containerRef}
          className="absolute inset-0 cursor-grab touch-none overflow-hidden rounded-sm active:cursor-grabbing"
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onDoubleClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            cancelarAnimacao();
            zoomEm((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, 1.8);
          }}
        >
          <svg
            viewBox={viewBox}
            className="mapa-svg h-full w-full"
            role="img"
            aria-label="Mapa do continente de Thalúria com os cinco reinos"
            style={{ fontFamily: FONTE_MAPA }}
          >
            <defs>
              <clipPath id={idClip}>
                <path d={atlas.terra} />
              </clipPath>
              <pattern id={idHachura} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="0" y2="7" stroke={TINTA_SUAVE} strokeWidth={0.8} strokeOpacity={0.35} />
              </pattern>
            </defs>

            <CamadaBase atlas={atlas} idClip={idClip} />

            {/* Névoa sobre reinos ainda desconhecidos */}
            <g clipPath={`url(#${idClip})`}>
              {atlas.territorios.map((t) => {
                const revelado = reinoRevelado.has(t.id);
                // Para o mestre em visão normal, a névoa é semitransparente (0.22) para que ele veja tudo
                const opacidadeNevoa = revelado ? 0 : ehVisaoMestre ? 0.25 : 1;
                return (
                  <g key={`n-${t.id}`} style={{ transition: 'opacity 0.6s' }} opacity={opacidadeNevoa} pointerEvents="none">
                    <path d={t.d} fill={PAPEL_NEVOA} fillOpacity={0.96} />
                    <path d={t.d} fill={`url(#${idHachura})`} />
                    <path d={t.d} fill="none" stroke={TINTA_SUAVE} strokeWidth={1.2} strokeDasharray="3 5" strokeOpacity={0.6} />
                  </g>
                );
              })}
            </g>

            {/* Rotas marítimas */}
            <g fill="none">
              {rotasMaritimasRenderizadas.map((r) => {
                const isHovered = rotaHover?.de === r.de && rotaHover?.para === r.para;
                return (
                  <g key={r.chave}>
                    {/* Halo de contraste escuro para separar do oceano */}
                    <path
                      d={r.d}
                      stroke="#14222d"
                      strokeWidth={4.8}
                      strokeOpacity={0.32}
                      strokeLinecap="round"
                    />
                    {/* Linha visível da rota marítima */}
                    <path
                      d={r.d}
                      stroke={!r.visivelJog && ehVisaoMestre ? '#7d725f' : '#334155'}
                      strokeWidth={2.2}
                      strokeDasharray={!r.visivelJog && ehVisaoMestre ? '2 6' : '3 5'}
                      strokeLinecap="round"
                      strokeOpacity={!r.visivelJog && ehVisaoMestre ? 0.55 : 0.95}
                      filter={isHovered ? 'drop-shadow(0 0 6px rgba(212,175,55,0.95))' : undefined}
                    />
                    {/* Hit-area invisível ampla para hover fácil e toque */}
                    <path
                      d={r.d}
                      stroke="transparent"
                      strokeWidth={24}
                      strokeLinecap="round"
                      style={{ cursor: 'pointer' }}
                      onPointerEnter={(e) => aoEntrarRota(r.de, r.para, true, false, r.visivelJog, e)}
                      onPointerMove={aoMoverRota}
                      onPointerLeave={aoSairRota}
                      onClick={() => aoClicarRota(r.de, r.para)}
                    />
                  </g>
                );
              })}
            </g>

            {/* Estradas terrestres */}
            <g fill="none" strokeLinecap="round">
              {estradasRenderizadas.map((e) => {
                const isHovered = rotaHover?.de === e.de && rotaHover?.para === e.para;
                const perigosa = (e.info?.perigo ?? 0) >= 7;
                const bloqueada = !!e.info?.bloqueada;
                return (
                  <g key={e.chave}>
                    {/* Halo de contraste sob a estrada para legibilidade perfeita */}
                    <path
                      d={e.d}
                      stroke="#1b1208"
                      strokeWidth={e.principal ? 5.6 : 4.2}
                      strokeOpacity={0.38}
                      strokeLinecap="round"
                    />
                    {/* Traço visível da estrada */}
                    <path
                      d={e.d}
                      stroke={
                        bloqueada
                          ? TINTA_VERMELHA
                          : perigosa
                          ? '#9c4228'
                          : e.principal
                          ? '#261b10'
                          : '#453220'
                      }
                      strokeWidth={e.principal ? 2.8 : 2.0}
                      strokeDasharray={
                        bloqueada
                          ? '2 6'
                          : !e.visivelJog && ehVisaoMestre
                          ? '4 5'
                          : e.principal
                          ? undefined
                          : '6 4'
                      }
                      strokeOpacity={!e.visivelJog && ehVisaoMestre ? 0.52 : 0.94}
                      filter={isHovered ? 'drop-shadow(0 0 6px rgba(212,175,55,0.95))' : undefined}
                    />
                    {/* Hit-area invisível generosa para hover e clique responsivos */}
                    <path
                      d={e.d}
                      stroke="transparent"
                      strokeWidth={24}
                      strokeLinecap="round"
                      style={{ cursor: 'pointer' }}
                      onPointerEnter={(ev) => aoEntrarRota(e.de, e.para, false, e.principal, e.visivelJog, ev)}
                      onPointerMove={aoMoverRota}
                      onPointerLeave={aoSairRota}
                      onClick={() => aoClicarRota(e.de, e.para)}
                    />
                  </g>
                );
              })}
            </g>

            {/* Rótulos de mar */}
            <g fill={TINTA_SUAVE} fontStyle="italic" textAnchor="middle" opacity={0.85} pointerEvents="none">
              {ROTULOS_MAR.map((r) => (
                <text
                  key={r.texto}
                  x={r.x}
                  y={r.y}
                  fontSize={r.tamanho ?? 20}
                  letterSpacing={r.tamanho && r.tamanho > 18 ? 5 : 1.5}
                  transform={r.rotacao ? `rotate(${r.rotacao} ${r.x} ${r.y})` : undefined}
                >
                  {r.texto}
                </text>
              ))}
            </g>

            {/* Rótulos dos reinos */}
            <g pointerEvents="none" opacity={opacidadeReinos} style={{ transition: 'opacity 0.3s' }} textAnchor="middle">
              {REINOS.map((r) => {
                const revelado = reinoRevelado.has(r.id);
                const transf = r.rotacao ? `rotate(${r.rotacao} ${r.rotulo.x} ${r.rotulo.y})` : undefined;
                return (
                  <g key={r.id} transform={transf}>
                    {revelado || ehVisaoMestre ? (
                      <>
                        {r.id !== 'campos' && (
                          <text x={r.rotulo.x} y={r.rotulo.y - 30} fontSize={15} fontStyle="italic" fill={TINTA_SUAVE} letterSpacing={2}>
                            Reino de
                          </text>
                        )}
                        <text
                          x={r.rotulo.x}
                          y={r.rotulo.y}
                          fontFamily={FONTE_MAPA_SC}
                          fontSize={r.id === 'campos' ? 24 : 38}
                          letterSpacing={r.id === 'campos' ? 4 : 8}
                          fill={TINTA}
                          fillOpacity={0.78}
                          stroke={PAPEL_CLARO}
                          strokeWidth={4}
                          strokeOpacity={0.55}
                          paintOrder="stroke"
                        >
                          {r.nome.toUpperCase()}
                        </text>
                      </>
                    ) : (
                      <text x={r.rotulo.x} y={r.rotulo.y} fontSize={22} fontStyle="italic" letterSpacing={3} fill={TINTA_SUAVE} fillOpacity={0.8}>
                        Terra Incógnita
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Decorações fixas do mapa */}
            <RosaDosVentos x={112} y={120} />
            <BarraEscala x={1290} y={978} />
            <Titulo x={40} y={944} />

            {/* Cidades e Assentamentos */}
            <g>
              {cidadesResolvidas.map((c) => {
                const oculta = c.vis === 'OCULTO';
                if (oculta && !ehVisaoMestre) return null;
                const parcial = c.vis === 'ROTA_E_NOME_APENAS';
                const ativa = selecionada === c.atlas.nome;
                const isMinhaCidade = cidadeAtual && normalizar(c.atlas.nome) === normalizar(cidadeAtual);
                const { atlas: a } = c;
                const mostrarNome = (!oculta || ehVisaoMestre) && (a.tipo !== 'vila' || k >= 1.5);
                const rot = posRotulo(a, escalaTexto);
                const capital = a.tipo === 'capital';
                return (
                  <g
                    key={a.nome}
                    transform={`translate(${a.x} ${a.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${oculta ? 'Cidade oculta' : a.nome}, ${ROTULO_TIPO[a.tipo]}`}
                    aria-pressed={ativa}
                    style={{ cursor: 'pointer', outline: 'none' }}
                    opacity={oculta ? (ehVisaoMestre ? 0.45 : 0) : 1}
                    onClick={() => aoClicarCidade(a.nome)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selecionar(a.nome, true);
                      }
                    }}
                  >
                    {/* Área de clique generosa */}
                    <circle r={18 * escalaGlifo} fill="transparent" />

                    {/* Farol / Indicador de Cidade Atual do Jogador */}
                    {isMinhaCidade && (
                      <g pointerEvents="none">
                        <circle
                          r={24 * escalaGlifo}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth={2.4 * escalaGlifo}
                        >
                          <animate
                            attributeName="r"
                            values={`${16 * escalaGlifo};${26 * escalaGlifo};${16 * escalaGlifo}`}
                            dur="2.4s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.9;0.2;0.9"
                            dur="2.4s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle r={6 * escalaGlifo} fill="#0284c7" fillOpacity={0.4} />
                      </g>
                    )}

                    {/* Indicador de Cidade Selecionada */}
                    {ativa && (
                      <circle
                        r={16 * escalaGlifo}
                        fill="none"
                        stroke={TINTA_VERMELHA}
                        strokeWidth={1.8 * escalaGlifo}
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Glifo representativo da cidade */}
                    <g transform={`scale(${(capital ? 1.25 : 1) * escalaGlifo})`}>
                      {oculta ? (
                        <circle r={3.5} fill="none" stroke={TINTA} strokeWidth={1} strokeDasharray="2 2" />
                      ) : (
                        <GlifoCidade tipo={a.tipo} parcial={parcial} />
                      )}
                    </g>

                    {/* Rótulo da cidade */}
                    {mostrarNome && (
                      <g>
                        {isMinhaCidade && (
                          <text
                            x={rot.x}
                            y={rot.y - 14 * escalaTexto}
                            textAnchor={rot.anchor}
                            fontSize={11 * escalaTexto}
                            fontWeight={700}
                            fill="#0369a1"
                            stroke={PAPEL_CLARO}
                            strokeWidth={2.5 * escalaTexto}
                            paintOrder="stroke"
                            pointerEvents="none"
                          >
                            📍 Sua Cidade
                          </text>
                        )}
                        <text
                          x={rot.x}
                          y={rot.y}
                          textAnchor={rot.anchor}
                          fontSize={(capital ? 21 : 15.5) * escalaTexto}
                          fontStyle={parcial ? 'italic' : 'normal'}
                          fontWeight={capital ? 700 : 400}
                          fill={TINTA}
                          stroke={PAPEL_CLARO}
                          strokeWidth={3.2 * escalaTexto}
                          strokeOpacity={0.88}
                          paintOrder="stroke"
                          strokeLinejoin="round"
                          pointerEvents="none"
                        >
                          {a.nome}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Moldura de tinta clássica */}
        <div className="pointer-events-none absolute inset-0 rounded-sm border-[3px] border-[#3a2a1a]/80" />
        <div className="pointer-events-none absolute inset-[7px] rounded-[1px] border border-[#3a2a1a]/60" />

        {/* Banner do Mestre quando em modo Pré-visualização de Jogador */}
        {mestre && previewJogador && (
          <div className="absolute left-3 right-3 top-3 z-30 flex items-center justify-between gap-3 rounded-lg border border-amber-600/70 bg-[#16120c]/90 px-3.5 py-2 text-amber-200 shadow-2xl backdrop-blur-md sm:left-4 sm:right-auto">
            <div className="flex items-center gap-2 text-xs font-cinzel">
              <Eye className="h-4 w-4 animate-pulse text-amber-400" />
              <span>Visão do Jogador (Pré-visualização)</span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewJogador(false)}
              className="cursor-pointer rounded border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-[11px] font-sans-clean font-semibold text-amber-300 hover:bg-amber-500/30"
            >
              Voltar ao Mestre
            </button>
          </div>
        )}

        {/* Tooltip interativo flutuante da rota em hover */}
        {rotaHover && (
          <div
            className="pointer-events-none absolute z-30 max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border border-[#3a2a1a]/80 bg-[#f7efd7]/95 px-3 py-2 text-[#2c1e11] shadow-2xl backdrop-blur-sm"
            style={{
              left: limitar(rotaHover.screenX, 110, (containerRef.current?.clientWidth ?? 600) - 110),
              top: Math.max(16, rotaHover.screenY - 14),
              fontFamily: FONTE_MAPA,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#3a2a1a]/20 pb-1">
              <span className="text-sm font-bold tracking-wide" style={{ fontFamily: FONTE_MAPA_SC }}>
                {rotaHover.de} ➔ {rotaHover.para}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  rotaHover.maritima
                    ? 'border border-cyan-800/30 bg-cyan-800/15 text-cyan-900'
                    : 'border border-amber-800/30 bg-amber-800/15 text-amber-900'
                }`}
              >
                {rotaHover.maritima ? '⛵ Marítima' : rotaHover.principal ? '🛣️ Principal' : '🛤️ Secundária'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs">
              <div>
                <span className="italic text-[#6b5436]">Distância: </span>
                <strong>{rotaHover.distanciaKm} km</strong>
              </div>
              <div>
                <span className="italic text-[#6b5436]">Perigo: </span>
                <span className={`font-bold ${corPerigoHover?.texto}`}>
                  {rotaHover.perigo}/10 ({corPerigoHover?.rotulo})
                </span>
              </div>
            </div>
            {rotaHover.bloqueada && (
              <div className="mt-1 text-[11px] font-bold text-rose-700">
                ⚠️ Rota Bloqueada pelo Mestre
              </div>
            )}
            {ehVisaoMestre && (
              <div className="mt-1 border-t border-[#3a2a1a]/15 pt-1 text-[10px] italic">
                {rotaHover.visivelParaJogador ? (
                  <span className="font-semibold text-emerald-800">✓ Revelada aos jogadores</span>
                ) : (
                  <span className="font-semibold text-[#8a3b2a]">👁️‍🗨️ Oculta dos jogadores (Névoa)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Barra flutuante de ferramentas e atalhos rápidos */}
        <div className="absolute right-3 top-3 z-20 flex flex-wrap items-center justify-end gap-1.5">
          {/* Atalho para Minha Cidade */}
          {cidadeAtual && (
            <BotaoMapa
              rotulo={`Centralizar na minha cidade: ${cidadeAtual}`}
              onClick={() => selecionar(cidadeAtual, true)}
            >
              <div className="flex items-center gap-1 font-cinzel text-[11px] text-sky-900">
                <MapPin className="h-3.5 w-3.5 text-sky-700" />
                <span className="hidden sm:inline max-w-[85px] truncate">{cidadeAtual}</span>
              </div>
            </BotaoMapa>
          )}

          {/* Seletor Rápido de Reinos */}
          <div className="relative">
            <BotaoMapa
              rotulo="Focar Reino ou Região"
              onClick={() => setMenuReinosAberto((v) => !v)}
              ativo={menuReinosAberto}
            >
              <div className="flex items-center gap-1 font-cinzel text-[11px]">
                <Compass className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reinos</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </BotaoMapa>

            {menuReinosAberto && (
              <div
                className="absolute right-0 top-9 z-30 w-48 rounded-lg border border-[#3a2a1a]/80 bg-[#f7efd7] p-1.5 shadow-2xl backdrop-blur-sm"
                style={{ fontFamily: FONTE_MAPA }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="border-b border-[#3a2a1a]/20 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#6b5436]">
                  Navegar para Região
                </div>
                <div className="mt-1 flex flex-col gap-0.5">
                  {[
                    { id: 'frosthelm', nome: 'Reino de Frosthelm' },
                    { id: 'sylvanor', nome: 'Reino de Sylvanor' },
                    { id: 'aurelia', nome: 'Reino de Aurelia' },
                    { id: 'drakos', nome: 'Reino de Drakos' },
                    { id: 'valthera', nome: 'Reino de Valthera' },
                    { id: 'campos', nome: 'Campos Meridionais' },
                    { id: 'ilhas', nome: 'Ilhas de Thalúria' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => focarReino(r.id)}
                      className="flex cursor-pointer items-center justify-between rounded px-2 py-1 text-left text-xs text-[#3a2a1a] transition-colors hover:bg-[#3a2a1a]/10"
                    >
                      <span>{r.nome}</span>
                      <Navigation className="h-3 w-3 text-[#6b5436]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alternador Mestre / Jogador */}
          {mestre && (
            <BotaoMapa
              rotulo={previewJogador ? 'Voltar para Visão do Mestre' : 'Pré-visualizar como Jogador'}
              onClick={() => setPreviewJogador((v) => !v)}
              ativo={previewJogador}
            >
              <div className="flex items-center gap-1 font-cinzel text-[11px]">
                {previewJogador ? <EyeOff className="h-3.5 w-3.5 text-amber-700" /> : <Eye className="h-3.5 w-3.5" />}
                <span className="hidden md:inline">
                  {previewJogador ? 'Modo: Jogador' : 'Ver como Jogador'}
                </span>
              </div>
            </BotaoMapa>
          )}

          {/* Zoom In / Out / Reset */}
          <div className="flex items-center gap-1">
            <BotaoMapa rotulo="Aproximar zoom" onClick={() => zoomBotao(1.5)}>
              <Plus className="h-3.5 w-3.5" />
            </BotaoMapa>
            <BotaoMapa rotulo="Afastar zoom" onClick={() => zoomBotao(1 / 1.5)}>
              <Minus className="h-3.5 w-3.5" />
            </BotaoMapa>
            <BotaoMapa
              rotulo="Visão Geral (Continente Inteiro)"
              onClick={() => {
                setSelecionada(null);
                irPara(VISTA_INICIAL);
              }}
            >
              <Locate className="h-3.5 w-3.5" />
            </BotaoMapa>
          </div>
        </div>

        {/* Ficha da cidade (Drawer responsivo) */}
        {atual && (
          <>
            {/* Backdrop escuro no mobile para fechar facilmente */}
            <div
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] sm:hidden"
              onClick={() => setSelecionada(null)}
              aria-hidden="true"
            />
            <FichaCidade
              atual={atual}
              reino={reinoAtual?.nome}
              rotasDaCidade={rotasDaCidade}
              mestre={ehVisaoMestre}
              salvando={salvando}
              erro={erro}
              onFechar={() => setSelecionada(null)}
              onIr={(nome) => selecionar(nome, true)}
              onAlterar={alterarVisibilidade}
              podeAlterar={!!onAlterarVisibilidade && !demonstracao}
            />
          </>
        )}
      </div>

      <p className="text-center font-sans-clean text-[11px] text-[#8c93a4]">
        Arraste para mover · use dois dedos ou roda do mouse para ampliar · passe o mouse nas rotas para ver distância e perigo · clique numa cidade para ver conexões
      </p>

      {/* ------------------------- Legenda e índice ------------------------- */}
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Legenda />
        <div className="grimorio-card rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#252b3a] pb-2">
            <h3 className="font-cinzel text-sm font-bold text-[#f3e5ab]">Locais conhecidos</h3>
            <span className="text-[11px] font-sans-clean text-[#8c93a4]">
              {totalVisiveis} / {CIDADES_ATLAS.length} {ehVisaoMestre ? '(Visão Mestre: 100% acessível)' : ''}
            </span>
          </div>
          {totalVisiveis === 0 ? (
            <p className="text-xs font-sans-clean text-[#8c93a4]">
              Nenhum local foi revelado pelo Mestre ainda. Conforme a campanha avança, o mapa será preenchido.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {cidadesResolvidas
                .filter(visivel)
                .map((c) => (
                  <button
                    key={c.atlas.nome}
                    type="button"
                    onClick={() => selecionar(c.atlas.nome, true)}
                    className={`cursor-pointer rounded border px-2 py-1 text-[11px] font-cinzel transition-colors ${
                      selecionada === c.atlas.nome
                        ? 'border-amber-400/70 bg-amber-400/15 text-[#f3e5ab]'
                        : 'border-[#2b3142] text-[#b8b2a0] hover:border-amber-500/50 hover:text-[#f3e5ab]'
                    }`}
                  >
                    {c.atlas.nome}
                  </button>
                ))}
            </div>
          )}
          {mestre && semCoordenadas.length > 0 && (
            <p className="mt-3 border-t border-[#252b3a] pt-2 text-[11px] font-sans-clean text-amber-300/80">
              Sem posição no atlas: {semCoordenadas.map((c) => c.nome).join(', ')}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Subcomponentes de interface
// ---------------------------------------------------------------------------
const BotaoMapa: React.FC<{
  rotulo: string;
  onClick: () => void;
  ativo?: boolean;
  children: React.ReactNode;
}> = ({ rotulo, onClick, ativo = false, children }) => (
  <button
    type="button"
    aria-label={rotulo}
    title={rotulo}
    onClick={onClick}
    onPointerDown={(e) => e.stopPropagation()}
    className={`flex h-8 cursor-pointer items-center justify-center rounded border px-2 shadow transition-colors ${
      ativo
        ? 'border-amber-600 bg-amber-400 text-[#1b1208] font-bold shadow-amber-500/30'
        : 'border-[#3a2a1a]/70 bg-[#f3e7c3]/90 text-[#3a2a1a] hover:bg-[#fff6d6]'
    }`}
  >
    {children}
  </button>
);

const Legenda: React.FC = () => (
  <div className="grimorio-card rounded-lg p-4">
    <h3 className="mb-3 border-b border-[#252b3a] pb-2 font-cinzel text-sm font-bold text-[#f3e5ab]">Legenda</h3>
    <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-sans-clean text-[#b8b2a0]">
      {(['capital', 'cidade', 'vila', 'porto', 'fortaleza'] as TipoCidade[]).map((t) => (
        <li key={t} className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="-12 -12 24 24" aria-hidden="true" className="shrink-0 rounded-sm bg-[#e9d9ab]">
            <GlifoCidade tipo={t} parcial={false} />
          </svg>
          {ROTULO_TIPO[t]}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="-12 -12 24 24" aria-hidden="true" className="shrink-0 rounded-sm bg-[#e9d9ab]">
          <GlifoCidade tipo="cidade" parcial />
        </svg>
        Só o nome é conhecido
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#261b10" strokeWidth="2.8" />
        </svg>
        Estrada principal
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#453220" strokeWidth="2.0" strokeDasharray="5 3" />
        </svg>
        Estrada secundária
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#334155" strokeWidth="2.2" strokeDasharray="3 4" strokeLinecap="round" />
        </svg>
        Rota marítima
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#8a3b2a" strokeWidth="2.0" strokeDasharray="2 4" strokeLinecap="round" />
        </svg>
        Rota bloqueada / perigosa
      </li>
      <li className="col-span-2 flex items-center gap-2 text-[#8c93a4]">
        <span className="inline-block h-3 w-3 shrink-0 rounded-sm border border-[#6b5436]/60 bg-[#e3d3a6]" />
        Terra Incógnita — reino sob névoa
      </li>
    </ul>
  </div>
);

interface FichaCidadeProps {
  atual: CidadeResolvida;
  reino?: string;
  rotasDaCidade: { destino: string; maritima: boolean; info?: RotaConexao; visivel: boolean; distanciaKm: number }[];
  mestre: boolean;
  podeAlterar: boolean;
  salvando: boolean;
  erro: string | null;
  onFechar: () => void;
  onIr: (nome: string) => void;
  onAlterar: (nome: string, nivel: NivelVisibilidade) => void;
}

const FichaCidade: React.FC<FichaCidadeProps> = ({
  atual,
  reino,
  rotasDaCidade,
  mestre,
  podeAlterar,
  salvando,
  erro,
  onFechar,
  onIr,
  onAlterar,
}) => {
  const { atlas: a, api, vis } = atual;
  const completa = vis === 'INFORMACOES_COMPLETAS';
  const ocultaParaJogador = vis === 'OCULTO';
  const niveis: NivelVisibilidade[] = ['OCULTO', 'ROTA_E_NOME_APENAS', 'INFORMACOES_COMPLETAS'];

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-40 max-h-[75vh] w-full overflow-y-auto rounded-t-2xl border-t-2 border-[#3a2a1a] bg-[#f5ecce] p-4 text-[#3a2a1a] shadow-2xl transition-transform sm:absolute sm:inset-auto sm:left-4 sm:top-4 sm:bottom-auto sm:max-h-[80%] sm:w-80 sm:rounded-lg sm:border sm:border-[#3a2a1a]/80 sm:bg-[#f3e7c3]/95 sm:p-3.5"
      style={{ fontFamily: FONTE_MAPA }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Pill de arraste visual no mobile */}
      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#3a2a1a]/25 sm:hidden" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xl font-bold leading-tight" style={{ fontFamily: FONTE_MAPA_SC }}>
            {a.nome}
          </h4>
          <p className="text-xs italic text-[#6b5436]">
            {ROTULO_TIPO[a.tipo]}
            {reino && a.reino !== 'ilhas' ? ` · ${a.reino === 'campos' ? reino : `Reino de ${reino}`}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="cursor-pointer rounded p-1 text-[#6b5436] hover:bg-[#3a2a1a]/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mestre && ocultaParaJogador && (
        <p className="mt-2 rounded bg-[#3a2a1a]/10 px-2 py-1 text-[11px] italic">Oculta para os jogadores.</p>
      )}

      {completa && api && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {api.regiao && (
            <>
              <dt className="italic text-[#6b5436]">Bioma</dt>
              <dd>{formatarEnum(api.regiao)}</dd>
            </>
          )}
          {api.geologia && (
            <>
              <dt className="italic text-[#6b5436]">Solo</dt>
              <dd>{formatarEnum(api.geologia)}</dd>
            </>
          )}
          {api.aquifero && (
            <>
              <dt className="italic text-[#6b5436]">Água</dt>
              <dd>{formatarEnum(api.aquifero)}</dd>
            </>
          )}
          {typeof api.lojas === 'number' && (
            <>
              <dt className="italic text-[#6b5436]">Lojas</dt>
              <dd>{api.lojas}</dd>
            </>
          )}
        </dl>
      )}
      {vis === 'ROTA_E_NOME_APENAS' && (
        <p className="mt-3 text-sm italic text-[#6b5436]">Apenas o nome e as rotas desta cidade são conhecidos.</p>
      )}
      {completa && !api && (
        <p className="mt-3 text-sm italic text-[#6b5436]">Sem dados adicionais do servidor para este local.</p>
      )}

      {rotasDaCidade.length > 0 && (
        <div className="mt-3 border-t border-[#3a2a1a]/25 pt-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#6b5436]">
            Rotas Conectadas ({rotasDaCidade.length})
          </p>
          <ul className="space-y-1 text-sm">
            {rotasDaCidade.map((r) => {
              const perigo = r.info?.perigo ?? (r.maritima ? 4 : 3);
              const corP = getCorPerigo(perigo);
              return (
                <li key={`${r.destino}-${r.maritima}`}>
                  <button
                    type="button"
                    onClick={() => onIr(r.destino)}
                    className="flex w-full cursor-pointer items-center justify-between rounded px-1.5 py-1 text-left transition-colors hover:bg-[#3a2a1a]/10"
                  >
                    <div>
                      <span className="font-semibold">{r.visivel ? r.destino : '??? Desconhecido'}</span>
                      <span className="text-xs italic text-[#6b5436] block">
                        {r.maritima ? '⛵ por mar' : '🛣️ por terra'} · {r.distanciaKm} km
                        {r.info?.bloqueada ? ' · bloqueada' : ''}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${corP.bg} ${corP.texto} border ${corP.borda}`}>
                      Perigo {perigo}/10
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {mestre && podeAlterar && (
        <div className="mt-3 border-t border-[#3a2a1a]/25 pt-2">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#6b5436]">
            {ocultaParaJogador ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Visão dos jogadores
          </p>
          <div className="flex flex-col gap-1">
            {niveis.map((n) => (
              <button
                key={n}
                type="button"
                disabled={salvando || vis === n}
                onClick={() => onAlterar(a.nome, n)}
                className={`cursor-pointer rounded border px-2 py-1 text-left text-xs transition-colors disabled:cursor-default ${
                  vis === n
                    ? 'border-[#3a2a1a] bg-[#3a2a1a] text-[#f3e7c3]'
                    : 'border-[#3a2a1a]/40 hover:bg-[#3a2a1a]/10 disabled:opacity-50'
                }`}
              >
                {ROTULO_VISIBILIDADE[n]}
              </button>
            ))}
          </div>
          {erro && <p className="mt-1.5 text-xs text-[#8a3b2a]">{erro}</p>}
        </div>
      )}
    </aside>
  );
};

function formatarEnum(valor: string): string {
  const t = valor.replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
