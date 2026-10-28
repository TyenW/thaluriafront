import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Pencil, Save, XCircle } from 'lucide-react';
import type { FichaPersonagem } from '../../types/ficha';
import { fichasService, type AtualizacaoFicha, type FichaAtualizada } from '../../services/fichasService';
import { ATRIBUTOS_INFO, grauDe, type ChaveAtributo } from '../../utils/calculosFicha';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { mundoService } from '../../services/mundoService';
import { Button } from '../common/Button';

const ATRIBUTO_MIN = 1;
const ATRIBUTO_MAX = 150;
const NOME_MAX = 60;

type ChaveRecurso = 'hpAtual' | 'sanAtual' | 'energiaAtual' | 'manaAtual';
const RECURSOS: { chave: ChaveRecurso; max: keyof FichaPersonagem; nome: string; cor: string }[] = [
  { chave: 'hpAtual', max: 'hpMax', nome: 'Vida', cor: 'text-red-400' },
  { chave: 'sanAtual', max: 'sanMax', nome: 'Sanidade', cor: 'text-purple-400' },
  { chave: 'energiaAtual', max: 'energiaMax', nome: 'Energia', cor: 'text-emerald-400' },
  { chave: 'manaAtual', max: 'manaMax', nome: 'Mana', cor: 'text-cyan-400' },
];

type Form = Record<'nome' | 'cidadeId' | ChaveAtributo | ChaveRecurso, string>;

const formDaFicha = (f: FichaPersonagem): Form => ({
  nome: f.nome,
  cidadeId: f.cidadeAtualId != null ? String(f.cidadeAtualId) : '',
  vig: String(f.vig),
  forca: String(f.forca),
  des: String(f.des),
  men: String(f.men),
  esp: String(f.esp),
  von: String(f.von),
  hpAtual: String(f.hpAtual),
  sanAtual: String(f.sanAtual),
  energiaAtual: String(f.energiaAtual),
  manaAtual: String(f.manaAtual),
});

function validar(form: Form, ficha: FichaPersonagem, atributosMudaram: boolean): Partial<Record<keyof Form, string>> {
  const erros: Partial<Record<keyof Form, string>> = {};
  const nome = form.nome.trim();
  if (!nome) erros.nome = 'O nome é obrigatório.';
  else if (nome.length > NOME_MAX) erros.nome = `Use no máximo ${NOME_MAX} caracteres.`;

  for (const a of ATRIBUTOS_INFO) {
    const v = form[a.chave].trim();
    if (!v) erros[a.chave] = 'Preencha o valor.';
    else if (!/^\d+$/.test(v)) erros[a.chave] = 'Número inteiro.';
    else if (Number(v) < ATRIBUTO_MIN || Number(v) > ATRIBUTO_MAX) erros[a.chave] = `De ${ATRIBUTO_MIN} a ${ATRIBUTO_MAX}.`;
  }
  for (const r of RECURSOS) {
    const v = form[r.chave].trim();
    const max = Number(ficha[r.max]);
    if (!v) erros[r.chave] = 'Preencha o valor.';
    else if (!/^\d+$/.test(v)) erros[r.chave] = 'Número inteiro ≥ 0.';
    // Com atributos alterados o máximo muda no servidor, que limita o valor ao novo teto.
    else if (!atributosMudaram && Number(v) > max) erros[r.chave] = `Máximo ${max}.`;
  }
  return erros;
}

export interface ModalEditarFichaProps {
  aberto: boolean;
  ficha: FichaPersonagem;
  onFechar: () => void;
  onSalvo: (resp: FichaAtualizada) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

type IdEtapa = 'identidade' | 'atributos' | 'recursos' | 'revisao';

const ETAPAS: { id: IdEtapa; titulo: string; campos: (keyof Form)[] }[] = [
  { id: 'identidade', titulo: 'Identidade', campos: ['nome', 'cidadeId'] },
  { id: 'atributos', titulo: 'Atributos', campos: ATRIBUTOS_INFO.map((a) => a.chave) },
  { id: 'recursos', titulo: 'Recursos', campos: RECURSOS.map((r) => r.chave) },
  { id: 'revisao', titulo: 'Revisão', campos: [] },
];

/** Nome legível de cada campo (lista de alterações e de pendências). */
const ROTULO_CAMPO: Record<keyof Form, string> = {
  nome: 'Nome',
  cidadeId: 'Cidade atual',
  ...(Object.fromEntries(ATRIBUTOS_INFO.map((a) => [a.chave, `${a.nome} (${a.sigla})`])) as Record<ChaveAtributo, string>),
  ...(Object.fromEntries(RECURSOS.map((r) => [r.chave, r.nome])) as Record<ChaveRecurso, string>),
};

export const ModalEditarFicha: React.FC<ModalEditarFichaProps> = ({ aberto, ficha, onFechar, onSalvo, avisar }) => {
  const [form, setForm] = useState<Form>(() => formDaFicha(ficha));
  const [salvando, setSalvando] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [etapa, setEtapa] = useState<IdEtapa>('identidade');
  const { usuario } = useAuth();
  const [cidades, setCidades] = useState<{ id: number; nome: string }[]>([]);

  useEffect(() => {
    if (!aberto) return;
    mundoService
      .obterConteudoVisivel(usuario?.papel ?? 'JOGADOR')
      .then((d) => setCidades(d.cidades.filter((c) => c.id != null && c.nome !== '???').map((c) => ({ id: c.id!, nome: c.nome })).sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch(() => setCidades([]));
  }, [aberto, usuario?.papel]);

  // Reabre sempre com os dados atuais da ficha, na primeira etapa.
  useEffect(() => {
    if (aberto) {
      setForm(formDaFicha(ficha));
      setTentou(false);
      setEtapa('identidade');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const original = formDaFicha(ficha);
  const alterados = (Object.keys(form) as (keyof Form)[]).filter((k) => form[k].trim() !== original[k]);
  const atributosMudaram = ATRIBUTOS_INFO.some((a) => alterados.includes(a.chave));
  const erros = validar(form, ficha, atributosMudaram);
  const temErro = Object.keys(erros).length > 0;
  const errosDaEtapa = (id: IdEtapa) => ETAPAS.find((e) => e.id === id)!.campos.filter((c) => erros[c]);
  const indice = ETAPAS.findIndex((e) => e.id === etapa);
  const nomeCidade = (id: string) => (id ? (cidades.find((c) => String(c.id) === id)?.nome ?? (id === original.cidadeId ? ficha.cidadeAtual : null) ?? `#${id}`) : 'Sem cidade');

  const irPara = (id: IdEtapa) => {
    setEtapa(id);
    // Ao chegar na revisão, as pendências aparecem destacadas também nas etapas.
    if (id === 'revisao') setTentou(true);
  };

  const avancar = () => {
    if (errosDaEtapa(etapa).length > 0) {
      setTentou(true);
      return;
    }
    irPara(ETAPAS[indice + 1].id);
  };

  const salvar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTentou(true);
    if (temErro) {
      const comErro = ETAPAS.find((x) => errosDaEtapa(x.id).length > 0);
      if (comErro) setEtapa(comErro.id);
      return;
    }
    if (alterados.length === 0) return;

    const dados: AtualizacaoFicha = { id: ficha.id };
    for (const k of alterados) {
      if (k === 'nome') dados.nome = form.nome.trim();
      else if (k === 'cidadeId') dados.cidadeId = form.cidadeId ? Number(form.cidadeId) : null;
      else dados[k] = Number(form[k]);
    }

    setSalvando(true);
    try {
      const resp = await fichasService.atualizarFicha(dados);
      onSalvo(resp);
      avisar('sucesso', 'Ficha salva.');
      onFechar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar a ficha.');
    } finally {
      setSalvando(false);
    }
  };

  const campo = (k: keyof Form, extra = '') =>
    `w-full bg-painel-alto text-pergaminho rounded border px-2.5 py-2 text-sm font-mono outline-none focus:border-amber-500 ${extra} ${
      tentou && erros[k] ? 'border-red-500/70' : alterados.includes(k) ? 'border-amber-500/60' : 'border-linha-forte'
    }`;
  const erro = (k: keyof Form) => tentou && erros[k] && <p className="text-[11px] text-red-300 mt-0.5">{erros[k]}</p>;
  const rotulo = 'block text-xs font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1.5';

  return (
    <Modal aberto={aberto} titulo={`Editar ficha — ${ficha.nome}`} icone={<Pencil className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={salvando} tamanho="lg">
      <form onSubmit={salvar} className="space-y-5" noValidate>
        {/* Etapas: clicáveis, com o estado de cada uma */}
        <nav aria-label="Etapas">
          <ol className="grid grid-cols-4 gap-1">
            {ETAPAS.map((x, i) => {
              const atual = x.id === etapa;
              const pendente = tentou && errosDaEtapa(x.id).length > 0;
              const mudou = x.campos.some((c) => alterados.includes(c));
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => irPara(x.id)}
                    aria-current={atual ? 'step' : undefined}
                    className={`w-full flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-[10px] sm:text-[11px] font-cinzel font-bold transition-colors cursor-pointer ${
                      atual ? 'border-ouro/60 bg-ouro/15 text-pergaminho' : pendente ? 'border-red-500/50 text-red-200' : 'border-linha-forte text-nevoa hover:text-texto'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        pendente ? 'bg-red-500/30' : atual ? 'bg-ouro text-abismo' : mudou ? 'bg-amber-500/30 text-amber-200' : 'bg-linha'
                      }`}
                    >
                      {pendente ? '!' : i + 1}
                    </span>
                    <span className="truncate max-w-full">{x.titulo}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {etapa === 'identidade' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="input-edit-nome" className={rotulo}>
                Nome do personagem <span className="text-red-300">*</span>
              </label>
              <input
                id="input-edit-nome"
                type="text"
                value={form.nome}
                maxLength={NOME_MAX + 10}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                aria-invalid={tentou && !!erros.nome}
                className={campo('nome', 'font-sans-clean')}
              />
              {erro('nome')}
            </div>
            <div>
              <label htmlFor="select-edit-cidade" className={rotulo}>
                Cidade atual
              </label>
              <select id="select-edit-cidade" value={form.cidadeId} onChange={(e) => setForm({ ...form, cidadeId: e.target.value })} className={campo('cidadeId', 'font-sans-clean')}>
                <option value="">Sem cidade (em viagem)</option>
                {/* Mantém a cidade atual na lista mesmo que ela não esteja revelada ao jogador. */}
                {form.cidadeId && !cidades.some((c) => String(c.id) === form.cidadeId) && ficha.cidadeAtual && <option value={form.cidadeId}>{ficha.cidadeAtual}</option>}
                {cidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-nevoa mt-1">Onde o personagem está agora: aparece como “Sua cidade” no mapa.</p>
            </div>
          </div>
        )}

        {etapa === 'atributos' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ATRIBUTOS_INFO.map((a) => {
                const valor = Number(form[a.chave]);
                return (
                  <div key={a.chave}>
                    <label htmlFor={`input-edit-${a.chave}`} className="flex items-center justify-between gap-1 text-[11px] font-cinzel text-amber-400 mb-1">
                      <span className="truncate">
                        {a.nome} ({a.sigla})
                      </span>
                      <span className="shrink-0 text-gray-400">G{Number.isFinite(valor) && form[a.chave].trim() ? grauDe(valor) : '—'}</span>
                    </label>
                    <input
                      id={`input-edit-${a.chave}`}
                      type="number"
                      inputMode="numeric"
                      min={ATRIBUTO_MIN}
                      max={ATRIBUTO_MAX}
                      value={form[a.chave]}
                      onChange={(e) => setForm({ ...form, [a.chave]: e.target.value })}
                      aria-invalid={tentou && !!erros[a.chave]}
                      className={campo(a.chave)}
                    />
                    {erro(a.chave)}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-nevoa font-sans-clean">
              De {ATRIBUTO_MIN} a {ATRIBUTO_MAX}. Grau = valor ÷ 10. Vida, Sanidade, Energia, Mana e Defesas são recalculadas pelo servidor com as fórmulas da raça.
            </p>
          </div>
        )}

        {etapa === 'recursos' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    hpAtual: String(ficha.hpMax),
                    sanAtual: String(ficha.sanMax),
                    energiaAtual: String(ficha.energiaMax),
                    manaAtual: String(ficha.manaMax),
                  })
                }
                className="text-[11px] font-cinzel text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                Preencher com os máximos
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {RECURSOS.map((r) => (
                <div key={r.chave}>
                  <label htmlFor={`input-edit-${r.chave}`} className={`block text-[11px] font-cinzel mb-1 ${r.cor}`}>
                    {r.nome} <span className="text-nevoa">(máx. {String(ficha[r.max])})</span>
                  </label>
                  <input
                    id={`input-edit-${r.chave}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form[r.chave]}
                    onChange={(e) => setForm({ ...form, [r.chave]: e.target.value })}
                    aria-invalid={tentou && !!erros[r.chave]}
                    className={campo(r.chave)}
                  />
                  {erro(r.chave)}
                </div>
              ))}
            </div>
            {atributosMudaram && (
              <p className="text-[11px] text-amber-300/90 font-sans-clean">
                Atributos alterados: os máximos serão recalculados e valores acima do novo máximo serão limitados a ele.
              </p>
            )}
          </div>
        )}

        {etapa === 'revisao' && (
          <div className="space-y-4">
            {/* Conferência: cada etapa preenchida e válida */}
            <ul className="space-y-1.5">
              {ETAPAS.filter((x) => x.id !== 'revisao').map((x) => {
                const pend = errosDaEtapa(x.id);
                return (
                  <li key={x.id} className={`rounded-lg border px-3 py-2 ${pend.length ? 'border-red-500/50 bg-red-950/20' : 'border-emerald-700/40 bg-emerald-950/15'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-cinzel font-bold text-pergaminho">
                        {pend.length ? <XCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {x.titulo}
                      </span>
                      {pend.length > 0 && (
                        <button type="button" onClick={() => irPara(x.id)} className="text-[11px] font-cinzel text-amber-300 underline cursor-pointer">
                          Corrigir
                        </button>
                      )}
                    </div>
                    {pend.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {pend.map((c) => (
                          <li key={c} className="text-[11px] text-red-200">
                            {ROTULO_CAMPO[c]}: {erros[c]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
              {!form.cidadeId && (
                <li className="flex items-start gap-2 rounded-lg border border-amber-600/40 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-100">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Sem cidade atual: o personagem não aparece em nenhuma cidade do mapa.{' '}
                    <button type="button" onClick={() => irPara('identidade')} className="underline cursor-pointer text-amber-300">
                      Definir
                    </button>
                  </span>
                </li>
              )}
            </ul>

            {/* O que vai mudar */}
            <div>
              <p className={rotulo}>Alterações ({alterados.length})</p>
              {alterados.length === 0 ? (
                <p className="text-xs text-nevoa">Nada foi alterado ainda.</p>
              ) : (
                <ul className="divide-y divide-linha rounded-lg border border-linha bg-abismo/60">
                  {alterados.map((k) => (
                    <li key={k} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
                      <span className="text-nevoa">{ROTULO_CAMPO[k]}</span>
                      <span className="font-mono text-right">
                        <span className="text-apagado line-through">{k === 'cidadeId' ? nomeCidade(original[k]) : original[k] || '—'}</span>
                        <span className="text-nevoa"> → </span>
                        <span className="text-amber-300">{k === 'cidadeId' ? nomeCidade(form[k]) : form[k].trim() || '—'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-[11px] text-nevoa font-sans-clean">Moedas, Pontos de Essência e perícias são gerenciados nas próprias abas.</p>
          </div>
        )}

        {/* Rodapé fixo: navegação entre etapas e salvar */}
        <div className="sticky -bottom-4 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-painel/95 backdrop-blur border-t border-linha flex items-center justify-between gap-2">
          {indice > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => irPara(ETAPAS[indice - 1].id)} disabled={salvando} icon={<ChevronLeft className="w-4 h-4" />}>
              Voltar
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={onFechar} disabled={salvando}>
              Cancelar
            </Button>
          )}
          {etapa === 'revisao' ? (
            <Button id="btn-salvar-edicao" type="submit" variant="gold" size="sm" loading={salvando} disabled={alterados.length === 0 || temErro} icon={<Save className="w-4 h-4" />}>
              {temErro ? 'Há pendências' : alterados.length === 0 ? 'Nada alterado' : 'Salvar alterações'}
            </Button>
          ) : (
            <Button type="button" variant="gold" size="sm" onClick={avancar} className="whitespace-nowrap">
              Próximo<span className="hidden sm:inline">: {ETAPAS[indice + 1].titulo}</span>
              <ChevronRight className="inline-block align-[-2px] w-3.5 h-3.5 ml-0.5" />
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
