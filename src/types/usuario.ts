export type PapelUsuario = 'JOGADOR' | 'MESTRE';

export interface ContaUsuario {
  id: number;
  username: string;
  papel: PapelUsuario;
  limiteFichas: number;
  pity: number;
  /** Token da sessão, enviado em cada pedido (Authorization: Bearer). */
  token: string;
}

export interface RespostaLogin {
  id: number;
  username: string;
  papel: PapelUsuario;
  limiteFichas: number;
  pity: number;
  token: string;
  erro?: string;
}
