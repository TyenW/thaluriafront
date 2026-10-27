import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Globe,
  BookOpen,
  Eye,
  EyeOff,
  ScrollText,
  RefreshCw,
  Map as MapIcon,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { MapaThaluria } from '../../components/map/MapaThaluria';
import { mundoService } from '../../services/mundoService';
import type { ConteudoVisivelMundo } from '../../types/monstro';
import { CIDADES_ATLAS, REINOS, type IdReino } from '../../data/atlasThaluria';

type AbaAtiva = 'mapa' | 'wiki' | 'bestiario';

export const ControleMundoPage: React.FC = () => {
  const [conteudo, setConteudo] = useState<ConteudoVisivelMundo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acaoLoading, setAcaoLoading] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('mapa');

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await mundoService.obterConteudoVisivel('MESTRE');
      setConteudo(data);
    } catch {
      // Ignora erro temporário de rede
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
    } catch {
    } finally {
      setAcaoLoading(null);
    }
  };

  /** O Mestre sempre vê a ficha completa; o que importa aqui é o que os jogadores enxergam. */
  const visivelAoJogador = (m: { revelado: boolean; reveladoJogador?: boolean }) => m.reveladoJogador ?? m.revelado;

  const handleAlternarMonstro = async (id: string, revelar: boolean) => {
    setAcaoLoading(id);
    try {
      if (revelar) await mundoService.revelarMonstro(id);
      else await mundoService.ocultarMonstro(id);
      await carregar();
    } catch {
    } finally {
      setAcaoLoading(null);
    }
  };

  const handleAcaoReino = async (
    reinoId: IdReino | 'todos',
    nivel: 'INFORMACOES_COMPLETAS' | 'OCULTO'
  ) => {
    const alvoLoading = `${reinoId}-${nivel}`;
    setAcaoLoading(alvoLoading);
    try {
      const cidadesParaAlterar =
        reinoId === 'todos'
          ? CIDADES_ATLAS
          : CIDADES_ATLAS.filter((c) => c.reino === reinoId);

      for (const c of cidadesParaAlterar) {
        await mundoService.definirVisibilidadeCidade(c.nome, nivel);
      }
      await carregar();
    } catch (err) {
      console.error('Erro ao atualizar visibilidade em lote:', err);
    } finally {
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

  // Contagem de cidades reveladas por reino com encadeamento opcional seguro
  const cidadesPorReino = (reinoId: IdReino) => {
    const total = CIDADES_ATLAS.filter((c) => c.reino === reinoId).length;
    const nomesReino = new Set(
      CIDADES_ATLAS.filter((c) => c.reino === reinoId).map((c) =>
        c.nome.toLowerCase()
      )
    );
    const reveladas =
      conteudo?.cidades?.filter(
        (c) =>
          nomesReino.has(c.nome.toLowerCase()) &&
          (c.visibilidadeJogador ?? c.visibilidade) !== 'OCULTO'
      ).length ?? 0;
    return { reveladas, total };
  };

  const totalCidadesReveladas =
    conteudo?.cidades?.filter(
      (c) => (c.visibilidadeJogador ?? c.visibilidade) !== 'OCULTO'
    ).length ?? 0;

  const totalCapitulosLiberados = conteudo?.capitulosWiki?.length ?? 0;
  const totalMonstrosRevelados =
    conteudo?.bestiario?.filter((b) => visivelAoJogador(b)).length ?? 0;
  const totalRotasAtivas = conteudo?.rotas?.length ?? 0;

  return (
    <div className="space-y-6 text-left">
      {/* Cabeçalho da página */}
      <div className="flex flex-col gap-4 border-b border-linha pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-cinzel text-2xl font-bold text-pergaminho">
            <Globe className="h-6 w-6 text-amber-400" />
            <span>Controle de Mundo &amp; Fog-of-War</span>
          </h1>
          <p className="mt-1 font-sans-clean text-xs text-nevoa">
            Painel do Mestre: gerencie a névoa do mapa, rotas comerciais, capítulos da wiki e monstros revelados para os jogadores.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={carregar}
          loading={loading}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Atualizar Mundo
        </Button>
      </div>

      {/* Abas Superiores de Navegação */}
      <div className="flex flex-wrap gap-2 border-b border-linha pb-2">
        <button
          type="button"
          onClick={() => setAbaAtiva('mapa')}
          className={`flex cursor-pointer items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 font-cinzel text-sm font-semibold transition-all ${
            abaAtiva === 'mapa'
              ? 'border-amber-400 bg-amber-400/10 text-amber-300'
              : 'border-transparent text-nevoa hover:border-amber-500/40 hover:text-pergaminho'
          }`}
        >
          <MapIcon className="h-4 w-4" />
          <span>Mapa &amp; Fog-of-War</span>
          <Badge variant="gold" size="sm">
            {totalCidadesReveladas} locais
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('wiki')}
          className={`flex cursor-pointer items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 font-cinzel text-sm font-semibold transition-all ${
            abaAtiva === 'wiki'
              ? 'border-amber-400 bg-amber-400/10 text-amber-300'
              : 'border-transparent text-nevoa hover:border-amber-500/40 hover:text-pergaminho'
          }`}
        >
          <ScrollText className="h-4 w-4" />
          <span>Compêndio da Wiki</span>
          <Badge variant="gold" size="sm">
            {totalCapitulosLiberados} / {capitulosDisponiveis.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('bestiario')}
          className={`flex cursor-pointer items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 font-cinzel text-sm font-semibold transition-all ${
            abaAtiva === 'bestiario'
              ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
              : 'border-transparent text-nevoa hover:border-cyan-500/40 hover:text-pergaminho'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Bestiário Regional</span>
          <Badge variant="cyan" size="sm">
            {totalMonstrosRevelados} feras
          </Badge>
        </button>
      </div>

      {loading && !conteudo && (
        <Card variant="grimorio" className="p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-amber-400" />
          <p className="font-cinzel text-sm text-amber-200/90 tracking-widest uppercase">
            Consultando registros cartográficos do servidor...
          </p>
        </Card>
      )}

      {/* ----------------- ABA 1: MAPA & FOG-OF-WAR ----------------- */}
      {abaAtiva === 'mapa' && (
        <div className="space-y-5">
          {/* Ações em lote por reino */}
          <Card variant="grimorio" className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-linha pb-3">
              <div>
                <h3 className="flex items-center gap-2 font-cinzel text-sm font-bold text-pergaminho">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Ações em Lote por Reino (Fog-of-War Instantâneo)</span>
                </h3>
                <p className="mt-0.5 font-sans-clean text-xs text-nevoa">
                  Revele ou oculte todas as cidades e rotas de uma província inteira com um único clique.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="gold"
                  size="sm"
                  loading={acaoLoading === 'todos-INFORMACOES_COMPLETAS'}
                  onClick={() => handleAcaoReino('todos', 'INFORMACOES_COMPLETAS')}
                  icon={<Eye className="h-3.5 w-3.5" />}
                >
                  Revelar Todo o Continente
                </Button>
                <Button
                  variant="dark"
                  size="sm"
                  loading={acaoLoading === 'todos-OCULTO'}
                  onClick={() => handleAcaoReino('todos', 'OCULTO')}
                  icon={<EyeOff className="h-3.5 w-3.5" />}
                >
                  Ocultar Todo o Continente
                </Button>
              </div>
            </div>

            {/* Grid dos reinos com contadores e botões */}
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {REINOS.map((r) => {
                const { reveladas, total } = cidadesPorReino(r.id);
                const tudoRevelado = reveladas === total && total > 0;
                const tudoOculto = reveladas === 0;

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded border border-linha bg-abismo/90 p-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: r.cor }}
                        />
                        <span className="font-cinzel text-xs font-bold text-pergaminho">
                          {r.nome}
                        </span>
                      </div>
                      <span className="font-sans-clean text-[10px] text-nevoa">
                        {reveladas} / {total} locais revelados
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant={tudoRevelado ? 'dark' : 'gold'}
                        size="sm"
                        loading={acaoLoading === `${r.id}-INFORMACOES_COMPLETAS`}
                        disabled={tudoRevelado}
                        onClick={() => handleAcaoReino(r.id, 'INFORMACOES_COMPLETAS')}
                      >
                        Revelar
                      </Button>
                      <Button
                        variant="dark"
                        size="sm"
                        loading={acaoLoading === `${r.id}-OCULTO`}
                        disabled={tudoOculto}
                        onClick={() => handleAcaoReino(r.id, 'OCULTO')}
                      >
                        Ocultar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* O componente interativo do Mapa de Thalúria */}
          <Card variant="grimorio" className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-linha pb-3">
              <div>
                <h3 className="flex items-center gap-2 font-cinzel text-base font-bold text-pergaminho">
                  <MapIcon className="h-4 w-4 text-emerald-400" />
                  <span>Cartografia de Thalúria &amp; Rotas Comerciais</span>
                </h3>
                <p className="font-sans-clean text-xs text-nevoa">
                  Como Mestre, você enxerga todas as cidades e rotas. Clique em uma cidade para abrir sua ficha e alterar o que os jogadores enxergam.
                </p>
              </div>

              <Badge variant="gold">
                {totalRotasAtivas} rotas comerciais ativas
              </Badge>
            </div>

            <MapaThaluria
              cidades={conteudo?.cidades ?? []}
              rotas={conteudo?.rotas ?? []}
              modo="mestre"
              onAlterarVisibilidade={async (cidade, nivel) => {
                await mundoService.definirVisibilidadeCidade(cidade, nivel);
                await carregar();
              }}
            />
          </Card>
        </div>
      )}

      {/* ----------------- ABA 2: COMPÊNDIO DA WIKI ----------------- */}
      {abaAtiva === 'wiki' && (
        <Card variant="grimorio" className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-linha pb-3">
            <div>
              <h3 className="flex items-center gap-2 font-cinzel text-base font-bold text-pergaminho">
                <ScrollText className="h-4 w-4 text-amber-400" />
                <span>Capítulos da Wiki (Fog-of-War Textual)</span>
              </h3>
              <p className="mt-0.5 font-sans-clean text-xs text-nevoa">
                Capítulos bloqueados aparecem com cadeado na enciclopédia dos jogadores até que você os libere.
              </p>
            </div>
            <Badge variant="gold">
              {totalCapitulosLiberados} / {capitulosDisponiveis.length} Liberados
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {capitulosDisponiveis.map((cap) => {
              const liberado = conteudo?.capitulosWiki?.includes(cap) ?? false;
              return (
                <div
                  key={cap}
                  className="flex items-center justify-between rounded border border-linha bg-abismo p-3.5 transition-colors hover:border-linha-forte"
                >
                  <div>
                    <strong className="block font-cinzel text-xs text-pergaminho">{cap}</strong>
                    <span className="font-sans-clean text-[10px] text-nevoa">
                      {liberado ? '✓ Acessível no compêndio do jogador' : '🔒 Oculto sob névoa de lore'}
                    </span>
                  </div>

                  <Button
                    variant={liberado ? 'dark' : 'gold'}
                    size="sm"
                    loading={acaoLoading === cap}
                    onClick={() => handleLiberarWiki(cap)}
                    disabled={liberado}
                  >
                    {liberado ? 'Liberado' : 'Liberar Capítulo'}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ----------------- ABA 3: BESTIÁRIO REGIONAL ----------------- */}
      {abaAtiva === 'bestiario' && (
        <Card variant="grimorio" className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-linha pb-3">
            <div>
              <h3 className="flex items-center gap-2 font-cinzel text-base font-bold text-pergaminho">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <span>Revelação de Feras &amp; Criaturas do Bestiário</span>
              </h3>
              <p className="mt-0.5 font-sans-clean text-xs text-nevoa">
                Criaturas não reveladas aparecem como sombras misteriosas na enciclopédia dos jogadores.
              </p>
            </div>
            <Badge variant="cyan">
              {totalMonstrosRevelados} Revelados
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {conteudo?.bestiario?.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded border border-linha bg-abismo p-3.5 transition-colors hover:border-linha-forte"
              >
                <div>
                  <strong className="block font-cinzel text-xs text-pergaminho">{m.nome}</strong>
                  <span className="font-cinzel text-[10px] text-amber-500/80">
                    {m.regiao || 'Bioma Geral'} • {m.elemento || 'Físico'}
                  </span>
                </div>

                <Button
                  variant={visivelAoJogador(m) ? 'dark' : 'gold'}
                  size="sm"
                  loading={acaoLoading === m.id}
                  onClick={() => handleAlternarMonstro(m.id, !visivelAoJogador(m))}
                  icon={visivelAoJogador(m) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  title={visivelAoJogador(m) ? 'Os jogadores veem esta criatura. Clique para escondê-la de novo.' : undefined}
                >
                  {visivelAoJogador(m) ? 'Desrevelar' : 'Revelar Fera'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
