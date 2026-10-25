import type { EntidadeEsquema, Registro, ValorRegistro } from '../../services/adminService';
import type { MonstroBestiario } from '../../types/monstro';
import { rotuloEnum } from '../../utils/formatadores';
import type { CidadeNoEditor } from './MapaEditor';
import type { OpcaoReferencia } from './FormularioRegistro';

export type Avisar = (tipo: 'sucesso' | 'erro', texto: string) => void;
/** Registros de cada entidade referenciada (ex.: cidades, itens), por id da entidade. */
export type Referencias = Record<string, Registro[]>;

export const numeroOuNulo = (v: ValorRegistro) => (v === null || v === undefined || String(v).trim() === '' ? null : Number(v));

/** Título legível de um registro (nome, ou "Origem → Destino" para rotas). */
export function tituloDe(entidade: EntidadeEsquema | undefined, r: Registro, refs: Referencias): string {
  if (!entidade) return `#${r.id}`;
  if (entidade.id === 'rotas') {
    const nome = (id: ValorRegistro) => refs.cidades?.find((c) => String(c.id) === String(id))?.nome ?? `#${id}`;
    return `${nome(r.origem_id)} → ${nome(r.destino_id)}`;
  }
  const t = entidade.colunaTitulo ? r[entidade.colunaTitulo] : null;
  return t ? String(t) : `#${r.id}`;
}

export function opcoesDe(esquema: EntidadeEsquema[], refs: Referencias): Record<string, OpcaoReferencia[]> {
  const saida: Record<string, OpcaoReferencia[]> = {};
  for (const [id, lista] of Object.entries(refs)) {
    const ent = esquema.find((e) => e.id === id);
    saida[id] = lista.map((r) => ({ id: String(r.id), titulo: tituloDe(ent, r, refs) }));
  }
  return saida;
}

export function formatarCelula(entidade: EntidadeEsquema, coluna: string, v: ValorRegistro, esquema: EntidadeEsquema[], refs: Referencias): string {
  const c = entidade.campos.find((x) => x.coluna === coluna);
  if (v === null || v === undefined || v === '') return '—';
  if (!c) return String(v);
  if (c.tipo === 'BOOLEANO') return v ? 'Sim' : 'Não';
  if (c.tipo === 'ENUM') return rotuloEnum(String(v));
  if (c.tipo === 'IMAGEM') return 'Imagem';
  if (c.tipo === 'REFERENCIA') {
    const ent = esquema.find((e) => e.id === c.referencia);
    const r = refs[c.referencia ?? '']?.find((x) => String(x.id) === String(v));
    return r ? tituloDe(ent, r, refs) : `#${v}`;
  }
  if (typeof v === 'number') return v.toLocaleString('pt-BR');
  return String(v);
}

/** Coluna de imagem da entidade, se houver (usada como miniatura nas listas). */
export const colunaImagem = (entidade: EntidadeEsquema) => entidade.campos.find((c) => c.tipo === 'IMAGEM')?.coluna ?? null;

export const cidadesDoEditor = (refs: Referencias): CidadeNoEditor[] =>
  (refs.cidades ?? []).map((c) => ({
    id: c.id,
    nome: String(c.nome),
    x: numeroOuNulo(c.mapa_x),
    y: numeroOuNulo(c.mapa_y),
    temPorto: c.tem_porto === true,
  }));

/** Converte os valores do formulário de monstro no formato exibido no bestiário. */
export function monstroDoFormulario(valores: Record<string, ValorRegistro>, id: string | null): MonstroBestiario {
  const texto = (v: ValorRegistro) => (v === null || v === undefined || v === '' ? null : String(v));
  return {
    id: id ?? 'novo',
    revelado: true,
    nome: texto(valores.nome) ?? 'Criatura sem nome',
    regiao: texto(valores.regiao_nativa) ?? undefined,
    elemento: texto(valores.elemento_primario) ?? undefined,
    elementoSecundario: texto(valores.elemento_secundario),
    porte: texto(valores.porte) ?? undefined,
    chefe: valores.chefe_solo === true,
    domesticavel: valores.domesticavel === true,
    imagemUrl: texto(valores.imagem_url),
    descricao: texto(valores.descricao),
    golpesPokemon: [],
  };
}
