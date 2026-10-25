import type { CidadeAtlas, TipoCidade } from '../../data/atlasThaluria';
import { ALTURA_MAPA, LARGURA_MAPA } from '../../data/atlasThaluria';
import type { CidadeVisivel, RotaConexao } from '../../types/monstro';

export type NivelVisibilidade = CidadeVisivel['visibilidade'];

// ---------------------------------------------------------------------------
// Paleta "tinta ferrogálica sobre pergaminho"
// ---------------------------------------------------------------------------
export const TINTA = '#3a2a1a';
export const TINTA_SUAVE = '#6b5436';
export const TINTA_VERMELHA = '#8a3b2a';
export const PAPEL_CLARO = '#f3e7c3';
export const PAPEL_NEVOA = '#e3d3a6';
export const FONTE_MAPA = "'IM Fell English', 'IM Fell DW Pica', Georgia, 'Times New Roman', serif";
export const FONTE_MAPA_SC = "'IM Fell English SC', 'IM Fell English', Georgia, serif";

export const ROTULO_TIPO: Record<TipoCidade, string> = {
  capital: 'Capital do Reino',
  cidade: 'Cidade',
  vila: 'Vila',
  porto: 'Porto',
  fortaleza: 'Fortaleza',
};

export const ROTULO_VISIBILIDADE: Record<NivelVisibilidade, string> = {
  OCULTO: 'Oculto',
  ROTA_E_NOME_APENAS: 'Só nome e rota',
  INFORMACOES_COMPLETAS: 'Revelado',
};

export const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export interface Vista {
  x: number;
  y: number;
  k: number;
}

export const VISTA_INICIAL: Vista = { x: 0, y: 0, k: 1 };
export const ZOOM_MAX = 7;

export function ajustarVista(v: Vista): Vista {
  const k = limitar(v.k, 1, ZOOM_MAX);
  const w = LARGURA_MAPA / k;
  const h = ALTURA_MAPA / k;
  return { k, x: limitar(v.x, 0, LARGURA_MAPA - w), y: limitar(v.y, 0, ALTURA_MAPA - h) };
}

export const CENTROS_REINOS: Record<string, { x: number; y: number; zoom: number }> = {
  frosthelm: { x: 540, y: 190, zoom: 2.2 },
  sylvanor: { x: 1040, y: 220, zoom: 2.2 },
  aurelia: { x: 440, y: 440, zoom: 2.2 },
  drakos: { x: 1260, y: 440, zoom: 2.2 },
  valthera: { x: 700, y: 700, zoom: 2.2 },
  campos: { x: 1100, y: 680, zoom: 2.2 },
  ilhas: { x: 768, y: 512, zoom: 1.4 },
};

export function getCorPerigo(perigo: number) {
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

export interface RotaHoverInfo {
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

export interface RotaTracada {
  chave: string;
  de: string;
  para: string;
  d: string;
  principal: boolean;
  /** Não há caminho pelo meio da rota (terra/água); exibida só ao Mestre como alerta. */
  impossivel: boolean;
  motivo?: string;
}

export interface CidadeResolvida {
  atlas: CidadeAtlas;
  api?: CidadeVisivel;
  /** O que os jogadores enxergam desta cidade. */
  vis: NivelVisibilidade;
}

export interface RotaDaCidade {
  destino: string;
  maritima: boolean;
  info?: RotaConexao;
  visivel: boolean;
  distanciaKm: number;
}

/** "PLANICIE_ALTA" -> "Planicie alta". */
export function formatarEnum(valor: string): string {
  const t = valor.replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
