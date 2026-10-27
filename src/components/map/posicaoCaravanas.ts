import type { CaravanaMapa } from '../../types/comercio';
import type { Ponto } from './geometria';
import { pontoNoTracado, tracarRota } from './tracadoRotas';

export interface CaravanaPosicionada {
  caravana: CaravanaMapa;
  x: number;
  y: number;
  maritima: boolean;
  /** Traçados de todos os trechos, para destacar o caminho da selecionada. */
  caminhos: { d: string; percorrido: boolean }[];
}

/** Calcula onde cada caravana está, sobre o mesmo traçado que o mapa usa para as rotas. */
export function posicionarCaravanas(caravanas: CaravanaMapa[], posicaoDe: (cidade: string) => Ponto | null): CaravanaPosicionada[] {
  const lista: CaravanaPosicionada[] = [];
  for (const c of caravanas) {
    const pontos = c.caminho.map(posicaoDe);
    if (pontos.some((p) => !p) || pontos.length < 2) continue;
    const caminhos = c.trechos.map((t, i) => ({
      d: tracarRota(pontos[i]!, pontos[i + 1]!, t.tipo === 'MARITIMA' ? 'agua' : 'terra').d,
      percorrido: i < c.indiceTrecho,
    }));
    const i = Math.min(c.indiceTrecho, c.trechos.length - 1);
    const trecho = c.trechos[i];
    const maritima = trecho?.tipo === 'MARITIMA';
    const fracao = c.status === 'AGUARDANDO_ESCOLTA' ? 0 : c.fracaoNoTrecho;
    const p = pontoNoTracado(tracarRota(pontos[i]!, pontos[i + 1]!, maritima ? 'agua' : 'terra'), fracao);
    lista.push({ caravana: c, x: p.x, y: p.y, maritima, caminhos });
  }
  return lista;
}
