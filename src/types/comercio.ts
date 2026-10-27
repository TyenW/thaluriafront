/** Especialidades de loja (Lojas.TipoEstabelecimento no back-end). */
export type TipoLoja = 'FORJA' | 'ALFAIATARIA' | 'LOJA_GERAL' | 'ALQUIMIA' | 'JOALHERIA' | 'TAVERNA' | 'BOTANICA';

export interface ResumoLoja {
  id: number;
  nome: string;
  mercador: string;
  tipo: TipoLoja;
  tipoRotulo: string;
  cidade: string | null;
  cidadeId: number | null;
  nivel: number;
  rede: string | null;
  caixaLatao: number;
  unidades: number;
  valorEstoqueLatao: number;
  ordens: number;
  entradasSemanaLatao: number;
  saidasSemanaLatao: number;
  unidadesVendidasSemana: number;
  alertas: string[];
}

export interface ResumoComercio {
  dia: number;
  diasDoResumo: number;
  totais: {
    lojas: number;
    caixaLatao: number;
    valorEstoqueLatao: number;
    ordensEmAndamento: number;
    lojasEmAlerta: number;
    caravanasEmViagem: number;
  };
  lojas: ResumoLoja[];
}

export interface MercadoriaLoja {
  itemId: number;
  nome: string;
  imagemUrl?: string | null;
  descricao?: string | null;
  tipo: string;
  raridade: string;
  quantidade: number;
  demanda: number;
  precoBaseLatao: number;
  /** Preço dinâmico atual de venda no balcão. */
  precoVendaLatao: number;
  /** Quanto a loja paga a um fornecedor por unidade. */
  precoCompraLatao: number;
  /** Peças prontas guardadas para encomendas: estão na oficina, mas não vendem. */
  reservado?: number;
  /** Item de conhecimento regional: o estágio dele nesta cidade (Rumor, Comércio, Produção). */
  estagioConhecimento?: string | null;
  /** Números de combate, se for arma feita na forja. */
  arma?: { dano: string; durabilidade: number; alcanceM: number; slotsEfeito: number; composicao: string | null } | null;
}

export interface InsumoReceita {
  itemId: number;
  nome: string;
  quantidade: number;
  emEstoque: number;
}

export interface ReceitaComercio {
  id: number;
  nome: string;
  /** A especialidade da loja produz esta receita sozinha. */
  conhecida: boolean;
  especialidade: string;
  resultadoId: number;
  resultadoNome: string;
  quantidadeResultado: number;
  dias: number;
  insumos: InsumoReceita[];
  receitaEsperadaLatao: number;
  custoInsumosLatao: number;
  maoDeObraLatao: number;
  lucroLatao: number;
  temInsumos: boolean;
  estoqueCheio: boolean;
  /** A IA não produz sozinha; só por ordem do Mestre. */
  somenteEncomenda?: boolean;
  /** Partes forjadas antes da montagem (armas da forja). */
  etapas?: string[];
  /** Receita que se espalha por disseminação (não é conhecida no mundo todo). */
  regional?: boolean;
  /** A cidade da loja já chegou à Produção dela (a IA só fabrica se sim). */
  liberadaAqui?: boolean;
}

/** Uma peça de uma encomenda de arma: na bancada, pronta e reservada, ou tirada da prateleira. */
export interface EtapaOrdem {
  parte: string;
  componente: string;
  dia: number;
  estado: 'PENDENTE' | 'RESERVADA' | 'DA_PRATELEIRA';
}

export interface OrdemComercio {
  receitaId: number;
  receitaNome: string;
  resultadoNome: string;
  quantidade: number;
  lotes: number;
  diaInicio: number;
  diaConclusao: number;
  origem: 'IA' | 'MESTRE';
  /** Posição na oficina (usada para cancelar). */
  indice: number;
  insumosPorConta: boolean;
  etapas: EtapaOrdem[];
}

export interface MovimentoCaixa {
  id: number;
  dia: number;
  hora: number;
  tipo: string;
  tipoDescricao: string;
  /** 1 entrada, -1 saída, 0 não mexe no caixa. */
  fluxo: 1 | -1 | 0;
  item: string | null;
  quantidade: number;
  valorLatao: number;
  descricao: string | null;
  saldoAposLatao: number | null;
}

export interface DetalheLoja {
  dia: number;
  loja: ResumoLoja;
  estoque: MercadoriaLoja[];
  receitas: ReceitaComercio[];
  ordens: OrdemComercio[];
  ordensMax: number;
  movimentacoes: MovimentoCaixa[];
}

/** Caravana em viagem, com a posição no caminho (para o mapa do Mestre). */
export interface CaravanaMapa {
  id: number;
  status: 'AGUARDANDO_ESCOLTA' | 'EM_TRANSITO' | 'EXTRAVIADA';
  statusDescricao: string;
  protecao: 'DESPROTEGIDA' | 'ESCOLTADA_NPC' | 'ESCOLTADA_JOGADOR';
  protecaoDescricao: string;
  itemId: number;
  carga: string;
  quantidade: number;
  valorCargaLatao: number;
  lojaOrigem: string;
  lojaOrigemId: number;
  lojaDestino: string;
  lojaDestinoId: number;
  /** Nomes das cidades do caminho, da origem ao destino. */
  caminho: string[];
  trechos: { tipo: 'TERRESTRE' | 'MARITIMA'; km: number; perigo: number }[];
  /** Trecho atual (entre caminho[i] e caminho[i + 1]) e quanto dele já foi percorrido (0 a 1). */
  indiceTrecho: number;
  fracaoNoTrecho: number;
  kmPercorridos: number;
  kmTotal: number;
  horasRestantes: number;
  missao?: { tipo: string; status: string; recompensaLatao: number; horasRestantes: number; cidade: string | null };
}
