import React, { useState } from 'react';
import { Dices, Pencil, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import type { FichaPersonagem, MagiaFicha } from '../../types/ficha';
import { fichasService } from '../../services/fichasService';
import { Modal } from '../common/Modal';
import { ModalConfirmacao } from '../common/ModalConfirmacao';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

const ELEMENTOS = ['Fogo', 'Água', 'Gelo', 'Terra', 'Ar', 'Raio', 'Luz', 'Trevas', 'Natureza', 'Veneno', 'Arcano', 'Neutro'];

type Form = Record<'nome' | 'escola' | 'elemento' | 'circulo' | 'custoMana' | 'custoEnergia' | 'alcanceM' | 'dado' | 'tempoConjuracao' | 'duracao' | 'descricao', string> & {
  id?: number;
  preparada: boolean;
};

const NOVA: Form = {
  nome: '', escola: '', elemento: '', circulo: '1', custoMana: '0', custoEnergia: '0', alcanceM: '0',
  dado: '', tempoConjuracao: '1 ação', duracao: 'Instantânea', descricao: '', preparada: true,
};

const inteiroEntre = (v: string, min: number, max: number) => /^\d+$/.test(v.trim()) && Number(v) >= min && Number(v) <= max;

function validar(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.nome.trim()) e.nome = 'Informe o nome da magia.';
  else if (f.nome.trim().length > 80) e.nome = 'Até 80 caracteres.';
  if (!inteiroEntre(f.circulo, 0, 10)) e.circulo = 'De 0 a 10.';
  if (!inteiroEntre(f.custoMana, 0, 100000)) e.custoMana = 'Inteiro ≥ 0.';
  if (!inteiroEntre(f.custoEnergia, 0, 100000)) e.custoEnergia = 'Inteiro ≥ 0.';
  const alcance = Number(f.alcanceM.replace(',', '.'));
  if (!Number.isFinite(alcance) || alcance < 0) e.alcanceM = 'Número ≥ 0.';
  if (f.dado.trim() && !/^\s*\d{0,3}d\d{1,3}(\s*[+-]\s*\d{1,4})?\s*$/i.test(f.dado)) e.dado = 'Formato 2d6, 1d20+3…';
  if (f.descricao.length > 3000) e.descricao = 'Até 3000 caracteres.';
  return e;
}

const classeCampo = (erro?: string) =>
  `w-full bg-abismo text-pergaminho rounded border px-3 py-2 text-sm outline-none focus:border-amber-400 ${erro ? 'border-red-500/70' : 'border-linha-forte'}`;

const paraMagia = (f: Form): Omit<MagiaFicha, 'id'> & { id?: number } => ({
  id: f.id,
  nome: f.nome.trim(),
  escola: f.escola.trim() || null,
  elemento: f.elemento.trim() || null,
  circulo: Number(f.circulo),
  custoMana: Number(f.custoMana),
  custoEnergia: Number(f.custoEnergia),
  alcanceM: Number(f.alcanceM.replace(',', '.')),
  dado: f.dado.trim() || null,
  tempoConjuracao: f.tempoConjuracao.trim() || null,
  duracao: f.duracao.trim() || null,
  descricao: f.descricao.trim() || null,
  preparada: f.preparada,
});

const paraForm = (m: MagiaFicha): Form => ({
  id: m.id,
  nome: m.nome,
  escola: m.escola ?? '',
  elemento: m.elemento ?? '',
  circulo: String(m.circulo),
  custoMana: String(m.custoMana),
  custoEnergia: String(m.custoEnergia),
  alcanceM: String(m.alcanceM),
  dado: m.dado ?? '',
  tempoConjuracao: m.tempoConjuracao ?? '',
  duracao: m.duracao ?? '',
  descricao: m.descricao ?? '',
  preparada: m.preparada,
});

export interface AbaMagiasProps {
  ficha: FichaPersonagem;
  onAtualizadas: (magias: MagiaFicha[]) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

export const AbaMagias: React.FC<AbaMagiasProps> = ({ ficha, onAtualizadas, avisar }) => {
  const magias = ficha.magias ?? [];
  const [form, setForm] = useState<Form | null>(null);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [paraRemover, setParaRemover] = useState<MagiaFicha | null>(null);
  const [alternando, setAlternando] = useState<number | null>(null);
  const erros = form ? validar(form) : {};

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setTentou(true);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    try {
      onAtualizadas(await fichasService.salvarMagia(ficha.id, paraMagia(form)));
      avisar('sucesso', form.id ? 'Magia atualizada.' : `Magia “${form.nome.trim()}” aprendida.`);
      setForm(null);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar a magia.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarPreparada = async (m: MagiaFicha) => {
    // Atualiza na hora; se o servidor falhar, volta ao estado anterior.
    const anteriores = magias;
    onAtualizadas(magias.map((x) => (x.id === m.id ? { ...x, preparada: !m.preparada } : x)));
    setAlternando(m.id);
    try {
      onAtualizadas(await fichasService.salvarMagia(ficha.id, { ...m, preparada: !m.preparada }));
    } catch (err: any) {
      onAtualizadas(anteriores);
      avisar('erro', err.message || 'Não foi possível atualizar a magia.');
    } finally {
      setAlternando(null);
    }
  };

  const remover = async () => {
    if (!paraRemover) return;
    try {
      onAtualizadas(await fichasService.removerMagia(ficha.id, paraRemover.id));
      avisar('sucesso', `Magia “${paraRemover.nome}” removida.`);
      setParaRemover(null);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível remover a magia.');
    }
  };

  const circulos = [...new Set(magias.map((m) => m.circulo))].sort((a, b) => a - b);
  const preparadas = magias.filter((m) => m.preparada).length;

  const campo = (chave: keyof Form, rotulo: string, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => (
    <div>
      <label htmlFor={`input-magia-${chave}`} className="block text-xs font-cinzel text-amber-400 mb-1">
        {rotulo}
      </label>
      <input
        id={`input-magia-${chave}`}
        value={String(form?.[chave] ?? '')}
        onChange={(e) => form && setForm({ ...form, [chave]: e.target.value })}
        className={`${classeCampo(tentou ? erros[chave] : undefined)} ${extra?.type === 'number' ? 'font-mono' : ''}`}
        {...extra}
      />
      {tentou && erros[chave] && <p className="text-[11px] text-red-300 mt-1">{erros[chave]}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-abismo border border-linha">
        <div>
          <h3 className="flex items-center gap-2 font-cinzel text-sm font-bold text-amber-300 uppercase tracking-widest">
            <Sparkles className="w-5 h-5 text-cyan-400" /> Magias e técnicas ({magias.length})
          </h3>
          <p className="text-xs text-nevoa font-sans-clean mt-1">
            {preparadas} preparada(s). Mana disponível: <strong className="text-cyan-300">{ficha.manaAtual}/{ficha.manaMax}</strong>.
          </p>
        </div>
        <Button
          id="btn-nova-magia"
          variant="gold"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => {
            setTentou(false);
            setForm({ ...NOVA });
          }}
        >
          Nova magia
        </Button>
      </div>

      {magias.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-xl border border-dashed border-linha-forte bg-abismo">
          <Sparkles className="w-10 h-10 text-cyan-500/40 mx-auto mb-2" />
          <p className="text-sm font-cinzel text-pergaminho">Nenhuma magia registrada</p>
          <p className="text-[11px] text-nevoa font-sans-clean mt-1">Registre feitiços, rituais e técnicas especiais do personagem.</p>
        </div>
      ) : (
        circulos.map((circ) => (
          <section key={circ} className="space-y-2">
            <h4 className="font-cinzel text-xs font-bold text-amber-300 uppercase tracking-wider">{circ === 0 ? 'Truques (círculo 0)' : `${circ}º círculo`}</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {magias
                .filter((m) => m.circulo === circ)
                .map((m) => {
                  const semMana = m.custoMana > ficha.manaAtual;
                  return (
                    <li key={m.id} className={`p-4 rounded-lg border bg-painel ${m.preparada ? 'border-cyan-700/50' : 'border-linha opacity-75'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="font-cinzel text-sm font-bold text-pergaminho">{m.nome}</h5>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {m.escola && <Badge variant="purple">{m.escola}</Badge>}
                            {m.elemento && <Badge variant="cyan">{m.elemento}</Badge>}
                          </div>
                        </div>
                        <div className="flex shrink-0">
                          <button
                            type="button"
                            className="p-1.5 text-amber-400 rounded hover:bg-amber-400/10 cursor-pointer"
                            aria-label={`Editar ${m.nome}`}
                            onClick={() => {
                              setTentou(false);
                              setForm(paraForm(m));
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" className="p-1.5 text-red-400 rounded hover:bg-red-500/10 cursor-pointer" aria-label={`Remover ${m.nome}`} onClick={() => setParaRemover(m)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-[11px] font-sans-clean">
                        <div>
                          <dt className="inline text-nevoa">Custo: </dt>
                          <dd className={`inline font-mono ${semMana ? 'text-red-300' : 'text-cyan-200'}`}>
                            {m.custoMana} MP{m.custoEnergia > 0 && ` · ${m.custoEnergia} EN`}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline text-nevoa">Alcance: </dt>
                          <dd className="inline font-mono text-texto-2">{m.alcanceM > 0 ? `${m.alcanceM} m` : 'Pessoal/toque'}</dd>
                        </div>
                        {m.tempoConjuracao && (
                          <div>
                            <dt className="inline text-nevoa">Conjuração: </dt>
                            <dd className="inline text-texto-2">{m.tempoConjuracao}</dd>
                          </div>
                        )}
                        {m.duracao && (
                          <div>
                            <dt className="inline text-nevoa">Duração: </dt>
                            <dd className="inline text-texto-2">{m.duracao}</dd>
                          </div>
                        )}
                      </dl>
                      {m.dado && (
                        <p className="flex items-center gap-1 mt-2 text-xs font-mono font-bold text-amber-300">
                          <Dices className="w-3.5 h-3.5 text-amber-400" /> {m.dado}
                        </p>
                      )}
                      {m.descricao && <p className="text-xs text-nevoa font-sans-clean mt-2 whitespace-pre-line">{m.descricao}</p>}
                      <label className="flex items-center gap-2 mt-3 text-[11px] text-texto-2 cursor-pointer select-none">
                        <input type="checkbox" checked={m.preparada} disabled={alternando === m.id} onChange={() => alternarPreparada(m)} className="accent-cyan-500" />
                        Preparada
                        {semMana && <span className="text-red-300">· mana insuficiente agora</span>}
                      </label>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))
      )}

      <Modal aberto={!!form} titulo={form?.id ? 'Editar magia' : 'Nova magia'} icone={<Sparkles className="w-5 h-5 text-cyan-400" />} onFechar={() => setForm(null)} bloqueado={salvando} tamanho="lg">
        {form && (
          <form onSubmit={salvar} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campo('nome', 'Nome *')}
              {campo('escola', 'Escola / tradição', { placeholder: 'Ex.: Grafiturgia, Evocação…' })}
              <div>
                <label htmlFor="input-magia-elemento" className="block text-xs font-cinzel text-amber-400 mb-1">
                  Elemento
                </label>
                <input id="input-magia-elemento" list="lista-elementos" value={form.elemento} onChange={(e) => setForm({ ...form, elemento: e.target.value })} className={classeCampo()} />
                <datalist id="lista-elementos">
                  {ELEMENTOS.map((el) => (
                    <option key={el} value={el} />
                  ))}
                </datalist>
              </div>
              {campo('circulo', 'Círculo (0–10)', { type: 'number', min: 0, max: 10 })}
              {campo('custoMana', 'Custo de mana', { type: 'number', min: 0 })}
              {campo('custoEnergia', 'Custo de energia', { type: 'number', min: 0 })}
              {campo('alcanceM', 'Alcance (m)', { type: 'number', min: 0, step: 'any' })}
              {campo('dado', 'Dado de efeito', { placeholder: 'Ex.: 3d6+2' })}
              {campo('tempoConjuracao', 'Tempo de conjuração')}
              {campo('duracao', 'Duração')}
            </div>
            <div>
              <label htmlFor="textarea-magia-descricao" className="block text-xs font-cinzel text-amber-400 mb-1">
                Descrição / efeito
              </label>
              <textarea
                id="textarea-magia-descricao"
                rows={4}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className={classeCampo(tentou ? erros.descricao : undefined)}
              />
              {tentou && erros.descricao && <p className="text-[11px] text-red-300 mt-1">{erros.descricao}</p>}
            </div>
            <label className="flex items-center gap-2 text-xs text-texto-2 cursor-pointer">
              <input type="checkbox" checked={form.preparada} onChange={(e) => setForm({ ...form, preparada: e.target.checked })} className="accent-cyan-500" />
              Magia preparada (disponível para uso)
            </label>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
              <Button type="button" variant="ghost" size="sm" onClick={() => setForm(null)} disabled={salvando}>
                Cancelar
              </Button>
              <Button id="btn-salvar-magia" type="submit" variant="gold" size="sm" loading={salvando} icon={<Save className="w-3.5 h-3.5" />}>
                Salvar magia
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ModalConfirmacao aberto={!!paraRemover} titulo="Remover magia" textoConfirmar="Remover" perigoso onConfirmar={remover} onCancelar={() => setParaRemover(null)}>
        Remover <strong className="text-amber-300">{paraRemover?.nome}</strong> das magias de {ficha.nome}?
      </ModalConfirmacao>
    </div>
  );
};
