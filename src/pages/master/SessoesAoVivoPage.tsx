import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { 
  UserCheck, 
  RefreshCw, 
  MessageSquare, 
  RotateCcw, 
  Flame, 
  CheckCircle2, 
  Dices,
  Radio
} from 'lucide-react';
import { mundoService } from '../../services/mundoService';
import type { SessaoCriacaoAtiva } from '../../types/ficha';

export const SessoesAoVivoPage: React.FC = () => {
  const [sessoes, setSessoes] = useState<SessaoCriacaoAtiva[]>([]);
  const [loading, setLoading] = useState(false);
  const [dicaTextos, setDicaTextos] = useState<Record<number, string>>({});
  const [acaoLoading, setAcaoLoading] = useState<string | null>(null);

  const carregarSessoes = async () => {
    setLoading(true);
    try {
      const data = await mundoService.listarSessoesMestre();
      setSessoes(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSessoes();
    const interval = setInterval(carregarSessoes, 2500); // Polling suave a cada 2.5s
    return () => clearInterval(interval);
  }, []);

  const handleIntervir = async (
    usuarioId: number,
    acao: 'DICA' | 'REROLL' | 'IMPULSO_DRACONICO' | 'APROVAR'
  ) => {
    const chave = `${usuarioId}-${acao}`;
    setAcaoLoading(chave);
    try {
      const dica = dicaTextos[usuarioId] || '';
      await mundoService.intervirSessao(usuarioId, acao, dica);
      if (acao === 'DICA') {
        setDicaTextos((prev) => ({ ...prev, [usuarioId]: '' }));
      }
      await carregarSessoes();
    } catch {
    } finally {
      setAcaoLoading(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-[#252b3a] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-xs font-cinzel text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-600/40">
              <Radio className="w-3 h-3 animate-pulse" /> Sincronização em Tempo Real (2.5s)
            </span>
          </div>
          <h1 className="text-2xl font-cinzel font-bold text-[#f3e5ab] flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-amber-400" />
            <span>Monitoramento de Fichas ao Vivo</span>
          </h1>
          <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
            Espelhamento direto de <strong className="font-mono text-amber-400">sessoes_criacao_ficha</strong> com intervenção tática imediata.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={carregarSessoes}
          loading={loading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Atualizar Agora
        </Button>
      </div>

      {sessoes.length === 0 ? (
        <Card variant="pergaminho" className="text-center py-16 px-6">
          <Dices className="w-12 h-12 text-amber-500/40 mx-auto mb-4" />
          <h3 className="text-lg font-cinzel font-bold text-[#f3e5ab] mb-2">
            Nenhuma Criação em Andamento no Momento
          </h3>
          <p className="text-xs text-[#8c93a4] font-sans-clean max-w-md mx-auto">
            Assim que um jogador clicar em <strong>"Criar Novo Personagem"</strong> e sortear suas raças, sua sessão aparecerá instantaneamente neste painel para seu acompanhamento.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sessoes.map((s) => (
            <Card key={s.usuarioId} variant="grimorio" className="p-6 border-amber-600/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#252b3a] pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="cyan">Jogador #{s.usuarioId}</Badge>
                    <Badge variant="gold">Etapa: {s.etapa}</Badge>
                    {s.aprovada && <Badge variant="gold">✓ Aprovada pelo Mestre</Badge>}
                  </div>
                  <h3 className="text-xl font-cinzel font-bold text-[#f3e5ab]">
                    {s.personagem || 'Novo Aventureiro'}
                  </h3>
                </div>

                <div className="text-xs text-[#8c93a4] font-cinzel">
                  Raça Escolhida:{' '}
                  <strong className="text-amber-300 font-bold">
                    {s.racaEscolhida || 'Aguardando Escolha'}
                  </strong>
                </div>
              </div>

              {/* Opções Sorteadas para o Jogador */}
              <div className="mb-4 p-3 bg-[#0c0d12] rounded border border-[#232838]">
                <span className="text-[11px] font-cinzel text-amber-400 block mb-1">
                  Opções de Raça Sorteadas pelo Motor Java:
                </span>
                <div className="flex flex-wrap gap-2">
                  {s.opcoes ? (
                    s.opcoes.split(',').map((r, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2.5 py-1 rounded border font-cinzel ${
                          r === s.racaEscolhida
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500 font-bold shadow-[0_0_8px_rgba(212,175,55,0.2)]'
                            : 'bg-white/5 text-gray-300 border-white/10'
                        }`}
                      >
                        {idx === 0 ? `🛡️ ${r} (Fixo)` : `🎲 ${r}`}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">Sorteio pendente</span>
                  )}
                </div>
              </div>

              {/* Dica atual do Mestre */}
              {s.dicaMestre && (
                <div className="mb-4 p-3 bg-blue-950/30 border border-blue-500/30 rounded text-xs font-sans-clean text-blue-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Dica enviada: <em>"{s.dicaMestre}"</em>
                  </span>
                </div>
              )}

              {/* Ações de Intervenção do Mestre */}
              <div className="pt-4 border-t border-[#252b3a] space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Escreva uma dica ou orientação tática para o jogador..."
                    value={dicaTextos[s.usuarioId] || ''}
                    onChange={(e) =>
                      setDicaTextos((prev) => ({ ...prev, [s.usuarioId]: e.target.value }))
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    loading={acaoLoading === `${s.usuarioId}-DICA`}
                    onClick={() => handleIntervir(s.usuarioId, 'DICA')}
                    icon={<MessageSquare className="w-3.5 h-3.5" />}
                  >
                    Enviar Dica
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    variant="dark"
                    size="sm"
                    loading={acaoLoading === `${s.usuarioId}-REROLL`}
                    onClick={() => handleIntervir(s.usuarioId, 'REROLL')}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                  >
                    Conceder Reroll de Atributos
                  </Button>

                  <Button
                    variant="dark"
                    size="sm"
                    loading={acaoLoading === `${s.usuarioId}-IMPULSO_DRACONICO`}
                    onClick={() => handleIntervir(s.usuarioId, 'IMPULSO_DRACONICO')}
                    icon={<Flame className="w-3.5 h-3.5 text-orange-400" />}
                    title="Aumenta as chances de Draconato para 25%"
                  >
                    Liberar Impulso Dracônico
                  </Button>

                  <Button
                    variant="gold"
                    size="sm"
                    loading={acaoLoading === `${s.usuarioId}-APROVAR`}
                    onClick={() => handleIntervir(s.usuarioId, 'APROVAR')}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    disabled={s.aprovada}
                  >
                    {s.aprovada ? 'Ficha Já Aprovada' : 'Aprovar Ficha'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
