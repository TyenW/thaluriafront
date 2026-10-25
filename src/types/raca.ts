export type GrauRaridadeRaca = 'COMUM' | 'INCOMUM' | 'RARA' | 'ANCESTRAL_MITICA';

export interface RacaResumo {
  id: string;
  nome: string;
  reino: string;
  raridade: GrauRaridadeRaca;
}

export type LinhagemDraconica = 
  | 'FOGO'
  | 'GELO'
  | 'RAIO'
  | 'ACIDO'
  | 'VENTO'
  | 'VENENO'
  | 'LUZ'
  | 'SOMBRA';

export interface OpcaoLinhagemDraconica {
  id: LinhagemDraconica;
  numeroDado: number;
  nome: string;
  elemento: string;
  descricao: string;
  iconeCor: string;
}

export const LINHAGENS_DRACONICAS: OpcaoLinhagemDraconica[] = [
  { id: 'FOGO', numeroDado: 1, nome: 'Dracônico de Fogo', elemento: 'Fogo', descricao: 'Sopro de chamas incandescentes que incinera alvos em cone de 4m', iconeCor: 'text-amber-500' },
  { id: 'GELO', numeroDado: 2, nome: 'Dracônico de Gelo', elemento: 'Gelo', descricao: 'Sopro de geada ártica que congela articulações (-2 Defesa, -50% deslocamento)', iconeCor: 'text-cyan-400' },
  { id: 'RAIO', numeroDado: 3, nome: 'Dracônico de Raio', elemento: 'Raio', descricao: 'Linha de 8m de arco elétrico que descarrega choque e atordoa oponentes', iconeCor: 'text-yellow-400' },
  { id: 'ACIDO', numeroDado: 4, nome: 'Dracônico de Ácido', elemento: 'Ácido', descricao: 'Jato de bílis corrosiva que dissolve armaduras reduzindo a RD do alvo', iconeCor: 'text-lime-400' },
  { id: 'VENTO', numeroDado: 5, nome: 'Dracônico de Vento', elemento: 'Vento', descricao: 'Onda de choque supersônica em cone que empurra alvos e derruba no chão', iconeCor: 'text-teal-300' },
  { id: 'VENENO', numeroDado: 6, nome: 'Dracônico de Veneno', elemento: 'Veneno', descricao: 'Nuvem tóxica asfixiante que drena energia e causa dano contínuo', iconeCor: 'text-emerald-400' },
  { id: 'LUZ', numeroDado: 7, nome: 'Dracônico de Luz', elemento: 'Luz', descricao: 'Clarão radiante que cega temporariamente e purifica corrupção', iconeCor: 'text-amber-200' },
  { id: 'SOMBRA', numeroDado: 8, nome: 'Dracônico de Sombra', elemento: 'Sombra', descricao: 'Feixe de vácuo abissal que rouba vitalidade e corrói a sanidade mental', iconeCor: 'text-purple-400' },
];
