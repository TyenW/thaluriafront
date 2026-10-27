import React from 'react';
import { ScrollText } from 'lucide-react';
import type { MovimentoCaixa } from '../../types/comercio';
import { formatarLatao } from '../../utils/formatadores';
import { EstadoVazio } from '../common/EstadoVazio';

const Valor: React.FC<{ m: MovimentoCaixa }> = ({ m }) => {
  if (m.fluxo === 0) return <span className="font-mono text-nevoa">{m.valorLatao ? formatarLatao(m.valorLatao) : '—'}</span>;
  const entrada = m.fluxo > 0;
  return (
    <span className={`font-mono ${entrada ? 'text-emerald-300' : 'text-red-300'}`}>
      {entrada ? '+' : '−'}
      {formatarLatao(m.valorLatao)}
    </span>
  );
};

/** Últimos movimentos do livro-caixa, do mais recente ao mais antigo. */
export const AbaLivroCaixa: React.FC<{ movimentacoes: MovimentoCaixa[] }> = ({ movimentacoes }) => {
  if (movimentacoes.length === 0) {
    return (
      <EstadoVazio icone={<ScrollText />} titulo="Livro-caixa em branco">
        Os movimentos aparecem conforme os dias de mercado passam.
      </EstadoVazio>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-nevoa">Últimos {movimentacoes.length} movimentos.</p>

      <ul className="md:hidden divide-y divide-linha rounded-xl border border-linha bg-painel">
        {movimentacoes.map((m) => (
          <li key={m.id} className="p-3 text-xs space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-cinzel text-pergaminho">{m.tipoDescricao}</span>
              <Valor m={m} />
            </div>
            <p className="text-texto-2">
              {m.quantidade}× {m.item}
            </p>
            <p className="text-nevoa">
              Dia {m.dia}, {String(m.hora).padStart(2, '0')}h{m.descricao ? ` · ${m.descricao}` : ''}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-linha">
        <table className="w-full text-left text-xs">
          <thead className="bg-painel">
            <tr className="border-b border-linha text-nevoa font-cinzel uppercase text-[10px] tracking-wider">
              <th className="py-2 px-3">Quando</th>
              <th className="py-2 px-3">Operação</th>
              <th className="py-2 px-3">Item</th>
              <th className="py-2 px-3 text-right">Valor</th>
              <th className="py-2 px-3 text-right">Caixa após</th>
              <th className="py-2 px-3">Observação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {movimentacoes.map((m) => (
              <tr key={m.id} className="hover:bg-white/5">
                <td className="py-1.5 px-3 whitespace-nowrap text-nevoa">
                  Dia {m.dia}, {String(m.hora).padStart(2, '0')}h
                </td>
                <td className="py-1.5 px-3 text-pergaminho whitespace-nowrap">{m.tipoDescricao}</td>
                <td className="py-1.5 px-3 text-texto-2">
                  {m.quantidade}× {m.item}
                </td>
                <td className="py-1.5 px-3 text-right whitespace-nowrap">
                  <Valor m={m} />
                </td>
                <td className="py-1.5 px-3 text-right font-mono text-nevoa whitespace-nowrap">{m.saldoAposLatao != null ? formatarLatao(m.saldoAposLatao) : '—'}</td>
                <td className="py-1.5 px-3 text-nevoa">{m.descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
