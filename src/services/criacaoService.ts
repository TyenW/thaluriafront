import { requestApi } from './api';
import type { RacaResumo } from '../types/raca';

export interface RespostaIniciarCriacao {
  usuarioId: number;
  etapa: string;
  opcoesRacas: RacaResumo[];
}

export interface RespostaEscolherRaca {
  racaEscolhida: string;
  etapa: string;
  atributosRolados: Record<string, number>;
}

export interface RespostaFinalizarCriacao {
  status: string;
  id: number;
  nome: string;
  raca: string;
  hpMax: number;
  manaMax: number;
  energiaMax: number;
  sanMax: number;
}

export const criacaoService = {
  async iniciar(usuarioId: number, username: string, nomePersonagem: string): Promise<RespostaIniciarCriacao> {
    return requestApi<RespostaIniciarCriacao>('/api/criacao/iniciar', {
      method: 'POST',
      body: { usuarioId, username, nomePersonagem },
    });
  },

  async escolherRaca(usuarioId: number, indiceOpcao: number, linhagemDraconica?: string): Promise<RespostaEscolherRaca> {
    const body: Record<string, any> = { usuarioId, indiceOpcao };
    if (linhagemDraconica) {
      body.linhagemDraconica = linhagemDraconica;
    }
    return requestApi<RespostaEscolherRaca>('/api/criacao/escolher-raca', {
      method: 'POST',
      body,
    });
  },

  async finalizar(usuarioId: number): Promise<RespostaFinalizarCriacao> {
    return requestApi<RespostaFinalizarCriacao>('/api/criacao/finalizar', {
      method: 'POST',
      body: { usuarioId },
    });
  },
};
