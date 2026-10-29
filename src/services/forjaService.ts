import { requestApi } from './api';
import type { EntregaEncomenda } from '../types/mesa';
import type { DetalheLoja } from '../types/comercio';
import type { ArmaCalculada, EscolhaMaterial, MoldeArma, PainelForja, TipoArma } from '../types/forja';

/** "parteId:itemId:qtd,..." — formato que o servidor lê. */
export const serializarMateriais = (m: EscolhaMaterial[]) =>
  m.filter((e) => e.quantidade > 0).map((e) => `${e.parteId}:${e.itemId}:${e.quantidade}`).join(',');

/** Uma linha por parte: id, nome, qtd, horas e opções (id,categoria,itemId,dano,durabilidade,alcance separadas por |). */
const serializarPartes = (molde: MoldeArma) =>
  molde.partes
    .map((p) =>
      [
        p.id || '',
        p.nome.replace(/[\t\n]/g, ' '),
        p.qtdMateriais,
        p.tempoHoras,
        p.opcoes.map((o) => [o.id ?? '', o.categoria ?? '', o.itemId ?? '', o.bonusDano, o.bonusDurabilidade, o.bonusAlcanceM].join(',')).join('|'),
      ].join('\t')
    )
    .join('\n');

/** Tela da Forja do Mestre e encomendas de arma nas lojas. */
export const forjaService = {
  painel(): Promise<PainelForja> {
    return requestApi('/api/mestre/forja');
  },

  previa(tipoArmaId: number, materiais: EscolhaMaterial[], nome?: string): Promise<ArmaCalculada> {
    return requestApi('/api/mestre/forja/previa', { method: 'POST', body: { tipoArmaId, materiais: serializarMateriais(materiais), nome } });
  },

  salvarMolde(molde: MoldeArma, descricao?: string): Promise<{ id: number }> {
    return requestApi('/api/mestre/forja/molde', {
      method: 'POST',
      body: {
        id: molde.id || undefined,
        nome: molde.nome,
        tipoLoja: molde.tipoLoja,
        slotsEfeito: molde.slotsEfeito,
        tempoMontagemHoras: molde.tempoMontagemHoras,
        descricao,
        partes: serializarPartes(molde),
      },
    });
  },

  excluirMolde(id: number): Promise<void> {
    return requestApi('/api/mestre/forja/molde/excluir', { method: 'POST', body: { id } });
  },

  salvarTipo(t: TipoArma): Promise<{ id: number }> {
    return requestApi('/api/mestre/forja/tipo', { method: 'POST', body: { ...t, id: t.id || undefined } });
  },

  excluirTipo(id: number): Promise<void> {
    return requestApi('/api/mestre/forja/tipo/excluir', { method: 'POST', body: { id } });
  },

  salvarReceita(r: { id?: number; nome: string; tipoArmaId: number; materiais: EscolhaMaterial[]; somenteEncomenda: boolean; descricao?: string | null }): Promise<{ id: number }> {
    return requestApi('/api/mestre/forja/receita', {
      method: 'POST',
      body: { ...r, id: r.id || undefined, materiais: serializarMateriais(r.materiais), descricao: r.descricao ?? undefined },
    });
  },

  excluirReceita(id: number): Promise<void> {
    return requestApi('/api/mestre/forja/receita/excluir', { method: 'POST', body: { id } });
  },

  /** Encomenda sob medida numa loja: o Mestre escolhe o material de cada parte. */
  async encomendar(dados: {
    lojaId: number;
    tipoArmaId: number;
    materiais: EscolhaMaterial[];
    insumosPorConta: boolean;
    imediato: boolean;
    /** Mesa escolhida; com fichaId, a arma é encomenda do personagem (prazo no relógio da mesa). */
    mesaId: number | null;
    fichaId?: number | null;
  }): Promise<{ detalhe: DetalheLoja; entregas: EntregaEncomenda[] }> {
    const r = await requestApi<{ detalhe: DetalheLoja; entregas?: EntregaEncomenda[] }>('/api/mestre/comercio/encomendar-arma', {
      method: 'POST',
      body: { ...dados, materiais: serializarMateriais(dados.materiais) },
    });
    return { detalhe: r.detalhe, entregas: r.entregas ?? [] };
  },
};
