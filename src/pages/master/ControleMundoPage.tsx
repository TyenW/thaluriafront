import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Globe, BookOpen, Eye, ScrollText, RefreshCw } from 'lucide-react';
import { mundoService } from '../../services/mundoService';
import type { ConteudoVisivelMundo } from '../../types/monstro';

export const ControleMundoPage: React.FC = () => {
  const [conteudo, setConteudo] = useState<ConteudoVisivelMundo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acaoLoading, setAcaoLoading] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await mundoService.obterConteudoVisivel('MESTRE');
      setConteudo(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleLiberarWiki = async (cap: string) => {
    setAcaoLoading(cap);
    try {
      await mundoService.liberarCapituloWiki(cap);
      await carregar();
    } catch {}
    finally {
      setAcaoLoading(null);
    }
  };

  const handleRevelarMonstro = async (id: string) => {
    setAcaoLoading(id);
    try {
      await mundoService.revelarMonstro(id);
      await carregar();
    } catch {}
    finally {
      setAcaoLoading(null);
    }
  };

  const capitulosDisponiveis = [
    'Status',
    'Grafiturgia Elemental',
    'Economia e Comercio',
    'Bestiario Regional',
    'Raças por Reino',
  ];

  return (
    <div className="space-y-8 text-left">
      <div className="border-b border-[#252b3a] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[#f3e5ab] flex items-center gap-3">
            <Globe className="w-6 h-6 text-amber-400" />
            <span>Controle de Mundo & Fog-of-War</span>
          </h1>
          <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
            Liberação pontual de capítulos, criaturas e locais visíveis para os jogadores.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={carregar} loading={loading} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Atualizar Mundo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Controle da Wiki */}
        <Card variant="grimorio" className="p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#252b3a] pb-3">
            <h3 className="font-cinzel text-base font-bold text-[#f3e5ab] flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-400" />
              <span>Capítulos da Wiki (Fog-of-War)</span>
            </h3>
            <Badge variant="gold">
              {conteudo?.capitulosWiki.length || 0} / {capitulosDisponiveis.length} Liberados
            </Badge>
          </div>

          <div className="space-y-2.5">
            {capitulosDisponiveis.map((cap) => {
              const liberado = conteudo?.capitulosWiki.includes(cap);
              return (
                <div
                  key={cap}
                  className="flex items-center justify-between p-3 bg-[#0c0d12] rounded border border-[#232838]"
                >
                  <div>
                    <strong className="text-xs font-cinzel text-[#f3e5ab] block">{cap}</strong>
                    <span className="text-[10px] text-[#8c93a4] font-sans-clean">
                      {liberado ? 'Aberto no menu do jogador' : 'Aparece com cadeado'}
                    </span>
                  </div>

                  <Button
                    variant={liberado ? 'dark' : 'gold'}
                    size="sm"
                    loading={acaoLoading === cap}
                    onClick={() => handleLiberarWiki(cap)}
                    disabled={liberado}
                  >
                    {liberado ? 'Já Liberado' : 'Liberar para Jogadores'}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Revelação do Bestiário */}
        <Card variant="grimorio" className="p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#252b3a] pb-3">
            <h3 className="font-cinzel text-base font-bold text-[#f3e5ab] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Revelação de Feras do Bestiário</span>
            </h3>
            <Badge variant="cyan">
              {conteudo?.bestiario.filter((b) => b.revelado).length || 0} Revelados
            </Badge>
          </div>

          <div className="space-y-2.5">
            {conteudo?.bestiario.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-[#0c0d12] rounded border border-[#232838]"
              >
                <div>
                  <strong className="text-xs font-cinzel text-[#f3e5ab] block">
                    {m.nome}
                  </strong>
                  <span className="text-[10px] text-amber-500/80 font-cinzel">
                    {m.regiao || 'Bioma Geral'} • {m.elemento || 'Físico'}
                  </span>
                </div>

                <Button
                  variant={m.revelado ? 'dark' : 'gold'}
                  size="sm"
                  loading={acaoLoading === m.id}
                  onClick={() => handleRevelarMonstro(m.id)}
                  disabled={m.revelado}
                  icon={<Eye className="w-3.5 h-3.5" />}
                >
                  {m.revelado ? 'Visível ao Jogador' : 'Revelar Fera'}
                </Button>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
};
