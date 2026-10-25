export type PapelUsuario = 'JOGADOR' | 'MESTRE';

export interface ContaUsuario {
  id: number;
  username: string;
  papel: PapelUsuario;
  limiteFichas: number;
  pity: number;
}

export interface RespostaLogin {
  id: number;
  username: string;
  papel: PapelUsuario;
  limiteFichas: number;
  pity: number;
  erro?: string;
}
