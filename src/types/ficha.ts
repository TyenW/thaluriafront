export interface MonstroDomadoResumo {
  idDomado: number;
  apelido: string;
  especie: string;
  bestaDeCarga: boolean;
  golpesAtivos: string[];
}

export interface ItemInventarioFicha {
  id: number;
  nome: string;
  descricao: string;
  precoLatao: number;
  pesoKg: number;
  tipo: string;
  raridade: string;
  quantidade: number;
}

export interface PericiaFicha {
  pericia: string;
  nome: string;
  atributoBase: string;
  grau: number;
  maestria: number;
  descricao?: string;
  personalizada?: boolean;
}

/** Denominações físicas de Thalúria, na mesma grafia do enum Carteira.Moeda do back-end. */
export type TipoMoeda =
  | 'EDITO'
  | 'TALENTO'
  | 'DIAMANTE'
  | 'COBALTO'
  | 'PLATINA'
  | 'OURO'
  | 'PRATA'
  | 'COBRE'
  | 'FERRO'
  | 'LATAO';

/** Quantidade física de cada moeda que o personagem carrega (sem conversões). */
export type MoedasFicha = Record<TipoMoeda, number>;

export interface FichaPersonagem {
  id: number;
  usuarioId?: number;
  nome: string;
  raca: string;
  imagemUrl?: string;
  reinoOrigem?: string;
  vig: number;
  forca: number;
  des: number;
  men: number;
  esp: number;
  von: number;
  hpAtual: number;
  hpMax: number;
  sanAtual: number;
  sanMax: number;
  energiaAtual: number;
  energiaMax: number;
  manaAtual: number;
  manaMax: number;
  defFisica: number;
  defOculta: number;
  /** Total equivalente em latão, mantido pelo servidor para as lojas. Não exibir como saldo. */
  carteiraLatao?: number;
  moedas?: MoedasFicha;
  cidadeAtual?: string;
  pontosEssencia?: number;
  poderAtaque?: number;
  nivelRessonancia?: number;
  ordem?: number;
  patamar?: string;
  manaRegen?: number;
  turnosMorte?: number;
  habilidadeInataNome?: string;
  habilidadeInataDescricao?: string;
  habilidadeInataDado?: string;
  habilidadeInataCustoEnergia?: number;
  habilidadeInataCustoMana?: number;
  habilidadeInataAlcance?: number;
  domados?: MonstroDomadoResumo[];
  inventario?: ItemInventarioFicha[];
  pericias?: PericiaFicha[];
}

export interface SessaoCriacaoAtiva {
  usuarioId: number;
  personagem: string;
  etapa: string;
  opcoes: string;
  racaEscolhida: string;
  dicaMestre?: string;
  aprovada: boolean;
}
