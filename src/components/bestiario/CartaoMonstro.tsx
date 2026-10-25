import React, { useState } from 'react';
import { Crown, HelpCircle, PawPrint, Skull, Swords } from 'lucide-react';
import type { MonstroBestiario } from '../../types/monstro';
import { rotuloEnum } from '../../utils/formatadores';
import { Badge } from '../common/Badge';

/** Cor de destaque por elemento (mesma lista ELEMENTOS do back-end). */
const COR_ELEMENTO: Record<string, string> = {
  FOGO: 'from-orange-600/40',
  AGUA: 'from-sky-600/40',
  GELO: 'from-cyan-400/30',
  TERRA: 'from-amber-800/40',
  AR: 'from-slate-300/20',
  RAIO: 'from-yellow-400/30',
  LUZ: 'from-amber-200/30',
  TREVAS: 'from-purple-900/50',
  NATUREZA: 'from-emerald-600/40',
  VENENO: 'from-lime-600/40',
  ARCANO: 'from-fuchsia-600/40',
  NEUTRO: 'from-slate-500/20',
};

export interface CartaoMonstroProps {
  monstro: MonstroBestiario;
  /** Exibe aviso de que os golpes são cadastrados à parte (pré-visualização do Mestre). */
  previa?: boolean;
}

/** Entrada do bestiário: ilustração, habitat, elementos e os 4 golpes ativos. */
export const CartaoMonstro: React.FC<CartaoMonstroProps> = ({ monstro: m, previa = false }) => {
  const [imagemQuebrada, setImagemQuebrada] = useState(false);

  if (!m.revelado) {
    return (
      <article className="h-full rounded-xl border border-dashed border-linha-forte bg-abismo/60 p-6 flex flex-col items-center justify-center text-center min-h-64">
        <span className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-apagado mb-3">
          <HelpCircle className="w-6 h-6" />
        </span>
        <h3 className="font-cinzel text-lg font-bold text-nevoa">???</h3>
        <p className="text-xs text-apagado mt-1 max-w-[16rem]">Criatura ainda não estudada pela expedição.</p>
      </article>
    );
  }

  const gradiente = COR_ELEMENTO[m.elemento ?? ''] ?? COR_ELEMENTO.NEUTRO;
  const golpes = (m.golpesPokemon ?? []).slice(0, 4);

  return (
    <article className="h-full rounded-xl border border-linha bg-painel overflow-hidden flex flex-col hover:border-ouro/40 transition-colors">
      <div className={`relative aspect-[4/3] bg-gradient-to-b ${gradiente} to-abismo`}>
        {m.imagemUrl && !imagemQuebrada ? (
          <img src={m.imagemUrl} alt={`Ilustração de ${m.nome}`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={() => setImagemQuebrada(true)} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-white/15">
            <Skull className="w-16 h-16" />
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-painel to-transparent" />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {m.chefe && (
            <Badge variant="danger" icon={<Crown className="w-3 h-3" />}>
              Chefe
            </Badge>
          )}
          {m.domesticavel && (
            <Badge variant="cyan" icon={<PawPrint className="w-3 h-3" />}>
              Domável
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3 -mt-6 relative">
        <header>
          <h3 className="font-cinzel text-lg font-bold text-pergaminho leading-tight break-words">{m.nome}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {m.elemento && <Badge variant="gold">{rotuloEnum(m.elemento)}</Badge>}
            {m.elementoSecundario && <Badge variant="purple">{rotuloEnum(m.elementoSecundario)}</Badge>}
            {m.porte && <Badge variant="muted">{rotuloEnum(m.porte)}</Badge>}
            {m.regiao && <span className="text-[11px] text-nevoa">· {rotuloEnum(m.regiao)}</span>}
          </div>
        </header>

        {m.descricao && <p className="text-xs text-texto-2 leading-relaxed line-clamp-4">{m.descricao}</p>}

        <section className="mt-auto">
          <p className="text-[11px] font-cinzel text-amber-500/80 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Swords className="w-3.5 h-3.5" /> Golpes ativos
          </p>
          {golpes.length > 0 ? (
            <ul className="grid grid-cols-2 gap-1.5">
              {golpes.map((g, i) => (
                <li key={i} className="p-2 rounded-lg bg-abismo border border-linha min-w-0">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <strong className="text-amber-200 font-cinzel truncate">{g.nome}</strong>
                    <span className="text-[10px] text-cyan-400 font-mono shrink-0">{g.dados}</span>
                  </div>
                  <span className="text-[10px] text-nevoa block mt-0.5 truncate">{rotuloEnum(g.categoria)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-apagado italic p-2 rounded-lg bg-abismo text-center">
              {previa ? 'Cadastre os golpes depois de salvar a espécie.' : 'Golpes ainda não registrados.'}
            </p>
          )}
        </section>
      </div>
    </article>
  );
};
