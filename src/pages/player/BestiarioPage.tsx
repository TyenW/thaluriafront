import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, RefreshCw, Search, Skull } from 'lucide-react';
import { mundoService } from '../../services/mundoService';
import { useAuth } from '../../contexts/AuthContext';
import type { MonstroBestiario } from '../../types/monstro';
import { CartaoMonstro } from '../../components/bestiario/CartaoMonstro';
import { CabecalhoPagina } from '../../components/common/CabecalhoPagina';
import { Button } from '../../components/common/Button';
import { EstadoVazio } from '../../components/common/EstadoVazio';

export const BestiarioPage: React.FC = () => {
  const { usuario } = useAuth();
  const [monstros, setMonstros] = useState<MonstroBestiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const carregarBestiario = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await mundoService.obterConteudoVisivel(usuario?.papel || 'JOGADOR');
      setMonstros(data.bestiario || []);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível abrir o bestiário.');
    } finally {
      setLoading(false);
    }
  }, [usuario?.papel]);

  useEffect(() => {
    carregarBestiario();
  }, [carregarBestiario]);

  const revelados = monstros.filter((m) => m.revelado).length;
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return monstros;
    // Criaturas ocultas não entram na busca: o nome delas é segredo.
    return monstros.filter((m) => m.revelado && `${m.nome} ${m.elemento ?? ''} ${m.regiao ?? ''}`.toLowerCase().includes(termo));
  }, [monstros, busca]);

  return (
    <div className="space-y-6 text-left">
      <CabecalhoPagina
        icone={<BookOpen />}
        titulo="Bestiário"
        descricao={
          monstros.length > 0
            ? `${revelados} de ${monstros.length} criaturas estudadas pela expedição. As demais seguem sob a névoa.`
            : 'Catálogo das feras e criaturas de Thalúria.'
        }
        acoes={
          <Button variant="outline" size="sm" onClick={carregarBestiario} loading={loading} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Atualizar
          </Button>
        }
      />

      {monstros.length > 0 && (
        <label className="relative block max-w-md">
          <span className="sr-only">Buscar criatura</span>
          <Search className="w-4 h-4 text-nevoa absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, elemento ou região…" className="campo pl-9" />
        </label>
      )}

      {erro && <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">{erro}</p>}

      {loading && monstros.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-xl bg-painel border border-linha animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EstadoVazio icone={<Skull />} titulo={busca ? 'Nenhuma criatura encontrada' : 'Bestiário vazio'}>
          {busca ? `Nada corresponde a “${busca}”.` : 'Nenhuma criatura foi catalogada ainda.'}
        </EstadoVazio>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtrados.map((m) => (
            <CartaoMonstro key={m.id} monstro={m} />
          ))}
        </div>
      )}
    </div>
  );
};
