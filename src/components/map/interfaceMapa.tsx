import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Droplets, Eye, EyeOff, Footprints, MapPin, Mountain, Pencil, Route, ScrollText, Ship, Store, Sun, X } from 'lucide-react';
import type { TipoCidade } from '../../data/atlasThaluria';
import { GlifoCidade } from './ornamentosMapa';
import {
  CARTAO_MAPA,
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
        ? // Etiqueta de couro escuro com filete de latão
          'border-[#c5a059] bg-[#3a2a1a] text-[#f3e7c3] font-bold shadow-[inset_0_0_0_1px_rgba(197,160,89,0.35)]'
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
      <li className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden="true" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="#8a3b2a" strokeWidth="1.4" strokeDasharray="6 3 1.5 3" />
        </svg>
        Fronteira de reino
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="-14 -14 28 28" aria-hidden="true" className="shrink-0">
          <circle r={11} fill="#9a3412" stroke="#4a1208" strokeWidth={1} />
          <text y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fbe7c4">
            3
          </text>
        </svg>
        Caravanas no mesmo ponto
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
  /** Cor do reino (faixa do cabeçalho). */
  corReino?: string;
  /** É a cidade onde o personagem do jogador está. */
  minhaCidade?: boolean;
  rotasDaCidade: RotaDaCidade[];
  mestre: boolean;
  podeAlterar: boolean;
  salvando: boolean;
  erro: string | null;
  onFechar: () => void;
  onIr: (nome: string) => void;
  onAlterar: (nome: string, nivel: NivelVisibilidade) => void;
}

/** O que os jogadores enxergam em cada nível (explicado no controle do Mestre). */
const EFEITO_VISIBILIDADE: Record<NivelVisibilidade, string> = {
  OCULTO: 'Os jogadores não veem esta cidade nem as rotas que chegam nela.',
  ROTA_E_NOME_APENAS: 'Veem o nome e as rotas, mas não a descrição, o clima nem as lojas.',
  INFORMACOES_COMPLETAS: 'Veem tudo: descrição, clima, solo, água, lojas e rotas.',
};

const OPCOES_VISIBILIDADE: { nivel: NivelVisibilidade; rotulo: string; icone: React.ReactNode }[] = [
  { nivel: 'OCULTO', rotulo: 'Oculta', icone: <EyeOff className="h-3.5 w-3.5" /> },
  { nivel: 'ROTA_E_NOME_APENAS', rotulo: 'Só nome', icone: <ScrollText className="h-3.5 w-3.5" /> },
  { nivel: 'INFORMACOES_COMPLETAS', rotulo: 'Revelada', icone: <Eye className="h-3.5 w-3.5" /> },
];

/** Km por dia de viagem: estimativa de mesa, só para dar noção ao grupo. */
const KM_POR_DIA = { terra: 30, mar: 90 };

const tempoDeViagem = (km: number, maritima: boolean) => {
  const dias = km / (maritima ? KM_POR_DIA.mar : KM_POR_DIA.terra);
  if (dias < 0.75) return `≈ ${Math.max(1, Math.round(dias * 24))} h`;
  const d = Math.round(dias * 2) / 2;
  return `≈ ${d.toLocaleString('pt-BR')} dia${d === 1 ? '' : 's'}`;
};

const Fato: React.FC<{ icone: React.ReactNode; rotulo: string; valor: string }> = ({ icone, rotulo, valor }) => (
  <div className="flex min-w-0 flex-col items-center gap-0.5 rounded-md border border-tinta/15 bg-papel-claro/60 px-1.5 py-2 text-center">
    <span className="text-tinta-suave">{icone}</span>
    <span className="text-[10px] uppercase tracking-wider text-tinta-suave">{rotulo}</span>
    <span className="w-full truncate text-sm font-semibold leading-tight" title={valor}>
      {valor}
    </span>
  </div>
);

export const FichaCidade: React.FC<FichaCidadeProps> = ({
  atual,
  reino,
  corReino,
  minhaCidade,
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
  // No celular a ficha abre pela metade para o mapa seguir à vista; um toque na alça expande.
  const [expandida, setExpandida] = useState(false);
  const rotas = [...rotasDaCidade].sort((x, y) => x.distanciaKm - y.distanciaKm);
  const nomeReino = reino && a.reino !== 'ilhas' ? (a.reino === 'campos' ? reino : `Reino de ${reino}`) : a.reino === 'ilhas' ? 'Ilhas de Thalúria' : undefined;
  const lojas = api?.lojasLista ?? [];

  return (
    <aside
      aria-label={`Ficha de ${a.nome}`}
      className={`fixed inset-x-0 bottom-0 z-40 flex w-full flex-col overflow-hidden rounded-t-2xl ${CARTAO_MAPA} transition-[max-height] duration-300 sm:absolute sm:inset-auto sm:bottom-auto sm:left-4 sm:top-4 sm:max-h-[calc(100%-2rem)] sm:w-[22rem] sm:rounded-xl ${
        expandida ? 'max-h-[88vh]' : 'max-h-[58vh]'
      }`}
      style={{ fontFamily: FONTE_MAPA }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Faixa na cor do reino */}
      <div className="h-1.5 shrink-0" style={{ background: corReino ?? '#8a6a3a' }} aria-hidden="true" />

      {/* Alça (celular): expande / recolhe */}
      <button
        type="button"
        onClick={() => setExpandida((v) => !v)}
        aria-label={expandida ? 'Recolher ficha' : 'Expandir ficha'}
        aria-expanded={expandida}
        className="mx-auto flex shrink-0 cursor-pointer items-center justify-center px-6 pt-2 pb-1 sm:hidden"
      >
        <span className="h-1.5 w-12 rounded-full bg-tinta/25" />
      </button>

      {/* Cabeçalho */}
      <header className="flex shrink-0 items-start gap-3 border-b border-tinta/15 px-4 pb-3 pt-1 sm:pt-3">
        <svg
          width="46"
          height="46"
          viewBox="-13 -13 26 26"
          aria-hidden="true"
          className="shrink-0 rounded-full border-2 bg-papel-claro"
          style={{ borderColor: corReino ?? '#8a6a3a' }}
        >
          <GlifoCidade tipo={a.tipo} parcial={vis === 'ROTA_E_NOME_APENAS'} />
        </svg>
        <div className="min-w-0 flex-1">
          <h4 className="break-words text-xl font-bold leading-tight" style={{ fontFamily: FONTE_MAPA_SC }}>
            {a.nome}
          </h4>
          <p className="text-xs italic text-tinta-suave">
            {ROTULO_TIPO[a.tipo]}
            {nomeReino ? ` · ${nomeReino}` : ''}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {minhaCidade && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-800/30 bg-sky-700/15 px-2 py-0.5 text-[10px] font-bold text-sky-900">
                <MapPin className="h-3 w-3" /> Sua cidade
              </span>
            )}
            {api?.temPorto && (
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-900/25 bg-cyan-800/10 px-2 py-0.5 text-[10px] font-bold text-cyan-900">
                <Anchor className="h-3 w-3" /> Porto
              </span>
            )}
            {mestre && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  vis === 'OCULTO'
                    ? 'border-tinta-rubra/30 bg-tinta-rubra/10 text-tinta-rubra'
                    : vis === 'ROTA_E_NOME_APENAS'
                    ? 'border-amber-800/30 bg-amber-700/10 text-amber-900'
                    : 'border-emerald-800/30 bg-emerald-700/10 text-emerald-900'
                }`}
                title="O que os jogadores enxergam"
              >
                {vis === 'OCULTO' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Jogadores: {ROTULO_VISIBILIDADE[vis]}
              </span>
            )}
          </div>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="-mr-1 shrink-0 cursor-pointer rounded-md p-1.5 text-tinta-suave hover:bg-tinta/10">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-3">
        {/* Descrição e fatos */}
        {completa && api?.descricao && <p className="whitespace-pre-line text-sm italic leading-relaxed text-tinta">{api.descricao}</p>}

        {completa && api && (api.regiao || api.geologia || api.aquifero) && (
          <div className="grid grid-cols-3 gap-1.5">
            {api.regiao && <Fato icone={<Sun className="h-4 w-4" />} rotulo="Clima" valor={formatarEnum(api.regiao)} />}
            {api.geologia && <Fato icone={<Mountain className="h-4 w-4" />} rotulo="Solo" valor={formatarEnum(api.geologia)} />}
            {api.aquifero && <Fato icone={<Droplets className="h-4 w-4" />} rotulo="Água" valor={formatarEnum(api.aquifero)} />}
          </div>
        )}

        {vis === 'ROTA_E_NOME_APENAS' && (
          <p className="flex items-start gap-2 rounded-md border border-dashed border-tinta/30 px-3 py-2 text-xs italic text-tinta-suave">
            <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Só se conhecem o nome e os caminhos até aqui. O resto, só indo lá.
          </p>
        )}

        {/* Lojas */}
        {completa && typeof api?.lojas === 'number' && (
          <section>
            <h5 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-tinta-suave">
              <Store className="h-3.5 w-3.5" /> Comércio ({api.lojas})
            </h5>
            {api.lojas === 0 ? (
              <p className="text-xs italic text-tinta-suave">Nenhuma loja estabelecida.</p>
            ) : lojas.length > 0 ? (
              <ul className="space-y-1">
                {lojas.map((l) => (
                  <li key={l.id} className="flex items-baseline justify-between gap-2 border-b border-dotted border-tinta/20 pb-1 text-sm last:border-0">
                    <span className="min-w-0 truncate">{l.nome}</span>
                    <span className="shrink-0 text-[11px] italic text-tinta-suave">{l.tipo}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        )}

        {/* Rotas */}
        {rotas.length > 0 && (
          <section>
            <h5 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-tinta-suave">
              <Route className="h-3.5 w-3.5" /> Caminhos ({rotas.length})
            </h5>
            <ul className="space-y-1">
              {rotas.map((r) => {
                const perigo = r.info?.perigo ?? (r.maritima ? 4 : 3);
                const corP = getCorPerigo(perigo);
                const bloqueada = !!r.info?.bloqueada;
                const conteudo = (
                  <>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${r.maritima ? 'bg-cyan-900/10 text-cyan-900' : 'bg-tinta/10 text-tinta'}`}>
                      {r.maritima ? <Ship className="h-3.5 w-3.5" /> : <Footprints className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-semibold ${r.visivel ? '' : 'italic text-tinta-suave'}`}>{r.visivel ? r.destino : 'Destino desconhecido'}</span>
                      <span className="block text-[11px] text-tinta-suave">
                        {r.distanciaKm} km · {tempoDeViagem(r.distanciaKm, r.maritima)} {r.maritima ? 'de barco' : 'a pé'}
                      </span>
                    </span>
                    {bloqueada ? (
                      <span className="shrink-0 rounded border border-tinta-rubra/40 bg-tinta-rubra/10 px-1.5 py-0.5 text-[10px] font-bold text-tinta-rubra">Bloqueada</span>
                    ) : (
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${corP.bg} ${corP.texto} ${corP.borda}`} title={`Perigo ${perigo}/10`}>
                        {corP.rotulo}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={`${r.destino}-${r.maritima}`}>
                    {r.visivel || mestre ? (
                      <button
                        type="button"
                        onClick={() => onIr(r.destino)}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-tinta/10"
                      >
                        {conteudo}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2.5 px-1.5 py-1.5">{conteudo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Mestre: o que os jogadores veem */}
        {mestre && podeAlterar && (
          <section>
            <h5 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-tinta-suave">
              <Eye className="h-3.5 w-3.5" /> Visão dos jogadores
            </h5>
            <div role="radiogroup" aria-label="Visão dos jogadores" className="grid grid-cols-3 gap-1 rounded-lg border border-tinta/25 bg-papel-claro/60 p-1">
              {OPCOES_VISIBILIDADE.map((o) => {
                const ativo = vis === o.nivel;
                return (
                  <button
                    key={o.nivel}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    disabled={salvando}
                    onClick={() => !ativo && onAlterar(a.nome, o.nivel)}
                    className={`flex cursor-pointer items-center justify-center gap-1 rounded-md px-1 py-1.5 text-xs font-semibold transition-colors disabled:cursor-wait ${
                      ativo ? 'bg-tinta text-papel shadow' : 'text-tinta hover:bg-tinta/10'
                    }`}
                  >
                    {o.icone}
                    {o.rotulo}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] italic text-tinta-suave">{salvando ? 'Salvando…' : EFEITO_VISIBILIDADE[vis]}</p>
            {erro && <p className="mt-1 text-xs text-tinta-rubra">{erro}</p>}
          </section>
        )}
      </div>

      {/* Atalhos do Mestre */}
      {mestre && api?.id != null && (
        <footer className="flex shrink-0 gap-2 border-t border-tinta/15 bg-papel-claro/50 px-4 py-2.5">
          <Link
            to={`/mestre/gerenciar?entidade=cidades&abrir=${api.id}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-tinta/40 px-2 py-1.5 text-xs font-semibold hover:bg-tinta/10"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar cidade
          </Link>
          <Link
            to="/mestre/comercio"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-tinta/40 px-2 py-1.5 text-xs font-semibold hover:bg-tinta/10"
          >
            <Store className="h-3.5 w-3.5" /> Comércio
          </Link>
        </footer>
      )}
    </aside>
  );
};
