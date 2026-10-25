import React from 'react';
import { Backpack, Coins } from 'lucide-react';
import type { FichaPersonagem } from '../../types/ficha';
import { resumirMoedas } from '../../data/moedas';
import type { DerivadosFicha } from '../../utils/calculosFicha';
import { Badge } from '../common/Badge';

export interface AbaInventarioProps {
  ficha: FichaPersonagem;
  derivados: DerivadosFicha;
  onIrParaMoedas: () => void;
}

export const AbaInventario: React.FC<AbaInventarioProps> = ({ ficha, derivados, onIrParaMoedas }) => {
  const itens = ficha.inventario ?? [];
  const pesoTotal = itens.reduce((soma, i) => soma + (i.pesoKg || 0) * (i.quantidade || 0), 0);
  const sobrecarga = pesoTotal > derivados.cargaMaxKg;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onIrParaMoedas}
          className="flex items-center gap-3 p-4 bg-[#12141e] border border-[#2b3346] hover:border-amber-500/50 rounded-lg text-left cursor-pointer transition-colors"
        >
          <span className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-600/40 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="text-xs font-cinzel text-[#8c93a4] block">Moedas · gerenciar na aba Moedas</span>
            <strong className="text-sm font-mono text-amber-300 block truncate">{resumirMoedas(ficha.moedas)}</strong>
          </span>
        </button>

        <div className="flex items-center gap-3 p-4 bg-[#12141e] border border-[#2b3346] rounded-lg">
          <span className="w-10 h-10 rounded-lg bg-[#141724] border border-[#2b3346] flex items-center justify-center text-cyan-400 shrink-0">
            <Backpack className="w-5 h-5" />
          </span>
          <span>
            <span className="text-xs font-cinzel text-[#8c93a4] block">Carga (FOR × 5)</span>
            <strong className={`text-sm font-mono ${sobrecarga ? 'text-red-300' : 'text-[#f3e5ab]'}`}>
              {pesoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / {derivados.cargaMaxKg} kg
            </strong>
            {sobrecarga && <span className="block text-[10px] text-red-300">Acima da capacidade de carga</span>}
          </span>
        </div>
      </div>

      {itens.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-xl border border-dashed border-[#2b3346] bg-[#0a0c12]">
          <Backpack className="w-12 h-12 text-amber-500/40 mx-auto mb-3" />
          <h3 className="text-lg font-cinzel font-bold text-[#f3e5ab] mb-1">Mochila vazia</h3>
          <p className="text-xs text-[#8c93a4] font-sans-clean max-w-md mx-auto">
            Nenhum item registrado para este personagem. Itens obtidos em lojas e oficinas aparecem aqui.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {itens.map((item) => (
            <li key={item.id} className="p-4 rounded-lg bg-[#10131c] border border-[#262c3c] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-cinzel text-sm font-bold text-[#f3e5ab]">{item.nome}</h4>
                  <Badge variant="gold">{item.tipo}</Badge>
                </div>
                {item.raridade && <span className="text-[10px] font-cinzel text-purple-300 uppercase tracking-wider">{item.raridade.replace(/_/g, ' ')}</span>}
                {item.descricao && <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">{item.descricao}</p>}
              </div>
              <div className="pt-2 border-t border-[#252b3a] flex items-center justify-between text-xs font-cinzel text-[#8c93a4]">
                <span>
                  Qtd: <strong className="text-amber-300">{item.quantidade}×</strong>
                </span>
                <span>
                  Peso: <strong className="text-gray-300">{item.pesoKg} kg</strong>
                </span>
                <span title="Preço de referência do item, em latão">
                  Preço: <strong className="text-amber-400 font-mono">{item.precoLatao.toLocaleString('pt-BR')} PL</strong>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
