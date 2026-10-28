import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import type { CaravanaMapa } from '../../types/comercio';
import { formatarLatao } from '../../utils/formatadores';
import type { CaravanaPosicionada } from './posicaoCaravanas';
import { CARTAO_MAPA, FONTE_MAPA, FONTE_MAPA_SC, PAPEL_CLARO, TINTA, TINTA_SUAVE, TINTA_VERMELHA } from './estiloMapa';

/** Cor da caravana conforme a situação na estrada (tintas de época, não cores de interface). */
const COR_STATUS: Record<CaravanaMapa['status'], string> = {
  EM_TRANSITO: '#8a4b1c',
  AGUARDANDO_ESCOLTA: '#6b6359',
  EXTRAVIADA: TINTA_VERMELHA,
};

/** Carroça coberta (terra) ou navio à vela (mar), em coordenadas locais centradas no ponto. */
const GlifoCaravana: React.FC<{ maritima: boolean; cor: string }> = ({ maritima, cor }) =>
  maritima ? (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M-7.5,2.2H7.5L5,6.2H-5Z" fill={cor} stroke={TINTA} strokeWidth={0.8} />
      <path d="M-0.5,2.2V-8" stroke={TINTA} strokeWidth={0.9} />
      <path d="M-0.5,-7.2Q5.8,-3 -0.5,1.2Z" fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.7} />
      <path d="M-1.2,-6.2Q-6,-2.6 -1.2,1Z" fill="#e7d4a6" stroke={TINTA} strokeWidth={0.6} />
      <path d="M-0.5,-8L3.4,-9.2L-0.5,-10.2" fill={cor} stroke={TINTA} strokeWidth={0.5} />
    </g>
  ) : (
    <g strokeLinejoin="round" strokeLinecap="round">
      {/* lona arqueada com costelas */}
      <path d="M-6.6,-0.4V-3.2Q-6.6,-8 0,-8Q6.6,-8 6.6,-3.2V-0.4Z" fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.8} />
      <path d="M-2.4,-7.6V-0.6M2.4,-7.6V-0.6" stroke={TINTA_SUAVE} strokeWidth={0.55} />
      {/* caixa da carroça */}
      <path d="M-7.6,-0.6H7.6L6.6,2.6H-6.6Z" fill={cor} stroke={TINTA} strokeWidth={0.8} />
      {/* rodas raiadas */}
      {[-4.2, 4.2].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={4.2} r={2.4} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.75} />
          <path d={`M${cx - 2.1},4.2H${cx + 2.1}M${cx},2.1V6.3`} stroke={TINTA} strokeWidth={0.45} />
        </g>
      ))}
    </g>
  );

/** Escudo pequeno (escolta). */
const ESCUDO = 'M0,-3.6L3,-2.5V0.4Q3,2.9 0,4Q-3,2.9 -3,0.4V-2.5Z';

export interface CamadaCaravanasProps {
  posicionadas: CaravanaPosicionada[];
  /** Escala do glifo (unidades do mapa por "pixel" do desenho). */
  escala: number;
  /** Unidades do mapa por pixel de tela, para agrupar o que ficaria sobreposto. */
  unidadesPorPixel: number;
  selecionadaId: number | null;
  onSelecionar: (id: number, e: React.MouseEvent) => void;
  /** Várias caravanas no mesmo lugar da tela: abre a lista delas. */
  onSelecionarGrupo: (ids: number[], e: React.MouseEvent) => void;
  /** Posições das cidades: caravana parada numa cidade fica acima do ícone, sem cobri-lo. */
  cidades: { x: number; y: number }[];
}

/** Latão envelhecido dos medalhões. */
const LATAO = '#c5a059';

/** Selo de lacre: círculo de 14 ondas, raio ~12 (coordenadas locais). */
const SELO_DE_LACRE = (() => {
  const n = 14;
  const pts: string[] = [];
  for (let i = 0; i <= n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2;
    const r = 11.5 + Math.sin(a * n) * 0.9;
    pts.push(`${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join('') + 'Z';
})();

/** Distância (px de tela) abaixo da qual caravanas viram um só marcador com contagem. */
const RAIO_GRUPO_PX = 18;

/** Camada SVG: as caravanas sobre as rotas (agrupadas quando se sobrepõem) e o caminho da selecionada. */
export const CamadaCaravanas: React.FC<CamadaCaravanasProps> = ({ posicionadas, escala, unidadesPorPixel, selecionadaId, onSelecionar, onSelecionarGrupo, cidades }) => {
  const selecionada = useMemo(() => posicionadas.find((p) => p.caravana.id === selecionadaId), [posicionadas, selecionadaId]);
  const grupos = useMemo(() => {
    const raio = RAIO_GRUPO_PX * unidadesPorPixel;
    const lista: { x: number; y: number; itens: CaravanaPosicionada[] }[] = [];
    for (const p of posicionadas) {
      // A selecionada fica sempre sozinha, para o destaque aparecer.
      const g =
        p.caravana.id === selecionadaId
          ? undefined
          : lista.find((x) => x.itens[0].caravana.id !== selecionadaId && Math.hypot(x.x - p.x, x.y - p.y) < raio);
      if (g) g.itens.push(p);
      else lista.push({ x: p.x, y: p.y, itens: [p] });
    }
    // "Estacionadas": sobre uma cidade, o marcador sobe para não esconder o ícone nem o nome.
    const perto = 10 * unidadesPorPixel;
    for (const g of lista) {
      const cidade = cidades.find((c) => Math.hypot(c.x - g.x, c.y - g.y) < perto);
      if (cidade) {
        g.x = cidade.x;
        g.y = cidade.y - 20 * unidadesPorPixel;
      }
    }
    return lista;
  }, [posicionadas, unidadesPorPixel, selecionadaId, cidades]);

  return (
    <g>
      {selecionada &&
        selecionada.caminhos.map((c, i) => (
          <path
            key={i}
            d={c.d}
            fill="none"
            stroke={c.percorrido ? TINTA : '#d97706'}
            strokeWidth={(c.percorrido ? 2 : 3) * escala}
            strokeDasharray={c.percorrido ? `${2 * escala} ${3 * escala}` : `${7 * escala} ${4 * escala}`}
            strokeLinecap="round"
            strokeOpacity={0.9}
            pointerEvents="none"
          />
        ))}
      {grupos.map((g) => {
        if (g.itens.length > 1) {
          const extraviadas = g.itens.some((p) => p.caravana.status === 'EXTRAVIADA');
          return (
            <g
              key={`g-${g.itens[0].caravana.id}`}
              transform={`translate(${g.x.toFixed(1)} ${g.y.toFixed(1)}) scale(${escala})`}
              role="button"
              tabIndex={0}
              aria-label={`${g.itens.length} caravanas aqui`}
              style={{ cursor: 'pointer', outline: 'none' }}
              onClick={(e) => onSelecionarGrupo(g.itens.map((p) => p.caravana.id), e)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Selo de lacre: borda ondulada de cera, anel interno prensado */}
              <path d={SELO_DE_LACRE} fill={extraviadas ? '#7a1f14' : '#9a3412'} stroke="#4a1208" strokeWidth={0.8} />
              <circle r={8.6} fill="none" stroke="#f2c38a" strokeOpacity={0.45} strokeWidth={0.9} />
              <text y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fbe7c4" fontFamily={FONTE_MAPA_SC} pointerEvents="none">
                {g.itens.length}
              </text>
              {extraviadas && (
                <text x={10} y={-8} fontSize={10} fontWeight={700} fill={TINTA_VERMELHA} pointerEvents="none">
                  !
                </text>
              )}
            </g>
          );
        }
        const { caravana: c, x, y, maritima, angulo, progresso } = g.itens[0];
        const ativa = c.id === selecionadaId;
        const cor = COR_STATUS[c.status];
        // Anel de progresso: arco que fecha conforme a viagem avança (começa no topo, sentido horário)
        const raioAnel = 13.4;
        const voltaAnel = 2 * Math.PI * raioAnel;
        const parada = c.status !== 'EM_TRANSITO';
        return (
          <g
            key={c.id}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${escala * (ativa ? 1.3 : 1)})`}
            role="button"
            tabIndex={0}
            aria-label={`Caravana com ${c.quantidade}× ${c.carga}, de ${c.caminho[0]} para ${c.caminho[c.caminho.length - 1]}`}
            style={{ cursor: 'pointer', outline: 'none' }}
            onClick={(e) => onSelecionar(c.id, e)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <title>{`${c.quantidade}× ${c.carga} · ${c.caminho[0]} → ${c.caminho[c.caminho.length - 1]} · ${Math.round(progresso * 100)}% do caminho`}</title>
            {/* Ponta de direção na borda do medalhão (para onde a caravana está indo) */}
            {!parada && (
              <path d="M12.4,-3.4L17.6,0L12.4,3.4Z" transform={`rotate(${angulo.toFixed(0)})`} fill={cor} stroke={TINTA} strokeWidth={0.6} strokeLinejoin="round" />
            )}
            {/* Trilho do anel e o quanto já foi percorrido */}
            <circle r={raioAnel} fill="none" stroke={TINTA} strokeOpacity={0.18} strokeWidth={2} />
            <circle
              r={raioAnel}
              fill="none"
              stroke={ativa ? '#d97706' : cor}
              strokeWidth={2}
              strokeDasharray={`${(voltaAnel * progresso).toFixed(1)} ${voltaAnel.toFixed(1)}`}
              transform="rotate(-90)"
              strokeLinecap="round"
            />
            {/* Medalhão: papel com anel de latão envelhecido */}
            <circle r={11} fill={PAPEL_CLARO} fillOpacity={0.96} stroke={ativa ? '#d97706' : LATAO} strokeWidth={ativa ? 2 : 1.6} />
            <circle r={11.9} fill="none" stroke={TINTA} strokeWidth={0.6} />
            <g opacity={c.status === 'AGUARDANDO_ESCOLTA' ? 0.75 : 1}>
              <GlifoCaravana maritima={maritima} cor={cor} />
            </g>
            {c.status === 'EXTRAVIADA' && (
              <g transform="translate(9.5 -9.5)" pointerEvents="none">
                <circle r={4.2} fill={TINTA_VERMELHA} stroke={PAPEL_CLARO} strokeWidth={1} />
                <text y={2.6} textAnchor="middle" fontSize={7} fontWeight={800} fill={PAPEL_CLARO} fontFamily="sans-serif">
                  !
                </text>
              </g>
            )}
            {c.protecao !== 'DESPROTEGIDA' && (
              <path
                d={ESCUDO}
                transform="translate(9.6 9.2) scale(1.15)"
                fill={c.protecao === 'ESCOLTADA_JOGADOR' ? LATAO : '#3f6b3a'}
                stroke={TINTA}
                strokeWidth={0.6}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

export interface ListaCaravanasProps {
  caravanas: CaravanaMapa[];
  left: number;
  top: number;
  onEscolher: (id: number) => void;
  onFechar: () => void;
}

/** Caravanas que estão no mesmo ponto do mapa: escolha uma para ver a ficha. */
export const ListaCaravanas: React.FC<ListaCaravanasProps> = ({ caravanas, left, top, onEscolher, onFechar }) => (
  <div
    className={`absolute z-30 w-72 max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-full rounded-lg p-2 ${CARTAO_MAPA}`}
    style={{ left, top, fontFamily: FONTE_MAPA }}
    onPointerDown={(e) => e.stopPropagation()}
  >
    <div className="flex items-center justify-between gap-2 border-b border-tinta/20 px-1 pb-1.5">
      <p className="text-sm font-bold" style={{ fontFamily: FONTE_MAPA_SC }}>
        {caravanas.length} caravanas aqui
      </p>
      <button type="button" onClick={onFechar} aria-label="Fechar" className="cursor-pointer rounded p-0.5 hover:bg-tinta/10">
        <X className="h-4 w-4" />
      </button>
    </div>
    <ul className="mt-1 max-h-56 overflow-y-auto overscroll-contain">
      {caravanas.map((c) => (
        <li key={c.id}>
          <button type="button" onClick={() => onEscolher(c.id)} className="w-full cursor-pointer rounded px-1.5 py-1 text-left hover:bg-tinta/10">
            <span className="flex items-center gap-1.5 text-xs font-bold">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COR_STATUS[c.status] }} aria-hidden="true" />
              {c.quantidade}× {c.carga}
            </span>
            <span className="block truncate text-[11px] text-tinta-suave">
              {c.caminho[0]} → {c.caminho[c.caminho.length - 1]} · {c.statusDescricao}
            </span>
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export interface FichaCaravanaProps {
  caravana: CaravanaMapa;
  left: number;
  top: number;
  onFechar: () => void;
}

/** Cartão com os detalhes da caravana selecionada, sobre o mapa. */
export const FichaCaravana: React.FC<FichaCaravanaProps> = ({ caravana: c, left, top, onFechar }) => {
  const pct = c.kmTotal > 0 ? Math.round((c.kmPercorridos / c.kmTotal) * 100) : 0;
  const dias = Math.floor(c.horasRestantes / 24);
  const horas = c.horasRestantes % 24;
  const chegada = c.status === 'EXTRAVIADA' ? 'parada: carga extraviada' : c.horasRestantes <= 0 ? 'chegando' : `${dias > 0 ? `${dias} d ` : ''}${horas} h`;
  return (
    <div
      className={`absolute z-30 w-72 max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-full rounded-lg p-3 ${CARTAO_MAPA}`}
      style={{ left, top, fontFamily: FONTE_MAPA }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2 border-b border-tinta/20 pb-1.5">
        <div>
          <p className="text-sm font-bold leading-tight" style={{ fontFamily: FONTE_MAPA_SC }}>
            {c.quantidade}× {c.carga}
          </p>
          <p className="text-[11px] italic text-tinta-suave">Caravana #{c.id} · {formatarLatao(c.valorCargaLatao)} em carga</p>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="cursor-pointer rounded p-0.5 hover:bg-tinta/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
        <dt className="italic text-tinta-suave">De</dt>
        <dd>
          {c.lojaOrigem} <span className="text-tinta-suave">({c.caminho[0]})</span>
        </dd>
        <dt className="italic text-tinta-suave">Para</dt>
        <dd>
          {c.lojaDestino} <span className="text-tinta-suave">({c.caminho[c.caminho.length - 1]})</span>
        </dd>
        <dt className="italic text-tinta-suave">Situação</dt>
        <dd className={c.status === 'EXTRAVIADA' ? 'font-bold text-tinta-rubra' : ''}>{c.statusDescricao}</dd>
        <dt className="italic text-tinta-suave">Proteção</dt>
        <dd>{c.protecaoDescricao}</dd>
        <dt className="italic text-tinta-suave">Chegada</dt>
        <dd>{chegada}</dd>
      </dl>
      <div className="mt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-tinta/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-amber-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-0.5 text-[10px] text-tinta-suave">
          {c.kmPercorridos} de {c.kmTotal} km · {c.caminho.join(' → ')}
        </p>
      </div>
      {c.missao && (
        <p className="mt-2 rounded bg-amber-700/15 px-2 py-1 text-[11px]">
          <strong>{c.missao.tipo}</strong> no quadro de {c.missao.cidade ?? '—'}: {formatarLatao(c.missao.recompensaLatao)}, prazo {c.missao.horasRestantes} h
        </p>
      )}
    </div>
  );
};
