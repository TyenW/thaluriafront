/**
 * Converte um valor bruto em Latão (long) para a escala canônica de moedas de Thalúria RPG:
 * - 1 Édito (ED) = 100.000.000.000 Latão
 * - 1 Talento (TL) = 100.000.000 Latão
 * - 1 Diamante (DI) = 10.000.000 Latão
 * - 1 Cobalto (CB) = 1.000.000 Latão
 * - 1 Platina (PT) = 100.000 Latão
 * - 1 Ouro (PO) = 10.000 Latão
 * - 1 Prata (PP) = 1.000 Latão
 * - 1 Cobre (PC) = 100 Latão
 * - 1 Ferro (PF) = 10 Latão
 * - 1 Latão (PL) = 1 Latão
 */
export function formatarMoedasLatao(latao: number | bigint): string {
  const v = typeof latao === 'bigint' ? Number(latao) : (latao || 0);
  if (v <= 0) return '0 PL';

  const ouro = Math.floor(v / 10000);
  const prata = Math.floor((v % 10000) / 1000);
  const cobre = Math.floor((v % 1000) / 100);
  const ferro = Math.floor((v % 100) / 10);
  const restoLatao = v % 10;

  const partes: string[] = [];
  if (ouro > 0) partes.push(`${ouro} PO`);
  if (prata > 0) partes.push(`${prata} PP`);
  if (cobre > 0) partes.push(`${cobre} PC`);
  if (ferro > 0) partes.push(`${ferro} PF`);
  if (restoLatao > 0 || partes.length === 0) partes.push(`${restoLatao} PL`);

  return partes.slice(0, 3).join(' ');
}

export function formatarValorOuro(latao: number): string {
  const ouro = (latao || 0) / 10000;
  return `${ouro.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} PO`;
}

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
