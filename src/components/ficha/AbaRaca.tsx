import React from 'react';
import { Activity, Dices, Flame, Sparkles, Zap } from 'lucide-react';
import type { FichaPersonagem } from '../../types/ficha';
import { obterInfoRaca } from '../../data/racasData';
import { SecaoRecolhivel } from '../common/SecaoRecolhivel';
import { Badge } from '../common/Badge';

export const AbaRaca: React.FC<{ ficha: FichaPersonagem }> = ({ ficha }) => {
  const infoRaca = obterInfoRaca(ficha.raca);
  // Dados do servidor têm prioridade; o catálogo local completa o que faltar.
  const inata = {
    nome: ficha.habilidadeInataNome || infoRaca.habilidadeInata.nome,
    descricao: ficha.habilidadeInataDescricao || infoRaca.habilidadeInata.descricao,
    tipoAcao: infoRaca.habilidadeInata.tipoAcao,
    dadoBase: ficha.habilidadeInataDado || infoRaca.habilidadeInata.dadoBase,
    custoEnergia: ficha.habilidadeInataCustoEnergia ?? infoRaca.habilidadeInata.custoEnergia,
    custoMana: ficha.habilidadeInataCustoMana ?? infoRaca.habilidadeInata.custoMana,
    alcanceMetros: ficha.habilidadeInataAlcance ?? infoRaca.habilidadeInata.alcanceMetros,
  };

  const modificadores = [
    { id: 'estrutural', rotulo: '1. Modificador estrutural', tag: 'Vitalidade / Defesa', icone: <Activity className="w-4 h-4 text-amber-400" />, texto: 'text-amber-300', borda: 'border-amber-500/30', mod: infoRaca.modEstrutural },
    { id: 'metabolico', rotulo: '2. Modificador metabólico', tag: 'Descanso / Fluxo', icone: <Zap className="w-4 h-4 text-cyan-400" />, texto: 'text-cyan-300', borda: 'border-cyan-500/30', mod: infoRaca.modMetabolico },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 sm:p-5 rounded-xl bg-[#0d0f16] border border-amber-600/40">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-cinzel font-bold text-[#f3e5ab]">{infoRaca.nome}</h3>
              <Badge variant="gold">{infoRaca.raridade.replace(/_/g, ' ')}</Badge>
            </div>
            <span className="text-xs text-[#8c93a4] font-cinzel">
              Reino de origem: <strong className="text-amber-300">{ficha.reinoOrigem || infoRaca.reinoOrigem}</strong>
            </span>
          </div>
        </div>
        <p className="text-xs text-[#a0a8ba] font-sans-clean leading-relaxed italic">“{infoRaca.descricao}”</p>
      </div>

      <SecaoRecolhivel chave="raca:modificadores" titulo="Modificadores raciais" icone={<Activity className="w-4 h-4 text-amber-400" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modificadores.map(({ id, rotulo, tag, icone, texto, borda, mod }) => (
            <div key={id} className={`p-4 bg-[#0c0e16] rounded-xl border ${borda}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className={`flex items-center gap-1.5 text-xs font-cinzel font-bold uppercase tracking-wider ${texto}`}>
                  {icone}
                  {rotulo}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 border border-[#2b3346] text-[#a0a8ba] font-mono">{tag}</span>
              </div>
              <h5 className="text-sm font-cinzel font-bold text-[#f3e5ab] mb-1">{mod.titulo}</h5>
              <div className={`p-2 mb-2 rounded bg-[#07080d] border border-[#2b3346] font-mono text-xs font-bold ${texto}`}>{mod.formula}</div>
              <p className="text-xs text-[#8c93a4] font-sans-clean leading-relaxed">{mod.descricao}</p>
            </div>
          ))}
        </div>
      </SecaoRecolhivel>

      <SecaoRecolhivel chave="raca:inata" titulo="Habilidade inata" icone={<Flame className="w-4 h-4 text-purple-400" />} resumo={inata.tipoAcao}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h5 className="font-cinzel text-lg font-bold text-[#f3e5ab]">{inata.nome}</h5>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
              {inata.dadoBase && (
                <span className="px-2.5 py-1 rounded bg-[#07080d] border border-amber-500/40 text-amber-300 flex items-center gap-1">
                  <Dices className="w-3.5 h-3.5 text-amber-400" />
                  Dano: {inata.dadoBase}
                </span>
              )}
              <span className="px-2.5 py-1 rounded bg-[#07080d] border border-emerald-500/40 text-emerald-300">Custo: {inata.custoEnergia} Energia</span>
              {inata.custoMana > 0 && <span className="px-2.5 py-1 rounded bg-[#07080d] border border-cyan-500/40 text-cyan-300">Custo: {inata.custoMana} Mana</span>}
              <span className="px-2.5 py-1 rounded bg-[#07080d] border border-[#2e374c] text-gray-300 font-normal">Alcance: {inata.alcanceMetros} m</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#cbd2e1] font-sans-clean leading-relaxed bg-[#08090f]/80 p-3.5 rounded-lg border border-[#23293a]">
            {inata.descricao}
          </p>
        </div>
      </SecaoRecolhivel>
    </div>
  );
};
