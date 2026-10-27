import React from 'react';
import { Activity, Dices, Pencil, Shield, Sparkles } from 'lucide-react';
import type { FichaPersonagem } from '../../types/ficha';
import { ATRIBUTOS_INFO, type DerivadosFicha } from '../../utils/calculosFicha';
import { SecaoRecolhivel } from '../common/SecaoRecolhivel';
import { Badge } from '../common/Badge';

export interface AbaAtributosProps {
  ficha: FichaPersonagem;
  derivados: DerivadosFicha;
  /** Sem ele (visão do jogador), os atributos ficam só para leitura. */
  onEditar?: () => void;
}

const PILARES = [
  { id: 'fisico', titulo: 'Pilar Físico (a Matéria)', icone: <Shield className="w-4 h-4 text-amber-400" />, valor: 'gold-gradient-text', badge: 'gold' as const },
  { id: 'etereo', titulo: 'Pilar Etéreo (o Imaterial)', icone: <Sparkles className="w-4 h-4 text-cyan-400" />, valor: 'text-cyan-300', badge: 'cyan' as const },
];

export const AbaAtributos: React.FC<AbaAtributosProps> = ({ ficha, derivados, onEditar }) => {
  const botaoEditar = onEditar && (
    <button
      type="button"
      onClick={onEditar}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-cinzel text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 cursor-pointer"
    >
      <Pencil className="w-3 h-3" />
      Editar
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {PILARES.map((pilar) => (
          <SecaoRecolhivel key={pilar.id} chave={`atributos:${pilar.id}`} titulo={pilar.titulo} icone={pilar.icone} acoes={botaoEditar}>
            <ul className="space-y-2">
              {ATRIBUTOS_INFO.filter((a) => a.pilar === pilar.id).map((a) => {
                const grau = derivados.graus[a.sigla];
                return (
                  <li key={a.chave} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-painel border border-linha">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-cinzel text-sm font-bold text-pergaminho">
                          {a.nome} ({a.sigla})
                        </span>
                        <Badge variant={pilar.badge}>Grau {grau}</Badge>
                      </div>
                      <p className="text-[11px] text-nevoa font-sans-clean mt-0.5">{a.desc}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 shrink-0">
                      <span className={`text-2xl font-cinzel font-black tabular-nums ${pilar.valor}`}>{ficha[a.chave]}</span>
                      <span className="flex items-center gap-1 px-2 py-1 bg-abismo border border-linha-forte rounded text-[11px] font-mono font-bold text-amber-300">
                        <Dices className="w-3.5 h-3.5 text-amber-400" />
                        1d20 + G{grau}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SecaoRecolhivel>
        ))}
      </div>

      <SecaoRecolhivel chave="atributos:combate" titulo="Parâmetros de combate" icone={<Activity className="w-4 h-4 text-amber-400" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { rotulo: 'Defesa Física', valor: ficha.defFisica, nota: 'Reduz dano em HP', cor: 'text-pergaminho' },
            { rotulo: 'Defesa Oculta', valor: ficha.defOculta, nota: 'Reduz dano em Sanidade', cor: 'text-purple-300' },
            { rotulo: 'Regeneração de Mana', valor: `+${derivados.manaRegen}/turno`, nota: 'Consome Energia', cor: 'text-cyan-300' },
            { rotulo: 'Turnos em agonia', valor: `${derivados.turnosMorte} turnos`, nota: 'Se o HP chegar a 0', cor: 'text-red-400' },
          ].map((p) => (
            <div key={p.rotulo} className="p-3 bg-black/40 rounded border border-linha-forte">
              <span className="text-[10px] font-cinzel text-nevoa block">{p.rotulo}</span>
              <strong className={`text-lg sm:text-xl font-cinzel font-bold ${p.cor}`}>{p.valor}</strong>
              <span className="text-[10px] text-nevoa block mt-0.5">{p.nota}</span>
            </div>
          ))}
        </div>
      </SecaoRecolhivel>
    </div>
  );
};
