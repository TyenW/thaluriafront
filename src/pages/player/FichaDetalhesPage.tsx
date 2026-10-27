import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
  Backpack,
  BookOpen,
  HeartPulse,
  Wand2,
  Brain,
  Camera,
  Coins,
  Flame,
  Heart,
  Pencil,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { fichasService, type FichaAtualizada } from '../../services/fichasService';
import type { FichaPersonagem, MoedasFicha } from '../../types/ficha';
import { lerMoedas, resumirMoedas } from '../../data/moedas';
import { calcularDerivados } from '../../utils/calculosFicha';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ModalConfirmacao } from '../../components/common/ModalConfirmacao';
import { PainelAvisos, useAvisos } from '../../components/common/Avisos';
import { BarraRecurso, TEMAS_RECURSO } from '../../components/ficha/BarraRecurso';
import { CarteiraMoedas } from '../../components/ficha/CarteiraMoedas';
import { AbaAtributos } from '../../components/ficha/AbaAtributos';
import { AbaPericias } from '../../components/ficha/AbaPericias';
import { AbaInventario } from '../../components/ficha/AbaInventario';
import { AbaProgressao } from '../../components/ficha/AbaProgressao';
import { AbaCompanheiros } from '../../components/ficha/AbaCompanheiros';
import { AbaRaca } from '../../components/ficha/AbaRaca';
import { AbaHistoria } from '../../components/ficha/AbaHistoria';
import { AbaCondicoes } from '../../components/ficha/AbaCondicoes';
import { AbaMagias } from '../../components/ficha/AbaMagias';
import { ModalEditarFicha } from '../../components/ficha/ModalEditarFicha';
import { ModalRetrato } from '../../components/ficha/ModalRetrato';
import { Abas } from '../../components/common/Abas';
import { useAuth } from '../../contexts/AuthContext';

type Aba = 'atributos' | 'pericias' | 'magias' | 'condicoes' | 'inventario' | 'moedas' | 'progressao' | 'historia' | 'companheiros' | 'raca';
type Recurso = 'hpAtual' | 'sanAtual' | 'energiaAtual' | 'manaAtual';

const ABAS: { id: Aba; rotulo: string; icone: React.ReactNode }[] = [
  { id: 'atributos', rotulo: 'Atributos', icone: <Shield className="w-4 h-4" /> },
  { id: 'pericias', rotulo: 'Perícias', icone: <Award className="w-4 h-4" /> },
  { id: 'magias', rotulo: 'Magias', icone: <Wand2 className="w-4 h-4" /> },
  { id: 'condicoes', rotulo: 'Condições', icone: <HeartPulse className="w-4 h-4" /> },
  { id: 'inventario', rotulo: 'Inventário', icone: <Backpack className="w-4 h-4" /> },
  { id: 'moedas', rotulo: 'Moedas', icone: <Coins className="w-4 h-4" /> },
  { id: 'progressao', rotulo: 'Progressão', icone: <TrendingUp className="w-4 h-4" /> },
  { id: 'historia', rotulo: 'História', icone: <BookOpen className="w-4 h-4" /> },
  { id: 'companheiros', rotulo: 'Companheiros', icone: <Activity className="w-4 h-4" /> },
  { id: 'raca', rotulo: 'Raça & Inata', icone: <Sparkles className="w-4 h-4" /> },
];

const MAXIMO_DO_RECURSO: Record<Recurso, keyof FichaPersonagem> = {
  hpAtual: 'hpMax',
  sanAtual: 'sanMax',
  energiaAtual: 'energiaMax',
  manaAtual: 'manaMax',
};

export const FichaDetalhesPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { avisos, avisar, fechar: fecharAviso } = useAvisos();
  const { isMestre } = useAuth();

  const [ficha, setFichaEstado] = useState<FichaPersonagem | null>(null);
  // Cópia síncrona do estado para cliques rápidos seguidos (+1, +1, +1...).
  const fichaRef = useRef<FichaPersonagem | null>(null);
  const setFicha = useCallback((proxima: FichaPersonagem | null | ((f: FichaPersonagem | null) => FichaPersonagem | null)) => {
    const valor = typeof proxima === 'function' ? proxima(fichaRef.current) : proxima;
    fichaRef.current = valor;
    setFichaEstado(valor);
  }, []);

  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [modalEdicao, setModalEdicao] = useState(false);
  const [modalFoto, setModalFoto] = useState(false);
  const [confirmarRestaurar, setConfirmarRestaurar] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const abaParam = searchParams.get('aba') as Aba | null;
  const abaAtiva: Aba = ABAS.some((a) => a.id === abaParam) ? (abaParam as Aba) : 'atributos';
  const irParaAba = (aba: Aba) =>
    setSearchParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        novo.set('aba', aba);
        return novo;
      },
      { replace: true }
    );

  const carregarFicha = useCallback(
    async (modo: 'inicial' | 'silencioso' = 'inicial') => {
      if (!id) return;
      if (modo === 'inicial') {
        setLoading(true);
        setErro(null);
      } else {
        setSincronizando(true);
      }
      try {
        const data = await fichasService.obterPorId(id);
        if (data) {
          setFicha(data);
          setErro(null);
        } else if (modo === 'inicial') {
          setErro(`A ficha #${id} não foi encontrada. Ela pode ter sido excluída.`);
        }
      } catch (err: any) {
        if (modo === 'inicial') setErro(err.message || 'Falha na comunicação com o servidor.');
        else avisar('erro', err.message || 'Não foi possível sincronizar a ficha.');
      } finally {
        setLoading(false);
        setSincronizando(false);
      }
    },
    [id, setFicha, avisar]
  );

  useEffect(() => {
    setFicha(null);
    carregarFicha('inicial');
  }, [carregarFicha, setFicha]);

  /** Aplica a resposta autoritativa de /api/fichas/atualizar sobre a ficha local. */
  const aplicarResposta = (resp: FichaAtualizada) => {
    const { status: _status, ...campos } = resp;
    setFicha((f) => (f ? { ...f, ...campos, moedas: resp.moedas ?? f.moedas } : f));
  };

  const ajustarRecurso = async (recurso: Recurso, delta: number) => {
    const atual = fichaRef.current;
    if (!atual) return;
    const maximo = Number(atual[MAXIMO_DO_RECURSO[recurso]]) || 0;
    const novo = Math.min(maximo, Math.max(0, atual[recurso] + delta));
    if (novo === atual[recurso]) return;

    setFicha({ ...atual, [recurso]: novo });
    try {
      await fichasService.atualizarFicha({ id: atual.id, [recurso]: novo });
    } catch (err: any) {
      avisar('erro', `${err.message || 'Falha ao salvar.'} O valor exibido foi ressincronizado com o servidor.`);
      carregarFicha('silencioso');
    }
  };

  const restaurarTudo = async () => {
    const atual = fichaRef.current;
    if (!atual) return;
    setRestaurando(true);
    try {
      const resp = await fichasService.atualizarFicha({
        id: atual.id,
        hpAtual: atual.hpMax,
        sanAtual: atual.sanMax,
        energiaAtual: atual.energiaMax,
        manaAtual: atual.manaMax,
      });
      aplicarResposta(resp);
      avisar('sucesso', 'Vida, Sanidade, Energia e Mana restauradas ao máximo.');
      setConfirmarRestaurar(false);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível restaurar os recursos.');
    } finally {
      setRestaurando(false);
    }
  };

  const salvarMoedas = async (alteradas: Partial<MoedasFicha>): Promise<boolean> => {
    if (!ficha) return false;
    try {
      const resp = await fichasService.atualizarFicha({ id: ficha.id, moedas: alteradas });
      if (!resp.moedas) throw new Error('O servidor não confirmou as moedas salvas. Atualize o back-end.');
      aplicarResposta(resp);
      avisar('sucesso', 'Moedas atualizadas.');
      return true;
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar as moedas.');
      return false;
    }
  };

  const salvarPE = async (pe: number): Promise<boolean> => {
    if (!ficha) return false;
    try {
      aplicarResposta(await fichasService.atualizarFicha({ id: ficha.id, pontosEssencia: pe }));
      avisar('sucesso', 'Pontos de Essência atualizados.');
      return true;
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar os Pontos de Essência.');
      return false;
    }
  };

  const excluirFicha = async () => {
    if (!ficha) return;
    setExcluindo(true);
    try {
      await fichasService.excluirFicha(ficha.id);
      navigate('/', { replace: true });
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível excluir a ficha.');
      setExcluindo(false);
    }
  };

  if (!loading && (erro || !ficha)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-left py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-cinzel text-amber-400 hover:text-amber-300">
          <ArrowLeft className="w-4 h-4" />
          Voltar aos personagens
        </Link>
        <Card variant="grimorio" className="p-8 text-center border-red-500/40 bg-red-950/20">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-cinzel font-bold text-red-200 mb-2">Não foi possível abrir a ficha</h2>
          <p className="text-sm text-nevoa font-sans-clean max-w-lg mx-auto mb-6">{erro || `A ficha #${id} não existe.`}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => carregarFicha('inicial')}>
              Tentar novamente
            </Button>
            <Link to="/">
              <Button variant="gold" size="sm">
                Voltar à lista de personagens
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loading || !ficha) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 text-left py-8" aria-busy="true" aria-label="Carregando ficha">
        <div className="h-6 w-48 bg-painel-alto rounded animate-pulse" />
        <div className="h-40 bg-painel-alto rounded-lg border border-linha-forte animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-painel-alto rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-10 bg-painel-alto rounded-lg animate-pulse" />
      </div>
    );
  }

  const derivados = calcularDerivados(ficha);
  const moedas = lerMoedas(ficha.moedas);
  const tudoCheio =
    ficha.hpAtual >= ficha.hpMax && ficha.sanAtual >= ficha.sanMax && ficha.energiaAtual >= ficha.energiaMax && ficha.manaAtual >= ficha.manaMax;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-12">
      {/* Navegação e ações gerais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-linha pb-4">
        <nav aria-label="Trilha" className="flex items-center gap-2 text-xs font-cinzel min-w-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-painel-alto hover:bg-painel-alto border border-linha-forte hover:border-amber-500/50 rounded text-amber-300 transition-all shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Personagens
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-texto-2 truncate">{ficha.nome}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {isMestre && (
            <Button id="btn-editar-ficha" variant="gold" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setModalEdicao(true)}>
              Editar ficha
            </Button>
          )}
          <Button
            id="btn-sincronizar"
            variant="outline"
            size="sm"
            loading={sincronizando}
            onClick={() => carregarFicha('silencioso')}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Recarregar os dados salvos no servidor"
          >
            Sincronizar
          </Button>
          {isMestre && (
            <Button
              id="btn-excluir-ficha"
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setConfirmarExcluir(true)}
              className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
            >
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Identidade do personagem */}
      <Card variant="grimorio" className="p-5 sm:p-7 border-amber-600/40 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4 sm:gap-6 min-w-0">
            <button
              id="btn-avatar-retrato"
              type="button"
              onClick={() => setModalFoto(true)}
              className="relative group shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-600/30 via-painel to-abismo border-2 border-amber-500/60 hover:border-amber-400 overflow-hidden cursor-pointer transition-colors"
              aria-label={ficha.imagemUrl ? 'Alterar retrato do personagem' : 'Adicionar retrato do personagem'}
            >
              {ficha.imagemUrl ? (
                <img src={ficha.imagemUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="flex flex-col items-center justify-center h-full text-amber-400/80">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
                  <span className="text-[10px] font-cinzel text-amber-300">Sem retrato</span>
                </span>
              )}
              <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 flex flex-col items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-amber-300 mb-1" />
                <span className="text-[10px] font-cinzel text-amber-200">Alterar</span>
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="purple">{derivados.patamar}</Badge>
                <Badge variant="cyan">
                  NR {derivados.nr} • Ordem {derivados.ordem}
                </Badge>
                {(ficha.pontosEssencia ?? 0) > 0 && <Badge variant="gold">{ficha.pontosEssencia} PE</Badge>}
                {(ficha.condicoes ?? []).slice(0, 4).map((c) => (
                  <button key={c.id} type="button" onClick={() => irParaAba('condicoes')} className="cursor-pointer" title="Ver condições">
                    <Badge variant={c.tipo === 'POSITIVA' ? 'cyan' : c.tipo === 'NEGATIVA' ? 'danger' : 'muted'}>
                      {c.nome}
                      {c.duracaoTurnos != null && ` · ${c.duracaoTurnos}t`}
                    </Badge>
                  </button>
                ))}
                {(ficha.condicoes?.length ?? 0) > 4 && <Badge variant="muted">+{(ficha.condicoes?.length ?? 0) - 4}</Badge>}
              </div>
              <h1 className="text-2xl sm:text-4xl font-cinzel font-black text-pergaminho tracking-wide leading-tight break-words">{ficha.nome}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-cinzel text-nevoa mt-2">
                <span>
                  Raça: <strong className="text-amber-300">{ficha.raca}</strong>
                </span>
                {ficha.reinoOrigem && (
                  <span>
                    Reino: <strong className="text-amber-200/90">{ficha.reinoOrigem}</strong>
                  </span>
                )}
                {ficha.cidadeAtual && (
                  <span>
                    Localização: <strong className="text-emerald-400">{ficha.cidadeAtual}</strong>
                  </span>
                )}
                <span className="text-apagado">#{ficha.id}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-abismo/90 border border-linha p-3 sm:p-4 rounded-xl shrink-0 lg:w-80">
            <div className="text-center px-2 border-r border-linha">
              <span className="text-[10px] font-cinzel text-amber-500/80 uppercase block">Potencial de Alma</span>
              <strong className="text-lg font-cinzel font-black gold-gradient-text">{derivados.pa} PA</strong>
            </div>
            <button
              type="button"
              onClick={() => irParaAba('moedas')}
              className="text-center px-2 rounded hover:bg-white/5 cursor-pointer min-w-0"
              title="Gerenciar moedas"
            >
              <span className="text-[10px] font-cinzel text-amber-500/80 uppercase block">Moedas</span>
              <strong className="flex items-center justify-center gap-1 text-xs font-mono font-bold text-amber-300 truncate">
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{resumirMoedas(moedas)}</span>
              </strong>
            </button>
          </div>
        </div>
      </Card>

      {/* Recursos vitais */}
      <section aria-label="Recursos vitais" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel text-xs font-bold text-amber-300 uppercase tracking-widest">Recursos em jogo</h2>
          {isMestre && (
            <Button
              id="btn-curar-tudo"
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setConfirmarRestaurar(true)}
              disabled={tudoCheio}
              title={tudoCheio ? 'Todos os recursos já estão no máximo' : 'Restaurar todos os recursos ao máximo'}
            >
              Restaurar tudo
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <BarraRecurso
            nome="Vida (HP)"
            icone={<Heart className="w-4 h-4 text-red-500 fill-red-500/30" />}
            atual={ficha.hpAtual}
            maximo={ficha.hpMax}
            tema={TEMAS_RECURSO.hp}
            onAjustar={(d) => ajustarRecurso('hpAtual', d)}
            rodape={
              <>
                <span>
                  Def. Física: <strong className="text-amber-300">{ficha.defFisica}</strong>
                </span>
                <span>
                  Agonia: <strong className="text-red-400">{derivados.turnosMorte} turnos</strong>
                </span>
              </>
            }
          />
          <BarraRecurso
            nome="Sanidade (SAN)"
            icone={<Brain className="w-4 h-4 text-purple-400" />}
            atual={ficha.sanAtual}
            maximo={ficha.sanMax}
            tema={TEMAS_RECURSO.san}
            onAjustar={(d) => ajustarRecurso('sanAtual', d)}
            rodape={
              <span>
                Def. Oculta: <strong className="text-purple-300">{ficha.defOculta}</strong>
              </span>
            }
          />
          <BarraRecurso
            nome="Energia"
            icone={<Zap className="w-4 h-4 text-emerald-400" />}
            atual={ficha.energiaAtual}
            maximo={ficha.energiaMax}
            tema={TEMAS_RECURSO.energia}
            onAjustar={(d) => ajustarRecurso('energiaAtual', d)}
          />
          <BarraRecurso
            nome="Mana"
            icone={<Flame className="w-4 h-4 text-cyan-400" />}
            atual={ficha.manaAtual}
            maximo={ficha.manaMax}
            tema={TEMAS_RECURSO.mana}
            onAjustar={(d) => ajustarRecurso('manaAtual', d)}
            rodape={
              <span>
                Regeneração: <strong className="text-cyan-300">+{derivados.manaRegen}/turno</strong>
              </span>
            }
          />
        </div>
      </section>

      {/* Gerenciamento da ficha por abas */}
      <section aria-label="Gerenciamento da ficha" className="space-y-4">
        <Abas
          rotulo="Seções da ficha"
          ativa={abaAtiva}
          onTrocar={irParaAba}
          abas={ABAS.map((aba) => ({
            ...aba,
            contagem:
              aba.id === 'companheiros' ? ficha.domados?.length
              : aba.id === 'inventario' ? ficha.inventario?.length
              : aba.id === 'condicoes' ? ficha.condicoes?.length
              : aba.id === 'magias' ? ficha.magias?.length
              : undefined,
          }))}
        />

        <div id={`aba-painel-${abaAtiva}`} role="tabpanel" aria-labelledby={`aba-${abaAtiva}`}>
          {abaAtiva === 'atributos' && <AbaAtributos ficha={ficha} derivados={derivados} onEditar={isMestre ? () => setModalEdicao(true) : undefined} />}
          {abaAtiva === 'pericias' && (
            <AbaPericias
              ficha={ficha}
              podeGerenciar={isMestre}
              avisar={avisar}
              onPericiasAtualizadas={(pericias) => setFicha((f) => (f ? { ...f, pericias } : f))}
            />
          )}
          {abaAtiva === 'inventario' && (
            <AbaInventario
              ficha={ficha}
              derivados={derivados}
              onIrParaMoedas={() => irParaAba('moedas')}
              podeGerenciar={isMestre}
              avisar={avisar}
              onInventarioAtualizado={(inventario) => setFicha((f) => (f ? { ...f, inventario } : f))}
            />
          )}
          {abaAtiva === 'moedas' && <CarteiraMoedas moedas={moedas} onSalvar={salvarMoedas} podeGerenciar={isMestre} />}
          {abaAtiva === 'progressao' && <AbaProgressao ficha={ficha} derivados={derivados} onSalvarPE={isMestre ? salvarPE : undefined} />}
          {abaAtiva === 'companheiros' && <AbaCompanheiros ficha={ficha} />}
          {abaAtiva === 'raca' && <AbaRaca ficha={ficha} />}
          {abaAtiva === 'historia' && (
            <AbaHistoria ficha={ficha} avisar={avisar} onSalvo={(historia) => setFicha((f) => (f ? { ...f, historia } : f))} />
          )}
          {abaAtiva === 'condicoes' && (
            <AbaCondicoes ficha={ficha} podeGerenciar={isMestre} avisar={avisar} onAtualizadas={(condicoes) => setFicha((f) => (f ? { ...f, condicoes } : f))} />
          )}
          {abaAtiva === 'magias' && (
            <AbaMagias ficha={ficha} podeGerenciar={isMestre} avisar={avisar} onAtualizadas={(magias) => setFicha((f) => (f ? { ...f, magias } : f))} />
          )}
        </div>
      </section>

      <ModalEditarFicha aberto={isMestre && modalEdicao} ficha={ficha} onFechar={() => setModalEdicao(false)} onSalvo={aplicarResposta} avisar={avisar} />

      <ModalRetrato
        aberto={modalFoto}
        fichaId={ficha.id}
        imagemAtual={ficha.imagemUrl}
        onFechar={() => setModalFoto(false)}
        onSalvo={(imagemUrl) => setFicha((f) => (f ? { ...f, imagemUrl } : f))}
        avisar={avisar}
      />

      <ModalConfirmacao
        aberto={confirmarRestaurar}
        titulo="Restaurar todos os recursos"
        textoConfirmar="Restaurar ao máximo"
        carregando={restaurando}
        onConfirmar={restaurarTudo}
        onCancelar={() => setConfirmarRestaurar(false)}
      >
        Vida, Sanidade, Energia e Mana de <strong className="text-amber-300">{ficha.nome}</strong> voltarão ao valor máximo. Os valores atuais serão substituídos.
      </ModalConfirmacao>

      <ModalConfirmacao
        aberto={confirmarExcluir}
        titulo="Excluir personagem"
        textoConfirmar="Excluir definitivamente"
        perigoso
        carregando={excluindo}
        onConfirmar={excluirFicha}
        onCancelar={() => setConfirmarExcluir(false)}
      >
        Apagar permanentemente <strong className="text-amber-300 font-cinzel">{ficha.nome}</strong> (#{ficha.id})? Perícias, inventário, moedas e companheiros
        domados também serão excluídos. Esta ação não pode ser desfeita.
      </ModalConfirmacao>

      <PainelAvisos avisos={avisos} onFechar={fecharAviso} />
    </div>
  );
};
