import type { TipoLoja } from '../types/comercio';

export const NOMES_ATRIBUTOS: Record<string, { nome: string; sigla: string; descricao: string; cor: string }> = {
  VIG: { nome: 'Vigor', sigla: 'VIG', descricao: 'Constituição física, resistência e vitalidade', cor: 'from-emerald-500 to-green-600' },
  FOR: { nome: 'Força', sigla: 'FOR', descricao: 'Potência muscular, impacto e capacidade de carga', cor: 'from-amber-500 to-red-600' },
  DES: { nome: 'Destreza', sigla: 'DES', descricao: 'Agilidade, pontaria, reflexos e equilíbrio', cor: 'from-cyan-500 to-blue-600' },
  MEN: { nome: 'Mental', sigla: 'MEN', descricao: 'Raciocínio lógico, erudição e estratégia', cor: 'from-indigo-500 to-purple-600' },
  ESP: { nome: 'Espírito', sigla: 'ESP', descricao: 'Canalização arcana, ressonância mágica e carisma', cor: 'from-purple-500 to-pink-600' },
  VON: { nome: 'Vontade', sigla: 'VON', descricao: 'Firmeza de espírito, tenacidade e sanidade', cor: 'from-amber-400 to-yellow-600' },
};

export function getCorPerigo(perigo: number): { texto: string; fundo: string; borda: string } {
  if (perigo <= 2) return { texto: 'text-emerald-400', fundo: 'bg-emerald-950/40', borda: 'border-emerald-600/40' };
  if (perigo <= 4) return { texto: 'text-yellow-400', fundo: 'bg-yellow-950/40', borda: 'border-yellow-600/40' };
  if (perigo <= 7) return { texto: 'text-orange-400', fundo: 'bg-orange-950/40', borda: 'border-orange-600/40' };
  return { texto: 'text-red-400', fundo: 'bg-red-950/40', borda: 'border-red-600/40' };
}

const SIGLAS_ATRIBUTO = new Set(['VIG', 'FOR', 'DES', 'MEN', 'ESP', 'VON']);

/** "ARMA_BRANCA" -> "Arma branca" (apresentação de enums vindos do servidor). Siglas de atributo (FOR, VIG...) ficam como estão. */
export function rotuloEnum(valor: string): string {
  if (SIGLAS_ATRIBUTO.has(valor)) return valor;
  const t = valor.replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Cor do texto de cada raridade de item (Item.RaridadeItem no back-end). */
export const COR_RARIDADE: Record<string, string> = {
  COMUM: 'text-texto-2',
  INCOMUM: 'text-emerald-300',
  RARO: 'text-sky-300',
  EPICO: 'text-purple-300',
  LENDARIO: 'text-amber-300',
  MITICO: 'text-rose-300',
};

export const corRaridade = (raridade?: string | null) => COR_RARIDADE[raridade ?? ''] ?? 'text-texto-2';

const LATAO_POR = { PO: 10_000, PP: 1_000, PC: 100 } as const;

/**
 * Valor em latão na moeda mais legível: 25.000 → "2,5 PO"; 1.500 → "1,5 PP"; 80 → "80 PL".
 * Só apresentação: o servidor guarda e calcula tudo em latão.
 */
export function formatarLatao(valor: number): string {
  const abs = Math.abs(valor);
  const sinal = valor < 0 ? '−' : '';
  const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  if (abs >= LATAO_POR.PO) return `${sinal}${fmt(abs / LATAO_POR.PO)} PO`;
  if (abs >= LATAO_POR.PP) return `${sinal}${fmt(abs / LATAO_POR.PP)} PP`;
  if (abs >= LATAO_POR.PC) return `${sinal}${fmt(abs / LATAO_POR.PC)} PC`;
  return `${sinal}${abs.toLocaleString('pt-BR')} PL`;
}

/** Nome curto de cada especialidade de loja. */
export const ROTULO_TIPO_LOJA: Record<TipoLoja, string> = {
  LOJA_GERAL: 'Empório',
  TAVERNA: 'Taverna',
  FORJA: 'Forja',
  ALQUIMIA: 'Alquimia',
  ALFAIATARIA: 'Alfaiataria',
  JOALHERIA: 'Joalheria',
  BOTANICA: 'Botânica',
};

export const rotuloTipoLoja = (t: TipoLoja) => ROTULO_TIPO_LOJA[t] ?? t;
