import React, { useMemo, useState } from 'react';
import { Cog, FlaskConical, Gem, HandCoins, Lock, Package, Search, Shield, Sword, TrendingDown, TrendingUp } from 'lucide-react';
import type { DetalheLoja, MercadoriaLoja } from '../../types/comercio';
import { corRaridade, formatarLatao, rotuloEnum } from '../../utils/formatadores';
import { EstadoVazio } from '../common/EstadoVazio';
import { ModalVenderItem } from './ModalVenderItem';

/** Variação do preço de balcão em relação ao valor de referência do item. */
const Variacao: React.FC<{ m: MercadoriaLoja }> = ({ m }) => {
  if (m.precoBaseLatao <= 0) return null;
  const pct = Math.round((m.precoVendaLatao / m.precoBaseLatao - 1) * 100);
  if (Math.abs(pct) < 3) return <span className="text-[10px] text-nevoa">no preço</span>;
  const alta = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] ${alta ? 'text-amber-300' : 'text-sky-300'}`} title={alta ? 'Escassez: está caro' : 'Fartura: está barato'}>
      {alta ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {alta ? '+' : ''}
      {pct}%
    </span>
  );
};

/** Ícone usado quando o item ainda não tem ilustração. */
const iconeDoTipo = (tipo: string) => {
  if (tipo.startsWith('ARMA') || tipo === 'PROJETIL') return <Sword />;
  if (tipo === 'ARMADURA' || tipo === 'ESCUDO') return <Shield />;
  if (tipo === 'CONSUMIVEL') return <FlaskConical />;
  if (tipo === 'ACESSORIO' || tipo === 'MAGICO') return <Gem />;
  if (tipo.startsWith('COMPONENTE')) return <Cog />;
  return <Package />;
};

/** Cartão quadrado de uma mercadoria: ilustração em cima, números e ação embaixo. */
const CartaoMercadoria: React.FC<{ m: MercadoriaLoja; onVender: () => void }> = ({ m, onVender }) => {
  const [imagemQuebrada, setImagemQuebrada] = useState(false);
  const faltando = m.quantidade < m.demanda;
  const esgotado = m.quantidade === 0;
  return (
    <li className="rounded-xl bg-painel border border-linha overflow-hidden flex flex-col hover:border-linha-forte transition-colors">
      <div className="relative aspect-square bg-abismo flex items-center justify-center text-apagado [&>svg]:w-10 [&>svg]:h-10">
        {m.imagemUrl && !imagemQuebrada ? (
          <img src={m.imagemUrl} alt="" loading="lazy" onError={() => setImagemQuebrada(true)} className={`w-full h-full object-cover ${esgotado ? 'opacity-40 grayscale' : ''}`} />
        ) : (
          iconeDoTipo(m.tipo)
        )}
        <span
          className={`absolute top-1.5 right-1.5 min-w-7 px-1.5 py-0.5 rounded-md text-center font-mono text-xs font-bold border ${
            esgotado ? 'bg-red-950/90 border-red-500/50 text-red-200' : 'bg-abismo/90 border-linha text-pergaminho'
          }`}
          title="Unidades na prateleira"
        >
          {esgotado ? 'Esgotado' : `×${m.quantidade}`}
        </span>
        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-abismo/90 border border-linha font-mono text-xs font-bold text-amber-300" title="Preço de balcão agora">
          {formatarLatao(m.precoVendaLatao)}
        </span>
      </div>

      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <h4 className="font-cinzel text-sm font-bold text-pergaminho leading-tight break-words" title={m.descricao ?? undefined}>
          {m.nome}
        </h4>
        <span className="text-[11px] text-nevoa leading-tight">
          {rotuloEnum(m.tipo)} · <span className={corRaridade(m.raridade)}>{rotuloEnum(m.raridade)}</span>
        </span>
        {m.arma && (
          <span className="text-[11px] text-texto-2 leading-tight" title={m.arma.composicao ?? undefined}>
            <strong className="font-mono text-amber-300">{m.arma.dano}</strong> · {m.arma.durabilidade} dur.
            {m.arma.alcanceM > 0 && ` · ${m.arma.alcanceM} m`} · {m.arma.slotsEfeito} slot(s)
          </span>
        )}
        {m.estagioConhecimento && (
          <span className="text-[11px] text-purple-300" title="Conhecimento regional: estágio desta cidade (veja em Disseminação)">
            Saber regional: {m.estagioConhecimento}
          </span>
        )}
        {!!m.reservado && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300" title="Peças prontas guardadas para encomendas em andamento: não vendem">
            <Lock className="w-3 h-3" /> {m.reservado} reservada(s) para encomenda
          </span>
        )}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className={faltando ? 'text-amber-300' : 'text-nevoa'} title="Unidades que os clientes procuram por dia">
            Procura {m.demanda}/dia
          </span>
          <Variacao m={m} />
        </div>
        <button
          type="button"
          onClick={onVender}
          disabled={esgotado}
          className="mt-auto inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-ouro/40 text-[11px] font-cinzel text-amber-300 hover:bg-amber-400/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <HandCoins className="w-3.5 h-3.5" /> Vender a jogador
        </button>
      </div>
    </li>
  );
};

export interface AbaEstoqueLojaProps {
  detalhe: DetalheLoja;
  onAtualizado: (d: DetalheLoja) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

export const AbaEstoqueLoja: React.FC<AbaEstoqueLojaProps> = ({ detalhe, onAtualizado, avisar }) => {
  const [vendendo, setVendendo] = useState<MercadoriaLoja | null>(null);
  const [busca, setBusca] = useState('');
  const [soDisponiveis, setSoDisponiveis] = useState(false);

  const mercadorias = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return detalhe.estoque.filter((m) => (!termo || m.nome.toLowerCase().includes(termo)) && (!soDisponiveis || m.quantidade > 0));
  }, [detalhe.estoque, busca, soDisponiveis]);

  if (detalhe.estoque.length === 0) {
    return (
      <EstadoVazio icone={<Package />} titulo="Loja sem mercadorias">
        Abasteça a loja na aba Administrar.
      </EstadoVazio>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <label className="relative block flex-1">
          <span className="sr-only">Buscar mercadoria</span>
          <Search className="w-4 h-4 text-nevoa absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar mercadoria…" className="campo pl-9" />
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-texto-2 cursor-pointer">
          <input type="checkbox" checked={soDisponiveis} onChange={(e) => setSoDisponiveis(e.target.checked)} className="accent-amber-500 w-4 h-4" />
          Só o que tem na prateleira
        </label>
      </div>

      {mercadorias.length === 0 ? (
        <p className="text-center text-sm text-nevoa py-10">Nada encontrado.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {mercadorias.map((m) => (
            <CartaoMercadoria key={m.itemId} m={m} onVender={() => setVendendo(m)} />
          ))}
        </ul>
      )}

      <ModalVenderItem lojaId={detalhe.loja.id} mercadoria={vendendo} onFechar={() => setVendendo(null)} onVendido={onAtualizado} avisar={avisar} />
    </>
  );
};
