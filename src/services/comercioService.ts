import { requestApi } from './api';
import type { CaravanaMapa, DetalheLoja, ResumoComercio } from '../types/comercio';

/** Rotas da aba de Comércio do Mestre. As ações devolvem o detalhe da loja já atualizado. */
export const comercioService = {
  resumo(): Promise<ResumoComercio> {
    return requestApi('/api/mestre/comercio/resumo');
  },

  async caravanas(): Promise<CaravanaMapa[]> {
    const r = await requestApi<{ caravanas: CaravanaMapa[] }>('/api/mestre/comercio/caravanas');
    return r.caravanas ?? [];
  },

  loja(id: number): Promise<DetalheLoja> {
    return requestApi('/api/mestre/comercio/loja', { params: { id } });
  },

  async produzir(dados: { lojaId: number; receitaId: number; lotes: number; insumosPorConta: boolean; imediato: boolean }): Promise<DetalheLoja> {
    const r = await requestApi<{ detalhe: DetalheLoja }>('/api/mestre/comercio/produzir', { method: 'POST', body: dados });
    return r.detalhe;
  },

  /** Cancela uma ordem da oficina: peças prontas viram estoque comum, materiais não usados voltam. */
  async cancelar(lojaId: number, indice: number): Promise<DetalheLoja> {
    const r = await requestApi<{ detalhe: DetalheLoja }>('/api/mestre/comercio/cancelar', { method: 'POST', body: { lojaId, indice } });
    return r.detalhe;
  },

  async vender(dados: {
    lojaId: number;
    itemId: number;
    fichaId: number;
    quantidade: number;
    precoUnitarioLatao: number;
    cobrar: boolean;
  }): Promise<{ totalLatao: number; saldoFichaLatao: number; detalhe: DetalheLoja }> {
    return requestApi('/api/mestre/comercio/vender', { method: 'POST', body: dados });
  },

  async ajustar(
    lojaId: number,
    ajuste:
      | { acao: 'CAIXA'; valorLatao: number }
      | { acao: 'NIVEL'; nivel: number }
      | { acao: 'ESTOQUE'; itemId: number; delta: number }
      | { acao: 'DEMANDA'; itemId: number; demanda: number }
  ): Promise<DetalheLoja> {
    const r = await requestApi<{ detalhe: DetalheLoja }>('/api/mestre/comercio/ajustar', { method: 'POST', body: { lojaId, ...ajuste } });
    return r.detalhe;
  },
};
