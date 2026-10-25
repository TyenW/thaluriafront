import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { BookOpen, RefreshCw, HelpCircle, Swords } from 'lucide-react';
import { mundoService } from '../../services/mundoService';
import { useAuth } from '../../contexts/AuthContext';
import type { MonstroBestiario } from '../../types/monstro';

export const BestiarioPage: React.FC = () => {
  const { usuario } = useAuth();
  const [monstros, setMonstros] = useState<MonstroBestiario[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarBestiario = async () => {
    setLoading(true);
    try {
      const data = await mundoService.obterConteudoVisivel(usuario?.papel || 'JOGADOR');
      setMonstros(data.bestiario || []);
    } catch {
      // Ignora erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarBestiario();
  }, [usuario]);

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-[#252b3a] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[#f3e5ab] flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span>Caderno do Explorador — Bestiário</span>
          </h1>
          <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
            Catálogo de feras e criaturas com Fog-of-War e Moveset estilo Pokémon (4 slots).
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={carregarBestiario} loading={loading} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Atualizar Catálogo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monstros.map((m) => {
          if (!m.revelado) {
            return (
              <Card key={m.id} variant="pergaminho" className="p-6 border-red-900/30 text-center flex flex-col justify-between h-64 opacity-75">
                <div className="my-auto">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-gray-500">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel text-lg font-bold text-gray-400">???</h3>
                  <p className="text-xs text-gray-500 font-sans-clean mt-1">
                    Criatura desconhecida ou não estudada pela expedição.
                  </p>
                </div>
                <div className="text-[10px] font-cinzel text-amber-500/50 uppercase tracking-widest pt-3 border-t border-white/5">
                  Névoa de Guerra Ativa
                </div>
              </Card>
            );
          }

          return (
            <Card key={m.id} variant="grimorio" className="p-6 border-amber-600/40 hover:border-amber-400/80 transition-all">
              <div className="flex items-start justify-between gap-2 border-b border-[#252b3a] pb-3 mb-3">
                <div>
                  <h3 className="font-cinzel text-base font-bold text-[#f3e5ab]">
                    {m.nome}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-cinzel text-amber-400">
                      Bioma: {m.regiao || 'Geral'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-950/40 text-amber-300 rounded border border-amber-600/30 font-cinzel">
                      {m.porte || 'MEDIO'}
                    </span>
                  </div>
                </div>
                <Badge variant="cyan">{m.elemento || 'Físico'}</Badge>
              </div>

              {/* Moveset Pokémon */}
              <div className="space-y-2 mt-4">
                <p className="text-[11px] font-cinzel text-amber-500/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" />
                  <span>Moveset Estilo Pokémon (4 Golpes)</span>
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {m.golpesPokemon && m.golpesPokemon.length > 0 ? (
                    m.golpesPokemon.slice(0, 4).map((g, idx) => (
                      <div key={idx} className="p-2 bg-[#0c0d12] border border-[#232838] rounded text-left">
                        <div className="flex items-center justify-between text-[10px]">
                          <strong className="text-amber-200 font-cinzel truncate">{g.nome}</strong>
                          <span className="text-[9px] text-cyan-400 font-mono">{g.dados}</span>
                        </div>
                        <span className="text-[9px] text-[#8c93a4] block mt-0.5">
                          {g.categoria.replace('_', ' ')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-xs text-gray-500 italic p-2 bg-[#0c0d12] rounded text-center">
                      Golpes sendo compilados pelo motor
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
