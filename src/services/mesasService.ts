import { requestApi } from './api';
import type { EntregaEncomenda, PainelMesas, ResultadoTempo } from '../types/mesa';

/** Mesas e linhas do tempo do Mestre (rotas /api/mestre/mesas). */
export const mesasService = {
  painel(): Promise<PainelMesas> {
    return requestApi('/api/mestre/mesas');
  },

  /** Mesa nova começa no presente do mundo, a não ser que se informe outro dia. */
  criar(nome: string, dia?: number, hora?: number): Promise<{ id: number; aviso?: string; painel: PainelMesas }> {
    return requestApi('/api/mestre/mesas/criar', { method: 'POST', body: { nome, dia, hora } });
  },

  async renomear(id: number, nome: string): Promise<PainelMesas> {
    return requestApi('/api/mestre/mesas/editar', { method: 'POST', body: { id, nome } });
  },

  definirStatus(id: number, status: 'ATIVA' | 'ARQUIVADA'): Promise<{ aviso?: string; painel: PainelMesas } & Partial<ResultadoTempo>> {
    return requestApi('/api/mestre/mesas/status', { method: 'POST', body: { id, status } });
  },

  /** Anda a mesa (e os personagens dela); se ela passar o mundo, o mercado simula a diferença. */
  avancar(id: number, horas: number): Promise<ResultadoTempo> {
    return requestApi('/api/mestre/mesas/avancar', { method: 'POST', body: { id, horas }, timeoutMs: 120000 });
  },

  /** Aquecer o mercado: só o mundo anda, nenhuma mesa muda de dia. */
  simular(dias: number): Promise<ResultadoTempo> {
    return requestApi('/api/mestre/mesas/simular', { method: 'POST', body: { dias }, timeoutMs: 120000 });
  },

  /** mesaId nulo tira o personagem de jogo. Para uma mesa atrasada é preciso forçar. */
  trocar(fichaId: number, mesaId: number | null, forcar = false): Promise<{ forcada?: boolean; entregas?: EntregaEncomenda[]; painel: PainelMesas }> {
    return requestApi('/api/mestre/mesas/trocar', { method: 'POST', body: { fichaId, mesaId: mesaId ?? '', forcar } });
  },
};

/** "1× Espada (Forja do Brom) → Aria; ..." para o aviso de encomendas entregues. */
export const descreverEntregas = (entregas: EntregaEncomenda[] | undefined) =>
  (entregas ?? []).map((e) => `${e.quantidade}× ${e.item} (${e.loja}) → ${e.destino}`).join('; ');

/** "dia 8, 15h" */
export const formatarMomento = (dia: number | null | undefined, hora: number | null | undefined) =>
  dia == null ? '—' : `dia ${dia}, ${String(hora ?? 0).padStart(2, '0')}h`;
