import React from 'react';
import { Card } from '../../components/common/Card';
import { Package, Coins, Anvil } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const InventarioPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-[#252b3a] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[#f3e5ab] flex items-center gap-3">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Inventário & Manufatura (Crafting)</span>
          </h1>
          <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
            Gestão de 50 slots, escala canônica de 10 moedas em Latão e receitas de oficina v5.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Carteira e Moedas */}
        <Card variant="grimorio" className="p-6">
          <h3 className="font-cinzel text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Carteira de Latão</span>
          </h3>

          <div className="space-y-2 text-xs font-cinzel">
            <div className="flex items-center justify-between p-2 bg-[#0c0d12] rounded border border-amber-900/30">
              <span className="text-amber-400">Ouro (PO)</span>
              <strong className="text-amber-200">25 PO</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#0c0d12] rounded border border-[#232838]">
              <span className="text-slate-300">Prata (PP)</span>
              <strong className="text-slate-100">0 PP</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#0c0d12] rounded border border-[#232838]">
              <span className="text-orange-400">Cobre (PC)</span>
              <strong className="text-orange-200">0 PC</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#0c0d12] rounded border border-amber-600/30">
              <span className="text-amber-300">Latão Base (PL)</span>
              <strong className="text-amber-100 font-mono">250.000 PL</strong>
            </div>
          </div>
        </Card>

        {/* Mochila e Slots */}
        <Card variant="grimorio" className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cinzel text-sm font-bold text-[#f3e5ab] flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Mochila de Viagem (50 Slots)</span>
            </h3>
            <Badge variant="gold">Capacidade: 5.5 / 35.0 kg</Badge>
          </div>

          <div className="p-8 text-center bg-[#0a0b10] border border-dashed border-[#2b3142] rounded-lg">
            <Anvil className="w-10 h-10 text-amber-500/40 mx-auto mb-3" />
            <h4 className="font-cinzel text-base font-bold text-amber-300 mb-1">
              Oficina de Crafting & Inventário Modular (Fase 4)
            </h4>
            <p className="text-xs text-[#8c93a4] font-sans-clean max-w-md mx-auto">
              Visualização dos 13 slots corporais de armadura, 5 de acessórios, alforje de montaria colossal (25.0+ slots) e catálogo de receitas de manufatura v5 integradas à API Java.
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};
