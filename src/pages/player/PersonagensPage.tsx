import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fichasService } from '../../services/fichasService';
import type { FichaPersonagem } from '../../types/ficha';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { 
  Plus, 
  Heart, 
  Brain, 
  Zap, 
  Flame, 
  Shield as ShieldIcon, 
  Sparkles, 
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const PersonagensPage: React.FC = () => {
  const { usuario } = useAuth();
  const [fichas, setFichas] = useState<FichaPersonagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarFichas = async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await fichasService.listarTodas();
      setFichas(data);
    } catch (err: any) {
      setErro(err.message || 'Falha ao carregar fichas do servidor Java.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFichas();
  }, []);

  const limiteAtingido = usuario ? fichas.length >= usuario.limiteFichas : false;

  return (
    <div className="space-y-8 text-left">
      
      {/* Header do Jogador */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#252b3a] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f3e5ab] tracking-wide flex items-center gap-3">
            <span>Grimório de Aventureiros</span>
            <Badge variant="gold">
              {fichas.length} / {usuario?.limiteFichas || 2} Fichas
            </Badge>
          </h1>
          <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
            Personagens registrados em <span className="text-amber-400 font-mono">thaluria.db</span> sob a autoridade da campanha.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarFichas}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Atualizar
          </Button>

          <Link to={limiteAtingido ? '#' : '/criar'}>
            <Button
              variant="gold"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              disabled={limiteAtingido}
              title={limiteAtingido ? 'Limite de fichas atingido. Peça autorização ao Mestre.' : 'Iniciar Criação de Personagem'}
            >
              Criar Novo Personagem
            </Button>
          </Link>
        </div>
      </div>

      {limiteAtingido && (
        <div className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-lg flex items-center gap-3 text-amber-200 text-xs font-sans-clean">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="font-cinzel text-amber-300 block">Limite de Fichas Atingido</strong>
            Você atingiu o teto de <strong>{usuario?.limiteFichas}</strong> personagens permitidos para sua conta. O Mestre pode expandir esse limite no painel administrativo.
          </div>
        </div>
      )}

      {erro && (
        <Card variant="grimorio" className="p-6 border-red-500/40 bg-red-950/30 text-center">
          <p className="text-sm text-red-300 font-sans-clean mb-3">{erro}</p>
          <Button variant="outline" size="sm" onClick={carregarFichas}>
            Tentar Reconectar
          </Button>
        </Card>
      )}

      {/* Lista de Fichas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-lg bg-[#141722]/80 border border-[#2b3142] animate-pulse p-6" />
          ))}
        </div>
      ) : fichas.length === 0 ? (
        <Card variant="pergaminho" className="text-center py-16 px-6">
          <Sparkles className="w-12 h-12 text-amber-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-cinzel font-bold text-[#f3e5ab] mb-2">
            Nenhum Aventureiro Registrado
          </h3>
          <p className="text-sm text-[#8c93a4] font-sans-clean max-w-md mx-auto mb-6">
            Você ainda não possui nenhum personagem forjado. Inicie agora a criação para participar do sorteio canônico de raças.
          </p>
          <Link to="/criar">
            <Button variant="gold" size="lg" icon={<Plus className="w-4 h-4" />}>
              Forjar Primeiro Personagem
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fichas.map((ficha) => (
            <Card
              key={ficha.id}
              variant="grimorio"
              className="hover:border-amber-500/50 transition-all hover:-translate-y-1 group flex flex-col justify-between"
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-3 border-b border-[#252b3a] pb-3 mb-4">
                  <div>
                    <h3 className="font-cinzel text-lg font-bold text-[#f3e5ab] group-hover:text-amber-300 transition-colors">
                      {ficha.nome}
                    </h3>
                    <p className="text-xs text-amber-500/80 font-cinzel">
                      {ficha.raca}
                    </p>
                  </div>
                  <Badge variant="gold">
                    ID #{ficha.id}
                  </Badge>
                </div>

                {/* Barras de Recursos Vitais */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2 bg-red-950/30 border border-red-900/40 rounded flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <div>
                      <span className="text-[10px] text-red-400 block font-cinzel">Vida (HP)</span>
                      <strong className="text-red-200">{ficha.hpAtual} / {ficha.hpMax}</strong>
                    </div>
                  </div>

                  <div className="p-2 bg-purple-950/30 border border-purple-900/40 rounded flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-[10px] text-purple-400 block font-cinzel">Sanidade</span>
                      <strong className="text-purple-200">{ficha.sanAtual} / {ficha.sanMax}</strong>
                    </div>
                  </div>

                  <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-cinzel">Energia</span>
                      <strong className="text-emerald-200">{ficha.energiaAtual} / {ficha.energiaMax}</strong>
                    </div>
                  </div>

                  <div className="p-2 bg-blue-950/30 border border-blue-900/40 rounded flex items-center gap-2">
                    <Flame className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-[10px] text-blue-400 block font-cinzel">Mana</span>
                      <strong className="text-blue-200">{ficha.manaAtual} / {ficha.manaMax}</strong>
                    </div>
                  </div>
                </div>

                {/* Atributos Básicos */}
                <div className="grid grid-cols-6 gap-1 text-center py-2 bg-[#0c0d12]/80 border border-[#202534] rounded mb-4">
                  {[
                    { label: 'VIG', val: ficha.vig },
                    { label: 'FOR', val: ficha.forca },
                    { label: 'DES', val: ficha.des },
                    { label: 'MEN', val: ficha.men },
                    { label: 'ESP', val: ficha.esp },
                    { label: 'VON', val: ficha.von },
                  ].map((a) => (
                    <div key={a.label}>
                      <span className="text-[9px] text-[#8c93a4] block font-cinzel">{a.label}</span>
                      <strong className="text-xs text-[#f3e5ab] font-bold">{a.val}</strong>
                    </div>
                  ))}
                </div>

                {/* Defesa e Monstros Domados */}
                <div className="flex items-center justify-between text-xs text-[#8c93a4] mb-4">
                  <div className="flex items-center gap-1.5">
                    <ShieldIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Def. Física: <strong className="text-[#e6dfcf]">{ficha.defFisica}</strong></span>
                  </div>
                  {ficha.domados && ficha.domados.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-500/40 rounded">
                      🐾 {ficha.domados.length} Domado(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Ação */}
              <div className="pt-3 border-t border-[#252b3a]">
                <Link to={`/fichas/${ficha.id}`} className="w-full">
                  <Button variant="dark" size="sm" className="w-full justify-between">
                    <span>Inspecionar Ficha</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
