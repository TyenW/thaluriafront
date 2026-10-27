import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Coins, Hammer, Map as MapIcon, Package, Search, Store, Truck } from 'lucide-react';
import type { ResumoComercio, ResumoLoja, TipoLoja } from '../../types/comercio';
import { ROTULO_TIPO_LOJA as ROTULO_TIPO, formatarLatao, rotuloTipoLoja } from '../../utils/formatadores';
import { Badge } from '../common/Badge';
import { EstadoVazio } from '../common/EstadoVazio';

const Indicador: React.FC<{ rotulo: string; valor: React.ReactNode; icone: React.ReactNode; destaque?: 'alerta' }> = ({ rotulo, valor, icone, destaque }) => (
  <div className={`rounded-xl border p-3 sm:p-4 bg-painel ${destaque ? 'border-amber-600/40' : 'border-linha'}`}>
    <div className="flex items-center gap-1.5 text-[11px] font-cinzel uppercase tracking-wider text-nevoa">
      <span className="text-amber-400 [&>svg]:w-3.5 [&>svg]:h-3.5">{icone}</span>
      {rotulo}
    </div>
    <div className="mt-1 text-lg sm:text-xl font-cinzel font-bold text-pergaminho">{valor}</div>
  </div>
);

/** Saldo da semana: entradas menos saídas no livro-caixa. */
const saldoSemana = (l: ResumoLoja) => l.entradasSemanaLatao - l.saidasSemanaLatao;

const SaldoSemana: React.FC<{ loja: ResumoLoja }> = ({ loja }) => {
  const s = saldoSemana(loja);
  return <span className={`font-mono ${s > 0 ? 'text-emerald-300' : s < 0 ? 'text-red-300' : 'text-nevoa'}`}>{s > 0 ? '+' : ''}{formatarLatao(s)}</span>;
};

type Ordem = 'nome' | 'caixa' | 'saldo' | 'alertas';

export interface ListaLojasProps {
  resumo: ResumoComercio;
  onAbrir: (id: number) => void;
}

/** Painel geral: indicadores do mundo e a lista de todas as lojas com filtros. */
export const ListaLojas: React.FC<ListaLojasProps> = ({ resumo, onAbrir }) => {
  const [busca, setBusca] = useState('');
  const [cidade, setCidade] = useState('');
  const [tipo, setTipo] = useState<TipoLoja | ''>('');
  const [soAlertas, setSoAlertas] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>('alertas');

  const cidades = useMemo(() => [...new Set(resumo.lojas.map((l) => l.cidade ?? '—'))].sort((a, b) => a.localeCompare(b)), [resumo]);

  const lojas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = resumo.lojas.filter(
      (l) =>
        (!termo || `${l.nome} ${l.mercador} ${l.cidade}`.toLowerCase().includes(termo)) &&
        (!cidade || (l.cidade ?? '—') === cidade) &&
        (!tipo || l.tipo === tipo) &&
        (!soAlertas || l.alertas.length > 0)
    );
    const cmp: Record<Ordem, (a: ResumoLoja, b: ResumoLoja) => number> = {
      nome: (a, b) => a.nome.localeCompare(b.nome),
      caixa: (a, b) => b.caixaLatao - a.caixaLatao,
      saldo: (a, b) => saldoSemana(b) - saldoSemana(a),
      alertas: (a, b) => b.alertas.length - a.alertas.length || a.nome.localeCompare(b.nome),
    };
    return lista.sort(cmp[ordem]);
  }, [resumo, busca, cidade, tipo, soAlertas, ordem]);

  const t = resumo.totais;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Indicador rotulo="Lojas" valor={t.lojas} icone={<Store />} />
        <Indicador rotulo="Caixa somado" valor={formatarLatao(t.caixaLatao)} icone={<Coins />} />
        <Indicador rotulo="Em produção" valor={`${t.ordensEmAndamento} lotes`} icone={<Hammer />} />
        <Indicador rotulo="Em alerta" valor={t.lojasEmAlerta} icone={<AlertTriangle />} destaque={t.lojasEmAlerta > 0 ? 'alerta' : undefined} />
      </div>

      <Link
        to="/mapa"
        className="flex items-center gap-2 p-3 rounded-xl border border-linha bg-painel hover:border-ouro/40 text-xs text-texto-2 transition-colors"
      >
        <Truck className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="flex-1">
          <strong className="font-cinzel text-pergaminho">{t.caravanasEmViagem ?? 0} caravanas</strong> levando mercadorias entre as cidades agora.
        </span>
        <span className="inline-flex items-center gap-1 font-cinzel text-amber-300">
          <MapIcon className="w-3.5 h-3.5" /> Ver no mapa
        </span>
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-2">
        <label className="relative block">
          <span className="sr-only">Buscar loja</span>
          <Search className="w-4 h-4 text-nevoa absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar loja, mercador ou cidade…" className="campo pl-9" />
        </label>
        <select aria-label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className="campo">
          <option value="">Todas as cidades</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select aria-label="Especialidade" value={tipo} onChange={(e) => setTipo(e.target.value as TipoLoja | '')} className="campo">
          <option value="">Todas as especialidades</option>
          {(Object.keys(ROTULO_TIPO) as TipoLoja[]).map((k) => (
            <option key={k} value={k}>
              {ROTULO_TIPO[k]}
            </option>
          ))}
        </select>
        <select aria-label="Ordenar por" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="campo">
          <option value="alertas">Alertas primeiro</option>
          <option value="saldo">Melhor semana</option>
          <option value="caixa">Maior caixa</option>
          <option value="nome">Nome</option>
        </select>
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-texto-2 cursor-pointer">
        <input type="checkbox" checked={soAlertas} onChange={(e) => setSoAlertas(e.target.checked)} className="accent-amber-500 w-4 h-4" />
        Só lojas com alerta
      </label>

      {lojas.length === 0 ? (
        <EstadoVazio icone={<Store />} titulo="Nenhuma loja encontrada">
          Ajuste os filtros, ou crie lojas em Gerenciar → Lojas.
        </EstadoVazio>
      ) : (
        <>
          <p className="text-[11px] text-nevoa">
            {lojas.length} loja(s) · saldo dos últimos {resumo.diasDoResumo} dias (dia {resumo.dia})
          </p>

          {/* Celular */}
          <ul className="md:hidden space-y-2">
            {lojas.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => onAbrir(l.id)} className="w-full text-left p-3 rounded-xl bg-painel border border-linha hover:border-ouro/40 cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block font-cinzel font-bold text-sm text-pergaminho break-words">{l.nome}</span>
                      <span className="block text-[11px] text-nevoa">
                        {rotuloTipoLoja(l.tipo)} · {l.cidade} · Nv. {l.nivel}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-nevoa shrink-0 mt-1" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="text-nevoa">
                      Caixa <strong className="font-mono text-amber-300">{formatarLatao(l.caixaLatao)}</strong>
                    </span>
                    <span className="text-nevoa">
                      Semana <SaldoSemana loja={l} />
                    </span>
                  </div>
                  {l.alertas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {l.alertas.map((a) => (
                        <Badge key={a} variant="danger">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-linha">
            <table className="w-full text-left text-xs font-sans-clean">
              <thead className="bg-painel">
                <tr className="border-b border-linha text-nevoa font-cinzel uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Loja</th>
                  <th className="py-2.5 px-3">Cidade</th>
                  <th className="py-2.5 px-3 text-right">Caixa</th>
                  <th className="py-2.5 px-3 text-right">Estoque</th>
                  <th className="py-2.5 px-3 text-right">Semana</th>
                  <th className="py-2.5 px-3 text-center">Oficina</th>
                  <th className="py-2.5 px-3">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {lojas.map((l) => (
                  <tr key={l.id} onClick={() => onAbrir(l.id)} className="hover:bg-white/5 cursor-pointer">
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAbrir(l.id);
                        }}
                        className="text-left cursor-pointer"
                      >
                        <span className="block font-cinzel font-bold text-pergaminho">{l.nome}</span>
                        <span className="block text-[11px] text-nevoa">
                          {rotuloTipoLoja(l.tipo)} · Nv. {l.nivel} · {l.mercador}
                        </span>
                      </button>
                    </td>
                    <td className="py-2 px-3 text-texto-2">{l.cidade}</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-300 whitespace-nowrap">{formatarLatao(l.caixaLatao)}</td>
                    <td className="py-2 px-3 text-right text-texto-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Package className="w-3 h-3 text-nevoa" /> {l.unidades}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <SaldoSemana loja={l} />
                    </td>
                    <td className="py-2 px-3 text-center text-texto-2">{l.ordens > 0 ? `${l.ordens} lote(s)` : '—'}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {l.alertas.map((a) => (
                          <Badge key={a} variant="danger">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
