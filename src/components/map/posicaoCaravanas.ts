import type { CaravanaMapa } from '../../types/comercio';
import type { Ponto } from './geometria';
import { pontoEmTerra, pontoNoTracado, tracarRota } from './tracadoRotas';

export interface CaravanaPosicionada {
  caravana: CaravanaMapa;
  x: number;
  y: number;
  maritima: boolean;
  /** Direção da viagem nesse ponto, em graus (0 = leste, 90 = sul). */
  angulo: number;
  /** Fração da viagem inteira já percorrida (0 a 1), para o anel de progresso. */
  progresso: number;
  /** Traçados de todos os trechos (com o acesso por terra aos portos), para destacar o caminho da selecionada. */
  caminhos: { d: string; percorrido: boolean }[];
}

/** Calcula onde cada caravana está, sobre o mesmo traçado que o mapa usa para as rotas. */
export function posicionarCaravanas(caravanas: CaravanaMapa[], posicaoDe: (cidade: string) => Ponto | null): CaravanaPosicionada[] {
  const lista: CaravanaPosicionada[] = [];
  for (const c of caravanas) {
    const pontos = c.caminho.map(posicaoDe);
    if (pontos.some((p) => !p) || pontos.length < 2) continue;
    const caminhos = c.trechos.map((t, i) => {
      const tr = tracarRota(pontos[i]!, pontos[i + 1]!, t.tipo === 'MARITIMA' ? 'agua' : 'terra');
      return { d: tr.d + (tr.acessos ?? ''), percorrido: i < c.indiceTrecho };
    });
    const i = Math.min(c.indiceTrecho, c.trechos.length - 1);
    const trecho = c.trechos[i];
    const rotaMaritima = trecho?.tipo === 'MARITIMA';
    const fracao = c.status === 'AGUARDANDO_ESCOLTA' ? 0 : c.fracaoNoTrecho;
    const p = pontoNoTracado(tracarRota(pontos[i]!, pontos[i + 1]!, rotaMaritima ? 'agua' : 'terra'), fracao);
    // Num trecho marítimo, entre a cidade e o cais ela ainda anda por terra: carroça até embarcar.
    const progresso = c.kmTotal > 0 ? Math.min(1, Math.max(0, c.kmPercorridos / c.kmTotal)) : 0;
    lista.push({ caravana: c, x: p.x, y: p.y, maritima: rotaMaritima && !pontoEmTerra(p), angulo: p.angulo, progresso, caminhos });
  }
  return lista;
}
