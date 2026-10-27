import React, { useEffect, useState } from 'react';
import { Pencil, Save, Sparkles, TrendingUp, Undo2 } from 'lucide-react';
import type { FichaPersonagem } from '../../types/ficha';
import { PATAMARES, type DerivadosFicha } from '../../utils/calculosFicha';
import { SecaoRecolhivel } from '../common/SecaoRecolhivel';
import { Button } from '../common/Button';

const PE_MAX = 2_147_483_647;

export interface AbaProgressaoProps {
  ficha: FichaPersonagem;
  derivados: DerivadosFicha;
  /** Sem ele (visão do jogador), os PE ficam só para leitura. */
  onSalvarPE?: (pe: number) => Promise<boolean>;
}

export const AbaProgressao: React.FC<AbaProgressaoProps> = ({ ficha, derivados, onSalvarPE }) => {
  const peAtual = ficha.pontosEssencia ?? 0;
  const [editandoPE, setEditandoPE] = useState(false);
  const [pe, setPe] = useState(String(peAtual));
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!editandoPE) setPe(String(peAtual));
  }, [peAtual, editandoPE]);

  const erroPE = !/^\d+$/.test(pe.trim()) ? 'Use um número inteiro ≥ 0.' : Number(pe) > PE_MAX ? 'Valor acima do limite.' : null;

  const salvarPE = async () => {
    if (!onSalvarPE || erroPE || Number(pe) === peAtual) return;
    setSalvando(true);
    const ok = await onSalvarPE(Number(pe));
    setSalvando(false);
    if (ok) setEditandoPE(false);
  };

  const indiceAtual = PATAMARES.findIndex((p) => p.titulo === derivados.patamar);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { rotulo: 'Potencial de Alma', valor: `${derivados.pa} PA`, cor: 'gold-gradient-text' },
          { rotulo: 'Nível de Ressonância', valor: `NR ${derivados.nr}`, cor: 'text-cyan-300' },
          { rotulo: 'Ordem', valor: String(derivados.ordem), cor: 'text-purple-300' },
          { rotulo: 'Patamar', valor: derivados.patamar, cor: 'text-amber-200' },
        ].map((c) => (
          <div key={c.rotulo} className="p-3 sm:p-4 rounded-xl bg-abismo border border-linha text-center">
            <span className="text-[10px] font-cinzel text-amber-500/80 uppercase block">{c.rotulo}</span>
            <strong className={`text-base sm:text-lg font-cinzel font-black ${c.cor}`}>{c.valor}</strong>
          </div>
        ))}
      </div>

      <SecaoRecolhivel chave="progressao:pe" titulo="Pontos de Essência (PE)" icone={<Sparkles className="w-4 h-4 text-purple-400" />}>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          {editandoPE ? (
            <>
              <label className="block flex-1 max-w-xs">
                <span className="block text-[11px] font-cinzel text-purple-300 mb-1">Quantidade de PE</span>
                <input
                  id="input-pontos-essencia"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={pe}
                  onChange={(e) => setPe(e.target.value)}
                  aria-invalid={!!erroPE}
                  disabled={salvando}
                  className={`w-full bg-painel-alto text-purple-200 rounded border px-3 py-2 text-sm font-mono outline-none focus:border-purple-400 ${
                    erroPE ? 'border-red-500/70' : 'border-linha-forte'
                  }`}
                />
                {erroPE && <span className="block text-[11px] text-red-300 mt-1">{erroPE}</span>}
              </label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={() => setEditandoPE(false)} disabled={salvando}>
                  Descartar
                </Button>
                <Button
                  id="btn-salvar-pe"
                  variant="gold"
                  size="sm"
                  icon={<Save className="w-3.5 h-3.5" />}
                  loading={salvando}
                  disabled={!!erroPE || Number(pe) === peAtual}
                  onClick={salvarPE}
                >
                  Salvar PE
                </Button>
              </div>
            </>
          ) : (
            <>
              <strong className="text-3xl font-cinzel font-black text-purple-200 tabular-nums">{peAtual.toLocaleString('pt-BR')} PE</strong>
              {onSalvarPE && (
                <Button id="btn-editar-pe" variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditandoPE(true)}>
                  Ajustar PE
                </Button>
              )}
            </>
          )}
        </div>
        <p className="text-[11px] text-nevoa font-sans-clean mt-3">
          Os PE são gastos para evoluir atributos, conforme o custo definido pelas regras da campanha.
        </p>
      </SecaoRecolhivel>

      <SecaoRecolhivel chave="progressao:patamares" titulo="Patamares de Ascensão" icone={<TrendingUp className="w-4 h-4 text-amber-400" />} abertaPorPadrao={false}>
        <p className="text-[11px] text-nevoa font-sans-clean mb-3">
          O patamar acompanha o Potencial de Alma (PA), calculado a partir dos seis atributos. NR = ⌊√PA⌋ e Ordem = ⌊NR ÷ 10⌋.
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[...PATAMARES].reverse().map((p) => {
            const atual = PATAMARES[indiceAtual]?.titulo === p.titulo;
            return (
              <li
                key={p.titulo}
                aria-current={atual ? 'step' : undefined}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded border text-xs ${
                  atual ? 'border-amber-500/70 bg-amber-950/30 text-amber-200' : 'border-linha bg-abismo text-texto-2'
                }`}
              >
                <span className="font-cinzel font-bold">
                  {p.titulo} <span className="font-sans-clean font-normal text-nevoa">· {p.desc}</span>
                </span>
                <span className="font-mono text-[11px] shrink-0">≥ {p.minimo.toLocaleString('pt-BR')} PA</span>
              </li>
            );
          })}
        </ol>
      </SecaoRecolhivel>
    </div>
  );
};
