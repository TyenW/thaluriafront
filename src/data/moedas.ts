import type { MoedasFicha, TipoMoeda } from '../types/ficha';

export interface InfoMoeda {
  tipo: TipoMoeda;
  nome: string;
  sigla: string;
  /** Classes do disco que representa a moeda. */
  disco: string;
  texto: string;
}

/** Da maior para a menor denominação. Apenas apresentação: nenhuma conversão é feita aqui. */
export const MOEDAS: InfoMoeda[] = [
  { tipo: 'EDITO', nome: 'Édito', sigla: 'ED', disco: 'from-rose-300 to-rose-700 border-rose-200/60', texto: 'text-rose-200' },
  { tipo: 'TALENTO', nome: 'Talento', sigla: 'TL', disco: 'from-violet-300 to-violet-700 border-violet-200/60', texto: 'text-violet-200' },
  { tipo: 'DIAMANTE', nome: 'Diamante', sigla: 'DI', disco: 'from-sky-100 to-cyan-500 border-cyan-100/70', texto: 'text-cyan-100' },
  { tipo: 'COBALTO', nome: 'Cobalto', sigla: 'CB', disco: 'from-blue-300 to-blue-800 border-blue-200/60', texto: 'text-blue-200' },
  { tipo: 'PLATINA', nome: 'Platina', sigla: 'PT', disco: 'from-slate-100 to-slate-400 border-white/70', texto: 'text-slate-100' },
  { tipo: 'OURO', nome: 'Ouro', sigla: 'PO', disco: 'from-yellow-200 to-amber-600 border-yellow-100/70', texto: 'text-amber-200' },
  { tipo: 'PRATA', nome: 'Prata', sigla: 'PP', disco: 'from-gray-100 to-gray-500 border-gray-100/60', texto: 'text-gray-200' },
  { tipo: 'COBRE', nome: 'Cobre', sigla: 'PC', disco: 'from-orange-300 to-orange-800 border-orange-200/50', texto: 'text-orange-200' },
  { tipo: 'FERRO', nome: 'Ferro', sigla: 'PF', disco: 'from-zinc-400 to-zinc-700 border-zinc-300/50', texto: 'text-zinc-300' },
  { tipo: 'LATAO', nome: 'Latão', sigla: 'PL', disco: 'from-yellow-500 to-yellow-800 border-yellow-300/50', texto: 'text-yellow-300' },
];

/** Maior quantidade aceita pelo back-end (int do Java). */
export const QTD_MAXIMA_MOEDA = 2_147_483_647;

export function moedasVazias(): MoedasFicha {
  return MOEDAS.reduce((acc, m) => ({ ...acc, [m.tipo]: 0 }), {} as MoedasFicha);
}

/** Normaliza o objeto recebido do servidor; moedas ausentes contam como zero. */
export function lerMoedas(moedas?: Partial<MoedasFicha>): MoedasFicha {
  const base = moedasVazias();
  if (!moedas) return base;
  for (const m of MOEDAS) {
    const v = Number(moedas[m.tipo]);
    base[m.tipo] = Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
  }
  return base;
}

/** Ex.: "10 PO · 15 PP · 3 PL". Mostra exatamente o que o personagem possui. */
export function resumirMoedas(moedas?: Partial<MoedasFicha>): string {
  const m = lerMoedas(moedas);
  const partes = MOEDAS.filter((i) => m[i.tipo] > 0).map((i) => `${m[i.tipo].toLocaleString('pt-BR')} ${i.sigla}`);
  return partes.length > 0 ? partes.join(' · ') : 'Sem moedas';
}
