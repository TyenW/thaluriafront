import React, { useState } from 'react';
import { Coins, Minus, Pencil, Plus, Save, Undo2 } from 'lucide-react';
import type { MoedasFicha, TipoMoeda } from '../../types/ficha';
import { MOEDAS, QTD_MAXIMA_MOEDA, type InfoMoeda } from '../../data/moedas';
import { useEstadoPersistido } from '../../hooks/useEstadoPersistido';
import { Button } from '../common/Button';

export const DiscoMoeda: React.FC<{ info: InfoMoeda; tamanho?: 'sm' | 'md' }> = ({ info, tamanho = 'md' }) => (
  <span
    aria-hidden="true"
    className={`inline-flex items-center justify-center shrink-0 rounded-full border bg-gradient-to-br shadow-inner font-cinzel font-black text-black/70 ${info.disco} ${
      tamanho === 'sm' ? 'w-5 h-5 text-[7px]' : 'w-9 h-9 text-[10px]'
    }`}
  >
    {info.sigla}
  </span>
);

/** Valida um texto digitado como quantidade de moedas; devolve a mensagem de erro ou null. */
function validarQuantidade(texto: string, nome: string): string | null {
  if (texto.trim() === '') return `Informe a quantidade de ${nome}.`;
  if (!/^\d+$/.test(texto.trim())) return `A quantidade de ${nome} deve ser um número inteiro sem sinal.`;
  if (Number(texto) > QTD_MAXIMA_MOEDA) return `Quantidade de ${nome} acima do limite permitido.`;
  return null;
}

export interface CarteiraMoedasProps {
  moedas: MoedasFicha;
  /** Recebe a quantidade final das moedas alteradas e persiste no servidor. */
  onSalvar: (alteradas: Partial<MoedasFicha>) => Promise<boolean>;
}

export const CarteiraMoedas: React.FC<CarteiraMoedasProps> = ({ moedas, onSalvar }) => {
  const [mostrarZeradas, setMostrarZeradas] = useEstadoPersistido('carteira:mostrar-zeradas', false);
  const [salvando, setSalvando] = useState(false);

  // Lançamento rápido
  const [tipoLancamento, setTipoLancamento] = useState<TipoMoeda>('OURO');
  const [qtdLancamento, setQtdLancamento] = useState('1');
  const [erroLancamento, setErroLancamento] = useState<string | null>(null);

  // Ajuste direto de quantidades
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<Record<TipoMoeda, string>>({} as Record<TipoMoeda, string>);

  const infoLancamento = MOEDAS.find((m) => m.tipo === tipoLancamento)!;
  const visiveis = MOEDAS.filter((m) => mostrarZeradas || moedas[m.tipo] > 0);
  const possuiAlguma = MOEDAS.some((m) => moedas[m.tipo] > 0);

  const lancar = async (operacao: 'receber' | 'gastar') => {
    const erro = validarQuantidade(qtdLancamento, infoLancamento.nome);
    const qtd = Number(qtdLancamento);
    if (erro || qtd === 0) {
      setErroLancamento(erro ?? 'A quantidade deve ser maior que zero.');
      return;
    }
    const atual = moedas[tipoLancamento];
    if (operacao === 'gastar' && qtd > atual) {
      setErroLancamento(
        `Saldo insuficiente: o personagem tem ${atual.toLocaleString('pt-BR')} ${infoLancamento.sigla}. Moedas de outros tipos não são convertidas automaticamente.`
      );
      return;
    }
    const novo = operacao === 'receber' ? atual + qtd : atual - qtd;
    if (novo > QTD_MAXIMA_MOEDA) {
      setErroLancamento(`Quantidade de ${infoLancamento.nome} acima do limite permitido.`);
      return;
    }
    setErroLancamento(null);
    setSalvando(true);
    const ok = await onSalvar({ [tipoLancamento]: novo });
    setSalvando(false);
    if (ok) setQtdLancamento('1');
  };

  const abrirEdicao = () => {
    setRascunho(MOEDAS.reduce((acc, m) => ({ ...acc, [m.tipo]: String(moedas[m.tipo]) }), {} as Record<TipoMoeda, string>));
    setEditando(true);
  };

  const errosRascunho = editando
    ? MOEDAS.map((m) => validarQuantidade(rascunho[m.tipo] ?? '', m.nome)).filter((e): e is string => !!e)
    : [];
  const alteradas = editando
    ? MOEDAS.filter((m) => !validarQuantidade(rascunho[m.tipo] ?? '', m.nome) && Number(rascunho[m.tipo]) !== moedas[m.tipo])
    : [];

  const salvarRascunho = async () => {
    if (errosRascunho.length > 0 || alteradas.length === 0) return;
    setSalvando(true);
    const ok = await onSalvar(alteradas.reduce((acc, m) => ({ ...acc, [m.tipo]: Number(rascunho[m.tipo]) }), {} as Partial<MoedasFicha>));
    setSalvando(false);
    if (ok) setEditando(false);
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-nevoa font-sans-clean leading-relaxed">
        Cada moeda é contada separadamente: o personagem carrega exatamente as moedas listadas abaixo.
        Nenhum valor é convertido entre denominações.
      </p>

      {/* Lançamento rápido */}
      {!editando && (
        <div className="p-4 rounded-xl bg-abismo border border-linha space-y-3">
          <span className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider block">Receber ou gastar moedas</span>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_auto] gap-2 items-start">
            <label className="block">
              <span className="sr-only">Tipo de moeda</span>
              <select
                id="select-lancamento-moeda"
                value={tipoLancamento}
                onChange={(e) => {
                  setTipoLancamento(e.target.value as TipoMoeda);
                  setErroLancamento(null);
                }}
                disabled={salvando}
                className="w-full bg-painel-alto text-pergaminho rounded-lg border border-linha-forte px-3 py-2 text-sm outline-none focus:border-amber-400"
              >
                {MOEDAS.map((m) => (
                  <option key={m.tipo} value={m.tipo}>
                    {m.nome} ({m.sigla}) — possui {moedas[m.tipo].toLocaleString('pt-BR')}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Quantidade</span>
              <input
                id="input-lancamento-qtd"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={qtdLancamento}
                onChange={(e) => {
                  setQtdLancamento(e.target.value);
                  setErroLancamento(null);
                }}
                disabled={salvando}
                aria-invalid={!!erroLancamento}
                className="w-full bg-painel-alto text-pergaminho rounded-lg border border-linha-forte px-3 py-2 text-sm font-mono outline-none focus:border-amber-400"
              />
            </label>
            <div className="flex gap-2">
              <Button
                id="btn-receber-moeda"
                variant="outline"
                size="md"
                className="flex-1 sm:flex-none text-emerald-200 border-emerald-600/50 hover:border-emerald-400 hover:bg-emerald-500/10"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => lancar('receber')}
                disabled={salvando}
              >
                Receber
              </Button>
              <Button
                id="btn-gastar-moeda"
                variant="outline"
                size="md"
                className="flex-1 sm:flex-none text-red-200 border-red-600/50 hover:border-red-400 hover:bg-red-500/10"
                icon={<Minus className="w-4 h-4" />}
                onClick={() => lancar('gastar')}
                disabled={salvando || moedas[tipoLancamento] === 0}
                title={moedas[tipoLancamento] === 0 ? `O personagem não possui ${infoLancamento.nome}` : undefined}
              >
                Gastar
              </Button>
            </div>
          </div>
          {erroLancamento && (
            <p role="alert" className="text-[11px] text-red-300 font-sans-clean">
              {erroLancamento}
            </p>
          )}
        </div>
      )}

      {/* Moedas possuídas / ajuste direto */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
            {editando ? 'Ajustar quantidades' : 'Moedas na bolsa'}
          </span>
          {!editando ? (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-nevoa font-sans-clean cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mostrarZeradas}
                  onChange={(e) => setMostrarZeradas(e.target.checked)}
                  className="accent-amber-500"
                />
                Mostrar moedas zeradas
              </label>
              <Button id="btn-ajustar-moedas" variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={abrirEdicao}>
                Ajustar
              </Button>
            </div>
          ) : (
            <span className="text-[11px] text-nevoa font-sans-clean">Defina a quantidade exata de cada moeda.</span>
          )}
        </div>

        {!editando && !possuiAlguma && !mostrarZeradas ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-linha-forte bg-abismo">
            <Coins className="w-9 h-9 text-amber-500/40 mx-auto mb-2" />
            <p className="text-sm font-cinzel text-pergaminho">Bolsa vazia</p>
            <p className="text-[11px] text-nevoa font-sans-clean mt-1">Use “Receber” acima para registrar moedas obtidas.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(editando ? MOEDAS : visiveis).map((m) => {
              const qtd = moedas[m.tipo];
              const textoRascunho = rascunho[m.tipo] ?? '';
              const erro = editando ? validarQuantidade(textoRascunho, m.nome) : null;
              const mudou = editando && !erro && Number(textoRascunho) !== qtd;
              return (
                <li
                  key={m.tipo}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    mudou
                      ? 'border-amber-500/60 bg-amber-950/20'
                      : erro
                      ? 'border-red-500/60 bg-red-950/20'
                      : qtd > 0
                      ? 'border-linha-forte bg-abismo'
                      : 'border-linha bg-abismo opacity-60'
                  }`}
                >
                  <DiscoMoeda info={m} />
                  <div className="min-w-0 flex-1">
                    <span className={`block font-cinzel text-sm font-bold ${m.texto}`}>{m.nome}</span>
                    <span className="block text-[10px] text-nevoa font-mono">
                      {m.sigla}
                      {mudou && ` · ${qtd.toLocaleString('pt-BR')} → ${Number(textoRascunho).toLocaleString('pt-BR')}`}
                    </span>
                  </div>
                  {editando ? (
                    <input
                      id={`input-moeda-${m.tipo}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={textoRascunho}
                      aria-label={`Quantidade de ${m.nome}`}
                      aria-invalid={!!erro}
                      onChange={(e) => setRascunho((r) => ({ ...r, [m.tipo]: e.target.value }))}
                      disabled={salvando}
                      className="w-28 bg-painel-alto text-right text-pergaminho rounded border border-linha-forte px-2 py-1.5 text-sm font-mono outline-none focus:border-amber-400"
                    />
                  ) : (
                    <strong className="font-mono text-lg text-pergaminho tabular-nums" aria-label={`${qtd} ${m.nome}`}>
                      {qtd.toLocaleString('pt-BR')}
                    </strong>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {editando && (
          <div className="space-y-2 pt-1">
            {errosRascunho.length > 0 && (
              <p role="alert" className="text-[11px] text-red-300 font-sans-clean">
                {errosRascunho[0]}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <Button variant="ghost" size="sm" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={() => setEditando(false)} disabled={salvando}>
                Descartar
              </Button>
              <Button
                id="btn-salvar-moedas"
                variant="gold"
                size="sm"
                icon={<Save className="w-3.5 h-3.5" />}
                onClick={salvarRascunho}
                loading={salvando}
                disabled={errosRascunho.length > 0 || alteradas.length === 0}
              >
                {alteradas.length === 0 ? 'Nada alterado' : `Salvar ${alteradas.length} moeda(s)`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
