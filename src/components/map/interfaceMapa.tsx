import React from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import type { TipoCidade } from '../../data/atlasThaluria';
import { GlifoCidade } from './ornamentosMapa';
import {
  FONTE_MAPA,
  FONTE_MAPA_SC,
  ROTULO_TIPO,
  ROTULO_VISIBILIDADE,
  formatarEnum,
  getCorPerigo,
  type CidadeResolvida,
  type NivelVisibilidade,
  type RotaDaCidade,
} from './estiloMapa';

// ---------------------------------------------------------------------------
// Subcomponentes de interface
// ---------------------------------------------------------------------------
export const BotaoMapa: React.FC<{
  rotulo: string;
  onClick: () => void;
  ativo?: boolean;
  children: React.ReactNode;
}> = ({ rotulo, onClick, ativo = false, children }) => (
  <button
    type="button"
    aria-label={rotulo}
    title={rotulo}
    onClick={onClick}
    onPointerDown={(e) => e.stopPropagation()}
    className={`flex h-8 cursor-pointer items-center justify-center rounded border px-2 shadow transition-colors ${
      ativo
        ? 'border-amber-600 bg-amber-400 text-tinta-escura font-bold shadow-amber-500/30'
        : 'border-tinta/70 bg-papel/90 text-tinta hover:bg-papel-claro'
    }`}
  >
    {children}
  </button>
);

export const Legenda: React.FC = () => (
  <div className="grimorio-card rounded-lg p-4">
    <h3 className="mb-3 border-b border-linha pb-2 font-cinzel text-sm font-bold text-pergaminho">Legenda</h3>
    <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-sans-clean text-texto-2">
      {(['capital', 'cidade', 'vila', 'porto', 'fortaleza'] as TipoCidade[]).map((t) => (
        <li key={t} className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="-12 -12 24 24" aria-hidden="true" className="shrink-0 rounded-sm bg-papel-velho">
            <GlifoCidade tipo={t} parcial={false} />
          </svg>
          {ROTULO_TIPO[t]}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="-12 -12 24 24" aria-hidden="true" className="shrink-0 rounded-sm bg-papel-velho">
          <GlifoCidade tipo="cidade" parcial />
        </svg>
        Só o nome é conhecido
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#261b10" strokeWidth="2.8" />
        </svg>
        Estrada principal
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#453220" strokeWidth="2.0" strokeDasharray="5 3" />
        </svg>
        Estrada secundária
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#334155" strokeWidth="2.2" strokeDasharray="3 4" strokeLinecap="round" />
        </svg>
        Rota marítima
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#8a3b2a" strokeWidth="2.0" strokeDasharray="2 4" strokeLinecap="round" />
        </svg>
        Rota bloqueada / perigosa
      </li>
      <li className="col-span-2 flex items-center gap-2 text-nevoa">
        <span className="inline-block h-3 w-3 shrink-0 rounded-sm border border-tinta-suave/60 bg-papel-nevoa" />
        Terra Incógnita — reino sob névoa
      </li>
    </ul>
  </div>
);

export interface FichaCidadeProps {
  atual: CidadeResolvida;
  reino?: string;
  rotasDaCidade: RotaDaCidade[];
  mestre: boolean;
  podeAlterar: boolean;
  salvando: boolean;
  erro: string | null;
  onFechar: () => void;
  onIr: (nome: string) => void;
  onAlterar: (nome: string, nivel: NivelVisibilidade) => void;
}

export const FichaCidade: React.FC<FichaCidadeProps> = ({
  atual,
  reino,
  rotasDaCidade,
  mestre,
  podeAlterar,
  salvando,
  erro,
  onFechar,
  onIr,
  onAlterar,
}) => {
  const { atlas: a, api, vis } = atual;
  const completa = vis === 'INFORMACOES_COMPLETAS';
  const ocultaParaJogador = vis === 'OCULTO';
  const niveis: NivelVisibilidade[] = ['OCULTO', 'ROTA_E_NOME_APENAS', 'INFORMACOES_COMPLETAS'];

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-40 max-h-[75vh] w-full overflow-y-auto rounded-t-2xl border-t-2 border-tinta bg-papel p-4 text-tinta shadow-2xl transition-transform sm:absolute sm:inset-auto sm:left-4 sm:top-4 sm:bottom-auto sm:max-h-[80%] sm:w-80 sm:rounded-lg sm:border sm:border-tinta/80 sm:bg-papel/95 sm:p-3.5"
      style={{ fontFamily: FONTE_MAPA }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Pill de arraste visual no mobile */}
      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-tinta/25 sm:hidden" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xl font-bold leading-tight" style={{ fontFamily: FONTE_MAPA_SC }}>
            {a.nome}
          </h4>
          <p className="text-xs italic text-tinta-suave">
            {ROTULO_TIPO[a.tipo]}
            {reino && a.reino !== 'ilhas' ? ` · ${a.reino === 'campos' ? reino : `Reino de ${reino}`}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="cursor-pointer rounded p-1 text-tinta-suave hover:bg-tinta/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mestre && ocultaParaJogador && (
        <p className="mt-2 rounded bg-tinta/10 px-2 py-1 text-[11px] italic">Oculta para os jogadores.</p>
      )}

      {completa && api && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {api.regiao && (
            <>
              <dt className="italic text-tinta-suave">Bioma</dt>
              <dd>{formatarEnum(api.regiao)}</dd>
            </>
          )}
          {api.geologia && (
            <>
              <dt className="italic text-tinta-suave">Solo</dt>
              <dd>{formatarEnum(api.geologia)}</dd>
            </>
          )}
          {api.aquifero && (
            <>
              <dt className="italic text-tinta-suave">Água</dt>
              <dd>{formatarEnum(api.aquifero)}</dd>
            </>
          )}
          {typeof api.lojas === 'number' && (
            <>
              <dt className="italic text-tinta-suave">Lojas</dt>
              <dd>{api.lojas}</dd>
            </>
          )}
        </dl>
      )}
      {vis === 'ROTA_E_NOME_APENAS' && (
        <p className="mt-3 text-sm italic text-tinta-suave">Apenas o nome e as rotas desta cidade são conhecidos.</p>
      )}
      {completa && !api && (
        <p className="mt-3 text-sm italic text-tinta-suave">Sem dados adicionais do servidor para este local.</p>
      )}

      {rotasDaCidade.length > 0 && (
        <div className="mt-3 border-t border-tinta/25 pt-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-tinta-suave">
            Rotas Conectadas ({rotasDaCidade.length})
          </p>
          <ul className="space-y-1 text-sm">
            {rotasDaCidade.map((r) => {
              const perigo = r.info?.perigo ?? (r.maritima ? 4 : 3);
              const corP = getCorPerigo(perigo);
              return (
                <li key={`${r.destino}-${r.maritima}`}>
                  <button
                    type="button"
                    onClick={() => onIr(r.destino)}
                    className="flex w-full cursor-pointer items-center justify-between rounded px-1.5 py-1 text-left transition-colors hover:bg-tinta/10"
                  >
                    <div>
                      <span className="font-semibold">{r.visivel ? r.destino : '??? Desconhecido'}</span>
                      <span className="text-xs italic text-tinta-suave block">
                        {r.maritima ? '⛵ por mar' : '🛣️ por terra'} · {r.distanciaKm} km
                        {r.info?.bloqueada ? ' · bloqueada' : ''}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${corP.bg} ${corP.texto} border ${corP.borda}`}>
                      Perigo {perigo}/10
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {mestre && podeAlterar && (
        <div className="mt-3 border-t border-tinta/25 pt-2">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-tinta-suave">
            {ocultaParaJogador ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Visão dos jogadores
          </p>
          <div className="flex flex-col gap-1">
            {niveis.map((n) => (
              <button
                key={n}
                type="button"
                disabled={salvando || vis === n}
                onClick={() => onAlterar(a.nome, n)}
                className={`cursor-pointer rounded border px-2 py-1 text-left text-xs transition-colors disabled:cursor-default ${
                  vis === n
                    ? 'border-tinta bg-tinta text-papel'
                    : 'border-tinta/40 hover:bg-tinta/10 disabled:opacity-50'
                }`}
              >
                {ROTULO_VISIBILIDADE[n]}
              </button>
            ))}
          </div>
          {erro && <p className="mt-1.5 text-xs text-tinta-rubra">{erro}</p>}
        </div>
      )}
    </aside>
  );
};

