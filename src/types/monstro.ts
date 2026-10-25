export interface GolpePokemon {
  nome: string;
  categoria: 'FISICO_CONTATO' | 'ESPECIAL_ELEMENTAL' | 'STATUS_TATICO';
  elemento: string;
  dados: string;
  custoEnergia?: number;
  custoMana?: number;
  descricao?: string;
}

export interface MonstroBestiario {
  id: string;
  revelado: boolean;
  nome: string;
  regiao?: string;
  elemento?: string;
  porte?: string;
  golpesPokemon?: GolpePokemon[];
}

export interface ConteudoVisivelMundo {
  diaMercado: number;
  capitulosWiki: string[];
  cidades: CidadeVisivel[];
  rotas: RotaConexao[];
  bestiario: MonstroBestiario[];
}

export interface CidadeVisivel {
  nome: string;
  visibilidade: 'OCULTO' | 'ROTA_E_NOME_APENAS' | 'INFORMACOES_COMPLETAS';
  regiao?: string;
  geologia?: string;
  aquifero?: string;
  lojas?: number;
  /**
   * Só vem preenchido na visão do Mestre: o que os JOGADORES enxergam desta cidade.
   * (Para o Mestre, `visibilidade` é sempre INFORMACOES_COMPLETAS.)
   */
  visibilidadeJogador?: 'OCULTO' | 'ROTA_E_NOME_APENAS' | 'INFORMACOES_COMPLETAS';
}

export interface RotaConexao {
  origem: string;
  destino: string;
  distanciaKm: number;
  perigo: number;
  tipo: 'TERRESTRE' | 'MARITIMA';
  bloqueada: boolean;
}
