import { requestApi } from './api';
import type { FichaPersonagem, MoedasFicha, PericiaFicha } from '../types/ficha';

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
  /** Quantidade física final de cada moeda alterada (sem conversão). */
  moedas?: Partial<MoedasFicha>;
}

/** Resposta de /api/fichas/atualizar: valores já recalculados e limitados pelo servidor. */
export type FichaAtualizada = Pick<
  FichaPersonagem,
  | 'id' | 'nome' | 'imagemUrl' | 'hpAtual' | 'hpMax' | 'sanAtual' | 'sanMax' | 'energiaAtual' | 'energiaMax'
  | 'manaAtual' | 'manaMax' | 'vig' | 'forca' | 'des' | 'men' | 'esp' | 'von' | 'defFisica' | 'defOculta'
  | 'carteiraLatao' | 'moedas' | 'pontosEssencia'
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
    const body: Record<string, string | number | undefined> = { ...resto };
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

  async excluirFicha(id: number | string): Promise<{ status: string; sucesso: boolean; id: number }> {
    return await requestApi('/api/fichas/excluir', {
      method: 'POST',
      body: { id: Number(id) },
    });
  },
};
