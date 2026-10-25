import React, { useState } from 'react';
import { Award, ChevronsDownUp, ChevronsUpDown, Dices, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import type { FichaPersonagem, PericiaFicha } from '../../types/ficha';
import { fichasService } from '../../services/fichasService';
import { dadoDePericia, listarPericias } from '../../utils/calculosFicha';
import { useEstadoPersistido } from '../../hooks/useEstadoPersistido';
import { SecaoRecolhivel } from '../common/SecaoRecolhivel';
import { Modal } from '../common/Modal';
import { ModalConfirmacao } from '../common/ModalConfirmacao';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

const GRUPOS: { atributo: string; titulo: string }[] = [
  { atributo: 'FOR', titulo: 'Força (FOR)' },
  { atributo: 'DES', titulo: 'Destreza (DES)' },
  { atributo: 'VIG', titulo: 'Vigor (VIG)' },
  { atributo: 'MEN', titulo: 'Mental (MEN)' },
  { atributo: 'VON', titulo: 'Vontade (VON)' },
  { atributo: 'ESP', titulo: 'Espírito (ESP)' },
];

const GRAU_MAXIMO = 20;
const MAESTRIA_MAXIMA = 5;
const NOME_MAXIMO = 60;
const DESCRICAO_MAXIMA = 500;

interface FormPericia {
  /** Chave da perícia existente; vazia ao criar. */
  pericia: string;
  nome: string;
  atributoBase: string;
  grau: string;
  maestria: number;
  descricao: string;
  personalizada: boolean;
}

const FORM_NOVA: FormPericia = { pericia: '', nome: '', atributoBase: 'FOR', grau: '1', maestria: 0, descricao: '', personalizada: true };

function validar(form: FormPericia): Record<string, string> {
  const erros: Record<string, string> = {};
  const nome = form.nome.trim();
  if (!nome) erros.nome = 'Informe o nome da perícia.';
  else if (nome.length > NOME_MAXIMO) erros.nome = `Use no máximo ${NOME_MAXIMO} caracteres.`;
  if (!/^\d+$/.test(form.grau.trim())) erros.grau = 'O grau deve ser um número inteiro.';
  else if (Number(form.grau) > GRAU_MAXIMO) erros.grau = `O grau vai de 0 a ${GRAU_MAXIMO}.`;
  if (form.descricao.length > DESCRICAO_MAXIMA) erros.descricao = `Use no máximo ${DESCRICAO_MAXIMA} caracteres.`;
  return erros;
}

const classeCampo = (erro?: string) =>
  `w-full bg-[#090b10] text-[#f3e5ab] rounded border px-3 py-2 text-sm outline-none focus:border-amber-400 ${
    erro ? 'border-red-500/70' : 'border-[#383d4e]'
  }`;

export interface AbaPericiasProps {
  ficha: FichaPersonagem;
  onPericiasAtualizadas: (pericias: PericiaFicha[]) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

export const AbaPericias: React.FC<AbaPericiasProps> = ({ ficha, onPericiasAtualizadas, avisar }) => {
  const pericias = listarPericias(ficha);
  const [filtro, setFiltro] = useState('');
  const [recolhidos, setRecolhidos] = useEstadoPersistido<string[]>('pericias:grupos-recolhidos', []);

  const [form, setForm] = useState<FormPericia | null>(null);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [paraRemover, setParaRemover] = useState<PericiaFicha | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const termo = filtro.trim().toLowerCase();
  const filtradas = termo
    ? pericias.filter((p) => p.nome.toLowerCase().includes(termo) || (p.descricao ?? '').toLowerCase().includes(termo))
    : pericias;

  const conhecidos = new Set(GRUPOS.map((g) => g.atributo));
  const grupos = [
    ...GRUPOS,
    ...(filtradas.some((p) => !conhecidos.has(p.atributoBase)) ? [{ atributo: 'OUTROS', titulo: 'Outros atributos' }] : []),
  ]
    .map((g) => ({
      ...g,
      itens: filtradas.filter((p) => (g.atributo === 'OUTROS' ? !conhecidos.has(p.atributoBase) : p.atributoBase === g.atributo)),
    }))
    .filter((g) => g.itens.length > 0);

  const todosRecolhidos = grupos.length > 0 && grupos.every((g) => recolhidos.includes(g.atributo));
  const alternarGrupo = (atributo: string, aberta: boolean) =>
    setRecolhidos((atual) => (aberta ? atual.filter((a) => a !== atributo) : [...new Set([...atual, atributo])]));

  const abrirEdicao = (p: PericiaFicha) => {
    setTentouSalvar(false);
    setForm({
      pericia: p.pericia,
      nome: p.nome,
      atributoBase: p.atributoBase,
      grau: String(p.grau ?? 0),
      maestria: p.maestria ?? 0,
      descricao: p.descricao ?? '',
      personalizada: !!p.personalizada,
    });
  };

  const erros = form ? validar(form) : {};

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setTentouSalvar(true);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    try {
      const resp = await fichasService.salvarPericia({
        fichaId: ficha.id,
        pericia: form.pericia || undefined,
        nome: form.nome.trim(),
        atributoBase: form.atributoBase,
        grau: Number(form.grau),
        maestria: form.maestria,
        descricao: form.descricao.trim(),
      });
      if (!resp?.pericias) throw new Error('O servidor não devolveu a lista de perícias atualizada.');
      onPericiasAtualizadas(resp.pericias);
      avisar('sucesso', form.pericia ? `Perícia “${form.nome.trim()}” salva.` : `Perícia “${form.nome.trim()}” criada.`);
      setForm(null);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar a perícia.');
    } finally {
      setSalvando(false);
    }
  };

  const remover = async () => {
    if (!paraRemover) return;
    setRemovendo(true);
    try {
      const resp = await fichasService.removerPericia(ficha.id, paraRemover.pericia);
      if (!resp?.pericias) throw new Error('O servidor não devolveu a lista de perícias atualizada.');
      onPericiasAtualizadas(resp.pericias);
      avisar('sucesso', `Perícia “${paraRemover.nome}” removida.`);
      setParaRemover(null);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível remover a perícia.');
    } finally {
      setRemovendo(false);
    }
  };

  const nomeEditavel = !!form && (form.personalizada || !form.pericia);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-amber-950/30 via-[#161a26] to-black/40 border border-amber-500/40 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-cinzel text-sm font-bold text-amber-300 uppercase tracking-widest">
              <Award className="w-5 h-5 text-amber-400" />
              Perícias ({pericias.length})
            </h3>
            <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
              <strong>Regra de mesa:</strong> Grau 0 = 2d20 (pior) + 0. Grau ≥ 1 = (Grau)d20 (melhor) + Maestria × 5.
            </p>
          </div>
          <Button
            id="btn-nova-pericia"
            variant="gold"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setTentouSalvar(false);
              setForm({ ...FORM_NOVA });
            }}
          >
            Nova perícia
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Buscar perícia</span>
            <Search className="w-4 h-4 text-[#8c93a4] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="input-buscar-pericia"
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nome ou descrição…"
              className="w-full bg-[#090b10] text-[#f3e5ab] rounded-lg border border-[#383d4e] pl-9 pr-3 py-2 text-sm outline-none focus:border-amber-400"
            />
          </label>
          <Button
            id="btn-alternar-grupos-pericias"
            variant="outline"
            size="sm"
            disabled={!!termo}
            title={termo ? 'Limpe a busca para recolher os grupos' : undefined}
            icon={todosRecolhidos ? <ChevronsUpDown className="w-4 h-4" /> : <ChevronsDownUp className="w-4 h-4" />}
            onClick={() => setRecolhidos(todosRecolhidos ? [] : grupos.map((g) => g.atributo))}
          >
            {todosRecolhidos ? 'Expandir todas' : 'Recolher todas'}
          </Button>
        </div>
      </div>

      {grupos.length === 0 ? (
        <p className="text-center text-sm text-[#8c93a4] font-sans-clean py-8">Nenhuma perícia encontrada para “{filtro}”.</p>
      ) : (
        grupos.map((g) => (
          <SecaoRecolhivel
            key={g.atributo}
            chave={`pericias:${g.atributo}`}
            titulo={g.titulo}
            resumo={`${g.itens.length} perícia(s)`}
            // Durante a busca os grupos ficam abertos para mostrar os resultados.
            aberta={termo ? true : !recolhidos.includes(g.atributo)}
            onAlternar={(aberta) => !termo && alternarGrupo(g.atributo, aberta)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {g.itens.map((p) => (
                <article
                  key={p.pericia}
                  className={`p-3.5 rounded-lg border flex flex-col justify-between gap-3 transition-colors hover:border-amber-500/50 ${
                    p.personalizada ? 'border-purple-600/50 bg-purple-950/15' : 'border-[#262c3c] bg-[#10131c]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-cinzel text-xs font-bold text-[#f3e5ab]">{p.nome}</h4>
                      {p.personalizada && <Badge variant="purple">Personalizada</Badge>}
                    </div>
                    <p className="text-[11px] text-[#8c93a4] font-sans-clean line-clamp-2" title={p.descricao || undefined}>
                      {p.descricao || 'Sem descrição.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 bg-[#0a0c12] px-2 py-1.5 rounded border border-[#232a3a]">
                      <span className="text-[10px] font-cinzel text-[#8c93a4]">Grau {p.grau ?? 0} · M+{(p.maestria ?? 0) * 5}</span>
                      <span className="flex items-center gap-1 text-xs font-mono text-amber-300 font-bold">
                        <Dices className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {dadoDePericia(p.grau ?? 0, p.maestria ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      {p.personalizada && (
                        <button
                          id={`btn-remover-pericia-${p.pericia}`}
                          type="button"
                          onClick={() => setParaRemover(p)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                          aria-label={`Excluir perícia ${p.nome}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Button
                        id={`btn-editar-pericia-${p.pericia}`}
                        variant="outline"
                        size="sm"
                        icon={<Pencil className="w-3 h-3 text-amber-400" />}
                        onClick={() => abrirEdicao(p)}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SecaoRecolhivel>
        ))
      )}

      <Modal
        aberto={!!form}
        titulo={form?.pericia ? `Editar perícia: ${form.nome || '—'}` : 'Nova perícia personalizada'}
        icone={form?.pericia ? <Pencil className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-amber-400" />}
        onFechar={() => setForm(null)}
        bloqueado={salvando}
      >
        {form && (
          <form onSubmit={salvar} className="space-y-4" noValidate>
            {nomeEditavel ? (
              <>
                <div>
                  <label htmlFor="input-pericia-nome" className="block text-xs font-cinzel text-amber-400 mb-1">
                    Nome da perícia *
                  </label>
                  <input
                    id="input-pericia-nome"
                    type="text"
                    maxLength={NOME_MAXIMO + 10}
                    placeholder="Ex.: Herbalismo Rúnico"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    aria-invalid={tentouSalvar && !!erros.nome}
                    className={classeCampo(tentouSalvar ? erros.nome : undefined)}
                  />
                  {tentouSalvar && erros.nome && <p className="text-[11px] text-red-300 mt-1">{erros.nome}</p>}
                </div>
                <div>
                  <label htmlFor="select-pericia-atributo" className="block text-xs font-cinzel text-amber-400 mb-1">
                    Atributo base
                  </label>
                  <select
                    id="select-pericia-atributo"
                    value={form.atributoBase}
                    onChange={(e) => setForm({ ...form, atributoBase: e.target.value })}
                    className={classeCampo()}
                  >
                    {GRUPOS.map((g) => (
                      <option key={g.atributo} value={g.atributo}>
                        {g.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-[#8c93a4] font-sans-clean">
                Perícia canônica de <strong className="text-amber-300">{form.atributoBase}</strong>: nome e atributo são fixos; ajuste grau, maestria e anotações.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-pericia-grau" className="block text-xs font-cinzel text-amber-400 mb-1">
                  Grau (qtd. de d20)
                </label>
                <input
                  id="input-pericia-grau"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={GRAU_MAXIMO}
                  step={1}
                  value={form.grau}
                  onChange={(e) => setForm({ ...form, grau: e.target.value })}
                  aria-invalid={tentouSalvar && !!erros.grau}
                  className={`${classeCampo(tentouSalvar ? erros.grau : undefined)} font-mono`}
                />
                {tentouSalvar && erros.grau && <p className="text-[11px] text-red-300 mt-1">{erros.grau}</p>}
              </div>
              <div>
                <label htmlFor="select-pericia-maestria" className="block text-xs font-cinzel text-cyan-400 mb-1">
                  Maestria (bônus fixo)
                </label>
                <select
                  id="select-pericia-maestria"
                  value={form.maestria}
                  onChange={(e) => setForm({ ...form, maestria: Number(e.target.value) })}
                  className={`${classeCampo()} font-mono`}
                >
                  {Array.from({ length: MAESTRIA_MAXIMA + 1 }, (_, n) => (
                    <option key={n} value={n}>
                      Nível {n} (+{n * 5})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-600/30 rounded-lg text-center">
              <span className="text-[10px] font-cinzel text-[#8c93a4] block">Rolagem na mesa</span>
              <span className="text-sm font-mono font-bold text-amber-300">
                {erros.grau ? '—' : dadoDePericia(Number(form.grau), form.maestria)}
              </span>
            </div>

            <div>
              <label htmlFor="textarea-pericia-descricao" className="flex justify-between text-xs font-cinzel text-gray-400 mb-1">
                <span>Descrição / anotações</span>
                <span className={form.descricao.length > DESCRICAO_MAXIMA ? 'text-red-300' : ''}>
                  {form.descricao.length}/{DESCRICAO_MAXIMA}
                </span>
              </label>
              <textarea
                id="textarea-pericia-descricao"
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className={classeCampo(tentouSalvar ? erros.descricao : undefined)}
              />
              {tentouSalvar && erros.descricao && <p className="text-[11px] text-red-300 mt-1">{erros.descricao}</p>}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-[#252b3a]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setForm(null)} disabled={salvando}>
                Cancelar
              </Button>
              <Button id="btn-salvar-pericia" type="submit" variant="gold" size="sm" loading={salvando} icon={<Save className="w-3.5 h-3.5" />}>
                {form.pericia ? 'Salvar perícia' : 'Criar perícia'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ModalConfirmacao
        aberto={!!paraRemover}
        titulo="Excluir perícia"
        textoConfirmar="Excluir perícia"
        perigoso
        carregando={removendo}
        onConfirmar={remover}
        onCancelar={() => setParaRemover(null)}
      >
        Excluir a perícia personalizada <strong className="text-amber-300">{paraRemover?.nome}</strong>? Grau, maestria e anotações dela serão perdidos.
      </ModalConfirmacao>
    </div>
  );
};
