import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { useEstadoPersistido } from '../../hooks/useEstadoPersistido';

export interface SecaoRecolhivelProps {
  /** Identificador único e estável; o estado aberto/recolhido é lembrado por ele. */
  chave: string;
  titulo: React.ReactNode;
  icone?: React.ReactNode;
  /** Texto curto exibido ao lado do título (ex.: contagem). */
  resumo?: React.ReactNode;
  /** Ações à direita do cabeçalho; cliques nelas não recolhem a seção. */
  acoes?: React.ReactNode;
  abertaPorPadrao?: boolean;
  /** Controle externo opcional (ex.: "recolher todas"). */
  aberta?: boolean;
  onAlternar?: (aberta: boolean) => void;
  children: React.ReactNode;
}

export const SecaoRecolhivel: React.FC<SecaoRecolhivelProps> = ({
  chave,
  titulo,
  icone,
  resumo,
  acoes,
  abertaPorPadrao = true,
  aberta: abertaControlada,
  onAlternar,
  children,
}) => {
  const conteudoId = useId();
  const [abertaInterna, setAbertaInterna] = useEstadoPersistido<boolean>(`secao:${chave}`, abertaPorPadrao);
  const aberta = abertaControlada ?? abertaInterna;

  const alternar = () => {
    const nova = !aberta;
    // Controlada: quem controla guarda o estado; não grava uma segunda cópia.
    if (abertaControlada === undefined) setAbertaInterna(nova);
    onAlternar?.(nova);
  };

  return (
    <section className="rounded-xl border border-[#23293a] bg-[#0d0f16]/80">
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
        <button
          type="button"
          onClick={alternar}
          aria-expanded={aberta}
          aria-controls={conteudoId}
          className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer group py-1"
        >
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-amber-400 transition-transform duration-200 ${aberta ? '' : '-rotate-90'}`}
            aria-hidden="true"
          />
          {icone && <span className="shrink-0">{icone}</span>}
          <span className="font-cinzel text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider group-hover:text-amber-200 truncate">
            {titulo}
          </span>
          {resumo && <span className="text-[11px] text-[#8c93a4] font-sans-clean shrink-0">{resumo}</span>}
          <span className="sr-only">{aberta ? '(recolher)' : '(expandir)'}</span>
        </button>
        {acoes && <div className="flex items-center gap-1.5 shrink-0">{acoes}</div>}
      </div>
      <div id={conteudoId} hidden={!aberta} className="px-3 sm:px-4 pb-4 pt-1">
        {children}
      </div>
    </section>
  );
};
