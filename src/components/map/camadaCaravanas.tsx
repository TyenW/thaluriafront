import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import type { CaravanaMapa } from '../../types/comercio';
import { formatarLatao } from '../../utils/formatadores';
import type { CaravanaPosicionada } from './posicaoCaravanas';
import { FONTE_MAPA, FONTE_MAPA_SC, PAPEL_CLARO, TINTA, TINTA_VERMELHA } from './estiloMapa';

/** Cor da caravana conforme a situação na estrada. */
const COR_STATUS: Record<CaravanaMapa['status'], string> = {
  EM_TRANSITO: '#b45309',
  AGUARDANDO_ESCOLTA: '#57534e',
  EXTRAVIADA: TINTA_VERMELHA,
};

/** Carroça (terra) ou barco (mar), em coordenadas locais centradas no ponto. */
const GlifoCaravana: React.FC<{ maritima: boolean; cor: string }> = ({ maritima, cor }) =>
  maritima ? (
    <g>
      <path d="M-7,1H7L4.5,5H-4.5Z" fill={cor} stroke={TINTA} strokeWidth={0.8} strokeLinejoin="round" />
      <path d="M0,1V-8L5.5,-1H0" fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.8} strokeLinejoin="round" />
    </g>
  ) : (
    <g>
      <path d="M-7,-5H5L7,1H-7Z" fill={cor} stroke={TINTA} strokeWidth={0.8} strokeLinejoin="round" />
      <circle cx={-4} cy={3} r={2.2} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.8} />
      <circle cx={4} cy={3} r={2.2} fill={PAPEL_CLARO} stroke={TINTA} strokeWidth={0.8} />
    </g>
  );

export interface CamadaCaravanasProps {
  posicionadas: CaravanaPosicionada[];
  escala: number;
  selecionadaId: number | null;
  onSelecionar: (id: number, e: React.MouseEvent) => void;
}

/** Camada SVG: as caravanas sobre as rotas e, para a selecionada, o caminho inteiro. */
export const CamadaCaravanas: React.FC<CamadaCaravanasProps> = ({ posicionadas, escala, selecionadaId, onSelecionar }) => {
  const selecionada = useMemo(() => posicionadas.find((p) => p.caravana.id === selecionadaId), [posicionadas, selecionadaId]);
  return (
    <g>
      {selecionada &&
        selecionada.caminhos.map((c, i) => (
          <path
            key={i}
            d={c.d}
            fill="none"
            stroke={c.percorrido ? TINTA : '#d97706'}
            strokeWidth={c.percorrido ? 2 : 3}
            strokeDasharray={c.percorrido ? '2 3' : '7 4'}
            strokeOpacity={0.9}
            pointerEvents="none"
          />
        ))}
      {posicionadas.map(({ caravana: c, x, y, maritima }) => {
        const ativa = c.id === selecionadaId;
        const cor = COR_STATUS[c.status];
        return (
          <g
            key={c.id}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${escala * (ativa ? 1.5 : 1.15)})`}
            role="button"
            tabIndex={0}
            aria-label={`Caravana com ${c.quantidade}× ${c.carga}, de ${c.caminho[0]} para ${c.caminho[c.caminho.length - 1]}`}
            style={{ cursor: 'pointer', outline: 'none' }}
            onClick={(e) => onSelecionar(c.id, e)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <circle r={11} fill={PAPEL_CLARO} fillOpacity={0.85} stroke={ativa ? '#d97706' : TINTA} strokeWidth={ativa ? 2 : 0.8} />
            <GlifoCaravana maritima={maritima} cor={cor} />
            {c.status === 'EXTRAVIADA' && (
              <text x={8} y={-6} fontSize={11} fontWeight={700} fill={TINTA_VERMELHA} pointerEvents="none">
                !
              </text>
            )}
            {c.protecao !== 'DESPROTEGIDA' && <circle cx={8} cy={7} r={2.6} fill="#15803d" stroke={TINTA} strokeWidth={0.6} />}
          </g>
        );
      })}
    </g>
  );
};

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
      className="absolute z-30 w-72 max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-full rounded-lg border border-tinta/80 bg-papel-claro/95 p-3 text-tinta-escura shadow-2xl backdrop-blur-sm"
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
