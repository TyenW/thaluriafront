import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Hammer, Package, ScrollText, Settings2 } from 'lucide-react';
import type { DetalheLoja } from '../../types/comercio';
import { formatarLatao, rotuloTipoLoja } from '../../utils/formatadores';
import { Abas } from '../common/Abas';
import { Badge } from '../common/Badge';
import { AbaEstoqueLoja } from './AbaEstoqueLoja';
import { AbaProducaoLoja } from './AbaProducaoLoja';
import { AbaLivroCaixa } from './AbaLivroCaixa';
import { AbaAdministrarLoja } from './AbaAdministrarLoja';

type AbaLoja = 'estoque' | 'producao' | 'caixa' | 'administrar';

export interface PainelLojaProps {
  detalhe: DetalheLoja;
  onAtualizado: (d: DetalheLoja) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

const Numero: React.FC<{ rotulo: string; children: React.ReactNode }> = ({ rotulo, children }) => (
  <div className="rounded-lg bg-abismo/70 border border-linha px-3 py-2">
    <span className="block text-[10px] font-cinzel uppercase tracking-wider text-nevoa">{rotulo}</span>
    <strong className="block text-sm font-mono text-pergaminho">{children}</strong>
  </div>
);

/** Uma loja por dentro: números da semana e as quatro abas de gestão. */
export const PainelLoja: React.FC<PainelLojaProps> = ({ detalhe, onAtualizado, avisar }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const l = detalhe.loja;
  const aba = (['estoque', 'producao', 'caixa', 'administrar'] as AbaLoja[]).find((a) => a === searchParams.get('aba')) ?? 'estoque';
  const trocar = (id: AbaLoja) =>
    setSearchParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        novo.set('aba', id);
        return novo;
      },
      { replace: true }
    );
  const saldo = l.entradasSemanaLatao - l.saidasSemanaLatao;

  return (
    <div className="space-y-5">
      <header className="p-4 sm:p-5 rounded-xl bg-painel border border-linha space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-pergaminho break-words">{l.nome}</h2>
            <p className="text-xs text-nevoa mt-0.5">
              {rotuloTipoLoja(l.tipo)} · {l.cidade} · Nível {l.nivel} · mercador {l.mercador}
              {l.rede ? ` · rede ${l.rede}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {l.alertas.map((a) => (
              <Badge key={a} variant="danger">
                {a}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Numero rotulo="Caixa">{formatarLatao(l.caixaLatao)}</Numero>
          <Numero rotulo="Estoque">
            {l.unidades} un. · {formatarLatao(l.valorEstoqueLatao)}
          </Numero>
          <Numero rotulo="Saldo da semana">
            <span className={saldo > 0 ? 'text-emerald-300' : saldo < 0 ? 'text-red-300' : ''}>
              {saldo > 0 ? '+' : ''}
              {formatarLatao(saldo)}
            </span>
          </Numero>
          <Numero rotulo="Vendido na semana">{l.unidadesVendidasSemana} un.</Numero>
        </div>
      </header>

      <Abas
        rotulo="Gestão da loja"
        prefixo="loja"
        ativa={aba}
        onTrocar={trocar}
        abas={[
          { id: 'estoque', rotulo: 'Estoque', icone: <Package className="w-4 h-4" />, contagem: detalhe.estoque.length },
          { id: 'producao', rotulo: 'Produção', icone: <Hammer className="w-4 h-4" />, contagem: detalhe.ordens.length },
          { id: 'caixa', rotulo: 'Livro-caixa', icone: <ScrollText className="w-4 h-4" /> },
          { id: 'administrar', rotulo: 'Administrar', icone: <Settings2 className="w-4 h-4" /> },
        ]}
      />

      <div role="tabpanel" id={`loja-painel-${aba}`} aria-labelledby={`loja-${aba}`}>
        {aba === 'estoque' && <AbaEstoqueLoja detalhe={detalhe} onAtualizado={onAtualizado} avisar={avisar} />}
        {aba === 'producao' && <AbaProducaoLoja detalhe={detalhe} onAtualizado={onAtualizado} avisar={avisar} />}
        {aba === 'caixa' && <AbaLivroCaixa movimentacoes={detalhe.movimentacoes} />}
        {aba === 'administrar' && <AbaAdministrarLoja detalhe={detalhe} onAtualizado={onAtualizado} avisar={avisar} />}
      </div>
    </div>
  );
};
