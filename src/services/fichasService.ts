import { requestApi } from './api';
import type { CondicaoFicha, FichaPersonagem, HistoriaFicha, ItemInventarioFicha, MagiaFicha, MoedasFicha, PericiaFicha } from '../types/ficha';

/** Campos aceitos por /api/fichas/atualizar. Envie apenas o que mudou. */
export interface AtualizacaoFicha {
  id: number;
  nome?: string;
  imagemUrl?: string;
  vig?: number;
  forca?: number;
  des?: number;
  men?: number;
  esp?: number;
  von?: number;
  hpAtual?: number;
  sanAtual?: number;
  energiaAtual?: number;
  manaAtual?: number;
  pontosEssencia?: number;
  /** Cidade atual (id); null remove a cidade. */
  cidadeId?: number | null;
  /** Quantidade física final de cada moeda alterada (sem conversão). */
  moedas?: Partial<MoedasFicha>;
}

/** Resposta de /api/fichas/atualizar: valores já recalculados e limitados pelo servidor. */
export type FichaAtualizada = Pick<
  FichaPersonagem,
  | 'id' | 'nome' | 'imagemUrl' | 'hpAtual' | 'hpMax' | 'sanAtual' | 'sanMax' | 'energiaAtual' | 'energiaMax'
  | 'manaAtual' | 'manaMax' | 'vig' | 'forca' | 'des' | 'men' | 'esp' | 'von' | 'defFisica' | 'defOculta'
  | 'carteiraLatao' | 'moedas' | 'pontosEssencia' | 'cidadeAtual' | 'cidadeAtualId'
> & { status: string };

export const fichasService = {
  async listarTodas(usuarioId?: number, papel?: string): Promise<FichaPersonagem[]> {
    const params: Record<string, any> = {};
    if (usuarioId) params.usuarioId = usuarioId;
    if (papel) params.papel = papel;
    const fichas = await requestApi<FichaPersonagem[]>('/api/fichas', {
      method: 'GET',
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return Array.isArray(fichas) ? fichas : [];
  },

  async obterPorId(id: number | string): Promise<FichaPersonagem | null> {
    const resposta = await requestApi<FichaPersonagem[] | FichaPersonagem>('/api/fichas', {
      method: 'GET',
      params: { id },
    });
    const lista = Array.isArray(resposta) ? resposta : resposta ? [resposta] : [];
    return lista.find((f) => String(f.id) === String(id)) ?? null;
  },

  async atualizarFicha(dados: AtualizacaoFicha): Promise<FichaAtualizada> {
    const { moedas, ...resto } = dados;
    const { cidadeId, ...demais } = resto;
    const body: Record<string, string | number | undefined> = { ...demais };
    // requestApi descarta null; '' instrui o servidor a remover a cidade atual.
    if (cidadeId !== undefined) body.cidadeId = cidadeId === null ? '' : cidadeId;
    if (moedas) {
      for (const [tipo, qtd] of Object.entries(moedas)) {
        if (qtd !== undefined) body[`moeda_${tipo}`] = qtd;
      }
    }
    return await requestApi<FichaAtualizada>('/api/fichas/atualizar', {
      method: 'POST',
      body,
    });
  },

  async salvarPericia(dados: {
    fichaId: number;
    pericia?: string;
    nome: string;
    atributoBase: string;
    grau: number;
    maestria: number;
    descricao?: string;
  }): Promise<{ status: string; pericia: string; pericias?: PericiaFicha[] }> {
    return await requestApi('/api/fichas/pericias/salvar', {
      method: 'POST',
      body: dados,
    });
  },

  async removerPericia(fichaId: number, pericia: string): Promise<{ status: string; sucesso: boolean; pericias?: PericiaFicha[] }> {
    return await requestApi('/api/fichas/pericias/remover', {
      method: 'POST',
      body: { fichaId, pericia },
    });
  },

  async salvarHistoria(fichaId: number, campos: Partial<HistoriaFicha>): Promise<HistoriaFicha> {
    const r = await requestApi<{ historia: HistoriaFicha }>('/api/fichas/historia/salvar', {
      method: 'POST',
      body: { fichaId, ...campos },
    });
    return r.historia;
  },

  async salvarCondicao(fichaId: number, c: Omit<CondicaoFicha, 'id'> & { id?: number }): Promise<CondicaoFicha[]> {
    const r = await requestApi<{ condicoes: CondicaoFicha[] }>('/api/fichas/condicoes/salvar', {
      method: 'POST',
      body: {
        fichaId,
        id: c.id,
        nome: c.nome,
        tipo: c.tipo,
        intensidade: c.intensidade,
        // vazio = condição sem duração definida
        duracaoTurnos: c.duracaoTurnos ?? '',
        descricao: c.descricao ?? '',
      },
    });
    return r.condicoes;
  },

  async removerCondicao(fichaId: number, id: number): Promise<CondicaoFicha[]> {
    const r = await requestApi<{ condicoes: CondicaoFicha[] }>('/api/fichas/condicoes/remover', { method: 'POST', body: { fichaId, id } });
    return r.condicoes;
  },

  async avancarTurnoCondicoes(fichaId: number): Promise<{ encerradas: number; condicoes: CondicaoFicha[] }> {
    return requestApi('/api/fichas/condicoes/avancar-turno', { method: 'POST', body: { fichaId } });
  },

  async salvarMagia(fichaId: number, m: Omit<MagiaFicha, 'id'> & { id?: number }): Promise<MagiaFicha[]> {
    const r = await requestApi<{ magias: MagiaFicha[] }>('/api/fichas/magias/salvar', {
      method: 'POST',
      body: {
        fichaId,
        id: m.id,
        nome: m.nome,
        escola: m.escola ?? '',
        elemento: m.elemento ?? '',
        circulo: m.circulo,
        custoMana: m.custoMana,
        custoEnergia: m.custoEnergia,
        alcanceM: m.alcanceM,
        dado: m.dado ?? '',
        tempoConjuracao: m.tempoConjuracao ?? '',
        duracao: m.duracao ?? '',
        descricao: m.descricao ?? '',
        preparada: m.preparada,
      },
    });
    return r.magias;
  },

  async removerMagia(fichaId: number, id: number): Promise<MagiaFicha[]> {
    const r = await requestApi<{ magias: MagiaFicha[] }>('/api/fichas/magias/remover', { method: 'POST', body: { fichaId, id } });
    return r.magias;
  },

  /** Mestre: soma unidades de um item do catálogo ao inventário. Devolve o inventário atualizado. */
  async concederItem(fichaId: number, itemId: number | string, quantidade: number): Promise<ItemInventarioFicha[]> {
    const r = await requestApi<{ inventario: ItemInventarioFicha[] }>('/api/fichas/inventario/conceder', {
      method: 'POST',
      body: { fichaId, itemId: String(itemId), quantidade },
    });
    return r.inventario;
  },

  /** Retira unidades de um item; sem quantidade, remove a pilha inteira. */
  async retirarItem(fichaId: number, itemId: number, quantidade?: number): Promise<ItemInventarioFicha[]> {
    const r = await requestApi<{ inventario: ItemInventarioFicha[] }>('/api/fichas/inventario/retirar', {
      method: 'POST',
      body: { fichaId, itemId, quantidade },
    });
    return r.inventario;
  },

  async excluirFicha(id: number | string): Promise<{ status: string; sucesso: boolean; id: number }> {
    return await requestApi('/api/fichas/excluir', {
      method: 'POST',
      body: { id: Number(id) },
    });
  },
};
