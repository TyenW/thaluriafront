import React, { useEffect, useState } from 'react';
import { Pencil, Save } from 'lucide-react';
import type { FichaPersonagem } from '../../types/ficha';
import { fichasService, type AtualizacaoFicha, type FichaAtualizada } from '../../services/fichasService';
import { ATRIBUTOS_INFO, grauDe, type ChaveAtributo } from '../../utils/calculosFicha';
import { Modal } from '../common/Modal';
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

type Form = Record<'nome' | ChaveAtributo | ChaveRecurso, string>;

const formDaFicha = (f: FichaPersonagem): Form => ({
  nome: f.nome,
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
    if (!/^\d+$/.test(v)) erros[a.chave] = 'Número inteiro.';
    else if (Number(v) < ATRIBUTO_MIN || Number(v) > ATRIBUTO_MAX) erros[a.chave] = `De ${ATRIBUTO_MIN} a ${ATRIBUTO_MAX}.`;
  }
  for (const r of RECURSOS) {
    const v = form[r.chave].trim();
    const max = Number(ficha[r.max]);
    if (!/^\d+$/.test(v)) erros[r.chave] = 'Número inteiro ≥ 0.';
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

export const ModalEditarFicha: React.FC<ModalEditarFichaProps> = ({ aberto, ficha, onFechar, onSalvo, avisar }) => {
  const [form, setForm] = useState<Form>(() => formDaFicha(ficha));
  const [salvando, setSalvando] = useState(false);
  const [tentou, setTentou] = useState(false);

  // Reabre sempre com os dados atuais da ficha.
  useEffect(() => {
    if (aberto) {
      setForm(formDaFicha(ficha));
      setTentou(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const original = formDaFicha(ficha);
  const alterados = (Object.keys(form) as (keyof Form)[]).filter((k) => form[k].trim() !== original[k]);
  const atributosMudaram = ATRIBUTOS_INFO.some((a) => alterados.includes(a.chave));
  const erros = validar(form, ficha, atributosMudaram);
  const temErro = Object.keys(erros).length > 0;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (temErro || alterados.length === 0) return;

    const dados: AtualizacaoFicha = { id: ficha.id };
    for (const k of alterados) {
      if (k === 'nome') dados.nome = form.nome.trim();
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
    `w-full bg-[#141724] text-[#f3e5ab] rounded border px-2.5 py-1.5 text-sm font-mono outline-none focus:border-amber-500 ${extra} ${
      tentou && erros[k] ? 'border-red-500/70' : alterados.includes(k) ? 'border-amber-500/60' : 'border-[#383d4e]'
    }`;
  const erro = (k: keyof Form) => tentou && erros[k] && <p className="text-[10px] text-red-300 mt-0.5">{erros[k]}</p>;

  return (
    <Modal
      aberto={aberto}
      titulo="Editar ficha"
      icone={<Pencil className="w-5 h-5 text-amber-400" />}
      onFechar={onFechar}
      bloqueado={salvando}
      tamanho="lg"
    >
      <form onSubmit={salvar} className="space-y-5" noValidate>
        <div>
          <label htmlFor="input-edit-nome" className="block text-xs font-cinzel font-semibold uppercase tracking-wider text-[#d4af37]/90 mb-1.5">
            Nome do personagem
          </label>
          <input
            id="input-edit-nome"
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            aria-invalid={tentou && !!erros.nome}
            className={campo('nome', 'font-sans-clean')}
          />
          {erro('nome')}
        </div>

        <fieldset className="p-4 bg-[#0a0c12] rounded-lg border border-[#23293a] space-y-3">
          <legend className="px-1 text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">Atributos</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ATRIBUTOS_INFO.map((a) => {
              const valor = Number(form[a.chave]);
              return (
                <div key={a.chave}>
                  <label htmlFor={`input-edit-${a.chave}`} className="flex items-center justify-between text-[11px] font-cinzel text-amber-400 mb-1">
                    <span>
                      {a.nome} ({a.sigla})
                    </span>
                    <span className="text-gray-400">G{Number.isFinite(valor) ? grauDe(valor) : '—'}</span>
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
          <p className="text-[10px] text-[#8c93a4] font-sans-clean">
            Grau = valor ÷ 10 (arredondado para baixo). Vida, Sanidade, Energia, Mana e Defesas são recalculadas pelo servidor com as fórmulas da raça.
          </p>
        </fieldset>

        <fieldset className="p-4 bg-[#0a0c12] rounded-lg border border-[#23293a] space-y-3">
          <legend className="px-1 text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">Recursos atuais</legend>
          <div className="flex justify-end -mt-1">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {RECURSOS.map((r) => (
              <div key={r.chave}>
                <label htmlFor={`input-edit-${r.chave}`} className={`block text-[10px] font-cinzel mb-1 ${r.cor}`}>
                  {r.nome} (máx. {String(ficha[r.max])})
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
            <p className="text-[10px] text-amber-300/90 font-sans-clean">
              Atributos alterados: os máximos serão recalculados e valores acima do novo máximo serão limitados a ele.
            </p>
          )}
        </fieldset>

        <p className="text-[11px] text-[#8c93a4] font-sans-clean">
          Moedas, Pontos de Essência e perícias são gerenciados nas próprias abas e não são alterados aqui.
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-4 border-t border-[#252b3a]">
          <Button type="button" variant="ghost" size="md" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            id="btn-salvar-edicao"
            type="submit"
            variant="gold"
            size="md"
            loading={salvando}
            disabled={alterados.length === 0}
            icon={<Save className="w-4 h-4" />}
          >
            {alterados.length === 0 ? 'Nada alterado' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
