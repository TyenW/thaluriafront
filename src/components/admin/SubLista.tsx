import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { adminService, type EntidadeEsquema, type Registro, type ValorRegistro } from '../../services/adminService';
import { Button } from '../common/Button';
import { ModalConfirmacao } from '../common/ModalConfirmacao';
import { FormularioRegistro, validarCampos, valoresPadrao } from './FormularioRegistro';
import { formatarCelula, opcoesDe, type Avisar, type Referencias } from './registros';

export interface SubListaProps {
  entidade: EntidadeEsquema;
  esquema: EntidadeEsquema[];
  paiId: string;
  refs: Referencias;
  avisar: Avisar;
}

/** Registros filhos (golpes, drops, insumos, estoque) editados dentro do registro pai. */
export const SubLista: React.FC<SubListaProps> = ({ entidade, esquema, paiId, refs, avisar }) => {
  const [itens, setItens] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<{ id: string | null; valores: Record<string, ValorRegistro> } | null>(null);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Registro | null>(null);
  const opcoes = useMemo(() => opcoesDe(esquema, refs), [esquema, refs]);
  const colunas = entidade.campos.filter((c) => c.naLista);

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

  const salvar = async () => {
    if (!editando) return;
    setTentou(true);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    try {
      await adminService.salvar(entidade.id, { ...editando.valores, id: editando.id ?? undefined, [entidade.colunaPai!]: paiId });
      avisar('sucesso', `${entidade.rotulo}: registro salvo.`);
      setEditando(null);
      await carregar();
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
    } catch (err: any) {
      setParaExcluir(null);
      avisar('erro', err.message || 'Não foi possível excluir.');
    }
  };

  return (
    <section className="rounded-xl border border-linha bg-abismo/70 p-3 space-y-3" aria-label={entidade.rotulo}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-cinzel text-xs font-bold text-amber-300 uppercase tracking-wider">
          {entidade.rotulo} ({itens.length})
        </h4>
        {!editando && (
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setTentou(false);
              setEditando({ id: null, valores: valoresPadrao(entidade) });
            }}
          >
            Adicionar
          </Button>
        )}
      </div>

      {editando && (
        <div className="p-3 rounded-lg border border-amber-600/40 bg-amber-950/10 space-y-3">
          <FormularioRegistro
            entidade={entidade}
            valores={editando.valores}
            onAlterar={(col, v) => setEditando((e) => (e ? { ...e, valores: { ...e.valores, [col]: v } } : e))}
            erros={tentou ? erros : {}}
            referencias={opcoes}
            prefixoId={`admin-${entidade.id}-filho`}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => setEditando(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={salvar}>
              {editando.id ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      )}

      {carregando ? (
        <p className="text-[11px] text-nevoa">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-[11px] text-nevoa italic">Nenhum registro.</p>
      ) : (
        <ul className="divide-y divide-linha">
          {itens.map((r) => (
            <li key={r.id} className="flex items-center gap-2 py-2">
              <div className="flex-1 min-w-0 text-xs text-texto-2 font-sans-clean flex flex-wrap gap-x-3 gap-y-0.5">
                {colunas.map((c, i) => (
                  <span key={c.coluna} className={i === 0 ? 'font-bold text-pergaminho w-full sm:w-auto' : 'text-nevoa'}>
                    {i > 0 && <span className="text-[10px] uppercase">{c.rotulo}: </span>}
                    {formatarCelula(entidade, c.coluna, r[c.coluna], esquema, refs)}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTentou(false);
                  setEditando({ id: String(r.id), valores: { ...r } });
                }}
                className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-md cursor-pointer"
                aria-label="Editar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setParaExcluir(r)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer" aria-label="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ModalConfirmacao
        aberto={!!paraExcluir}
        titulo={`Excluir de ${entidade.rotulo.toLowerCase()}`}
        textoConfirmar="Excluir"
        perigoso
        onConfirmar={excluir}
        onCancelar={() => setParaExcluir(null)}
      >
        Remover este registro? A ação não pode ser desfeita.
      </ModalConfirmacao>
    </section>
  );
};
