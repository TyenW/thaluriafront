import React, { useMemo, useRef } from 'react';
import { ALTURA_MAPA, LARGURA_MAPA } from '../../data/atlasThaluria';
import { construirAtlas } from '../map/construirAtlas';
import { distanciaAteAgua, pontoEmTerra, tracarRota, type TracadoRota } from '../map/tracadoRotas';
import type { Ponto } from '../map/geometria';

export interface CidadeNoEditor {
  id: string | number;
  nome: string;
  x: number | null;
  y: number | null;
  temPorto?: boolean;
}

export interface MapaEditorProps {
  cidades: CidadeNoEditor[];
  /** Posição sendo editada (cidade). */
  marcador?: Ponto | null;
  onEscolher?: (p: Ponto) => void;
  /** Rota a pré-visualizar. */
  rota?: { a: Ponto; b: Ponto; maritima: boolean } | null;
  destacar?: (string | number)[];
  altura?: number;
}

/** Avisos sobre a posição de uma cidade (água, porto sem acesso ao mar). */
export function avisosDePosicao(p: Ponto | null | undefined, temPorto: boolean): string[] {
  if (!p) return [];
  const avisos: string[] = [];
  if (!pontoEmTerra(p)) avisos.push('A posição está sobre a água. Coloque a cidade em terra firme.');
  else if (temPorto && distanciaAteAgua(p) > 30) avisos.push('Porto longe da costa: aproxime a cidade do mar ou de um lago para as rotas marítimas funcionarem.');
  return avisos;
}

export function tracadoDaRota(rota: MapaEditorProps['rota']): TracadoRota | null {
  return rota ? tracarRota(rota.a, rota.b, rota.maritima ? 'agua' : 'terra') : null;
}

export const MapaEditor: React.FC<MapaEditorProps> = ({ cidades, marcador, onEscolher, rota, destacar = [], altura = 320 }) => {
  const atlas = useMemo(() => construirAtlas(), []);
  const svgRef = useRef<SVGSVGElement>(null);
  const tracado = useMemo(() => tracadoDaRota(rota), [rota]);

  const aoClicar = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onEscolher || !svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    onEscolher({
      x: Math.round(Math.min(LARGURA_MAPA, Math.max(0, pt.x))),
      y: Math.round(Math.min(ALTURA_MAPA, Math.max(0, pt.y))),
    });
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${LARGURA_MAPA} ${ALTURA_MAPA}`}
      className={`w-full rounded-lg border border-tinta bg-[#bfb48c] ${onEscolher ? 'cursor-crosshair' : ''}`}
      style={{ maxHeight: altura }}
      onClick={aoClicar}
      role={onEscolher ? 'button' : 'img'}
      aria-label={onEscolher ? 'Clique para posicionar a cidade no mapa' : 'Pré-visualização no mapa'}
    >
      <path d={atlas.terra} fill="#efe2bb" stroke="#3a2a1a" strokeWidth={2} />
      <path d={atlas.lago} fill="#b9c8c0" stroke="#3a2a1a" strokeWidth={1.5} />
      {atlas.ilhas.map((i) => (
        <path key={i.id} d={i.d} fill="#efe2bb" stroke="#3a2a1a" strokeWidth={1.5} />
      ))}
      {atlas.territorios.map((t) => (
        <path key={t.id} d={t.d} fill="none" stroke="#8a3b2a" strokeWidth={1} strokeDasharray="6 6" strokeOpacity={0.35} pointerEvents="none" />
      ))}

      {tracado && (
        <path
          d={tracado.d}
          fill="none"
          stroke={tracado.impossivel ? '#b3261e' : rota?.maritima ? '#1f4f6b' : '#3a2a1a'}
          strokeWidth={4}
          strokeDasharray={tracado.impossivel ? '4 8' : rota?.maritima ? '12 8' : undefined}
          strokeLinecap="round"
        />
      )}

      {cidades.map((c) =>
        c.x == null || c.y == null ? null : (
          <g key={c.id} pointerEvents="none">
            <circle
              cx={c.x}
              cy={c.y}
              r={destacar.includes(c.id) ? 9 : 5}
              fill={destacar.includes(c.id) ? '#d4af37' : c.temPorto ? '#1f4f6b' : '#3a2a1a'}
              stroke="#f3e7c3"
              strokeWidth={2}
            />
            {destacar.includes(c.id) && (
              <text x={c.x + 12} y={c.y + 6} fontSize={26} fill="#3a2a1a" fontFamily="Georgia, serif" fontWeight="bold">
                {c.nome}
              </text>
            )}
          </g>
        )
      )}

      {marcador && (
        <g pointerEvents="none">
          <circle cx={marcador.x} cy={marcador.y} r={16} fill="none" stroke="#b3261e" strokeWidth={4} />
          <circle cx={marcador.x} cy={marcador.y} r={5} fill="#b3261e" />
        </g>
      )}
    </svg>
  );
};
