import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RefreshCw, Store } from 'lucide-react';
import type { DetalheLoja, ResumoComercio } from '../../types/comercio';
import { comercioService } from '../../services/comercioService';
import { ControleTempo } from '../../components/comercio/ControleTempo';
import { CabecalhoPagina } from '../../components/common/CabecalhoPagina';
import { Button } from '../../components/common/Button';
import { PainelAvisos, useAvisos } from '../../components/common/Avisos';
import { ListaLojas } from '../../components/comercio/ListaLojas';
import { PainelLoja } from '../../components/comercio/PainelLoja';
import { GuiaComercio } from '../../components/comercio/GuiaComercio';

/** Aba de Comércio do Mestre: visão de todas as lojas e gestão de cada uma (?loja=ID). */
export const ComercioPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const lojaId = Number(searchParams.get('loja')) || null;
  const [resumo, setResumo] = useState<ResumoComercio | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheLoja | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { avisos, avisar, fechar } = useAvisos();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      if (lojaId) setDetalhe(await comercioService.loja(lojaId));
      else setResumo(await comercioService.resumo());
    } catch (err: any) {
      setErro(err.message || 'Não foi possível carregar o comércio. Reinicie o servidor para aplicar a atualização.');
    } finally {
      setCarregando(false);
    }
  }, [lojaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirLoja = (id: number) => setSearchParams({ loja: String(id) });
  const voltar = () => {
    setDetalhe(null);
    setSearchParams({});
  };

  const dia = (lojaId ? detalhe?.dia : resumo?.dia) ?? null;
  const diaCampanha = (lojaId ? detalhe?.diaCampanha : resumo?.diaCampanha) ?? dia;

  return (
    <div className="space-y-6 text-left pb-16">
      <CabecalhoPagina
        icone={<Store />}
        titulo="Comércio"
        descricao={
          lojaId
            ? 'Gerencie a loja como o mercador: venda a jogadores, mande produzir e ajuste estoque e caixa.'
            : 'Como vão as lojas do mundo, o que estão produzindo e quais precisam de atenção.'
        }
        acoes={
          <>
            {dia != null && (
              <span className="text-xs font-cinzel text-nevoa" title={dia !== diaCampanha ? 'O mercado foi simulado à frente da campanha' : undefined}>
                Dia {diaCampanha}
                {dia !== diaCampanha && <span className="text-amber-300/90"> · mercado no dia {dia}</span>}
              </span>
            )}
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={carregar} loading={carregando}>
              Atualizar
            </Button>
            <ControleTempo diaCampanha={diaCampanha} diaMercado={dia} avisar={avisar} onPassou={() => carregar()} />
          </>
        }
      />

      {lojaId && (
        <button type="button" onClick={voltar} className="inline-flex items-center gap-1.5 text-xs font-cinzel text-amber-400 hover:text-amber-300 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Todas as lojas
        </button>
      )}

      <GuiaComercio />

      {erro && (
        <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
        </p>
      )}

      {carregando && !(lojaId ? detalhe : resumo) ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-24 rounded-xl bg-painel border border-linha animate-pulse" />
          <div className="h-64 rounded-xl bg-painel border border-linha animate-pulse" />
        </div>
      ) : lojaId ? (
        detalhe && <PainelLoja detalhe={detalhe} onAtualizado={setDetalhe} avisar={avisar} />
      ) : (
        resumo && <ListaLojas resumo={resumo} onAbrir={abrirLoja} />
      )}

      <PainelAvisos avisos={avisos} onFechar={fechar} />
    </div>
  );
};
