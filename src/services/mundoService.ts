import { requestApi } from './api';
import type { ConteudoVisivelMundo } from '../types/monstro';
import type { SessaoCriacaoAtiva } from '../types/ficha';
import type { PapelUsuario } from '../types/usuario';

export type ModoTempo = 'AVANCAR_DIA' | 'SIMULAR_MERCADO';

/** diaAtual = dia da campanha; diaMercado = relógio do mercado (pode estar à frente). */
export interface RelogioMundo {
  status: string;
  diaAtual: number;
  diaMercado: number;
}

export const mundoService = {
  async obterConteudoVisivel(papel: PapelUsuario): Promise<ConteudoVisivelMundo> {
    return requestApi<ConteudoVisivelMundo>('/api/conteudo/visivel', {
      method: 'GET',
      params: { papel },
    });
  },

  async listarSessoesMestre(): Promise<SessaoCriacaoAtiva[]> {
    const res = await requestApi<SessaoCriacaoAtiva[]>('/api/mestre/sessoes-ao-vivo', {
      method: 'GET',
    });
    return Array.isArray(res) ? res : [];
  },

  async intervirSessao(
    usuarioId: number,
    acao: 'DICA' | 'REROLL' | 'REROLL_RACA' | 'IMPULSO_DRACONICO' | 'APROVAR' | 'REINICIAR',
    dica?: string
  ): Promise<{ status: string; acaoAplicada: string }> {
    return requestApi<{ status: string; acaoAplicada: string }>('/api/mestre/assistir-sessao', {
      method: 'POST',
      body: { usuarioId, acao, dica: dica || '' },
    });
  },

  /**
   * Passa o tempo do mundo. AVANCAR_DIA anda a campanha e o mercado; SIMULAR_MERCADO só o mercado
   * (lojas, produção, encomendas, caravanas), sem passar o dia nem espalhar conhecimento.
   */
  async passarTempo(modo: ModoTempo, dias = 1): Promise<RelogioMundo> {
    return requestApi<RelogioMundo>('/api/mestre/controle-mundo', {
      method: 'POST',
      body: { acao: modo, dias },
      // Um ano de mercado leva alguns segundos no servidor
      timeoutMs: 15000 + dias * 150,
    });
  },

  async revelarMonstro(monstroId: string): Promise<{ status: string }> {
    return requestApi<{ status: string }>('/api/mestre/controle-mundo', {
      method: 'POST',
      body: { acao: 'REVELAR_MONSTRO', monstroId },
    });
  },

  async ocultarMonstro(monstroId: string): Promise<{ status: string }> {
    return requestApi<{ status: string }>('/api/mestre/controle-mundo', {
      method: 'POST',
      body: { acao: 'OCULTAR_MONSTRO', monstroId },
    });
  },

  async liberarCapituloWiki(capitulo: string): Promise<{ status: string }> {
    return requestApi<{ status: string }>('/api/mestre/controle-mundo', {
      method: 'POST',
      body: { acao: 'LIBERAR_WIKI', capitulo },
    });
  },

  async definirVisibilidadeCidade(cidade: string, nivel: 'OCULTO' | 'ROTA_E_NOME_APENAS' | 'INFORMACOES_COMPLETAS'): Promise<{ status: string }> {
    return requestApi<{ status: string }>('/api/mestre/controle-mundo', {
      method: 'POST',
      body: { acao: 'VISIBILIDADE_CIDADE', cidade, nivel },
    });
  },

  async cadastrarOuAlterarUsuario(username: string, senha?: string, papel: PapelUsuario = 'JOGADOR', limiteFichas = 2): Promise<{ id: number; username: string; limiteFichas: number }> {
    return requestApi<{ id: number; username: string; limiteFichas: number }>('/api/mestre/usuarios', {
      method: 'POST',
      // senha vazia/ausente: o servidor mantém a senha atual da conta
      body: { username, senha: senha?.trim() || undefined, papel, limiteFichas },
    });
  },

  async listarUsuarios(): Promise<{ id: number; username: string; papel: PapelUsuario; limiteFichas: number; pity: number; totalFichas: number }[]> {
    const res = await requestApi<any[]>('/api/mestre/usuarios', {
      method: 'GET',
    });
    return Array.isArray(res) ? res : [];
  },

  async excluirUsuario(id: number): Promise<{ status: string; sucesso: boolean; id: number }> {
    return requestApi<{ status: string; sucesso: boolean; id: number }>('/api/mestre/usuarios/excluir', {
      method: 'POST',
      body: { id },
    });
  },
};
