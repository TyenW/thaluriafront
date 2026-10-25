import React, { useCallback, useEffect, useState } from 'react';
import { Globe, MapPin, RefreshCw, ScrollText } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { MapaThaluria } from '../../components/map/MapaThaluria';
import { useAuth } from '../../contexts/AuthContext';
import { mundoService } from '../../services/mundoService';
import { fichasService } from '../../services/fichasService';
import type { CidadeVisivel, RotaConexao } from '../../types/monstro';

export const MapaPage: React.FC = () => {
  const { usuario, isMestre } = useAuth();
  const [cidades, setCidades] = useState<CidadeVisivel[]>([]);
  const [rotas, setRotas] = useState<RotaConexao[]>([]);
  const [cidadeAtual, setCidadeAtual] = useState<string | undefined>(undefined);
  const [nomePersonagem, setNomePersonagem] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atlasCompleto, setAtlasCompleto] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await mundoService.obterConteudoVisivel(usuario?.papel ?? 'JOGADOR');
      setCidades(data.cidades ?? []);
      setRotas(data.rotas ?? []);

      // Busca a cidade atual do personagem do jogador
      if (usuario?.id) {
        try {
          const fichas = await fichasService.listarTodas(usuario.id);
          const fichaAtiva = fichas[0];
          if (fichaAtiva?.cidadeAtual) {
            setCidadeAtual(fichaAtiva.cidadeAtual);
            setNomePersonagem(fichaAtiva.nome);
          }
        } catch {
          // Se não houver ficha ainda, ignora silenciosamente
        }
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível consultar o servidor.');
    } finally {
      setLoading(false);
    }
  }, [usuario?.id, usuario?.papel]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 border-b border-linha pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-3 font-cinzel text-2xl font-bold text-pergaminho">
              <Globe className="h-6 w-6 text-amber-400" />
              <span>Mapa do Continente de Thalúria</span>
            </h1>
            {cidadeAtual && (
              <Badge variant="cyan" size="sm" icon={<MapPin className="h-3 w-3" />}>
                {nomePersonagem ? `${nomePersonagem} em ` : ''}{cidadeAtual}
              </Badge>
            )}
          </div>
          <p className="mt-1 font-sans-clean text-xs text-nevoa">
            Atlas dos cinco reinos. Cidades e rotas de viagem surgem conforme sua comitiva avança ou o Mestre as revela.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMestre && (
            <Button
              variant={atlasCompleto ? 'gold' : 'dark'}
              size="sm"
              onClick={() => setAtlasCompleto((v) => !v)}
              icon={<ScrollText className="h-3.5 w-3.5" />}
            >
              {atlasCompleto ? 'Voltar ao Fog-of-War' : 'Ver atlas completo'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={carregar}
            loading={loading}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {erro && (
        <div role="alert" className="rounded border border-red-900/60 bg-red-950/30 px-3 py-2 font-sans-clean text-xs text-red-300">
          {erro} O mapa abaixo mostra apenas o que já foi carregado.
        </div>
      )}

      <MapaThaluria
        cidades={cidades}
        rotas={rotas}
        modo={isMestre ? 'mestre' : 'jogador'}
        demonstracao={isMestre && atlasCompleto}
        cidadeAtual={cidadeAtual}
        onAlterarVisibilidade={
          isMestre
            ? async (cidade, nivel) => {
                await mundoService.definirVisibilidadeCidade(cidade, nivel);
                await carregar();
              }
            : undefined
        }
      />
    </div>
  );
};
