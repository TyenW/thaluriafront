import { requestApi } from './api';
import type { PainelDisseminacao, ParametrosEspalhamento } from '../types/conhecimento';

export type AcaoCidade = 'RUMOR' | 'COMERCIO' | 'PRODUCAO' | 'REVOGAR' | 'LIMPAR';

/** Tela de Disseminação do Mestre (só o Mestre vê). */
export const conhecimentoService = {
  painel(): Promise<PainelDisseminacao> {
    return requestApi('/api/mestre/conhecimentos');
  },

  conceder(dados: { tipo: 'TIPO_ARMA' | 'RECEITA'; tipoArmaId?: number; receitaId?: number; cidadeOrigemId: number } & ParametrosEspalhamento): Promise<{ id: number }> {
    return requestApi('/api/mestre/conhecimentos/conceder', { method: 'POST', body: { ...dados } });
  },

  parametros(id: number, p: ParametrosEspalhamento): Promise<void> {
    return requestApi('/api/mestre/conhecimentos/parametros', { method: 'POST', body: { id, ...p } });
  },

  pausar(id: number, pausar: boolean): Promise<void> {
    return requestApi('/api/mestre/conhecimentos/pausar', { method: 'POST', body: { id, pausar } });
  },

  segredo(id: number, segredo: boolean): Promise<void> {
    return requestApi('/api/mestre/conhecimentos/segredo', { method: 'POST', body: { id, segredo } });
  },

  cidade(id: number, cidadeId: number, acao: AcaoCidade): Promise<void> {
    return requestApi('/api/mestre/conhecimentos/cidade', { method: 'POST', body: { id, cidadeId, acao } });
  },

  excluir(id: number): Promise<void> {
    return requestApi('/api/mestre/conhecimentos/excluir', { method: 'POST', body: { id } });
  },
};
