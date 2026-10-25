import React from 'react';
import { Card } from '../../components/common/Card';
import { Sparkles, Dices } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';

export const CriarPersonagemPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      <div className="border-b border-[#252b3a] pb-6">
        <h1 className="text-3xl font-cinzel font-bold text-[#f3e5ab] flex items-center gap-3">
          <Dices className="w-8 h-8 text-amber-400" />
          <span>Forja de Heróis — Criação Canônica</span>
        </h1>
        <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
          O sorteio de raças é executado diretamente no motor Java com Pity System acumulado.
        </p>
      </div>

      <Card variant="grimorio" className="p-8 text-center">
        <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-cinzel font-bold text-[#f3e5ab] mb-2">
          Fluxo de Criação em Tempo Real (Fase 2)
        </h2>
        <p className="text-sm text-[#8c93a4] font-sans-clean max-w-lg mx-auto mb-6">
          Esta tela será ativada na Fase 2 com a revelação animada das 3 opções sorteadas (Vaga 1 Humano + 2 Sorteadas), seleção da Linhagem Dracônica (1d8) e espelhamento instantâneo no Painel do Mestre.
        </p>
        <Link to="/">
          <Button variant="outline" size="md">
            Voltar ao Grimório de Personagens
          </Button>
        </Link>
      </Card>
    </div>
  );
};
