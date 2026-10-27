import type { TipoLoja } from './comercio';

export type CategoriaMaterial = 'METAL' | 'MADEIRA' | 'COURO' | 'FIBRA' | 'GEMA' | 'OSSO' | 'ESCAMA' | 'OUTRO';

/** O que uma parte aceita: uma categoria de material OU um item específico, com bônus que só vale nesta parte. */
export interface OpcaoParte {
  id?: number;
  categoria: CategoriaMaterial | null;
  itemId: number | null;
  itemNome?: string | null;
  bonusDano: number;
  bonusDurabilidade: number;
  bonusAlcanceM: number;
}

export interface ParteMolde {
  /** 0 = parte nova, ainda não gravada. */
  id: number;
  nome: string;
  qtdMateriais: number;
  tempoHoras: number;
  opcoes: OpcaoParte[];
}

/** Família de arma (Espada, Machado, Arco...): as partes e os slots de efeito. */
export interface MoldeArma {
  id: number;
  nome: string;
  tipoLoja: TipoLoja;
  slotsEfeito: number;
  tempoMontagemHoras: number;
  partes: ParteMolde[];
}

/** Espada Longa, Katana...: o dado base e o molde que usa. */
export interface TipoArma {
  id: number;
  nome: string;
  moldeId: number;
  tipoItem: 'ARMA_BRANCA' | 'ARMA_LONGO_ALCANCE';
  qtdDados: number;
  facesDado: number;
  alcanceM: number;
}

export interface MaterialForja {
  id: number;
  nome: string;
  categoria: CategoriaMaterial | null;
  bonusDano: number;
  durabilidade: number;
  pesoKg: number;
  precoLatao: number;
  raridade: string;
}

/** Quanto de um material vai numa parte. */
export interface EscolhaMaterial {
  parteId: number;
  itemId: number;
  quantidade: number;
}

export interface ComponenteCalculado {
  parteId: number;
  parte: string;
  nome: string;
  bonusDano: number;
  durabilidade: number;
  pesoKg: number;
  precoLatao: number;
  raridade: string;
}

/** Arma calculada pelo servidor (mesma fórmula da forja de verdade). */
export interface ArmaCalculada {
  nome: string;
  dano: string;
  bonusDano: number;
  durabilidade: number;
  pesoKg: number;
  precoLatao: number;
  raridade: string;
  alcanceM: number;
  slotsEfeito: number;
  tempoHoras: number;
  componentes: ComponenteCalculado[];
  problemas: string[];
}

export interface ReceitaArma {
  id: number;
  nome: string;
  tipoArmaId: number;
  somenteEncomenda: boolean;
  descricao: string | null;
  receitaId: number | null;
  itemId: number | null;
  materiais: EscolhaMaterial[];
  arma: ArmaCalculada;
}

export interface PainelForja {
  moldes: MoldeArma[];
  tipos: TipoArma[];
  materiais: MaterialForja[];
  receitas: ReceitaArma[];
  categorias: CategoriaMaterial[];
}
