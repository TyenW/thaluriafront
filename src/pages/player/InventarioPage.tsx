import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Anvil, ArrowRight, Backpack, Coins, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fichasService } from '../../services/fichasService';
import type { FichaPersonagem } from '../../types/ficha';
import { MOEDAS, lerMoedas } from '../../data/moedas';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DiscoMoeda } from '../../components/ficha/CarteiraMoedas';

export const InventarioPage: React.FC = () => {
  const { usuario } = useAuth();
  const [fichas, setFichas] = useState<FichaPersonagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      setFichas(await fichasService.listarTodas(usuario?.id, usuario?.papel));
    } catch (err: any) {
      setErro(err.message || 'Não foi possível carregar os personagens.');
    } finally {
      setLoading(false);
    }
  }, [usuario?.id, usuario?.papel]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-linha pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-pergaminho flex items-center gap-3">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Inventário & Moedas</span>
          </h1>
          <p className="text-xs text-nevoa font-sans-clean mt-1">
            Visão geral das bolsas e mochilas dos seus personagens. Para alterar, abra a ficha do personagem.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar} loading={loading} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Atualizar
        </Button>
      </div>

      {erro && (
        <Card variant="grimorio" className="p-6 border-red-500/40 bg-red-950/30 text-center">
          <p className="text-sm text-red-300 font-sans-clean mb-3">{erro}</p>
          <Button variant="outline" size="sm" onClick={carregar}>
            Tentar novamente
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 rounded-lg bg-painel/80 border border-linha-forte animate-pulse" />
          ))}
        </div>
      ) : !erro && fichas.length === 0 ? (
        <Card variant="pergaminho" className="text-center py-12 px-6">
          <Backpack className="w-12 h-12 text-amber-500/40 mx-auto mb-3" />
          <h3 className="text-lg font-cinzel font-bold text-pergaminho mb-1">Nenhum personagem</h3>
          <p className="text-xs text-nevoa font-sans-clean mb-4">Crie um personagem para registrar moedas e itens.</p>
          <Link to="/criar">
            <Button variant="gold" size="sm">
              Criar personagem
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fichas.map((f) => {
            const moedas = lerMoedas(f.moedas);
            const possuidas = MOEDAS.filter((m) => moedas[m.tipo] > 0);
            const itens = f.inventario ?? [];
            return (
              <Card key={f.id} variant="grimorio" className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-linha pb-3">
                  <div className="min-w-0">
                    <h3 className="font-cinzel text-lg font-bold text-pergaminho truncate">{f.nome}</h3>
                    <span className="text-xs text-amber-500/80 font-cinzel">{f.raca}</span>
                  </div>
                  <Badge variant="gold">#{f.id}</Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
                      <Coins className="w-4 h-4" /> Moedas
                    </span>
                    <Link to={`/fichas/${f.id}?aba=moedas`} className="text-[11px] font-cinzel text-amber-400 hover:text-amber-300">
                      Gerenciar
                    </Link>
                  </div>
                  {possuidas.length === 0 ? (
                    <p className="text-xs text-nevoa font-sans-clean italic">Bolsa vazia.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {possuidas.map((m) => (
                        <li key={m.tipo} className="flex items-center gap-1.5 px-2 py-1 rounded bg-abismo border border-linha-forte" title={m.nome}>
                          <DiscoMoeda info={m} tamanho="sm" />
                          <strong className="font-mono text-xs text-pergaminho">{moedas[m.tipo].toLocaleString('pt-BR')}</strong>
                          <span className="text-[10px] text-nevoa font-mono">{m.sigla}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <span className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-2">
                    <Backpack className="w-4 h-4" /> Mochila ({itens.length})
                  </span>
                  {itens.length === 0 ? (
                    <p className="text-xs text-nevoa font-sans-clean italic">Nenhum item.</p>
                  ) : (
                    <ul className="space-y-1">
                      {itens.slice(0, 5).map((i) => (
                        <li key={i.id} className="flex justify-between text-xs font-sans-clean text-texto-2">
                          <span className="truncate">{i.nome}</span>
                          <span className="font-mono text-nevoa shrink-0">{i.quantidade}×</span>
                        </li>
                      ))}
                      {itens.length > 5 && <li className="text-[11px] text-nevoa">e mais {itens.length - 5}…</li>}
                    </ul>
                  )}
                </div>

                <Link to={`/fichas/${f.id}?aba=inventario`} className="block">
                  <Button variant="dark" size="sm" className="w-full justify-between">
                    <span>Abrir inventário da ficha</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <Card variant="simple" className="p-6 text-center border-dashed">
        <Anvil className="w-9 h-9 text-amber-500/40 mx-auto mb-2" />
        <h4 className="font-cinzel text-sm font-bold text-amber-300 mb-1">Oficina de manufatura</h4>
        <p className="text-xs text-nevoa font-sans-clean max-w-md mx-auto">
          Receitas e crafting ainda não estão disponíveis na versão web.
        </p>
      </Card>
    </div>
  );
};
