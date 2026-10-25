import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { 
  Crown, 
  UserCheck, 
  Globe, 
  Users, 
  Calendar, 
  ArrowRight,
  Database
} from 'lucide-react';
import { mundoService } from '../../services/mundoService';

export const PainelMestrePage: React.FC = () => {
  const [diaCampanha, setDiaCampanha] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const conteudo = await mundoService.obterConteudoVisivel('MESTRE');
        setDiaCampanha(conteudo.diaMercado || 1);
      } catch {}
    };
    carregar();
  }, []);

  const handleAvancarDia = async (dias = 1) => {
    setLoading(true);
    try {
      const res = await mundoService.avancarDiaMercado(dias);
      setDiaCampanha(res.diaAtual);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div className="border-b border-[#252b3a] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="danger">
              <Crown className="w-3 h-3 text-amber-300" />
              <span>Painel do Mestre</span>
            </Badge>
            <Badge variant="gold">Dia de Campanha #{diaCampanha}</Badge>
          </div>
          <h1 className="text-3xl font-cinzel font-bold text-[#f3e5ab] tracking-wide">
            Câmara de Controle da Campanha
          </h1>
          <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
            Comando supremo sobre o mundo, névoa de guerra, intervenção nas criações e jogadores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="gold"
            size="sm"
            onClick={() => handleAvancarDia(1)}
            loading={loading}
            icon={<Calendar className="w-3.5 h-3.5" />}
          >
            Avançar 1 Dia de Mercado
          </Button>
        </div>
      </div>

      {/* Grid de Ferramentas Principais do Mestre */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Sessões ao Vivo */}
        <Card variant="grimorio" className="p-6 flex flex-col justify-between hover:border-amber-500/60 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300 mb-4">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-cinzel text-lg font-bold text-[#f3e5ab] mb-2">
              Sessões de Criação ao Vivo
            </h3>
            <p className="text-xs text-[#8c93a4] font-sans-clean leading-relaxed mb-4">
              Acompanhe os jogadores criando fichas passo a passo. Envie dicas táticas, conceda rerolls de atributos e aprove a ficha.
            </p>
          </div>
          <Link to="/mestre/sessoes">
            <Button variant="dark" size="sm" className="w-full justify-between">
              <span>Abrir Monitor ao Vivo</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Button>
          </Link>
        </Card>

        {/* Card 2: Fog-of-War & Mundo */}
        <Card variant="grimorio" className="p-6 flex flex-col justify-between hover:border-amber-500/60 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-cinzel text-lg font-bold text-[#f3e5ab] mb-2">
              Fog-of-War & Bestiário
            </h3>
            <p className="text-xs text-[#8c93a4] font-sans-clean leading-relaxed mb-4">
              Controle quais cidades aparecem no mapa, desbloqueie capítulos da wiki e revele monstros desconhecidos no Bestiário.
            </p>
          </div>
          <Link to="/mestre/mundo">
            <Button variant="dark" size="sm" className="w-full justify-between">
              <span>Gerenciar Fog-of-War</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Button>
          </Link>
        </Card>

        {/* Card 3: Jogadores & Contas */}
        <Card variant="grimorio" className="p-6 flex flex-col justify-between hover:border-amber-500/60 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-cinzel text-lg font-bold text-[#f3e5ab] mb-2">
              Jogadores & Limites
            </h3>
            <p className="text-xs text-[#8c93a4] font-sans-clean leading-relaxed mb-4">
              Cadastre novas credenciais para os jogadores da mesa ou altere o limite máximo de fichas permitidas por conta.
            </p>
          </div>
          <Link to="/mestre/jogadores">
            <Button variant="dark" size="sm" className="w-full justify-between">
              <span>Administrar Contas</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Button>
          </Link>
        </Card>

      </div>

      {/* Status da Conexão com SQLite e Servidor */}
      <Card variant="pergaminho" className="p-6 border-amber-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-cinzel text-sm font-bold text-[#f3e5ab]">
                Motor Java & Banco SQLite Conectados
              </h4>
              <p className="text-xs text-[#8c93a4] font-sans-clean">
                Tabelas persistidas em <strong className="text-amber-400 font-mono">thaluria.db</strong> (Modo WAL ativado).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="gold">Porta 8080</Badge>
            <Badge variant="cyan">Virtual Threads Ativas</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
