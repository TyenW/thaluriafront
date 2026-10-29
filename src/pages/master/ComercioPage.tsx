import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RefreshCw, Store } from 'lucide-react';
import type { DetalheLoja, ResumoComercio } from '../../types/comercio';
import { comercioService } from '../../services/comercioService';
import { CabecalhoPagina } from '../../components/common/CabecalhoPagina';
import { Button } from '../../components/common/Button';
import { PainelAvisos, useAvisos } from '../../components/common/Avisos';
import { ListaLojas } from '../../components/comercio/ListaLojas';
import { PainelLoja } from '../../components/comercio/PainelLoja';
import { GuiaComercio } from '../../components/comercio/GuiaComercio';
import { ControleTempo } from '../../components/comercio/ControleTempo';
import { useMesa } from '../../contexts/MesaContext';

/** Aba de Comércio do Mestre: visão de todas as lojas e gestão de cada uma (?loja=ID). */
export const ComercioPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const lojaId = Number(searchParams.get('loja')) || null;
  const [resumo, setResumo] = useState<ResumoComercio | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheLoja | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { avisos, avisar, fechar } = useAvisos();
  const { mesaId, painel, erro: erroMesas } = useMesa();
  const mesasProntas = painel != null || erroMesas != null;

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      if (lojaId) setDetalhe(await comercioService.loja(lojaId, mesaId));
      else setResumo(await comercioService.resumo(mesaId));
    } catch (err: any) {
      setErro(err.message || 'Não foi possível carregar o comércio. Reinicie o servidor para aplicar a atualização.');
    } finally {
      setCarregando(false);
    }
  }, [lojaId, mesaId]);

  // Espera as mesas para já pedir pelo dia da mesa escolhida
  useEffect(() => {
    if (mesasProntas) carregar();
  }, [carregar, mesasProntas]);

  const abrirLoja = (id: number) => setSearchParams({ loja: String(id) });
  const voltar = () => {
    setDetalhe(null);
    setSearchParams({});
  };

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
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={carregar} loading={carregando}>
              Atualizar
            </Button>
          </>
        }
      />

      {lojaId && (
        <button type="button" onClick={voltar} className="inline-flex items-center gap-1.5 text-xs font-cinzel text-amber-400 hover:text-amber-300 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Todas as lojas
        </button>
      )}

      <ControleTempo avisar={avisar} onTempoMudou={carregar} />

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
