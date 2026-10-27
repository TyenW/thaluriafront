import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Box, Layers, Move3d, Sparkles, Compass, Swords } from 'lucide-react';

export const VTT3DPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      <div className="border-b border-linha pb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="purple">Experimental</Badge>
            <Badge variant="gold">Planejamento Arquitetural</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-pergaminho flex items-center gap-3">
            <Box className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400 shrink-0" />
            <span>VTT 3D — Em Desenvolvimento</span>
          </h1>
          <p className="text-xs text-nevoa font-sans-clean mt-1">
            Mesa virtual tridimensional imersiva para combate tático, exploração e cenários espaciais em Thalúria.
          </p>
        </div>
      </div>

      {/* Banner Conceitual */}
      <Card variant="grimorio" className="p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-2xl">
          <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center mb-4 text-purple-300">
            <Move3d className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-cinzel font-bold text-pergaminho mb-3">
            O Próximo Salto na Imersão de Thalúria
          </h2>
          <p className="text-sm text-nevoa font-sans-clean leading-relaxed mb-6">
            A mesa virtual 3D está planejada para proporcionar um ambiente tridimensional onde os jogadores movem seus tokens, exploram masmorras com névoa de guerra volumétrica e travam combates com linhas de visão dinâmicas diretamente integradas com as fichas e o motor de combate Java.
          </p>
        </div>

        {/* Pilares Planejados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-linha">
          <div className="p-4 bg-abismo/80 rounded border border-linha">
            <Layers className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="font-cinzel text-xs font-bold text-texto mb-1">Cenários & Mapas 3D</h4>
            <p className="text-[11px] text-nevoa font-sans-clean">
              Suporte a mapas com elevações, desníveis e terrenos táticos (planícies, cavernas, fortalezas).
            </p>
          </div>

          <div className="p-4 bg-abismo/80 rounded border border-linha">
            <Compass className="w-5 h-5 text-cyan-400 mb-2" />
            <h4 className="font-cinzel text-xs font-bold text-texto mb-1">Câmera Livre & Rotação</h4>
            <p className="text-[11px] text-nevoa font-sans-clean">
              Controles de rotação orbital, zoom suave e visão em primeira pessoa para exploração.
            </p>
          </div>

          <div className="p-4 bg-abismo/80 rounded border border-linha">
            <Swords className="w-5 h-5 text-red-400 mb-2" />
            <h4 className="font-cinzel text-xs font-bold text-texto mb-1">Integração de Fichas</h4>
            <p className="text-[11px] text-nevoa font-sans-clean">
              Tokens com barras de HP flutuantes, anéis de alcance de feitiços e movimentação por turno.
            </p>
          </div>
        </div>

        {/* Avaliação Técnica */}
        <div className="mt-8 p-4 bg-purple-950/20 border border-purple-500/30 rounded-lg text-xs font-sans-clean text-purple-200/90 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-cinzel text-purple-300 block mb-0.5">Avaliação de Stack Tecnológica:</strong>
            Para a futura implementação, motores WebGL modernos como <strong>Three.js / React Three Fiber</strong> ou <strong>Babylon.js</strong> são os candidatos ideais. O ambiente tridimensional será desenvolvido nas fases posteriores sem onerar a aplicação atual.
          </div>
        </div>
      </Card>
    </div>
  );
};
