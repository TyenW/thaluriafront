/** Mesa de jogo com relógio próprio (docs/Sistema de Economia/05 no back-end). */
export interface Mesa {
  id: number;
  nome: string;
  dia: number;
  hora: number;
  status: 'ATIVA' | 'ARQUIVADA';
  /** Dia anterior ao do mundo: lê o snapshot do dia dela e não mexe em caravanas. */
  noPassado: boolean;
  diasAtras: number;
  personagens?: number;
  /** Há foto do mercado do dia da mesa (sem ela, a mesa atrasada lê o presente). */
  temSnapshot?: boolean;
}

/** Personagem visto pelo controle de mesas: em que mesa está e até quando já viveu. */
export interface FichaNaMesa {
  id: number;
  nome: string;
  raca: string;
  usuarioId: number;
  mesaId: number | null;
  dia: number | null;
  hora: number | null;
}

export interface TrocaDeMesa {
  id: number;
  fichaId: number;
  fichaNome: string | null;
  mesaOrigemId: number | null;
  mesaDestinoId: number | null;
  forcada: boolean;
  diaPersonagem: number | null;
  horaPersonagem: number | null;
  diaMesa: number | null;
  horaMesa: number | null;
  registradoEm: string;
}

export interface PainelMesas {
  mundoDia: number;
  mundoHora: number;
  /** Dia da mesa ativa mais à frente (guia a disseminação). */
  diaCampanha: number;
  snapshotsDe: number | null;
  snapshotsAte: number | null;
  mesas: Mesa[];
  fichas: FichaNaMesa[];
  trocas: TrocaDeMesa[];
}

/** De onde a mesa lê preço e estoque. */
export type FonteMercado = 'AO_VIVO' | 'SNAPSHOT' | 'PRESENTE_SEM_SNAPSHOT';

/** Os dois relógios que as rotas de comércio e conhecimento devolvem. */
export interface RelogioMesa {
  mundoDia: number;
  mundoHora: number;
  diaCampanha: number;
  mesa: Mesa | null;
  noPassado: boolean;
  fonte: FonteMercado;
}

/** Encomenda de mesa que chegou ao prazo e foi entregue. */
export interface EntregaEncomenda {
  mesa: string;
  loja: string;
  item: string;
  quantidade: number;
  /** Nome do personagem ou "balcão de <loja>". */
  destino: string;
}

export interface ResultadoTempo {
  mundoDia: number;
  mundoHora: number;
  mundoAndouHoras: number;
  entregas: EntregaEncomenda[];
  mesa?: Mesa;
  aviso?: string;
  painel: PainelMesas;
}
