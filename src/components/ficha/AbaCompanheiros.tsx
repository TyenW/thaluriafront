import React from 'react';
import { Footprints, Swords } from 'lucide-react';
import type { FichaPersonagem } from '../../types/ficha';
import { Badge } from '../common/Badge';

export const AbaCompanheiros: React.FC<{ ficha: FichaPersonagem }> = ({ ficha }) => {
  const domados = ficha.domados ?? [];

  if (domados.length === 0) {
    return (
      <div className="text-center py-12 px-6 rounded-xl border border-dashed border-linha-forte bg-abismo">
        <Footprints className="w-12 h-12 text-amber-500/40 mx-auto mb-3" />
        <h3 className="text-lg font-cinzel font-bold text-pergaminho mb-1">Nenhum companheiro domado</h3>
        <p className="text-xs text-nevoa font-sans-clean max-w-md mx-auto">
          Criaturas domadas com a perícia <strong>Adestramento</strong> (Espírito) aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {domados.map((m) => {
        // O servidor serializa slots vazios como "" ou "null".
        const golpes = (m.golpesAtivos ?? []).filter((g) => g && g.trim() && g !== 'null');
        return (
          <li key={m.idDomado} className="p-5 rounded-lg bg-painel border border-purple-600/40">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="purple">Domado #{m.idDomado}</Badge>
              {m.bestaDeCarga && <Badge variant="gold">Besta de carga</Badge>}
            </div>
            <h4 className="text-lg font-cinzel font-bold text-pergaminho">{m.apelido}</h4>
            <span className="text-xs text-nevoa font-cinzel block mb-3">
              Espécie: <strong className="text-purple-300">{m.especie}</strong>
            </span>
            <span className="text-[11px] font-cinzel text-amber-400 block mb-1.5">Golpes ativos ({golpes.length}/4)</span>
            {golpes.length > 0 ? (
              <ul className="grid grid-cols-2 gap-2">
                {golpes.map((g, i) => (
                  <li key={i} className="flex items-center gap-1.5 p-2 bg-abismo rounded border border-linha-forte text-xs font-cinzel text-gray-300">
                    <Swords className="w-3 h-3 text-amber-400 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic p-2 bg-abismo rounded border border-linha-forte">Nenhum golpe configurado</p>
            )}
          </li>
        );
      })}
    </ul>
  );
};
