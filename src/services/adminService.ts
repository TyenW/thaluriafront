import { requestApi } from './api';

export type TipoCampo = 'TEXTO' | 'TEXTO_LONGO' | 'INTEIRO' | 'REAL' | 'BOOLEANO' | 'ENUM' | 'REFERENCIA' | 'IMAGEM';

export interface CampoEsquema {
  coluna: string;
  rotulo: string;
  tipo: TipoCampo;
  obrigatorio: boolean;
  min: number | null;
  max: number | null;
  opcoes: string[];
  /** Entidade referenciada (campos REFERENCIA). */
  referencia: string | null;
  ajuda: string | null;
  padrao: string | number | boolean | null;
  naLista: boolean;
  /** Seção do formulário (ex.: "Atributos base"); null = sem seção. */
  grupo?: string | null;
}

export interface EntidadeEsquema {
  id: string;
  rotulo: string;
  descricao: string | null;
  chaveTexto: boolean;
  colunaTitulo: string | null;
  /** Entidade-mãe (registros filhos, ex.: golpes de um monstro). */
  pai: string | null;
  colunaPai: string | null;
  afetaMundo: boolean;
  campos: CampoEsquema[];
}

export type ValorRegistro = string | number | boolean | null;
export type Registro = { id: string | number } & Record<string, ValorRegistro>;

export const adminService = {
  async esquema(): Promise<EntidadeEsquema[]> {
    const r = await requestApi<EntidadeEsquema[]>('/api/admin/esquema');
    return Array.isArray(r) ? r : [];
  },

  async listar(entidade: string, pai?: string | number): Promise<Registro[]> {
    const r = await requestApi<Registro[]>('/api/admin/listar', { params: { entidade, pai } });
    return Array.isArray(r) ? r : [];
  },

  /** Insere (sem id) ou atualiza (com id). Devolve a chave gravada. */
  async salvar(entidade: string, dados: Record<string, ValorRegistro | undefined>): Promise<string> {
    const body: Record<string, string> = { entidade };
    for (const [k, v] of Object.entries(dados)) {
      if (v === undefined) continue;
      body[k] = v === null ? '' : String(v);
    }
    const r = await requestApi<{ id: string | number }>('/api/admin/salvar', { method: 'POST', body });
    return String(r.id);
  },

  async excluir(entidade: string, id: string | number): Promise<void> {
    await requestApi('/api/admin/excluir', { method: 'POST', body: { entidade, id: String(id) } });
  },
};
