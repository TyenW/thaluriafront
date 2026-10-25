import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Shield, ArrowLeft } from 'lucide-react';

export const FichaDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-cinzel text-amber-400 hover:text-amber-300">
        <ArrowLeft className="w-4 h-4" />
        <span>Retornar ao Grimório</span>
      </Link>

      <div className="border-b border-[#252b3a] pb-4">
        <h1 className="text-2xl font-cinzel font-bold text-[#f3e5ab] flex items-center gap-3">
          <Shield className="w-6 h-6 text-amber-400" />
          <span>Ficha de Personagem #{id}</span>
        </h1>
      </div>

      <Card variant="grimorio" className="p-8 text-center">
        <p className="text-sm text-[#8c93a4] font-sans-clean">
          Carregamento detalhado dos 6 atributos, fórmulas raciais, inventário e monstros domados integrados à API Java.
        </p>
      </Card>
    </div>
  );
};
