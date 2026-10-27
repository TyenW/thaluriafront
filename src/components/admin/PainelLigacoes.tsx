import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Link2 } from 'lucide-react';
import { adminService, type GrupoLigacoes } from '../../services/adminService';

export interface PainelLigacoesProps {
  entidade: string;
  id: string;
  /** Abre o registro ligado (ex.: a receita que produz o item). */
  onAbrir: (entidade: string, id: string) => void;
  /** Muda quando o registro é salvo, para recarregar as ligações. */
  versao?: number;
}

/** Onde o registro aparece no mundo: quem produz, usa, dropa, vende... cada um clicável. */
export const PainelLigacoes: React.FC<PainelLigacoesProps> = ({ entidade, id, onAbrir, versao = 0 }) => {
  const [grupos, setGrupos] = useState<GrupoLigacoes[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    adminService
      .ligacoes(entidade, id)
      .then((g) => vivo && (setGrupos(g), setErro(null)))
      .catch((e) => vivo && setErro(e.message || 'Não foi possível carregar as ligações.'));
    return () => {
      vivo = false;
    };
  }, [entidade, id, versao]);

  return (
    <section aria-label="Ligações" className="rounded-xl border border-linha bg-abismo/70 p-3 space-y-3">
      <h4 className="flex items-center gap-1.5 font-cinzel text-xs font-bold text-amber-300 uppercase tracking-wider">
        <Link2 className="w-4 h-4" /> Ligações no mundo
      </h4>
      {erro ? (
        <p className="text-[11px] text-red-300">{erro}</p>
      ) : !grupos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-16 rounded-lg bg-painel-alto animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {grupos.map((g) => (
            <div key={g.titulo} className="min-w-0">
              <p className="text-[10px] font-cinzel font-bold uppercase tracking-widest text-nevoa mb-1">
                {g.titulo} {g.itens.length > 0 && <span className="font-mono text-amber-300/80">({g.itens.length})</span>}
              </p>
              {g.itens.length === 0 ? (
                <p className="text-[11px] text-apagado italic">{g.vazio}</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto overscroll-contain">
                  {g.itens.map((i, k) => {
                    const clicavel = g.entidade && i.id != null;
                    const conteudo = (
                      <>
                        <span className="truncate text-pergaminho">{i.nome || '—'}</span>
                        {i.detalhe && <span className="shrink-0 font-mono text-[10px] text-nevoa">{i.detalhe}</span>}
                        {clicavel && <ArrowUpRight className="w-3 h-3 shrink-0 text-amber-400" aria-hidden="true" />}
                      </>
                    );
                    const classe = 'inline-flex items-center gap-1.5 max-w-full px-2 py-1 rounded-md border border-linha bg-painel text-[11px]';
                    return (
                      <li key={`${i.id}-${k}`} className="max-w-full">
                        {clicavel ? (
                          <button
                            type="button"
                            onClick={() => onAbrir(g.entidade!, String(i.id))}
                            className={`${classe} hover:border-ouro/50 hover:bg-amber-400/10 cursor-pointer`}
                            title={`Abrir ${i.nome}`}
                          >
                            {conteudo}
                          </button>
                        ) : (
                          <span className={classe}>{conteudo}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
