export type EstagioConhecimento = 'NENHUM' | 'RUMOR' | 'COMERCIO' | 'PRODUCAO';

export interface ParametrosEspalhamento {
  /** Dias que a origem guarda o segredo antes de vazar. */
  sigiloDias: number;
  diasPor100Km: number;
  /** Dias que cada cidade segura antes de passar adiante. */
  resistenciaPorSalto: number;
  diasRumorComercio: number;
  diasComercioProducao: number;
}

export interface PrevisaoCidade {
  cidadeId: number;
  estagio: EstagioConhecimento;
  /** Dia em que o estágio chega (ou chegou). null = não chega ou o espalhamento está pausado. */
  diaRumor: number | null;
  diaComercio: number | null;
  diaProducao: number | null;
  alcancavel: boolean;
  saltos: number;
  km: number;
  origem: boolean;
  revogada: boolean;
  adiantadoPara: EstagioConhecimento | null;
}

/** Um tipo de arma ou receita concedido pelo Mestre a uma cidade e que se espalha pelas rotas. */
export interface Conhecimento extends ParametrosEspalhamento {
  id: number;
  tipo: 'TIPO_ARMA' | 'RECEITA';
  tipoArmaId: number | null;
  receitaId: number | null;
  nome: string;
  cidadeOrigemId: number;
  diaConcessao: number;
  pausado: boolean;
  segredo: boolean;
  decorrido: number;
  contagem: Record<EstagioConhecimento, number>;
  cidades: PrevisaoCidade[];
}

export interface PainelDisseminacao {
  dia: number;
  conhecimentos: Conhecimento[];
  cidades: { id: number; nome: string; x: number | null; y: number | null }[];
  tiposArma: { id: number; nome: string }[];
  receitas: { id: number; nome: string; especialidade: string }[];
  padrao: ParametrosEspalhamento;
}
