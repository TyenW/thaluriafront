import { requestApi } from './api';
import type { CaravanaMapa, DetalheLoja, ResumoComercio } from '../types/comercio';
import type { EntregaEncomenda } from '../types/mesa';

/**
 * Rotas da aba de Comércio do Mestre. As ações devolvem o detalhe da loja já atualizado.
 * Toda chamada leva a mesa escolhida: mesa atrasada lê preço e estoque do dia dela e age no presente.
 */
export const comercioService = {
  resumo(mesaId: number | null): Promise<ResumoComercio> {
    return requestApi('/api/mestre/comercio/resumo', { params: { mesaId } });
  },

  async caravanas(mesaId?: number | null): Promise<CaravanaMapa[]> {
    // Pelo túnel a resposta pode demorar mais que o prazo padrão de 12 s
    const r = await requestApi<{ caravanas: CaravanaMapa[] }>('/api/mestre/comercio/caravanas', { params: { mesaId }, timeoutMs: 30000 });
    return r.caravanas ?? [];
  },

  loja(id: number, mesaId: number | null): Promise<DetalheLoja> {
    return requestApi('/api/mestre/comercio/loja', { params: { id, mesaId } });
  },

  /** Com fichaId, vira encomenda do personagem: o prazo conta no relógio da mesa e a peça vai para a ficha. */
  async produzir(dados: {
    lojaId: number;
    receitaId: number;
    lotes: number;
    insumosPorConta: boolean;
    imediato: boolean;
    mesaId: number | null;
    fichaId?: number | null;
  }): Promise<{ detalhe: DetalheLoja; entregas: EntregaEncomenda[] }> {
    const r = await requestApi<{ detalhe: DetalheLoja; entregas?: EntregaEncomenda[] }>('/api/mestre/comercio/produzir', { method: 'POST', body: dados });
    return { detalhe: r.detalhe, entregas: r.entregas ?? [] };
  },

  /** Cancela uma ordem da oficina: peças prontas viram estoque comum, materiais não usados voltam. */
  async cancelar(lojaId: number, indice: number, mesaId: number | null): Promise<DetalheLoja> {
    const r = await requestApi<{ detalhe: DetalheLoja }>('/api/mestre/comercio/cancelar', { method: 'POST', body: { lojaId, indice, mesaId } });
    return r.detalhe;
  },

  async vender(dados: {
    lojaId: number;
    itemId: number;
    fichaId: number;
    quantidade: number;
    precoUnitarioLatao: number;
    cobrar: boolean;
    mesaId: number | null;
  }): Promise<{ totalLatao: number; saldoFichaLatao: number; detalhe: DetalheLoja }> {
    return requestApi('/api/mestre/comercio/vender', { method: 'POST', body: dados });
  },

  /** O personagem vende um item à loja; sem preço, vale o que a loja paga a fornecedores no dia da mesa. */
  async comprar(dados: {
    lojaId: number;
    itemId: number;
    fichaId: number;
    quantidade: number;
    precoUnitarioLatao?: number;
    pagar: boolean;
    mesaId: number | null;
  }): Promise<{ totalLatao: number; saldoFichaLatao: number; detalhe: DetalheLoja }> {
    return requestApi('/api/mestre/comercio/comprar', { method: 'POST', body: dados });
  },

  async ajustar(
    lojaId: number,
    ajuste:
      | { acao: 'CAIXA'; valorLatao: number }
      | { acao: 'NIVEL'; nivel: number }
      | { acao: 'ESTOQUE'; itemId: number; delta: number }
      | { acao: 'DEMANDA'; itemId: number; demanda: number },
    mesaId: number | null
  ): Promise<DetalheLoja> {
    const r = await requestApi<{ detalhe: DetalheLoja }>('/api/mestre/comercio/ajustar', { method: 'POST', body: { lojaId, mesaId, ...ajuste } });
    return r.detalhe;
  },
};
