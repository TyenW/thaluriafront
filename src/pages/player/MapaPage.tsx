import React from 'react';
import { Card } from '../../components/common/Card';
import { Globe } from 'lucide-react';

export const MapaPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-[#252b3a] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[#f3e5ab] flex items-center gap-3">
            <Globe className="w-6 h-6 text-amber-400" />
            <span>Mapa do Continente de Thalúria</span>
          </h1>
          <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
            Visualização cartográfica dos 5 Reinos com camada interativa SVG e Fog-of-War.
          </p>
        </div>
      </div>

      <Card variant="grimorio" className="p-4 overflow-hidden">
        <div className="relative rounded-lg overflow-hidden border border-[#2b3142] aspect-[16/10] bg-[#07080b] flex items-center justify-center">
          <img
            src="/assets/mapa-thaluria.png"
            alt="Mapa de Thaluria"
            className="w-full h-full object-contain filter contrast-105"
          />
          <div className="absolute bottom-4 left-4 p-3 bg-black/80 backdrop-blur-md border border-amber-600/40 rounded text-xs font-cinzel text-amber-300">
            Fase 3: Zoom, Pan e Pontos de Interesse SVG em desenvolvimento
          </div>
        </div>
      </Card>
    </div>
  );
};
