import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { criacaoService, type SessaoCriacao } from '../../services/criacaoService';
import { ApiError } from '../../services/api';
import { ModalConfirmacao } from '../../components/common/ModalConfirmacao';
import { Modal } from '../../components/common/Modal';
import { fichasService } from '../../services/fichasService';
import type { RacaResumo } from '../../types/raca';
import { LINHAGENS_DRACONICAS } from '../../types/raca';
import { obterInfoRaca } from '../../data/racasData';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import {
  Dices,
  Sparkles,
  Flame,
  Activity,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Crown,
  User,
  RotateCcw,
  MessageSquare,
  Trash2,
  Edit3
} from 'lucide-react';

const NOME_MAXIMO = 60;

export const CriarPersonagemPage: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Etapas do Wizard: 1 = Identidade, 2 = Sorteio das 3 Raças, 3 = Rolagem de Atributos, 4 = Consagração
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1);

  // Estados dos Dados
  const [nomePersonagem, setNomePersonagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [retomando, setRetomando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);

  // Intervenção e Acompanhamento do Mestre ao Vivo
  const [dicaMestre, setDicaMestre] = useState<string | undefined>(undefined);
  const [aprovadaPeloMestre, setAprovadaPeloMestre] = useState(false);

  // Modais de Controle
  const [confirmarReiniciar, setConfirmarReiniciar] = useState(false);
  const [modalRenomear, setModalRenomear] = useState(false);
  const [novoNomeInput, setNovoNomeInput] = useState('');
  const [salvandoNome, setSalvandoNome] = useState(false);

  // Etapa 2: Raças Sorteadas
  const [opcoesRacas, setOpcoesRacas] = useState<RacaResumo[]>([]);
  const [racaSelecionadaIndex, setRacaSelecionadaIndex] = useState<number>(0);
  const [linhagemDraconica, setLinhagemDraconica] = useState<string>('FOGO');

  // Etapa 3: Atributos Rolados pelo Motor Java
  const [atributosRolados, setAtributosRolados] = useState<Record<string, number>>({});
  const [racaEscolhidaNome, setRacaEscolhidaNome] = useState<string>('Humano');
  /** Índice da raça cujos atributos já foram rolados (-1 = ainda não rolou). */
  const [indiceRolado, setIndiceRolado] = useState(-1);
  const [rerolagensRestantes, setRerolagensRestantes] = useState(2);
  const [rerolagensPermitidas, setRerolagensPermitidas] = useState(2);
  const [confirmarRerolagem, setConfirmarRerolagem] = useState<'reroll' | 'trocar-raca' | null>(null);

  // Nome enviado ao servidor no sorteio; se o jogador renomear depois, aplicamos ao consagrar.
  const [nomeDoSorteio, setNomeDoSorteio] = useState('');
  const racasJaSorteadas = opcoesRacas.length > 0;
  const jaRolou = indiceRolado >= 0;

  // Refs para manter valores atualizados no polling sem recriar timers
  const opcoesRacasRef = useRef<RacaResumo[]>(opcoesRacas);
  useEffect(() => {
    opcoesRacasRef.current = opcoesRacas;
  }, [opcoesRacas]);

  const etapaRef = useRef<1 | 2 | 3 | 4>(etapa);
  useEffect(() => {
    etapaRef.current = etapa;
  }, [etapa]);

  const aplicarSessao = (s: SessaoCriacao) => {
    setOpcoesRacas(s.opcoesRacas || []);
    setNomeDoSorteio(s.nomePersonagem);
    setRerolagensRestantes(s.rerolagensRestantes ?? 0);
    setRerolagensPermitidas(s.rerolagensPermitidas ?? 2);
    setDicaMestre(s.dicaMestre);
    setAprovadaPeloMestre(!!s.aprovadaPeloMestre);
    if (s.linhagemDraconica) setLinhagemDraconica(s.linhagemDraconica);
    const rolou = Object.keys(s.atributosRolados || {}).length > 0;
    setAtributosRolados(s.atributosRolados || {});
    if (rolou && s.indiceRacaEscolhida >= 0) {
      setIndiceRolado(s.indiceRacaEscolhida);
      setRacaSelecionadaIndex(s.indiceRacaEscolhida);
      setRacaEscolhidaNome(s.racaEscolhidaNome || s.opcoesRacas[s.indiceRacaEscolhida]?.nome || 'Humano');
    } else if (!rolou) {
      setIndiceRolado(-1);
    }
  };

  // Retoma uma criação em andamento ao carregar a página
  useEffect(() => {
    if (!usuario) return;
    let ativo = true;
    criacaoService
      .obterSessao(usuario.id)
      .then((s) => {
        if (!ativo || !s) return;
        aplicarSessao(s);
        setNomePersonagem(s.nomePersonagem);
        const rolou = Object.keys(s.atributosRolados || {}).length > 0;
        setEtapa(rolou ? 3 : 2);
        setAviso(`Criação de “${s.nomePersonagem}” retomada.`);
      })
      .catch(() => {
        // Sem sessão retomável: segue para o passo 1.
      })
      .finally(() => ativo && setRetomando(false));
    return () => {
      ativo = false;
    };
  }, [usuario]);

  // Sincronização em Tempo Real com o Mestre (Polling suave a cada 2.5s)
  useEffect(() => {
    if (!usuario) return;
    const interval = setInterval(async () => {
      try {
        const s = await criacaoService.obterSessao(usuario.id);
        if (!s) {
          // Se havia raças sorteadas e a sessão sumiu, o mestre resetou o rascunho
          if (opcoesRacasRef.current.length > 0) {
            setOpcoesRacas([]);
            setAtributosRolados({});
            setIndiceRolado(-1);
            setDicaMestre(undefined);
            setAprovadaPeloMestre(false);
            setEtapa(1);
            setAviso('O Mestre reiniciou a sua criação. Você pode recomeçar do zero!');
          }
          return;
        }

        // Atualiza dicas, aprovação e contadores de reroll
        setDicaMestre(s.dicaMestre);
        setAprovadaPeloMestre(!!s.aprovadaPeloMestre);
        setRerolagensRestantes(s.rerolagensRestantes ?? 0);
        setRerolagensPermitidas(s.rerolagensPermitidas ?? 2);
        if (s.linhagemDraconica) setLinhagemDraconica(s.linhagemDraconica);

        const nomesNovasRacas = (s.opcoesRacas || []).map((r) => r.nome).join(',');
        const nomesRacasAtuais = opcoesRacasRef.current.map((r) => r.nome).join(',');

        // Detecta se o Mestre executou um novo sorteio de raças (REROLL_RACA)
        if (nomesRacasAtuais.length > 0 && nomesNovasRacas.length > 0 && nomesNovasRacas !== nomesRacasAtuais) {
          setOpcoesRacas(s.opcoesRacas || []);
          setNomeDoSorteio(s.nomePersonagem);
          setNomePersonagem(s.nomePersonagem);
          setAtributosRolados({});
          setIndiceRolado(-1);
          setRacaSelecionadaIndex(0);
          setEtapa(2);
          setAviso('🎲 O Mestre concedeu um novo sorteio de 3 raças para o seu herói!');
        }
      } catch {
        // Ignora erros temporários de conexão durante o background polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [usuario]);

  // Passo 1 -> Passo 2: Iniciar Sorteio no Java ou avançar persistindo nome
  const handleIniciarCriacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = nomePersonagem.trim();
    if (!nome) {
      setErro('Por favor, informe o nome do seu aventureiro.');
      return;
    }
    if (nome.length > NOME_MAXIMO) {
      setErro(`O nome pode ter no máximo ${NOME_MAXIMO} caracteres.`);
      return;
    }
    if (!usuario) {
      setErro('Sua sessão expirou. Entre novamente para criar um personagem.');
      return;
    }

    // Se já havia raças sorteadas, apenas atualiza o nome no servidor e avança
    if (racasJaSorteadas) {
      setLoading(true);
      setErro(null);
      try {
        if (nome !== nomeDoSorteio) {
          await criacaoService.atualizarNome(usuario.id, nome);
          setNomeDoSorteio(nome);
        }
        setEtapa(2);
      } catch (err: any) {
        setErro(err.message || 'Falha ao atualizar nome do herói.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const resp = await criacaoService.iniciar(usuario.id, usuario.username, nome);
      aplicarSessao(resp);
      if (resp.retomada) setAviso('Você já tinha uma criação em andamento; ela foi retomada.');
      setEtapa(Object.keys(resp.atributosRolados || {}).length > 0 ? 3 : 2);
    } catch (err: any) {
      setErro(err.message || 'Falha ao iniciar sorteio de raças no servidor.');
    } finally {
      setLoading(false);
    }
  };

  /** Descarta o rascunho e reinicia a criação do zero */
  const handleReiniciarCriacao = async () => {
    if (!usuario) return;
    setLoading(true);
    setErro(null);
    try {
      await criacaoService.reiniciar(usuario.id);
      setOpcoesRacas([]);
      setAtributosRolados({});
      setIndiceRolado(-1);
      setRacaSelecionadaIndex(0);
      setDicaMestre(undefined);
      setAprovadaPeloMestre(false);
      setNomePersonagem('');
      setNomeDoSorteio('');
      setConfirmarReiniciar(false);
      setEtapa(1);
      setAviso('Criação reiniciada do zero com sucesso.');
    } catch (err: any) {
      setErro(err.message || 'Falha ao reiniciar criação.');
    } finally {
      setLoading(false);
    }
  };

  /** Salva alteração de nome do herói a qualquer momento */
  const handleSalvarNovoNome = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = novoNomeInput.trim();
    if (!nomeLimpo) {
      setErro('Informe um nome válido.');
      return;
    }
    if (!usuario) return;
    setSalvandoNome(true);
    setErro(null);
    try {
      await criacaoService.atualizarNome(usuario.id, nomeLimpo);
      setNomePersonagem(nomeLimpo);
      setNomeDoSorteio(nomeLimpo);
      setModalRenomear(false);
      setAviso(`Nome do personagem alterado para “${nomeLimpo}”.`);
    } catch (err: any) {
      setErro(err.message || 'Falha ao atualizar nome.');
    } finally {
      setSalvandoNome(false);
    }
  };

  /** Rola (ou rerrola) os atributos da raça selecionada no servidor. */
  const rolarAtributos = async () => {
    const racaAtual = opcoesRacas[racaSelecionadaIndex];
    if (!racaAtual || !usuario) return;
    setConfirmarRerolagem(null);
    setLoading(true);
    setErro(null);
    try {
      const resp = await criacaoService.escolherRaca(
        usuario.id,
        racaSelecionadaIndex,
        racaAtual.nome.toLowerCase().includes('dracon') ? linhagemDraconica : undefined
      );
      setRacaEscolhidaNome(resp.racaEscolhidaNome || racaAtual.nome);
      setAtributosRolados(resp.atributosRolados || {});
      setIndiceRolado(racaSelecionadaIndex);
      setRerolagensRestantes(resp.rerolagensRestantes ?? 0);
      setRerolagensPermitidas(resp.rerolagensPermitidas ?? rerolagensPermitidas);
      setEtapa(3);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) setRerolagensRestantes(0);
      setErro(err.message || 'Falha ao escolher raça e rolar atributos.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2 -> Passo 3. Mesma raça já rolada: só avança. Outra raça: rolar de novo gasta uma rerolagem.
  const handleConfirmarRaca = () => {
    if (!jaRolou) return rolarAtributos();
    if (racaSelecionadaIndex === indiceRolado) {
      setErro(null);
      setEtapa(3);
      return;
    }
    if (rerolagensRestantes <= 0) {
      setErro('Suas rerolagens acabaram: não é possível trocar de raça. Volte à raça já rolada para continuar.');
      return;
    }
    setConfirmarRerolagem('trocar-raca');
  };

  // Passo 4: Consagrar Ficha Definitiva no SQLite
  const handleFinalizarCriacao = async () => {
    if (!usuario) return;
    setLoading(true);
    setErro(null);
    try {
      const resp = await criacaoService.finalizar(usuario.id);
      if (resp && resp.id) {
        const nomeFinal = nomePersonagem.trim();
        if (nomeFinal && nomeFinal !== nomeDoSorteio) {
          await fichasService.atualizarFicha({ id: resp.id, nome: nomeFinal });
        }
        navigate(`/fichas/${resp.id}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao consagrar personagem no banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  // Atributos rolados pelo servidor (sem valores inventados quando faltar algum).
  const valorAtributo = (sigla: string, nomeLongo: string): number | null =>
    atributosRolados[sigla] ?? atributosRolados[nomeLongo] ?? null;
  const vig = valorAtributo('VIG', 'VIGOR');
  const forca = valorAtributo('FOR', 'FORCA');
  const des = valorAtributo('DES', 'DESTREZA');
  const men = valorAtributo('MEN', 'MENTAL');
  const esp = valorAtributo('ESP', 'ESPIRITO');
  const von = valorAtributo('VON', 'VONTADE');
  const exibir = (v: number | null) => (v === null ? '—' : v);

  const racaInfoAtiva = obterInfoRaca(racaEscolhidaNome);

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left pb-16">
      
      {/* Header do Wizard */}
      <div className="border-b border-linha pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-pergaminho flex items-center gap-3">
            <Dices className="w-8 h-8 text-amber-400" />
            <span>Forja de Heróis — Criação Canônica</span>
          </h1>
          <p className="text-xs text-nevoa font-sans-clean mt-1">
            Motor de regras canônicas de Thalúria com Sorteio de 3 Raças e Atributos em intervalos balanceados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {racasJaSorteadas && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmarReiniciar(true)}
              icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
              className="text-red-400 hover:text-red-300 hover:border-red-500/50 text-xs"
              title="Descartar rascunho atual e começar de novo"
            >
              Recomeçar do Zero
            </Button>
          )}
          <Link to="/">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Voltar ao Grimório
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de Progresso das 4 Etapas */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { num: 1, label: 'Identidade' },
          { num: 2, label: 'Sorteio de Raças' },
          { num: 3, label: '6 Atributos' },
          { num: 4, label: 'Consagração' },
        ].map((step) => (
          <div
            key={step.num}
            className={`p-2 sm:p-3 rounded-lg border text-center transition-all ${
              etapa === step.num
                ? 'bg-amber-400/15 border-amber-500/60 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                : etapa > step.num
                ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-300'
                : 'bg-painel border-linha text-gray-500'
            }`}
          >
            <span className="block text-[10px] font-cinzel uppercase tracking-widest text-nevoa">
              Passo {step.num}
            </span>
            <span className={`block text-[10px] sm:text-xs leading-tight font-cinzel font-bold ${
              etapa === step.num ? 'text-amber-300' : etapa > step.num ? 'text-emerald-300' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Dica / Orientação do Mestre da Campanha */}
      {dicaMestre && (
        <div className="p-4 bg-gradient-to-r from-blue-950/60 via-purple-950/40 to-painel border border-blue-500/50 rounded-xl flex items-start justify-between gap-3 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-fade-in">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-cinzel font-bold text-blue-300">
                  Orientação do Mestre da Campanha
                </span>
                <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs font-sans-clean mt-1 text-gray-200">
                "{dicaMestre}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aprovação do Mestre */}
      {aprovadaPeloMestre && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/60 rounded-xl flex items-center gap-3 text-emerald-200 text-xs shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <Crown className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong>Ficha Aprovada pelo Mestre!</strong> O mestre da mesa acompanhou e validou esta criação em tempo real.
          </span>
        </div>
      )}

      {aviso && (
        <div role="status" className="p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-xl flex items-center justify-between gap-3 text-emerald-200 text-xs font-sans-clean">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{aviso}</span>
          </div>
          <button onClick={() => setAviso(null)} className="text-emerald-400 hover:text-emerald-200 font-bold px-1">✕</button>
        </div>
      )}

      {/* Modal de Re-rolagem de Atributos ou Troca de Raça */}
      <ModalConfirmacao
        aberto={!!confirmarRerolagem}
        titulo={confirmarRerolagem === 'trocar-raca' ? 'Trocar de raça' : 'Re-rolar atributos'}
        textoConfirmar={`Usar 1 rerolagem (${rerolagensRestantes} restante${rerolagensRestantes === 1 ? '' : 's'})`}
        carregando={loading}
        onConfirmar={rolarAtributos}
        onCancelar={() => setConfirmarRerolagem(null)}
      >
        {confirmarRerolagem === 'trocar-raca'
          ? `Escolher ${opcoesRacas[racaSelecionadaIndex]?.nome ?? 'outra raça'} rola os seis atributos de novo. `
          : 'Os seis atributos atuais serão descartados e rolados de novo. '}
        Cada criação tem {rerolagensPermitidas} rerolagens e esta ação não pode ser desfeita.
      </ModalConfirmacao>

      {/* Modal para Recomeçar do Zero */}
      <ModalConfirmacao
        aberto={confirmarReiniciar}
        titulo="Recomeçar Criação do Zero?"
        textoConfirmar="Sim, descartar e recomeçar"
        perigoso
        carregando={loading}
        onConfirmar={handleReiniciarCriacao}
        onCancelar={() => setConfirmarReiniciar(false)}
      >
        Tem certeza que deseja recomeçar? O rascunho de <strong>{nomePersonagem || 'seu personagem'}</strong> e todas as raças e atributos já sorteados serão descartados do servidor.
      </ModalConfirmacao>

      {/* Modal para Alterar Nome do Herói */}
      <Modal
        aberto={modalRenomear}
        titulo="Alterar Nome do Personagem"
        icone={<Edit3 className="w-5 h-5 text-amber-400" />}
        onFechar={() => setModalRenomear(false)}
        bloqueado={salvandoNome}
        tamanho="sm"
      >
        <form onSubmit={handleSalvarNovoNome} className="space-y-4">
          <Input
            label="Novo Nome do Herói"
            placeholder="Ex: Aldor Vento-Gélido..."
            value={novoNomeInput}
            onChange={(e) => setNovoNomeInput(e.target.value)}
            maxLength={NOME_MAXIMO}
            required
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalRenomear(false)} disabled={salvandoNome}>
              Cancelar
            </Button>
            <Button variant="gold" size="sm" type="submit" loading={salvandoNome}>
              Salvar Nome
            </Button>
          </div>
        </form>
      </Modal>

      {/* Alerta de Erro */}
      {erro && (
        <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center justify-between gap-3 text-red-200 text-xs font-sans-clean">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
          <button onClick={() => setErro(null)} className="text-red-400 hover:text-red-200 font-bold px-1">✕</button>
        </div>
      )}

      {/* =========================================================================
          ETAPA 1: NOME E IDENTIDADE DO PERSONAGEM
         ========================================================================= */}
      {retomando && <div className="h-48 rounded-xl bg-painel/80 border border-linha-forte animate-pulse" aria-label="Verificando criação em andamento" />}

      {etapa === 1 && !retomando && (
        <Card variant="grimorio" className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-linha pb-4">
            <User className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-cinzel font-bold text-pergaminho">
                1. Quem é o seu Herói?
              </h2>
              <p className="text-xs text-nevoa font-sans-clean">
                Dê um nome à sua lenda antes que os dados místicos revelem sua espécie primordial.
              </p>
            </div>
          </div>

          <form onSubmit={handleIniciarCriacao} className="space-y-6">
            <Input
              label="Nome do Personagem"
              placeholder="Ex: Aldor Vento-Gélido, Vaelin de Frosthelm..."
              value={nomePersonagem}
              onChange={(e) => setNomePersonagem(e.target.value)}
              maxLength={NOME_MAXIMO}
              helperText={
                racasJaSorteadas
                  ? 'As raças já foram sorteadas. Mudar o nome não gera um novo sorteio; o novo nome é aplicado ao consagrar.'
                  : `Até ${NOME_MAXIMO} caracteres. Poderá ser alterado depois na ficha.`
              }
              required
              autoFocus
            />

            <div className="p-4 bg-abismo rounded-xl border border-amber-600/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-cinzel font-bold text-amber-300 block">
                    Pity System Acumulado: {usuario?.pity || 0}
                  </span>
                  <p className="text-[11px] text-nevoa font-sans-clean">
                    Seu fator de sorte aumenta as chances de raças Raras e Ancestrais Míticas (<strong className="text-amber-400">Draconatos &lt; 1%</strong>).
                  </p>
                </div>
              </div>
              <Badge variant="gold">Vaga 1 Humano Garantida</Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                variant="gold"
                size="lg"
                loading={loading}
                icon={<Dices className="w-5 h-5" />}
                className="flex-1 justify-center text-sm font-bold uppercase tracking-wider"
              >
                {racasJaSorteadas ? 'Continuar com as raças sorteadas' : 'Invocar o Grande Sorteio das 3 Raças'}
              </Button>
              {racasJaSorteadas && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setConfirmarReiniciar(true)}
                  icon={<Trash2 className="w-4 h-4 text-red-400" />}
                  className="text-red-400 hover:text-red-300 hover:border-red-500/50 justify-center text-xs font-bold uppercase tracking-wider"
                >
                  Descartar e Sortear Novas Raças
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* =========================================================================
          ETAPA 2: O GRANDE SORTEIO DAS 3 RAÇAS
         ========================================================================= */}
      {etapa === 2 && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-painel to-black/40 border border-amber-500/40 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-lg font-cinzel font-bold text-pergaminho flex items-center gap-2 flex-wrap">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span>As 3 Raças Reveladas para {nomePersonagem}</span>
                <button
                  type="button"
                  onClick={() => {
                    setNovoNomeInput(nomePersonagem);
                    setModalRenomear(true);
                  }}
                  className="text-xs text-nevoa hover:text-amber-300 inline-flex items-center gap-1 border border-linha rounded px-2 py-0.5 bg-abismo"
                  title="Alterar Nome do Herói"
                >
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-sans-clean">Renomear</span>
                </button>
              </h2>
              <p className="text-xs text-nevoa font-sans-clean">
                Escolha uma das 3 opções canônicas sorteadas diretamente pelo motor Java.
              </p>
            </div>
            <Badge variant="gold">{opcoesRacas.length} Opções Disponíveis</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opcoesRacas.map((raca, idx) => {
              const info = obterInfoRaca(raca.nome);
              const selecionada = racaSelecionadaIndex === idx;

              return (
                <div
                  key={raca.id || idx}
                  onClick={() => setRacaSelecionadaIndex(idx)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selecionada
                      ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_16px_rgba(212,175,55,0.3)] scale-[1.02]'
                      : 'bg-painel border-linha hover:border-linha-forte opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-cinzel uppercase tracking-widest text-nevoa">
                        {idx === 0 ? 'Vaga 1 (Fixo)' : `Vaga ${idx + 1} (Sorteada)`}
                      </span>
                      <Badge variant={raca.raridade === 'ANCESTRAL_MITICA' ? 'purple' : 'gold'} size="sm">
                        {raca.raridade ? raca.raridade.replace('_', ' ') : 'COMUM'}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-cinzel font-bold text-pergaminho">
                        {raca.nome}
                      </h3>
                      <span className="text-xs font-cinzel text-amber-400">
                        Reino: {raca.reino || info.reinoOrigem}
                      </span>
                    </div>

                    <p className="text-xs text-nevoa font-sans-clean leading-relaxed italic">
                      "{info.descricao}"
                    </p>

                    <div className="space-y-2 pt-2 border-t border-linha">
                      <div className="text-[11px] font-sans-clean">
                        <strong className="text-amber-300 block font-cinzel">1. Estrutural:</strong>
                        <span className="text-gray-300">{info.modEstrutural.titulo}</span>
                      </div>
                      <div className="text-[11px] font-sans-clean">
                        <strong className="text-cyan-300 block font-cinzel">2. Metabólico:</strong>
                        <span className="text-gray-300">{info.modMetabolico.titulo}</span>
                      </div>
                      <div className="text-[11px] font-sans-clean">
                        <strong className="text-purple-300 block font-cinzel">3. Inata:</strong>
                        <span className="text-gray-300">{info.habilidadeInata.nome}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-linha flex items-center justify-between">
                    <span className="text-xs font-cinzel text-amber-400 font-bold">
                      {selecionada ? '✓ Selecionada' : 'Clique para Escolher'}
                    </span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selecionada ? 'border-amber-400 bg-amber-400' : 'border-gray-600'
                    }`}>
                      {selecionada && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opção Especial Dracônica se a raça selecionada for Draconato */}
          {opcoesRacas[racaSelecionadaIndex]?.nome.toLowerCase().includes('dracon') && (
            <Card variant="grimorio" className="p-6 border-purple-600/50 space-y-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-base font-cinzel font-bold text-amber-300 uppercase tracking-wider">
                    Sorteio de Linhagem Primordial Dracônica (1d8)
                  </h4>
                  <p className="text-xs text-nevoa font-sans-clean">
                    Draconatos canalizam uma das 8 afinidades elementais canônicas de Thalúria no sopro primordial.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LINHAGENS_DRACONICAS.map((lin) => (
                  <button
                    key={lin.id}
                    type="button"
                    onClick={() => setLinhagemDraconica(lin.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      linhagemDraconica === lin.id
                        ? 'bg-purple-950/50 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-abismo border-linha opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {lin.numeroDado}d8
                      </span>
                      <Flame className={`w-3.5 h-3.5 ${lin.iconeCor}`} />
                    </div>
                    <strong className="text-xs font-cinzel text-pergaminho block">
                      {lin.nome}
                    </strong>
                    <span className="text-[10px] text-nevoa font-sans-clean block line-clamp-2 mt-0.5">
                      {lin.descricao}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => setEtapa(1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Voltar ao Nome
            </Button>

            <Button
              id="btn-confirmar-raca"
              variant="gold"
              size="lg"
              onClick={handleConfirmarRaca}
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {!jaRolou
                ? `Confirmar ${opcoesRacas[racaSelecionadaIndex]?.nome ?? ''} & rolar atributos`
                : racaSelecionadaIndex === indiceRolado
                ? 'Continuar com os atributos rolados'
                : `Trocar para ${opcoesRacas[racaSelecionadaIndex]?.nome ?? ''} (usa 1 rerolagem)`}
            </Button>
          </div>
          {jaRolou && racaSelecionadaIndex !== indiceRolado && (
            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-2 pt-1">
              <span className={`text-[11px] ${rerolagensRestantes > 0 ? 'text-amber-200' : 'text-red-300'}`}>
                {rerolagensRestantes > 0
                  ? `Trocar de raça rola os atributos de novo e consome uma rerolagem (${rerolagensRestantes} restante(s)).`
                  : `Suas rerolagens acabaram (${rerolagensPermitidas}/${rerolagensPermitidas} usadas). Peça novas raças ao Mestre ou recomece a criação.`}
              </span>
              {rerolagensRestantes <= 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmarReiniciar(true)}
                  icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                  className="text-red-400 hover:text-red-300 hover:border-red-500/50 text-xs"
                >
                  Recomeçar do Zero
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ETAPA 3: ROLAGEM DOS 6 ATRIBUTOS CANÔNICOS
         ========================================================================= */}
      {etapa === 3 && (
        <div className="space-y-6">
          <div className="p-4 bg-painel border border-linha-forte rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="gold">{racaEscolhidaNome}</Badge>
                <span className="text-xs font-cinzel text-amber-300">
                  Rolagem Oficial Executada no Servidor Java
                </span>
              </div>
              <h2 className="text-lg font-cinzel font-bold text-pergaminho flex items-center gap-2 flex-wrap">
                <span>Os 6 Atributos Canônicos de {nomePersonagem}</span>
                <button
                  type="button"
                  onClick={() => {
                    setNovoNomeInput(nomePersonagem);
                    setModalRenomear(true);
                  }}
                  className="text-xs text-nevoa hover:text-amber-300 inline-flex items-center gap-1 border border-linha rounded px-2 py-0.5 bg-abismo"
                  title="Alterar Nome do Herói"
                >
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-sans-clean">Renomear</span>
                </button>
              </h2>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-1">
              <Button
                id="btn-rerolar"
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => setConfirmarRerolagem('reroll')}
                loading={loading}
                disabled={rerolagensRestantes <= 0}
                title={rerolagensRestantes <= 0 ? 'Todas as rerolagens desta criação foram usadas' : 'Rolar de novo nos limites da raça'}
              >
                Re-rolar atributos
              </Button>
              <span id="contador-rerolagens" className={`text-[11px] font-mono ${rerolagensRestantes > 0 ? 'text-nevoa' : 'text-red-300'}`}>
                Rerolagens: {rerolagensRestantes} de {rerolagensPermitidas} restantes
              </span>
            </div>
          </div>

          {/* Cards dos 6 Atributos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { id: 'VIG', nome: 'Vigor', val: vig, cor: 'text-amber-400', desc: 'HP e Sustentação Biológica' },
              { id: 'FOR', nome: 'Força', val: forca, cor: 'text-amber-400', desc: 'Poder de Impacto e Carga' },
              { id: 'DES', nome: 'Destreza', val: des, cor: 'text-amber-400', desc: 'Esquiva e Ataques Finos' },
              { id: 'MEN', nome: 'Mental', val: men, cor: 'text-cyan-400', desc: 'Lógica e Dedução Investigativa' },
              { id: 'ESP', nome: 'Espírito', val: esp, cor: 'text-cyan-400', desc: 'Condutividade de Mana' },
              { id: 'VON', nome: 'Vontade', val: von, cor: 'text-purple-400', desc: 'Sanidade e Escudo da Alma' },
            ].map((attr) => {
              const grau = attr.val === null ? '—' : Math.floor(attr.val / 10);
              return (
                <Card key={attr.id} variant="grimorio" className="p-4 flex flex-col justify-between hover:border-amber-500/50 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-cinzel text-xs font-bold ${attr.cor}`}>
                        {attr.nome} ({attr.id})
                      </span>
                      <Badge variant="gold" size="sm">G{grau}</Badge>
                    </div>
                    <p className="text-[10px] text-nevoa font-sans-clean mb-3">
                      {attr.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-linha">
                    <span className="text-2xl font-cinzel font-black text-pergaminho">
                      {exibir(attr.val)}
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 bg-abismo px-2 py-0.5 rounded border border-linha-forte">
                      1d20 + G{grau}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Regras raciais que o servidor aplica ao consagrar (sem números estimados) */}
          <Card variant="pergaminho" className="p-6">
            <h4 className="font-cinzel text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Como os recursos serão calculados</span>
            </h4>
            <p className="text-xs text-nevoa font-sans-clean mb-4">
              Vida, Sanidade, Energia, Mana e Defesas são calculadas pelo servidor com as fórmulas da raça {racaInfoAtiva.nome} ao consagrar
              o personagem. Os valores finais aparecem na ficha.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[racaInfoAtiva.modEstrutural, racaInfoAtiva.modMetabolico].map((mod) => (
                <div key={mod.titulo} className="p-3 bg-black/40 rounded border border-linha-forte">
                  <span className="text-xs font-cinzel font-bold text-pergaminho block">{mod.titulo}</span>
                  <code className="block text-[11px] font-mono text-amber-300 mt-1">{mod.formula}</code>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => setEtapa(2)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Voltar às Raças
            </Button>

            <Button
              variant="gold"
              size="lg"
              onClick={() => setEtapa(4)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Avançar para Revisão & Consagração
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 4: REVISÃO FINAL E CONSAGRAÇÃO DA FICHA
         ========================================================================= */}
      {etapa === 4 && (
        <Card variant="grimorio" className="p-8 space-y-6 border-amber-500/60 shadow-2xl">
          <div className="text-center space-y-2 border-b border-linha pb-6">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
            <h2 className="text-2xl font-cinzel font-bold text-pergaminho">
              A Forja está Concluída!
            </h2>
            <p className="text-xs text-nevoa font-sans-clean max-w-md mx-auto">
              Revise o perfil canônico do seu herói antes de consagrá-lo no banco de dados da campanha.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-abismo rounded-xl border border-linha">
            <div className="space-y-2">
              <span className="text-[10px] font-cinzel text-nevoa uppercase tracking-widest block">
                Herói & Espécie
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-cinzel font-bold text-amber-300">
                  {nomePersonagem}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setNovoNomeInput(nomePersonagem);
                    setModalRenomear(true);
                  }}
                  className="text-xs text-nevoa hover:text-amber-300 inline-flex items-center gap-1 border border-linha rounded px-2 py-0.5 bg-abismo"
                  title="Alterar Nome do Herói"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-sans-clean">Renomear</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="gold">{racaEscolhidaNome}</Badge>
                <span className="text-xs font-cinzel text-gray-400">
                  {racaInfoAtiva.reinoOrigem}
                </span>
              </div>
              <p className="text-xs text-nevoa font-sans-clean mt-2 italic">
                "{racaInfoAtiva.descricao}"
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-cinzel text-nevoa uppercase tracking-widest block">
                Habilidade Inata Canônica
              </span>
              <div className="p-3 bg-painel rounded-lg border border-purple-500/30">
                <h4 className="font-cinzel text-sm font-bold text-purple-300">
                  {racaInfoAtiva.habilidadeInata.nome}
                </h4>
                <p className="text-xs text-nevoa font-sans-clean mt-1">
                  {racaInfoAtiva.habilidadeInata.descricao}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300 pt-1">
                <span>VIG: <strong className="text-amber-300">{exibir(vig)}</strong></span>
                <span>MEN: <strong className="text-cyan-300">{exibir(men)}</strong></span>
                <span>FOR: <strong className="text-amber-300">{exibir(forca)}</strong></span>
                <span>ESP: <strong className="text-cyan-300">{exibir(esp)}</strong></span>
                <span>DES: <strong className="text-amber-300">{exibir(des)}</strong></span>
                <span>VON: <strong className="text-purple-300">{exibir(von)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-linha">
            <Button
              variant="outline"
              size="md"
              onClick={() => setEtapa(3)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Ajustar Atributos
            </Button>

            <Button
              variant="gold"
              size="lg"
              loading={loading}
              onClick={handleFinalizarCriacao}
              icon={<CheckCircle2 className="w-5 h-5" />}
              className="px-8 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              Consagrar Personagem no Grimório
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
};
