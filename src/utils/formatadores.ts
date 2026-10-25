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
