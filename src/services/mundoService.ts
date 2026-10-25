import { requestApi } from './api';
import type { ConteudoVisivelMundo } from '../types/monstro';
import type { SessaoCriacaoAtiva } from '../types/ficha';
import type { PapelUsuario } from '../types/usuario';

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
    acao: 'DICA' | 'REROLL' | 'IMPULSO_DRACONICO' | 'APROVAR',
    dica?: string
  ): Promise<{ status: string; acaoAplicada: string }> {
    return requestApi<{ status: string; acaoAplicada: string }>('/api/mestre/assistir-sessao', {
      method: 'POST',
      body: { usuarioId, acao, dica: dica || '' },
    });
  },

  async avancarDiaMercado(dias = 1): Promise<{ status: string; diaAtual: number }> {
    return requestApi<{ status: string; diaAtual: number }>('/api/mestre/controle-mundo', {
      method: 'POST',
      body: { acao: 'AVANCAR_DIA', dias },
    });
  },

  async revelarMonstro(monstroId: string): Promise<{ status: string }> {
    return requestApi<{ status: string }>('/api/mestre/controle-mundo', {
      method: 'POST',
      body: { acao: 'REVELAR_MONSTRO', monstroId },
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
