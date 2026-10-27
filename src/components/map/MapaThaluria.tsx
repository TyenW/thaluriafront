import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Compass,
  Eye,
  EyeOff,
  Locate,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Truck,
} from 'lucide-react';
import {
  ALTURA_MAPA,
  CIDADES_ATLAS,
  ESTRADAS_ATLAS,
  ROTAS_MARITIMAS_ATLAS,
  LARGURA_MAPA,
  REINOS,
  ROTULOS_MAR,
  type CidadeAtlas,
  type TipoCidade,
} from '../../data/atlasThaluria';
import type { CidadeVisivel, RotaConexao } from '../../types/monstro';
import { construirAtlas } from './construirAtlas';
import { tracarRota } from './tracadoRotas';
import {
  CENTROS_REINOS,
  FONTE_MAPA,
  FONTE_MAPA_SC,
  PAPEL_CLARO,
  PAPEL_NEVOA,
  ROTULO_TIPO,
  TINTA,
  TINTA_SUAVE,
  TINTA_VERMELHA,
  VISTA_INICIAL,
  ZOOM_MAX,
  ajustarVista,
  getCorPerigo,
  limitar,
  normalizar,
  type CidadeResolvida,
  type NivelVisibilidade,
  type RotaHoverInfo,
  type RotaTracada,
  type Vista,
} from './estiloMapa';
import { BarraEscala, CamadaBase, GlifoCidade, RosaDosVentos, Titulo } from './ornamentosMapa';
import { BotaoMapa, FichaCidade, Legenda } from './interfaceMapa';
import { CamadaCaravanas, FichaCaravana } from './camadaCaravanas';
import { posicionarCaravanas } from './posicaoCaravanas';
import type { CaravanaMapa } from '../../types/comercio';

export interface MapaThaluriaProps {
  cidades: CidadeVisivel[];
  rotas: RotaConexao[];
  /** 'mestre' permite alterar a visibilidade das cidades e enxerga cidades ocultas. */
  modo?: 'jogador' | 'mestre';
  /** Revela o atlas inteiro, ignorando o Fog-of-War (usado quando a API está indisponível). */
  demonstracao?: boolean;
  onAlterarVisibilidade?: (cidade: string, nivel: NivelVisibilidade) => Promise<void>;
  /** Cidade atual do jogador para destaque com farol e atalho de navegação. */
  cidadeAtual?: string;
  /** Notifica componente pai quando o modo de pré-visualização mudar. */
  onTogglePreviewJogador?: (ativo: boolean) => void;
  /** Caravanas em viagem (só o Mestre recebe); desenhadas sobre as rotas. */
  caravanas?: CaravanaMapa[];
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export const MapaThaluria: React.FC<MapaThaluriaProps> = ({
  cidades,
  rotas,
  modo = 'jogador',
  demonstracao = false,
  onAlterarVisibilidade,
  cidadeAtual,
  onTogglePreviewJogador,
  caravanas,
}) => {
  const idBase = useId().replace(/[^a-zA-Z0-9]/g, '');
  const atlas = useMemo(() => construirAtlas(), []);
  const mestre = modo === 'mestre';

  // Modo de pré-visualização como jogador (para o Mestre)
  const [previewJogador, setPreviewJogador] = useState(false);
  const ehVisaoMestre = mestre && !previewJogador;

  const [vista, setVista] = useState<Vista>(VISTA_INICIAL);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sobrepor, setSobrepor] = useState<Record<string, NivelVisibilidade>>({});
  const [menuReinosAberto, setMenuReinosAberto] = useState(false);
  const [rotaHover, setRotaHover] = useState<RotaHoverInfo | null>(null);
  const [mostrarCaravanas, setMostrarCaravanas] = useState(true);
  const [caravanaSel, setCaravanaSel] = useState<{ id: number; left: number; top: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const arrastando = useRef(false);
  const movido = useRef(false);
  const distPinch = useRef(0);
  const animacao = useRef<number | null>(null);

  // Notifica pai quando preview muda
  useEffect(() => {
    onTogglePreviewJogador?.(previewJogador);
  }, [previewJogador, onTogglePreviewJogador]);

  // --- Cidades e rotas vindas da API (posição gravada no servidor) ----------
  // O atlas local só completa dados ausentes e serve de base no modo demonstração.
  const cidadesBase = useMemo<CidadeAtlas[]>(() => {
    if (demonstracao && cidades.length === 0) return CIDADES_ATLAS;
    const atlasPorNome = new Map(CIDADES_ATLAS.map((c) => [normalizar(c.nome), c]));
    const lista: CidadeAtlas[] = [];
    for (const c of cidades) {
      if (c.nome === '???') continue;
      const base = atlasPorNome.get(normalizar(c.nome));
      const x = c.x ?? base?.x;
      const y = c.y ?? base?.y;
      if (x == null || y == null) continue;
      lista.push({
        nome: c.nome,
        reino: (c.reino as CidadeAtlas['reino']) ?? base?.reino ?? 'ilhas',
        tipo: (c.icone as TipoCidade) ?? base?.tipo ?? (c.temPorto ? 'porto' : 'cidade'),
        x,
        y,
        rotulo: base?.rotulo,
      });
    }
    return lista;
  }, [cidades, demonstracao]);

  const { estradasBase, maritimasBase } = useMemo(() => {
    const posicao = new Map(cidadesBase.map((c) => [c.nome, c]));
    const lista: { de: string; para: string; tipo: 'TERRESTRE' | 'MARITIMA' }[] =
      demonstracao && rotas.length === 0
        ? [
            ...ESTRADAS_ATLAS.map((e) => ({ de: e.de, para: e.para, tipo: 'TERRESTRE' as const })),
            ...ROTAS_MARITIMAS_ATLAS.map((e) => ({ de: e.de, para: e.para, tipo: 'MARITIMA' as const })),
          ]
        : rotas.map((r) => ({ de: r.origem, para: r.destino, tipo: r.tipo }));
    const estradas: RotaTracada[] = [];
    const maritimas: RotaTracada[] = [];
    for (const r of lista) {
      const a = posicao.get(r.de);
      const b = posicao.get(r.para);
      if (!a || !b) continue;
      const maritima = r.tipo === 'MARITIMA';
      const t = tracarRota(a, b, maritima ? 'agua' : 'terra');
      const rota: RotaTracada = {
        chave: `${r.tipo}|${r.de}|${r.para}`,
        de: r.de,
        para: r.para,
        d: t.d,
        // Estradas que saem de capitais são as vias principais do reino.
        principal: !maritima && (a.tipo === 'capital' || b.tipo === 'capital'),
        impossivel: t.impossivel,
        motivo: t.motivo,
      };
      (maritima ? maritimas : estradas).push(rota);
    }
    return { estradasBase: estradas, maritimasBase: maritimas };
  }, [cidadesBase, rotas, demonstracao]);

  // --- Resolve o que cada cidade do atlas mostra ---------------------------
  const cidadesResolvidas = useMemo<CidadeResolvida[]>(() => {
    const porNome = new Map(cidades.map((c) => [normalizar(c.nome), c]));
    return cidadesBase.map((atlasCidade) => {
      const api = porNome.get(normalizar(atlasCidade.nome));
      let vis: NivelVisibilidade;
      if (demonstracao) {
        vis = 'INFORMACOES_COMPLETAS';
      } else if (sobrepor[atlasCidade.nome]) {
        vis = sobrepor[atlasCidade.nome];
      } else if (ehVisaoMestre) {
        // Para o Mestre, ele sempre vê as cidades, mas 'vis' armazena o status que o jogador tem
        vis = api?.visibilidadeJogador ?? (api ? api.visibilidade : 'OCULTO');
      } else {
        // Para o Jogador (ou Mestre no modo pré-visualização de Jogador)
        vis = api?.visibilidadeJogador ?? api?.visibilidade ?? 'OCULTO';
      }
      return { atlas: atlasCidade, api, vis };
    });
  }, [cidades, cidadesBase, demonstracao, ehVisaoMestre, sobrepor]);

  const caravanasNoMapa = useMemo(() => {
    if (!caravanas?.length) return [];
    const porNome = new Map(cidadesBase.map((c) => [normalizar(c.nome), c]));
    return posicionarCaravanas(caravanas, (nome) => {
      const c = porNome.get(normalizar(nome));
      return c ? { x: c.x, y: c.y } : null;
    });
  }, [caravanas, cidadesBase]);

  const resolvidaPorNome = useMemo(() => new Map(cidadesResolvidas.map((c) => [c.atlas.nome, c])), [cidadesResolvidas]);

  /** Cidades da API sem posição no mapa — o Mestre pode posicioná-las no painel de gerenciamento. */
  const semCoordenadas = useMemo(() => {
    const comPosicao = new Set(cidadesBase.map((c) => normalizar(c.nome)));
    return cidades.filter((c) => c.nome !== '???' && !comPosicao.has(normalizar(c.nome)));
  }, [cidades, cidadesBase]);

  const visivel = (c: CidadeResolvida) => c.vis !== 'OCULTO';

  const reinoRevelado = useMemo(() => {
    const m = new Set<string>();
    for (const c of cidadesResolvidas) if (visivel(c)) m.add(c.atlas.reino);
    return m;
  }, [cidadesResolvidas]);

  const totalVisiveis = cidadesResolvidas.filter(visivel).length;

  // --- Rotas ---------------------------------------------------------------
  const rotaApi = useMemo(() => {
    const m = new Map<string, RotaConexao>();
    for (const r of rotas) m.set([normalizar(r.origem), normalizar(r.destino)].sort().join('|'), r);
    return m;
  }, [rotas]);

  const buscarRota = useCallback(
    (a: string, b: string) => rotaApi.get([normalizar(a), normalizar(b)].sort().join('|')),
    [rotaApi]
  );

  const estimarDistancia = useCallback((aNome: string, bNome: string): number => {
    const ca = resolvidaPorNome.get(aNome)?.atlas;
    const cb = resolvidaPorNome.get(bNome)?.atlas;
    if (!ca || !cb) return 60;
    return Math.round(Math.hypot(ca.x - cb.x, ca.y - cb.y) * 1.35);
  }, [resolvidaPorNome]);

  const isCidadeVisivelParaJogador = useCallback((nome: string): boolean => {
    if (demonstracao) return true;
    const c = resolvidaPorNome.get(nome);
    return !!c && c.vis !== 'OCULTO';
  }, [demonstracao, resolvidaPorNome]);

  const isRotaVisivelParaJogador = useCallback((de: string, para: string): boolean => {
    if (demonstracao) return true;
    return isCidadeVisivelParaJogador(de) && isCidadeVisivelParaJogador(para);
  }, [demonstracao, isCidadeVisivelParaJogador]);

  // Lista de estradas com dados e visibilidade calculados
  const estradasRenderizadas = useMemo(() => {
    return estradasBase
      .map((e) => {
        const a = resolvidaPorNome.get(e.de);
        const b = resolvidaPorNome.get(e.para);
        const visivelJog = isRotaVisivelParaJogador(e.de, e.para);
        // O mestre vê todas as rotas; o jogador vê apenas as reveladas
        // Traçado impossível (ex.: estrada até ilha) só aparece ao Mestre, como alerta.
        const deveExibir = ehVisaoMestre || (visivelJog && !e.impossivel);
        if (!deveExibir || !a || !b) return null;
        const info = buscarRota(e.de, e.para);
        return {
          ...e,
          a,
          b,
          visivelJog,
          info,
        };
      })
      .filter(Boolean) as (RotaTracada & {
        a: CidadeResolvida;
        b: CidadeResolvida;
        visivelJog: boolean;
        info?: RotaConexao;
      })[];
  }, [estradasBase, resolvidaPorNome, isRotaVisivelParaJogador, ehVisaoMestre, buscarRota]);

  // Lista de rotas marítimas com dados e visibilidade calculados
  const rotasMaritimasRenderizadas = useMemo(() => {
    return maritimasBase
      .map((r) => {
        const a = resolvidaPorNome.get(r.de);
        const b = resolvidaPorNome.get(r.para);
        const visivelJog = isRotaVisivelParaJogador(r.de, r.para);
        // Traçado impossível (ex.: estrada até ilha) só aparece ao Mestre, como alerta.
        const deveExibir = ehVisaoMestre || (visivelJog && !r.impossivel);
        if (!deveExibir || !a || !b) return null;
        const info = buscarRota(r.de, r.para);
        return {
          ...r,
          a,
          b,
          visivelJog,
          info,
        };
      })
      .filter(Boolean) as (RotaTracada & {
        a: CidadeResolvida;
        b: CidadeResolvida;
        visivelJog: boolean;
        info?: RotaConexao;
      })[];
  }, [maritimasBase, resolvidaPorNome, isRotaVisivelParaJogador, ehVisaoMestre, buscarRota]);

  // --- Navegação (zoom / pan) ---------------------------------------------
  const cancelarAnimacao = () => {
    if (animacao.current !== null) {
      cancelAnimationFrame(animacao.current);
      animacao.current = null;
    }
  };

  const irPara = useCallback((alvo: Vista) => {
    cancelarAnimacao();
    const origem = vistaRef.current;
    const destino = ajustarVista(alvo);
    const inicio = performance.now();
    const duracao = 380;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao);
      const e = 1 - Math.pow(1 - t, 3);
      setVista({
        x: origem.x + (destino.x - origem.x) * e,
        y: origem.y + (destino.y - origem.y) * e,
        k: origem.k + (destino.k - origem.k) * e,
      });
      animacao.current = t < 1 ? requestAnimationFrame(passo) : null;
    };
    animacao.current = requestAnimationFrame(passo);
  }, []);

  useEffect(() => cancelarAnimacao, []);

  const zoomEm = useCallback((fx: number, fy: number, fator: number) => {
    const v = vistaRef.current;
    const k = limitar(v.k * fator, 1, ZOOM_MAX);
    const wx = v.x + fx * (LARGURA_MAPA / v.k);
    const wy = v.y + fy * (ALTURA_MAPA / v.k);
    setVista(ajustarVista({ k, x: wx - fx * (LARGURA_MAPA / k), y: wy - fy * (ALTURA_MAPA / k) }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const aoRolar = (e: WheelEvent) => {
      e.preventDefault();
      cancelarAnimacao();
      const r = el.getBoundingClientRect();
      zoomEm((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, Math.exp(-e.deltaY * 0.0016));
    };
    el.addEventListener('wheel', aoRolar, { passive: false });
    return () => el.removeEventListener('wheel', aoRolar);
  }, [zoomEm]);

  const aoPressionar = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelarAnimacao();
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movido.current = false;
    arrastando.current = true;
    setRotaHover(null);
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      distPinch.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const aoMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const anterior = ponteiros.current.get(e.pointerId);
    if (!anterior || !arrastando.current) return;
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const atual = { x: e.clientX, y: e.clientY };

    if (ponteiros.current.size === 2) {
      ponteiros.current.set(e.pointerId, atual);
      const [a, b] = [...ponteiros.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (distPinch.current > 0) {
        const cx = ((a.x + b.x) / 2 - r.left) / r.width;
        const cy = ((a.y + b.y) / 2 - r.top) / r.height;
        zoomEm(cx, cy, dist / distPinch.current);
      }
      distPinch.current = dist;
      movido.current = true;
      return;
    }

    const dx = atual.x - anterior.x;
    const dy = atual.y - anterior.y;
    if (!movido.current && Math.hypot(dx, dy) < 4) return;
    if (!movido.current) {
      movido.current = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignora */
      }
    }
    ponteiros.current.set(e.pointerId, atual);
    const v = vistaRef.current;
    setVista(
      ajustarVista({
        k: v.k,
        x: v.x - (dx / r.width) * (LARGURA_MAPA / v.k),
        y: v.y - (dy / r.height) * (ALTURA_MAPA / v.k),
      }),
    );
  };

  const aoSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    ponteiros.current.delete(e.pointerId);
    if (ponteiros.current.size < 2) distPinch.current = 0;
    if (ponteiros.current.size === 0) arrastando.current = false;
    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignora */
    }
  };

  const zoomBotao = (fator: number) => {
    cancelarAnimacao();
    zoomEm(0.5, 0.5, fator);
  };

  // --- Seleção e Navegação ---------------------------------------------------
  const selecionar = (nome: string, focar = false) => {
    setSelecionada(nome);
    setErro(null);
    const c = resolvidaPorNome.get(nome);
    if (focar && c) {
      const k = Math.max(vistaRef.current.k, 2.6);
      irPara({ k, x: c.atlas.x - LARGURA_MAPA / k / 2, y: c.atlas.y - ALTURA_MAPA / k / 2 });
    }
  };

  const aoClicarCidade = (nome: string) => {
    if (movido.current) return;
    selecionar(nome);
  };

  const focarReino = (reinoId: string) => {
    setMenuReinosAberto(false);
    const alvo = CENTROS_REINOS[reinoId];
    if (!alvo) return;
    const k = alvo.zoom;
    irPara({
      k,
      x: alvo.x - LARGURA_MAPA / k / 2,
      y: alvo.y - ALTURA_MAPA / k / 2,
    });
  };

  const alterarVisibilidade = async (nome: string, nivel: NivelVisibilidade) => {
    if (!onAlterarVisibilidade) return;
    setSalvando(true);
    setErro(null);
    try {
      await onAlterarVisibilidade(nome, nivel);
      setSobrepor((s) => ({ ...s, [nome]: nivel }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível alterar a visibilidade.');
    } finally {
      setSalvando(false);
    }
  };

  // --- Eventos de Rotas -----------------------------------------------------
  const aoEntrarRota = (
    de: string,
    para: string,
    maritima: boolean,
    principal: boolean | undefined,
    visivelParaJogador: boolean,
    e: React.PointerEvent
  ) => {
    if (arrastando.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const info = buscarRota(de, para);
    setRotaHover({
      de,
      para,
      maritima,
      principal,
      distanciaKm: info?.distanciaKm ?? estimarDistancia(de, para),
      perigo: info?.perigo ?? (maritima ? 4 : principal ? 2 : 5),
      bloqueada: !!info?.bloqueada,
      visivelParaJogador,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    });
  };

  const aoMoverRota = (e: React.PointerEvent) => {
    if (arrastando.current) {
      if (rotaHover) setRotaHover(null);
      return;
    }
    const container = containerRef.current;
    if (!container || !rotaHover) return;
    const rect = container.getBoundingClientRect();
    setRotaHover((prev) =>
      prev
        ? {
            ...prev,
            screenX: e.clientX - rect.left,
            screenY: e.clientY - rect.top,
          }
        : null
    );
  };

  const aoSairRota = () => {
    setRotaHover(null);
  };

  const aoClicarRota = (de: string, para: string) => {
    if (movido.current) return;
    // Se a cidade atual já for uma das pontas, foca na outra
    if (selecionada === de) {
      selecionar(para, true);
    } else {
      selecionar(de, true);
    }
  };

  const atual = selecionada ? resolvidaPorNome.get(selecionada) : undefined;
  const reinoAtual = atual ? REINOS.find((r) => r.id === atual.atlas.reino) : undefined;

  const rotasDaCidade = useMemo(() => {
    if (!atual) return [];
    const lista: { destino: string; maritima: boolean; info?: RotaConexao; visivel: boolean; distanciaKm: number }[] = [];
    estradasBase.forEach((e) => {
      if (e.de === atual.atlas.nome || e.para === atual.atlas.nome) {
        const destino = e.de === atual.atlas.nome ? e.para : e.de;
        const d = resolvidaPorNome.get(destino);
        const info = buscarRota(e.de, e.para);
        const dist = info?.distanciaKm ?? estimarDistancia(e.de, e.para);
        lista.push({
          destino,
          maritima: false,
          info,
          distanciaKm: dist,
          visivel: !!d && visivel(d),
        });
      }
    });
    maritimasBase.forEach((e) => {
      if (e.de === atual.atlas.nome || e.para === atual.atlas.nome) {
        const destino = e.de === atual.atlas.nome ? e.para : e.de;
        const d = resolvidaPorNome.get(destino);
        const info = buscarRota(e.de, e.para);
        const dist = info?.distanciaKm ?? estimarDistancia(e.de, e.para);
        lista.push({
          destino,
          maritima: true,
          info,
          distanciaKm: dist,
          visivel: !!d && visivel(d),
        });
      }
    });
    return ehVisaoMestre ? lista : lista.filter((r) => r.visivel);
  }, [atual, estradasBase, maritimasBase, resolvidaPorNome, ehVisaoMestre, buscarRota, estimarDistancia]);

  // --- Escalas dependentes do zoom ------------------------------------------
  const k = vista.k;
  const escalaGlifo = Math.pow(k, -0.62);
  const escalaTexto = Math.pow(k, -0.55);
  const opacidadeReinos = limitar(1.25 - (k - 1.3) * 0.55, 0.1, 1);

  const viewBox = `${vista.x.toFixed(2)} ${vista.y.toFixed(2)} ${(LARGURA_MAPA / k).toFixed(2)} ${(ALTURA_MAPA / k).toFixed(2)}`;

  const idClip = `${idBase}-clip`;
  const idHachura = `${idBase}-hachura`;
  const idPapel = `${idBase}-papel`;

  const posRotulo = (c: CidadeAtlas, s: number) => {
    const folga = (c.tipo === 'capital' ? 14 : 10) * s;
    switch (c.rotulo ?? 'direita') {
      case 'esquerda':
        return { x: -folga, y: 4 * s, anchor: 'end' as const };
      case 'abaixo':
        return { x: 0, y: folga + 10 * s, anchor: 'middle' as const };
      case 'acima':
        return { x: 0, y: -folga - 2 * s, anchor: 'middle' as const };
      default:
        return { x: folga, y: 4 * s, anchor: 'start' as const };
    }
  };

  const corPerigoHover = rotaHover ? getCorPerigo(rotaHover.perigo) : null;

  return (
    <div className="space-y-4">
      {/* Container principal do pergaminho */}
      <div className="relative aspect-[3/2] w-full select-none overflow-hidden rounded-lg bg-[#d9c593] shadow-2xl">
        {/* Textura de fundo e manchas de tinta */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <filter id={idPapel} x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="7" result="ruido" />
              <feColorMatrix
                in="ruido"
                type="matrix"
                values="0 0 0 0 0.42  0 0 0 0 0.28  0 0 0 0 0.1  1.1 0 0 0 -0.47"
                result="manchasTinta"
              />
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="grao" />
              <feColorMatrix
                in="grao"
                type="matrix"
                values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.08  0 0 0 0.35 -0.1"
                result="graoTinta"
              />
              <feMerge>
                <feMergeNode in="manchasTinta" />
                <feMergeNode in="graoTinta" />
              </feMerge>
            </filter>
            <radialGradient id={`${idPapel}-vinheta`} cx="50%" cy="50%" r="75%">
              <stop offset="55%" stopColor="#6b4a1f" stopOpacity="0" />
              <stop offset="100%" stopColor="#4a2f0f" stopOpacity="0.38" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="#e9d9ab" />
          <rect width="100%" height="100%" filter={`url(#${idPapel})`} />
          <rect width="100%" height="100%" fill={`url(#${idPapel}-vinheta)`} />
        </svg>

        {/* Camada interativa */}
        <div
          ref={containerRef}
          className="absolute inset-0 cursor-grab touch-none overflow-hidden rounded-sm active:cursor-grabbing"
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onDoubleClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            cancelarAnimacao();
            zoomEm((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, 1.8);
          }}
        >
          <svg
            viewBox={viewBox}
            className="mapa-svg h-full w-full"
            role="img"
            aria-label="Mapa do continente de Thalúria com os cinco reinos"
            style={{ fontFamily: FONTE_MAPA }}
          >
            <defs>
              <clipPath id={idClip}>
                <path d={atlas.terra} />
              </clipPath>
              <pattern id={idHachura} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="0" y2="7" stroke={TINTA_SUAVE} strokeWidth={0.8} strokeOpacity={0.35} />
              </pattern>
            </defs>

            <CamadaBase atlas={atlas} idClip={idClip} />

            {/* Névoa sobre reinos ainda desconhecidos */}
            <g clipPath={`url(#${idClip})`}>
              {atlas.territorios.map((t) => {
                const revelado = reinoRevelado.has(t.id);
                // Para o mestre em visão normal, a névoa é semitransparente (0.22) para que ele veja tudo
                const opacidadeNevoa = revelado ? 0 : ehVisaoMestre ? 0.25 : 1;
                return (
                  <g key={`n-${t.id}`} style={{ transition: 'opacity 0.6s' }} opacity={opacidadeNevoa} pointerEvents="none">
                    <path d={t.d} fill={PAPEL_NEVOA} fillOpacity={0.96} />
                    <path d={t.d} fill={`url(#${idHachura})`} />
                    <path d={t.d} fill="none" stroke={TINTA_SUAVE} strokeWidth={1.2} strokeDasharray="3 5" strokeOpacity={0.6} />
                  </g>
                );
              })}
            </g>

            {/* Rotas marítimas */}
            <g fill="none">
              {rotasMaritimasRenderizadas.map((r) => {
                const isHovered = rotaHover?.de === r.de && rotaHover?.para === r.para;
                return (
                  <g key={r.chave}>
                    {r.impossivel && <title>{`Rota inválida: ${r.motivo}`}</title>}
                    {/* Halo claro: separa a rota da água e da hachura do mar */}
                    <path
                      d={r.d}
                      stroke="#f3e7c3"
                      strokeWidth={5.2}
                      strokeOpacity={0.55}
                      strokeLinecap="round"
                    />
                    {/* Linha visível da rota marítima */}
                    <path
                      d={r.d}
                      stroke={r.impossivel ? TINTA_VERMELHA : !r.visivelJog && ehVisaoMestre ? '#5f7a8c' : '#1f4f6b'}
                      strokeWidth={2.2}
                      strokeDasharray={r.impossivel ? '1 7' : !r.visivelJog && ehVisaoMestre ? '2 6' : '7 5'}
                      strokeLinecap="round"
                      strokeOpacity={!r.visivelJog && ehVisaoMestre ? 0.55 : 0.95}
                      filter={isHovered ? 'drop-shadow(0 0 6px rgba(212,175,55,0.95))' : undefined}
                    />
                    {/* Hit-area invisível ampla para hover fácil e toque */}
                    <path
                      d={r.d}
                      stroke="transparent"
                      strokeWidth={24}
                      strokeLinecap="round"
                      style={{ cursor: 'pointer' }}
                      onPointerEnter={(e) => aoEntrarRota(r.de, r.para, true, false, r.visivelJog, e)}
                      onPointerMove={aoMoverRota}
                      onPointerLeave={aoSairRota}
                      onClick={() => aoClicarRota(r.de, r.para)}
                    />
                  </g>
                );
              })}
            </g>

            {/* Estradas terrestres */}
            <g fill="none" strokeLinecap="round">
              {estradasRenderizadas.map((e) => {
                const isHovered = rotaHover?.de === e.de && rotaHover?.para === e.para;
                const perigosa = (e.info?.perigo ?? 0) >= 7;
                const bloqueada = !!e.info?.bloqueada;
                return (
                  <g key={e.chave}>
                    {e.impossivel && <title>{`Rota inválida: ${e.motivo}`}</title>}
                    {/* Halo de contraste sob a estrada para legibilidade perfeita */}
                    <path
                      d={e.d}
                      stroke="#1b1208"
                      strokeWidth={e.principal ? 5.6 : 4.2}
                      strokeOpacity={0.38}
                      strokeLinecap="round"
                    />
                    {/* Traço visível da estrada */}
                    <path
                      d={e.d}
                      stroke={
                        e.impossivel
                          ? TINTA_VERMELHA
                          : bloqueada
                          ? TINTA_VERMELHA
                          : perigosa
                          ? '#9c4228'
                          : e.principal
                          ? '#261b10'
                          : '#453220'
                      }
                      strokeWidth={e.principal ? 2.8 : 2.0}
                      strokeDasharray={
                        e.impossivel
                          ? '1 7'
                          : bloqueada
                          ? '2 6'
                          : !e.visivelJog && ehVisaoMestre
                          ? '4 5'
                          : e.principal
                          ? undefined
                          : '6 4'
                      }
                      strokeOpacity={!e.visivelJog && ehVisaoMestre ? 0.52 : 0.94}
                      filter={isHovered ? 'drop-shadow(0 0 6px rgba(212,175,55,0.95))' : undefined}
                    />
                    {/* Hit-area invisível generosa para hover e clique responsivos */}
                    <path
                      d={e.d}
                      stroke="transparent"
                      strokeWidth={24}
                      strokeLinecap="round"
                      style={{ cursor: 'pointer' }}
                      onPointerEnter={(ev) => aoEntrarRota(e.de, e.para, false, e.principal, e.visivelJog, ev)}
                      onPointerMove={aoMoverRota}
                      onPointerLeave={aoSairRota}
                      onClick={() => aoClicarRota(e.de, e.para)}
                    />
                  </g>
                );
              })}
            </g>

            {/* Rótulos de mar */}
            <g fill={TINTA_SUAVE} fontStyle="italic" textAnchor="middle" opacity={0.85} pointerEvents="none">
              {ROTULOS_MAR.map((r) => (
                <text
                  key={r.texto}
                  x={r.x}
                  y={r.y}
                  fontSize={r.tamanho ?? 20}
                  letterSpacing={r.tamanho && r.tamanho > 18 ? 5 : 1.5}
                  transform={r.rotacao ? `rotate(${r.rotacao} ${r.x} ${r.y})` : undefined}
                >
                  {r.texto}
                </text>
              ))}
            </g>

            {/* Rótulos dos reinos */}
            <g pointerEvents="none" opacity={opacidadeReinos} style={{ transition: 'opacity 0.3s' }} textAnchor="middle">
              {REINOS.map((r) => {
                const revelado = reinoRevelado.has(r.id);
                const transf = r.rotacao ? `rotate(${r.rotacao} ${r.rotulo.x} ${r.rotulo.y})` : undefined;
                return (
                  <g key={r.id} transform={transf}>
                    {revelado || ehVisaoMestre ? (
                      <>
                        {r.id !== 'campos' && (
                          <text x={r.rotulo.x} y={r.rotulo.y - 30} fontSize={15} fontStyle="italic" fill={TINTA_SUAVE} letterSpacing={2}>
                            Reino de
                          </text>
                        )}
                        <text
                          x={r.rotulo.x}
                          y={r.rotulo.y}
                          fontFamily={FONTE_MAPA_SC}
                          fontSize={r.id === 'campos' ? 24 : 38}
                          letterSpacing={r.id === 'campos' ? 4 : 8}
                          fill={TINTA}
                          fillOpacity={0.78}
                          stroke={PAPEL_CLARO}
                          strokeWidth={4}
                          strokeOpacity={0.55}
                          paintOrder="stroke"
                        >
                          {r.nome.toUpperCase()}
                        </text>
                      </>
                    ) : (
                      <text x={r.rotulo.x} y={r.rotulo.y} fontSize={22} fontStyle="italic" letterSpacing={3} fill={TINTA_SUAVE} fillOpacity={0.8}>
                        Terra Incógnita
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Decorações fixas do mapa */}
            <RosaDosVentos x={112} y={120} />
            <BarraEscala x={1290} y={978} />
            <Titulo x={40} y={944} />

            {/* Cidades e Assentamentos */}
            <g>
              {cidadesResolvidas.map((c) => {
                const oculta = c.vis === 'OCULTO';
                if (oculta && !ehVisaoMestre) return null;
                const parcial = c.vis === 'ROTA_E_NOME_APENAS';
                const ativa = selecionada === c.atlas.nome;
                const isMinhaCidade = cidadeAtual && normalizar(c.atlas.nome) === normalizar(cidadeAtual);
                const { atlas: a } = c;
                const mostrarNome = (!oculta || ehVisaoMestre) && (a.tipo !== 'vila' || k >= 1.5);
                const rot = posRotulo(a, escalaTexto);
                const capital = a.tipo === 'capital';
                return (
                  <g
                    key={a.nome}
                    transform={`translate(${a.x} ${a.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${oculta ? 'Cidade oculta' : a.nome}, ${ROTULO_TIPO[a.tipo]}`}
                    aria-pressed={ativa}
                    style={{ cursor: 'pointer', outline: 'none' }}
                    opacity={oculta ? (ehVisaoMestre ? 0.45 : 0) : 1}
                    onClick={() => aoClicarCidade(a.nome)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selecionar(a.nome, true);
                      }
                    }}
                  >
                    {/* Área de clique generosa */}
                    <circle r={18 * escalaGlifo} fill="transparent" />

                    {/* Farol / Indicador de Cidade Atual do Jogador */}
                    {isMinhaCidade && (
                      <g pointerEvents="none">
                        <circle
                          r={24 * escalaGlifo}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth={2.4 * escalaGlifo}
                        >
                          <animate
                            attributeName="r"
                            values={`${16 * escalaGlifo};${26 * escalaGlifo};${16 * escalaGlifo}`}
                            dur="2.4s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.9;0.2;0.9"
                            dur="2.4s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle r={6 * escalaGlifo} fill="#0284c7" fillOpacity={0.4} />
                      </g>
                    )}

                    {/* Indicador de Cidade Selecionada */}
                    {ativa && (
                      <circle
                        r={16 * escalaGlifo}
                        fill="none"
                        stroke={TINTA_VERMELHA}
                        strokeWidth={1.8 * escalaGlifo}
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Glifo representativo da cidade */}
                    <g transform={`scale(${(capital ? 1.25 : 1) * escalaGlifo})`}>
                      {oculta ? (
                        <circle r={3.5} fill="none" stroke={TINTA} strokeWidth={1} strokeDasharray="2 2" />
                      ) : (
                        <GlifoCidade tipo={a.tipo} parcial={parcial} />
                      )}
                    </g>

                    {/* Rótulo da cidade */}
                    {mostrarNome && (
                      <g>
                        {isMinhaCidade && (
                          <text
                            x={rot.x}
                            y={rot.y - 14 * escalaTexto}
                            textAnchor={rot.anchor}
                            fontSize={11 * escalaTexto}
                            fontWeight={700}
                            fill="#0369a1"
                            stroke={PAPEL_CLARO}
                            strokeWidth={2.5 * escalaTexto}
                            paintOrder="stroke"
                            pointerEvents="none"
                          >
                            📍 Sua Cidade
                          </text>
                        )}
                        <text
                          x={rot.x}
                          y={rot.y}
                          textAnchor={rot.anchor}
                          fontSize={(capital ? 21 : 15.5) * escalaTexto}
                          fontStyle={parcial ? 'italic' : 'normal'}
                          fontWeight={capital ? 700 : 400}
                          fill={TINTA}
                          stroke={PAPEL_CLARO}
                          strokeWidth={3.2 * escalaTexto}
                          strokeOpacity={0.88}
                          paintOrder="stroke"
                          strokeLinejoin="round"
                          pointerEvents="none"
                        >
                          {a.nome}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
            {/* Caravanas em viagem (visão do Mestre) */}
            {mestre && !previewJogador && mostrarCaravanas && caravanasNoMapa.length > 0 && (
              <CamadaCaravanas
                posicionadas={caravanasNoMapa}
                escala={escalaTexto}
                selecionadaId={caravanaSel?.id ?? null}
                onSelecionar={(id, e) => {
                  if (movido.current) return;
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setCaravanaSel((atual) => (atual?.id === id ? null : { id, left: e.clientX - rect.left, top: e.clientY - rect.top - 16 }));
                }}
              />
            )}
          </svg>
        </div>

        {/* Moldura de tinta clássica */}
        <div className="pointer-events-none absolute inset-0 rounded-sm border-[3px] border-tinta/80" />
        <div className="pointer-events-none absolute inset-[7px] rounded-[1px] border border-tinta/60" />

        {/* Banner do Mestre quando em modo Pré-visualização de Jogador */}
        {mestre && previewJogador && (
          <div className="absolute left-3 right-3 top-3 z-30 flex items-center justify-between gap-3 rounded-lg border border-amber-600/70 bg-[#16120c]/90 px-3.5 py-2 text-amber-200 shadow-2xl backdrop-blur-md sm:left-4 sm:right-auto">
            <div className="flex items-center gap-2 text-xs font-cinzel">
              <Eye className="h-4 w-4 animate-pulse text-amber-400" />
              <span>Visão do Jogador (Pré-visualização)</span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewJogador(false)}
              className="cursor-pointer rounded border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-[11px] font-sans-clean font-semibold text-amber-300 hover:bg-amber-500/30"
            >
              Voltar ao Mestre
            </button>
          </div>
        )}

        {/* Cartão da caravana selecionada */}
        {caravanaSel && mostrarCaravanas && (() => {
          const c = caravanas?.find((x) => x.id === caravanaSel.id);
          if (!c) return null;
          const largura = containerRef.current?.clientWidth ?? 600;
          return (
            <FichaCaravana
              caravana={c}
              left={limitar(caravanaSel.left, 150, largura - 150)}
              top={Math.max(250, caravanaSel.top)}
              onFechar={() => setCaravanaSel(null)}
            />
          );
        })()}

        {/* Tooltip interativo flutuante da rota em hover */}
        {rotaHover && (
          <div
            className="pointer-events-none absolute z-30 max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border border-tinta/80 bg-papel-claro/95 px-3 py-2 text-tinta-escura shadow-2xl backdrop-blur-sm"
            style={{
              left: limitar(rotaHover.screenX, 110, (containerRef.current?.clientWidth ?? 600) - 110),
              top: Math.max(16, rotaHover.screenY - 14),
              fontFamily: FONTE_MAPA,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-tinta/20 pb-1">
              <span className="text-sm font-bold tracking-wide" style={{ fontFamily: FONTE_MAPA_SC }}>
                {rotaHover.de} ➔ {rotaHover.para}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  rotaHover.maritima
                    ? 'border border-cyan-800/30 bg-cyan-800/15 text-cyan-900'
                    : 'border border-amber-800/30 bg-amber-800/15 text-amber-900'
                }`}
              >
                {rotaHover.maritima ? '⛵ Marítima' : rotaHover.principal ? '🛣️ Principal' : '🛤️ Secundária'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs">
              <div>
                <span className="italic text-tinta-suave">Distância: </span>
                <strong>{rotaHover.distanciaKm} km</strong>
              </div>
              <div>
                <span className="italic text-tinta-suave">Perigo: </span>
                <span className={`font-bold ${corPerigoHover?.texto}`}>
                  {rotaHover.perigo}/10 ({corPerigoHover?.rotulo})
                </span>
              </div>
            </div>
            {rotaHover.bloqueada && (
              <div className="mt-1 text-[11px] font-bold text-rose-700">
                ⚠️ Rota Bloqueada pelo Mestre
              </div>
            )}
            {ehVisaoMestre && (
              <div className="mt-1 border-t border-tinta/15 pt-1 text-[10px] italic">
                {rotaHover.visivelParaJogador ? (
                  <span className="font-semibold text-emerald-800">✓ Revelada aos jogadores</span>
                ) : (
                  <span className="font-semibold text-tinta-rubra">👁️‍🗨️ Oculta dos jogadores (Névoa)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Barra flutuante de ferramentas e atalhos rápidos */}
        <div className="absolute right-3 top-3 z-20 flex flex-wrap items-center justify-end gap-1.5">
          {/* Atalho para Minha Cidade */}
          {cidadeAtual && (
            <BotaoMapa
              rotulo={`Centralizar na minha cidade: ${cidadeAtual}`}
              onClick={() => selecionar(cidadeAtual, true)}
            >
              <div className="flex items-center gap-1 font-cinzel text-[11px] text-sky-900">
                <MapPin className="h-3.5 w-3.5 text-sky-700" />
                <span className="hidden sm:inline max-w-[85px] truncate">{cidadeAtual}</span>
              </div>
            </BotaoMapa>
          )}

          {/* Seletor Rápido de Reinos */}
          <div className="relative">
            <BotaoMapa
              rotulo="Focar Reino ou Região"
              onClick={() => setMenuReinosAberto((v) => !v)}
              ativo={menuReinosAberto}
            >
              <div className="flex items-center gap-1 font-cinzel text-[11px]">
                <Compass className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reinos</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </BotaoMapa>

            {menuReinosAberto && (
              <div
                className="absolute right-0 top-9 z-30 w-48 rounded-lg border border-tinta/80 bg-papel-claro p-1.5 shadow-2xl backdrop-blur-sm"
                style={{ fontFamily: FONTE_MAPA }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="border-b border-tinta/20 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-tinta-suave">
                  Navegar para Região
                </div>
                <div className="mt-1 flex flex-col gap-0.5">
                  {[
                    { id: 'frosthelm', nome: 'Reino de Frosthelm' },
                    { id: 'sylvanor', nome: 'Reino de Sylvanor' },
                    { id: 'aurelia', nome: 'Reino de Aurelia' },
                    { id: 'drakos', nome: 'Reino de Drakos' },
                    { id: 'valthera', nome: 'Reino de Valthera' },
                    { id: 'campos', nome: 'Campos Meridionais' },
                    { id: 'ilhas', nome: 'Ilhas de Thalúria' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => focarReino(r.id)}
                      className="flex cursor-pointer items-center justify-between rounded px-2 py-1 text-left text-xs text-tinta transition-colors hover:bg-tinta/10"
                    >
                      <span>{r.nome}</span>
                      <Navigation className="h-3 w-3 text-tinta-suave" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Caravanas em viagem */}
          {mestre && caravanas && (
            <BotaoMapa
              rotulo={mostrarCaravanas ? 'Esconder caravanas' : 'Mostrar caravanas'}
              onClick={() => {
                setMostrarCaravanas((v) => !v);
                setCaravanaSel(null);
              }}
              ativo={mostrarCaravanas}
            >
              <div className="flex items-center gap-1 font-cinzel text-[11px]">
                <Truck className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Caravanas ({caravanas.length})</span>
              </div>
            </BotaoMapa>
          )}

          {/* Alternador Mestre / Jogador */}
          {mestre && (
            <BotaoMapa
              rotulo={previewJogador ? 'Voltar para Visão do Mestre' : 'Pré-visualizar como Jogador'}
              onClick={() => setPreviewJogador((v) => !v)}
              ativo={previewJogador}
            >
              <div className="flex items-center gap-1 font-cinzel text-[11px]">
                {previewJogador ? <EyeOff className="h-3.5 w-3.5 text-amber-700" /> : <Eye className="h-3.5 w-3.5" />}
                <span className="hidden md:inline">
                  {previewJogador ? 'Modo: Jogador' : 'Ver como Jogador'}
                </span>
              </div>
            </BotaoMapa>
          )}

          {/* Zoom In / Out / Reset */}
          <div className="flex items-center gap-1">
            <BotaoMapa rotulo="Aproximar zoom" onClick={() => zoomBotao(1.5)}>
              <Plus className="h-3.5 w-3.5" />
            </BotaoMapa>
            <BotaoMapa rotulo="Afastar zoom" onClick={() => zoomBotao(1 / 1.5)}>
              <Minus className="h-3.5 w-3.5" />
            </BotaoMapa>
            <BotaoMapa
              rotulo="Visão Geral (Continente Inteiro)"
              onClick={() => {
                setSelecionada(null);
                irPara(VISTA_INICIAL);
              }}
            >
              <Locate className="h-3.5 w-3.5" />
            </BotaoMapa>
          </div>
        </div>

        {/* Ficha da cidade (Drawer responsivo) */}
        {atual && (
          <>
            {/* Backdrop escuro no mobile para fechar facilmente */}
            <div
              className="fixed inset-0 m-0 z-30 bg-black/40 backdrop-blur-[2px] sm:hidden"
              onClick={() => setSelecionada(null)}
              aria-hidden="true"
            />
            <FichaCidade
              atual={atual}
              reino={reinoAtual?.nome}
              rotasDaCidade={rotasDaCidade}
              mestre={ehVisaoMestre}
              salvando={salvando}
              erro={erro}
              onFechar={() => setSelecionada(null)}
              onIr={(nome) => selecionar(nome, true)}
              onAlterar={alterarVisibilidade}
              podeAlterar={!!onAlterarVisibilidade && !demonstracao}
            />
          </>
        )}
      </div>

      <p className="text-center font-sans-clean text-[11px] text-nevoa">
        Arraste para mover · use dois dedos ou roda do mouse para ampliar · passe o mouse nas rotas para ver distância e perigo · clique numa cidade para ver conexões
      </p>

      {/* ------------------------- Legenda e índice ------------------------- */}
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Legenda />
        <div className="grimorio-card rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between border-b border-linha pb-2">
            <h3 className="font-cinzel text-sm font-bold text-pergaminho">Locais conhecidos</h3>
            <span className="text-[11px] font-sans-clean text-nevoa">
              {totalVisiveis} / {cidadesBase.length} {ehVisaoMestre ? '(Visão Mestre: 100% acessível)' : ''}
            </span>
          </div>
          {totalVisiveis === 0 ? (
            <p className="text-xs font-sans-clean text-nevoa">
              Nenhum local foi revelado pelo Mestre ainda. Conforme a campanha avança, o mapa será preenchido.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {cidadesResolvidas
                .filter(visivel)
                .map((c) => (
                  <button
                    key={c.atlas.nome}
                    type="button"
                    onClick={() => selecionar(c.atlas.nome, true)}
                    className={`cursor-pointer rounded border px-2 py-1 text-[11px] font-cinzel transition-colors ${
                      selecionada === c.atlas.nome
                        ? 'border-amber-400/70 bg-amber-400/15 text-pergaminho'
                        : 'border-linha-forte text-texto-2 hover:border-amber-500/50 hover:text-pergaminho'
                    }`}
                  >
                    {c.atlas.nome}
                  </button>
                ))}
            </div>
          )}
          {mestre && semCoordenadas.length > 0 && (
            <p className="mt-3 border-t border-linha pt-2 text-[11px] font-sans-clean text-amber-300/80">
              Sem posição no atlas: {semCoordenadas.map((c) => c.nome).join(', ')}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

