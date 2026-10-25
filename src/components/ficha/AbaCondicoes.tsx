import React, { useState } from 'react';
import { Activity, Hourglass, Pencil, Plus, Save, SkipForward, Trash2 } from 'lucide-react';
import type { CondicaoFicha, FichaPersonagem, TipoCondicao } from '../../types/ficha';
import { fichasService } from '../../services/fichasService';
import { Modal } from '../common/Modal';
import { ModalConfirmacao } from '../common/ModalConfirmacao';
import { Button } from '../common/Button';

const TIPOS: Record<TipoCondicao, { rotulo: string; classe: string }> = {
  NEGATIVA: { rotulo: 'Negativa', classe: 'border-red-600/50 bg-red-950/20 text-red-200' },
  POSITIVA: { rotulo: 'Positiva', classe: 'border-emerald-600/50 bg-emerald-950/20 text-emerald-200' },
  NEUTRA: { rotulo: 'Neutra', classe: 'border-slate-500/50 bg-slate-900/40 text-slate-200' },
};

/** Sugestões comuns para agilizar o cadastro (o nome continua livre). */
const SUGESTOES = ['Envenenado', 'Sangrando', 'Atordoado', 'Exausto', 'Amedrontado', 'Em chamas', 'Congelado', 'Abençoado', 'Inspirado', 'Invisível'];

interface Form {
  id?: number;
  nome: string;
  tipo: TipoCondicao;
  intensidade: string;
  duracaoTurnos: string;
  descricao: string;
}

const NOVA: Form = { nome: '', tipo: 'NEGATIVA', intensidade: '1', duracaoTurnos: '', descricao: '' };

function validar(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.nome.trim()) e.nome = 'Informe o nome da condição.';
  else if (f.nome.trim().length > 80) e.nome = 'Até 80 caracteres.';
  if (!/^\d+$/.test(f.intensidade) || Number(f.intensidade) < 1 || Number(f.intensidade) > 10) e.intensidade = 'De 1 a 10.';
  if (f.duracaoTurnos.trim() && (!/^\d+$/.test(f.duracaoTurnos.trim()) || Number(f.duracaoTurnos) < 1 || Number(f.duracaoTurnos) > 9999)) {
    e.duracaoTurnos = 'De 1 a 9999 turnos, ou vazio.';
  }
  if (f.descricao.length > 1000) e.descricao = 'Até 1000 caracteres.';
  return e;
}

const classeCampo = (erro?: string) =>
  `w-full bg-abismo text-pergaminho rounded border px-3 py-2 text-sm outline-none focus:border-amber-400 ${erro ? 'border-red-500/70' : 'border-linha-forte'}`;

export interface AbaCondicoesProps {
  ficha: FichaPersonagem;
  onAtualizadas: (condicoes: CondicaoFicha[]) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

export const AbaCondicoes: React.FC<AbaCondicoesProps> = ({ ficha, onAtualizadas, avisar }) => {
  const condicoes = ficha.condicoes ?? [];
  const [form, setForm] = useState<Form | null>(null);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [paraRemover, setParaRemover] = useState<CondicaoFicha | null>(null);
  const [avancando, setAvancando] = useState(false);
  const erros = form ? validar(form) : {};

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setTentou(true);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    try {
      const lista = await fichasService.salvarCondicao(ficha.id, {
        id: form.id,
        nome: form.nome.trim(),
        tipo: form.tipo,
        intensidade: Number(form.intensidade),
        duracaoTurnos: form.duracaoTurnos.trim() ? Number(form.duracaoTurnos) : null,
        descricao: form.descricao.trim() || null,
      });
      onAtualizadas(lista);
      avisar('sucesso', form.id ? 'Condição atualizada.' : `Condição “${form.nome.trim()}” aplicada.`);
      setForm(null);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar a condição.');
    } finally {
      setSalvando(false);
    }
  };

  const remover = async () => {
    if (!paraRemover) return;
    try {
      onAtualizadas(await fichasService.removerCondicao(ficha.id, paraRemover.id));
      avisar('sucesso', `Condição “${paraRemover.nome}” removida.`);
      setParaRemover(null);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível remover a condição.');
    }
  };

  const avancarTurno = async () => {
    setAvancando(true);
    try {
      const r = await fichasService.avancarTurnoCondicoes(ficha.id);
      onAtualizadas(r.condicoes);
      avisar('sucesso', r.encerradas > 0 ? `Turno avançado: ${r.encerradas} condição(ões) terminaram.` : 'Turno avançado.');
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível avançar o turno.');
    } finally {
      setAvancando(false);
    }
  };

  const temporarias = condicoes.some((c) => c.duracaoTurnos != null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-abismo border border-linha">
        <div>
          <h3 className="flex items-center gap-2 font-cinzel text-sm font-bold text-amber-300 uppercase tracking-widest">
            <Activity className="w-5 h-5 text-amber-400" /> Condições ativas ({condicoes.length})
          </h3>
          <p className="text-xs text-nevoa font-sans-clean mt-1">
            Efeitos temporários ou permanentes sobre o personagem. “Avançar turno” desconta 1 turno das condições com duração.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            id="btn-avancar-turno"
            variant="outline"
            size="sm"
            icon={<SkipForward className="w-3.5 h-3.5" />}
            onClick={avancarTurno}
            loading={avancando}
            disabled={!temporarias}
            title={temporarias ? undefined : 'Nenhuma condição com duração em turnos'}
          >
            Avançar turno
          </Button>
          <Button
            id="btn-nova-condicao"
            variant="gold"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setTentou(false);
              setForm({ ...NOVA });
            }}
          >
            Aplicar condição
          </Button>
        </div>
      </div>

      {condicoes.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-xl border border-dashed border-linha-forte bg-abismo">
          <Activity className="w-10 h-10 text-amber-500/40 mx-auto mb-2" />
          <p className="text-sm font-cinzel text-pergaminho">Nenhuma condição ativa</p>
          <p className="text-[11px] text-nevoa font-sans-clean mt-1">Envenenamentos, bênçãos, exaustão e outros efeitos aparecem aqui.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {condicoes.map((c) => (
            <li key={c.id} className={`p-4 rounded-lg border ${TIPOS[c.tipo]?.classe ?? TIPOS.NEUTRA.classe}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-cinzel text-sm font-bold">{c.nome}</h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] font-mono opacity-90">
                    <span>{TIPOS[c.tipo]?.rotulo ?? c.tipo}</span>
                    <span>Intensidade {c.intensidade}</span>
                    <span className="flex items-center gap-1">
                      <Hourglass className="w-3 h-3" />
                      {c.duracaoTurnos == null ? 'Sem duração definida' : `${c.duracaoTurnos} turno(s)`}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
                    aria-label={`Editar ${c.nome}`}
                    onClick={() => {
                      setTentou(false);
                      setForm({
                        id: c.id,
                        nome: c.nome,
                        tipo: c.tipo,
                        intensidade: String(c.intensidade),
                        duracaoTurnos: c.duracaoTurnos == null ? '' : String(c.duracaoTurnos),
                        descricao: c.descricao ?? '',
                      });
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-white/10 cursor-pointer" aria-label={`Remover ${c.nome}`} onClick={() => setParaRemover(c)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {c.descricao && <p className="text-xs font-sans-clean mt-2 opacity-90 whitespace-pre-line">{c.descricao}</p>}
            </li>
          ))}
        </ul>
      )}

      <Modal aberto={!!form} titulo={form?.id ? 'Editar condição' : 'Aplicar condição'} icone={<Activity className="w-5 h-5 text-amber-400" />} onFechar={() => setForm(null)} bloqueado={salvando}>
        {form && (
          <form onSubmit={salvar} className="space-y-4" noValidate>
            <div>
              <label htmlFor="input-condicao-nome" className="block text-xs font-cinzel text-amber-400 mb-1">
                Nome *
              </label>
              <input
                id="input-condicao-nome"
                list="sugestoes-condicao"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={classeCampo(tentou ? erros.nome : undefined)}
              />
              <datalist id="sugestoes-condicao">
                {SUGESTOES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {tentou && erros.nome && <p className="text-[11px] text-red-300 mt-1">{erros.nome}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="select-condicao-tipo" className="block text-xs font-cinzel text-amber-400 mb-1">
                  Tipo
                </label>
                <select id="select-condicao-tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCondicao })} className={classeCampo()}>
                  {(Object.keys(TIPOS) as TipoCondicao[]).map((t) => (
                    <option key={t} value={t}>
                      {TIPOS[t].rotulo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="input-condicao-intensidade" className="block text-xs font-cinzel text-amber-400 mb-1">
                  Intensidade (1–10)
                </label>
                <input
                  id="input-condicao-intensidade"
                  type="number"
                  min={1}
                  max={10}
                  value={form.intensidade}
                  onChange={(e) => setForm({ ...form, intensidade: e.target.value })}
                  className={`${classeCampo(tentou ? erros.intensidade : undefined)} font-mono`}
                />
                {tentou && erros.intensidade && <p className="text-[11px] text-red-300 mt-1">{erros.intensidade}</p>}
              </div>
              <div>
                <label htmlFor="input-condicao-duracao" className="block text-xs font-cinzel text-amber-400 mb-1">
                  Duração (turnos)
                </label>
                <input
                  id="input-condicao-duracao"
                  type="number"
                  min={1}
                  placeholder="Indefinida"
                  value={form.duracaoTurnos}
                  onChange={(e) => setForm({ ...form, duracaoTurnos: e.target.value })}
                  className={`${classeCampo(tentou ? erros.duracaoTurnos : undefined)} font-mono`}
                />
                {tentou && erros.duracaoTurnos && <p className="text-[11px] text-red-300 mt-1">{erros.duracaoTurnos}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="textarea-condicao-descricao" className="block text-xs font-cinzel text-amber-400 mb-1">
                Efeito / descrição
              </label>
              <textarea
                id="textarea-condicao-descricao"
                rows={3}
                value={form.descricao}
                placeholder="Ex.: perde 1d4 de HP por turno; desvantagem em testes de DES."
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className={classeCampo(tentou ? erros.descricao : undefined)}
              />
              {tentou && erros.descricao && <p className="text-[11px] text-red-300 mt-1">{erros.descricao}</p>}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
              <Button type="button" variant="ghost" size="sm" onClick={() => setForm(null)} disabled={salvando}>
                Cancelar
              </Button>
              <Button id="btn-salvar-condicao" type="submit" variant="gold" size="sm" loading={salvando} icon={<Save className="w-3.5 h-3.5" />}>
                {form.id ? 'Salvar' : 'Aplicar'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ModalConfirmacao
        aberto={!!paraRemover}
        titulo="Remover condição"
        textoConfirmar="Remover"
        perigoso
        onConfirmar={remover}
        onCancelar={() => setParaRemover(null)}
      >
        Remover a condição <strong className="text-amber-300">{paraRemover?.nome}</strong> de {ficha.nome}?
      </ModalConfirmacao>
    </div>
  );
};
