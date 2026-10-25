import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { PainelAvisos, useAvisos } from '../../components/common/Avisos';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { 
  Crown, 
  UserCheck, 
  Globe, 
  Users, 
  Calendar, 
  ArrowRight,
  Database,
  Shield,
  Eye,
  Search,
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { mundoService } from '../../services/mundoService';
import { fichasService } from '../../services/fichasService';
import type { FichaPersonagem } from '../../types/ficha';

export const PainelMestrePage: React.FC = () => {
  const { avisos, avisar, fechar: fecharAviso } = useAvisos();
  const [diaCampanha, setDiaCampanha] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [fichas, setFichas] = useState<FichaPersonagem[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(true);
  const [buscaFicha, setBuscaFicha] = useState('');
  const [fichaParaExcluir, setFichaParaExcluir] = useState<FichaPersonagem | null>(null);
  const [excluindoFicha, setExcluindoFicha] = useState(false);

  const carregarFichas = async () => {
    setLoadingFichas(true);
    try {
      const data = await fichasService.listarTodas(undefined, 'MESTRE');
      setFichas(data);
    } catch {}
    finally {
      setLoadingFichas(false);
    }
  };

  const handleExcluirFicha = async () => {
    if (!fichaParaExcluir) return;
    setExcluindoFicha(true);
    try {
      await fichasService.excluirFicha(fichaParaExcluir.id);
      setFichaParaExcluir(null);
      await carregarFichas();
    } catch (err: any) {
      avisar('erro', err.message || 'Erro ao excluir ficha.');
    } finally {
      setExcluindoFicha(false);
    }
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        const conteudo = await mundoService.obterConteudoVisivel('MESTRE');
        setDiaCampanha(conteudo.diaMercado || 1);
      } catch {}
    };
    carregar();
    carregarFichas();
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

      {/* Compêndio de Fichas de Todos os Jogadores */}
      <Card variant="grimorio" className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252b3a] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h3 className="font-cinzel text-lg font-bold text-[#f3e5ab]">
                Grimório Supremo: Todas as Fichas da Campanha ({fichas.length})
              </h3>
            </div>
            <p className="text-xs text-[#8c93a4] font-sans-clean mt-0.5">
              Inspecione, audite recursos vitais e edite atributos de qualquer herói criado pelos jogadores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar personagem ou raça..."
                value={buscaFicha}
                onChange={(e) => setBuscaFicha(e.target.value)}
                className="bg-[#0b0d14] text-xs text-[#f3e5ab] rounded-lg border border-[#2b3346] pl-8 pr-3 py-1.5 outline-none focus:border-amber-400 w-52 font-sans-clean"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={carregarFichas}
              loading={loadingFichas}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Atualizar
            </Button>
          </div>
        </div>

        {fichas.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 italic">
            Nenhuma ficha encontrada no banco SQLite.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {fichas
              .filter((f) =>
                buscaFicha.trim() === '' ||
                f.nome.toLowerCase().includes(buscaFicha.toLowerCase()) ||
                f.raca.toLowerCase().includes(buscaFicha.toLowerCase())
              )
              .map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl bg-[#0d0f16] border border-[#23293a] hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#8c93a4]">
                        Ficha #{f.id} • Conta #{f.usuarioId || 1}
                      </span>
                      <Badge variant="gold" size="sm">{f.raca}</Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      {f.imagemUrl ? (
                        <img
                          src={f.imagemUrl}
                          alt={f.nome}
                          className="w-10 h-10 rounded-lg object-cover border border-amber-500/40 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#141724] border border-[#2b3346] flex items-center justify-center text-amber-400 font-cinzel font-bold shrink-0">
                          {f.nome.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-cinzel text-sm font-bold text-[#f3e5ab]">
                          {f.nome}
                        </h4>
                        <span className="text-[11px] text-[#8c93a4] font-cinzel">
                          {f.reinoOrigem || 'Terras Livres'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] pt-1">
                      <span className="p-1 rounded bg-red-950/40 text-red-300 border border-red-900/40">
                        {f.hpAtual}/{f.hpMax} HP
                      </span>
                      <span className="p-1 rounded bg-purple-950/40 text-purple-300 border border-purple-900/40">
                        {f.sanAtual}/{f.sanMax} SAN
                      </span>
                      <span className="p-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/40">
                        {f.energiaAtual} ENE
                      </span>
                      <span className="p-1 rounded bg-blue-950/40 text-cyan-300 border border-blue-900/40">
                        {f.manaAtual} MAN
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#202534] flex items-center gap-2">
                    <Link to={`/fichas/${f.id}`} className="flex-1">
                      <Button variant="dark" size="sm" className="w-full justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-amber-300">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspecionar & Editar</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setFichaParaExcluir(f)}
                      className="p-2 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 hover:border-red-500 text-red-400 hover:text-red-200 transition-all cursor-pointer"
                      title={`Excluir ficha #${f.id} (${f.nome})`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

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
      {/* Modal de Confirmação de Exclusão do Mestre */}
      {fichaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#10131d] border border-red-500/50 rounded-2xl shadow-2xl overflow-hidden p-6 text-left">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-cinzel font-bold text-red-100">
                Intervenção do Mestre: Excluir Ficha
              </h3>
            </div>
            <p className="text-xs text-[#a0a8be] font-sans-clean leading-relaxed mb-6">
              Como Mestre, você está prestes a excluir permanentemente a ficha <strong className="text-amber-300 font-cinzel font-bold">{fichaParaExcluir.nome}</strong> (ID #{fichaParaExcluir.id}) do jogador #{fichaParaExcluir.usuarioId || 1}. Todos os registros associados no SQLite serão apagados.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFichaParaExcluir(null)}
                disabled={excluindoFicha}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleExcluirFicha}
                loading={excluindoFicha}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Sim, Excluir Ficha
              </Button>
            </div>
          </div>
        </div>
      )}

      <PainelAvisos avisos={avisos} onFechar={fecharAviso} />
    </div>
  );
};
