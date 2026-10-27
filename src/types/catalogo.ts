export type OrigemItem = 'COLETADO' | 'DROPADO' | 'CRAFTADO';

/** Como um item do catálogo chega ao mundo (coletado, dropado ou craftado — pode ser mais de um). */
export interface OrigemDeItem {
  id: number;
  nome: string;
  tipo: string;
  raridade: string;
  imagemUrl: string | null;
  coletavel: boolean;
  locaisColeta: number;
  /** Nomes das receitas que produzem o item. */
  receitas: string[];
  /** Nomes dos monstros que dropam o item. */
  monstros: string[];
  origens: OrigemItem[];
  avisos: string[];
}

/** Drop cadastrado só pelo nome, sem item correspondente no catálogo. */
export interface DropOrfao {
  dropId: number;
  itemNome: string;
  monstroId: string;
  monstro: string;
}

export interface AuditoriaOrigens {
  totalItens: number;
  semOrigem: number;
  itens: OrigemDeItem[];
  dropsOrfaos: DropOrfao[];
}
