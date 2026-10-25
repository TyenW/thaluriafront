import { requestApi } from './api';
import type { RacaResumo } from '../types/raca';

/** Estado da criação em andamento, devolvido ao iniciar, retomar e rolar atributos. */
export interface SessaoCriacao {
  ativa: boolean;
  /** true quando o servidor devolveu uma criação já existente em vez de sortear de novo. */
  retomada?: boolean;
  usuarioId: number;
  etapa: string;
  nomePersonagem: string;
  opcoesRacas: RacaResumo[];
  racaEscolhida: string | null;
  racaEscolhidaNome: string | null;
  indiceRacaEscolhida: number;
  atributosRolados: Record<string, number>;
  rerolagensPermitidas: number;
  rerolagensRestantes: number;
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
  /** Criação em andamento do usuário, ou null se não houver. */
  async obterSessao(usuarioId: number): Promise<SessaoCriacao | null> {
    const r = await requestApi<SessaoCriacao | { ativa: false }>('/api/criacao/sessao', { params: { usuarioId } });
    return r && r.ativa ? (r as SessaoCriacao) : null;
  },

  async iniciar(usuarioId: number, username: string, nomePersonagem: string): Promise<SessaoCriacao> {
    return requestApi<SessaoCriacao>('/api/criacao/iniciar', {
      method: 'POST',
      body: { usuarioId, username, nomePersonagem },
    });
  },

  /** Escolhe a raça e rola os atributos. A partir da 2ª rolagem consome uma rerolagem. */
  async escolherRaca(usuarioId: number, indiceOpcao: number, linhagemDraconica?: string): Promise<SessaoCriacao> {
    const body: Record<string, any> = { usuarioId, indiceOpcao };
    if (linhagemDraconica) {
      body.linhagemDraconica = linhagemDraconica;
    }
    return requestApi<SessaoCriacao>('/api/criacao/escolher-raca', {
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
