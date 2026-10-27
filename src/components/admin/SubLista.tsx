import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { adminService, type EntidadeEsquema, type Registro, type ValorRegistro } from '../../services/adminService';
import { formatarLatao } from '../../utils/formatadores';
import { Button } from '../common/Button';
import { Miniatura } from '../common/Miniatura';
import { ModalConfirmacao } from '../common/ModalConfirmacao';
import { FormularioRegistro, validarCampos, valoresPadrao } from './FormularioRegistro';
import { formatarCelula, opcoesDe, tituloDe, type Avisar, type Referencias } from './registros';

export interface SubListaProps {
  entidade: EntidadeEsquema;
  esquema: EntidadeEsquema[];
  paiId: string;
  /** Valores atuais do registro pai (ex.: item produzido, para comparar com o custo dos insumos). */
  pai?: Record<string, ValorRegistro>;
  refs: Referencias;
  avisar: Avisar;
  /** Chamado depois de adicionar, editar ou remover (o pai recarrega as ligações). */
  onMudou?: () => void;
}

const num = (v: ValorRegistro | undefined) => (v === null || v === undefined || v === '' ? 0 : Number(v) || 0);

/** Conta feita sobre a sublista: custo de receita, valor esperado de drops, slots de golpes. */
function Resumo({ entidade, itens, refs, pai }: { entidade: string; itens: Registro[]; refs: Referencias; pai?: Record<string, ValorRegistro> }) {
  const preco = (itemId: ValorRegistro) => num(refs.itens?.find((i) => String(i.id) === String(itemId))?.preco_latao);
  const linha = 'flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 rounded-lg bg-painel border border-linha text-[11px] text-texto-2';

  if (entidade === 'receita_insumos' && itens.length > 0) {
    const custo = itens.reduce((t, i) => t + preco(i.item_id) * num(i.quantidade), 0);
    const valor = pai ? preco(pai.item_resultado_id) * Math.max(1, num(pai.quantidade_resultado)) : 0;
    const margem = valor - custo;
    return (
      <p className={linha}>
        <span>
          Custo dos insumos: <strong className="font-mono text-pergaminho">{formatarLatao(custo)}</strong>
        </span>
        {valor > 0 && (
          <>
            <span>
              Produto vale: <strong className="font-mono text-pergaminho">{formatarLatao(valor)}</strong>
            </span>
            <span className={margem >= 0 ? 'text-emerald-300' : 'text-red-300'}>
              {margem >= 0 ? 'Lucro' : 'Prejuízo'} de <strong className="font-mono">{formatarLatao(Math.abs(margem))}</strong>
              {custo > 0 && ` (${Math.round((margem / custo) * 100)}%)`}
            </span>
          </>
        )}
        {margem < 0 && <span className="w-full text-red-300/90">A IA das lojas evita receitas que dão prejuízo.</span>}
      </p>
    );
  }
  if (entidade === 'monstro_drops' && itens.length > 0) {
    const esperado = itens.reduce((t, d) => t + num(d.probabilidade) * ((num(d.qtd_min) + num(d.qtd_max)) / 2) * preco(d.item_id), 0);
    return (
      <p className={linha}>
        Valor esperado por abate: <strong className="font-mono text-pergaminho">{formatarLatao(Math.round(esperado))}</strong>
      </p>
    );
  }
  if (entidade === 'monstro_golpes' && itens.length > 0) {
    const slots = itens.map((g) => num(g.slot_inicial)).filter((s) => s > 0);
    const repetidos = slots.filter((s, i) => slots.indexOf(s) !== i);
    return (
      <p className={linha}>
        <span>
          {slots.length} de 4 slots equipados{slots.length > 0 && ` (${[...slots].sort().join(', ')})`}
        </span>
        {repetidos.length > 0 && (
          <span className="flex items-center gap-1 text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Mais de um golpe no slot {[...new Set(repetidos)].join(', ')}.
          </span>
        )}
      </p>
    );
  }
  return null;
}

/** Registros filhos (golpes, drops, insumos, estoque) editados dentro do registro pai. */
export const SubLista: React.FC<SubListaProps> = ({ entidade, esquema, paiId, pai, refs, avisar, onMudou }) => {
  const [itens, setItens] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<{ id: string | null; valores: Record<string, ValorRegistro> } | null>(null);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Registro | null>(null);
  const opcoes = useMemo(() => opcoesDe(esquema, refs), [esquema, refs]);
  const colunas = entidade.campos.filter((c) => c.naLista);
  // Primeira referência a item: a linha ganha a miniatura do item.
  const refItem = entidade.campos.find((c) => c.tipo === 'REFERENCIA' && c.referencia === 'itens')?.coluna;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setItens(await adminService.listar(entidade.id, paiId));
    } catch (err: any) {
      avisar('erro', err.message || `Não foi possível carregar ${entidade.rotulo.toLowerCase()}.`);
    } finally {
      setCarregando(false);
    }
  }, [entidade.id, entidade.rotulo, paiId, avisar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const erros = editando ? validarCampos(entidade, editando.valores) : {};
  const abrirNovo = (valores = valoresPadrao(entidade)) => {
    setTentou(false);
    setEditando({ id: null, valores });
  };

  const salvar = async (outro = false) => {
    if (!editando) return;
    setTentou(true);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    try {
      await adminService.salvar(entidade.id, { ...editando.valores, id: editando.id ?? undefined, [entidade.colunaPai!]: paiId });
      avisar('sucesso', `${entidade.rotulo}: registro salvo.`);
      if (outro) abrirNovo();
      else setEditando(null);
      await carregar();
      onMudou?.();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!paraExcluir) return;
    try {
      await adminService.excluir(entidade.id, paraExcluir.id);
      avisar('sucesso', 'Registro removido.');
      setParaExcluir(null);
      await carregar();
      onMudou?.();
    } catch (err: any) {
      setParaExcluir(null);
      avisar('erro', err.message || 'Não foi possível excluir.');
    }
  };

  // Sem título nem referência preenchida (ex.: local de coleta sem cidade): usa o primeiro campo preenchido.
  const nomeDe = (r: Registro) => {
    const t = tituloDe(entidade, r, refs);
    if (!t.startsWith('#')) return t;
    const c = colunas.find((x) => r[x.coluna] != null && r[x.coluna] !== '');
    return c ? formatarCelula(entidade, c.coluna, r[c.coluna], esquema, refs) : t;
  };

  return (
    <section className="rounded-xl border border-linha bg-abismo/70 p-3 space-y-3" aria-label={entidade.rotulo}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-cinzel text-xs font-bold text-amber-300 uppercase tracking-wider">
          {entidade.rotulo} ({itens.length})
        </h4>
        {!editando && (
          <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => abrirNovo()}>
            Adicionar
          </Button>
        )}
      </div>
      {entidade.descricao && !editando && itens.length === 0 && <p className="text-[11px] text-nevoa">{entidade.descricao}</p>}

      {editando && (
        <div className="p-3 rounded-lg border border-amber-600/40 bg-amber-950/10 space-y-3">
          <p className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-amber-300">
            {editando.id ? 'Editando' : `Novo em ${entidade.rotulo.toLowerCase()}`}
          </p>
          <FormularioRegistro
            entidade={entidade}
            valores={editando.valores}
            onAlterar={(col, v) => setEditando((e) => (e ? { ...e, valores: { ...e.valores, [col]: v } } : e))}
            erros={tentou ? erros : {}}
            referencias={opcoes}
            prefixoId={`admin-${entidade.id}-filho`}
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => setEditando(null)} disabled={salvando}>
              Cancelar
            </Button>
            {!editando.id && (
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} disabled={salvando} onClick={() => salvar(true)}>
                Salvar e adicionar outro
              </Button>
            )}
            <Button variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={() => salvar()}>
              {editando.id ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="space-y-1.5">
          {[1, 2].map((n) => (
            <div key={n} className="h-10 rounded-lg bg-painel-alto animate-pulse" />
          ))}
        </div>
      ) : itens.length === 0 ? (
        !editando && <p className="text-[11px] text-nevoa italic">Nenhum registro ainda.</p>
      ) : (
        <ul className="divide-y divide-linha">
          {itens.map((r) => {
            const itemRef = refItem ? refs.itens?.find((i) => String(i.id) === String(r[refItem])) : undefined;
            return (
              <li key={r.id} className={`flex items-center gap-2 py-2 ${editando?.id === String(r.id) ? 'bg-amber-400/5 -mx-1 px-1 rounded' : ''}`}>
                {refItem && <Miniatura imagem={(itemRef?.imagem_url as string | null) ?? null} />}
                <button
                  type="button"
                  onClick={() => {
                    setTentou(false);
                    setEditando({ id: String(r.id), valores: { ...r } });
                  }}
                  className="flex-1 min-w-0 text-left cursor-pointer"
                >
                  <span className="block text-xs font-bold text-pergaminho break-words">{nomeDe(r)}</span>
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-nevoa">
                    {r.qtd_dados != null && r.faces_dado != null && (
                      <span>
                        <span className="text-[10px] uppercase">Dano: </span>
                        <span className="font-mono text-amber-300/90">
                          {String(r.qtd_dados)}d{String(r.faces_dado)}
                        </span>
                      </span>
                    )}
                    {colunas
                      .filter((c) => c.coluna !== entidade.colunaTitulo && c.coluna !== refItem && c.coluna !== 'qtd_dados' && c.coluna !== 'faces_dado')
                      .map((c) => (
                        <span key={c.coluna}>
                          <span className="text-[10px] uppercase">{c.rotulo}: </span>
                          <span className="text-texto-2">
                            {c.tipo === 'REAL' && c.min === 0 && c.max === 1 && r[c.coluna] != null
                              ? `${Math.round(Number(r[c.coluna]) * 100)}%`
                              : formatarCelula(entidade, c.coluna, r[c.coluna], esquema, refs)}
                          </span>
                        </span>
                      ))}
                  </span>
                </button>
                <span className="flex shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const { id: _id, ...copia } = r;
                      abrirNovo({ ...copia, ...(entidade.colunaTitulo ? { [entidade.colunaTitulo]: `${r[entidade.colunaTitulo] ?? ''} (cópia)` } : {}) });
                    }}
                    className="p-2 text-nevoa hover:text-amber-300 hover:bg-amber-400/10 rounded-md cursor-pointer"
                    aria-label={`Duplicar ${nomeDe(r)}`}
                    title="Duplicar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTentou(false);
                      setEditando({ id: String(r.id), valores: { ...r } });
                    }}
                    className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-md cursor-pointer"
                    aria-label={`Editar ${nomeDe(r)}`}
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setParaExcluir(r)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer"
                    aria-label={`Excluir ${nomeDe(r)}`}
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {!carregando && <Resumo entidade={entidade.id} itens={itens} refs={refs} pai={pai} />}

      <ModalConfirmacao
        aberto={!!paraExcluir}
        titulo={`Excluir de ${entidade.rotulo.toLowerCase()}`}
        textoConfirmar="Excluir"
        perigoso
        onConfirmar={excluir}
        onCancelar={() => setParaExcluir(null)}
      >
        Remover <strong className="text-amber-300">{paraExcluir ? nomeDe(paraExcluir) : ''}</strong>? A ação não pode ser desfeita.
      </ModalConfirmacao>
    </section>
  );
};
