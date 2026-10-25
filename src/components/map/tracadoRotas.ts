/**
 * Traçado de rotas sobre o mapa: estradas andam só por terra e rotas marítimas
 * só por água. Usa uma grade sobre o atlas e A* (8 vizinhos); o caminho é depois
 * simplificado (linha de visada dentro do mesmo meio) e suavizado.
 */
import { ALTURA_MAPA, LARGURA_MAPA } from '../../data/atlasThaluria';
import { construirAtlas } from './construirAtlas';
import { distancia, pontoNoPoligono, suavizarAberto, type Ponto } from './geometria';

const CELULA = 6;
const COLS = Math.ceil(LARGURA_MAPA / CELULA);
const LINHAS = Math.ceil(ALTURA_MAPA / CELULA);
/** Quilômetros por unidade do mapa (mesma escala usada nas estimativas de distância). */
export const KM_POR_UNIDADE = 1.35;
/** Até quantas células uma cidade pode estar do meio exigido (porto afastado da água, etc.). */
const RAIO_ENCAIXE = 9;

export type MeioRota = 'terra' | 'agua';

export interface TracadoRota {
  d: string;
  /** Comprimento do traçado em unidades do mapa. */
  comprimento: number;
  /** Não existe caminho pelo meio exigido (ex.: estrada até uma ilha). */
  impossivel: boolean;
  motivo?: string;
}

interface Grade {
  terra: Uint8Array;
  /** Distância (em células) até a borda terra/água mais próxima. */
  distBorda: Uint16Array;
}

let grade: Grade | null = null;

function obterGrade(): Grade {
  if (grade) return grade;
  const { poligonos } = construirAtlas();
  const terra = new Uint8Array(COLS * LINHAS);
  for (let l = 0; l < LINHAS; l++) {
    for (let c = 0; c < COLS; c++) {
      const p = { x: c * CELULA + CELULA / 2, y: l * CELULA + CELULA / 2 };
      const continente = pontoNoPoligono(p, poligonos.costa) && !pontoNoPoligono(p, poligonos.lago);
      terra[l * COLS + c] = continente || poligonos.ilhas.some((ilha) => pontoNoPoligono(p, ilha)) ? 1 : 0;
    }
  }

  // BFS multi-fonte a partir das células de borda (vizinha de meio diferente).
  const distBorda = new Uint16Array(COLS * LINHAS).fill(65535);
  const fila: number[] = [];
  for (let i = 0; i < terra.length; i++) {
    const c = i % COLS;
    const l = (i / COLS) | 0;
    for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nl = l + dl;
      if (nc < 0 || nl < 0 || nc >= COLS || nl >= LINHAS) continue;
      if (terra[nl * COLS + nc] !== terra[i]) {
        distBorda[i] = 0;
        fila.push(i);
        break;
      }
    }
  }
  for (let k = 0; k < fila.length; k++) {
    const i = fila[k];
    const c = i % COLS;
    const l = (i / COLS) | 0;
    for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nl = l + dl;
      if (nc < 0 || nl < 0 || nc >= COLS || nl >= LINHAS) continue;
      const j = nl * COLS + nc;
      if (terra[j] === terra[i] && distBorda[j] > distBorda[i] + 1) {
        distBorda[j] = distBorda[i] + 1;
        fila.push(j);
      }
    }
  }

  grade = { terra, distBorda };
  return grade;
}

const celulaDe = (p: Ponto) => {
  const c = Math.min(COLS - 1, Math.max(0, Math.floor(p.x / CELULA)));
  const l = Math.min(LINHAS - 1, Math.max(0, Math.floor(p.y / CELULA)));
  return l * COLS + c;
};
const centro = (i: number): Ponto => ({ x: (i % COLS) * CELULA + CELULA / 2, y: ((i / COLS) | 0) * CELULA + CELULA / 2 });

const noMeio = (g: Grade, i: number, meio: MeioRota) => (g.terra[i] === 1) === (meio === 'terra');

/** Indica se o ponto está em terra firme (continente fora do lago, ou ilha). */
export function pontoEmTerra(p: Ponto): boolean {
  return obterGrade().terra[celulaDe(p)] === 1;
}

/** Distância (unidades do mapa) do ponto até a água mais próxima; 0 se já estiver na água. */
export function distanciaAteAgua(p: Ponto): number {
  const g = obterGrade();
  const i = celulaDe(p);
  return g.terra[i] === 1 ? g.distBorda[i] * CELULA : 0;
}

/** Célula do meio exigido mais próxima do ponto (busca em anel até RAIO_ENCAIXE). */
function encaixar(g: Grade, p: Ponto, meio: MeioRota): number | null {
  const base = celulaDe(p);
  if (noMeio(g, base, meio)) return base;
  const c0 = base % COLS;
  const l0 = (base / COLS) | 0;
  let melhor: number | null = null;
  let melhorD = Infinity;
  for (let r = 1; r <= RAIO_ENCAIXE; r++) {
    for (let dl = -r; dl <= r; dl++) {
      for (let dc = -r; dc <= r; dc++) {
        if (Math.max(Math.abs(dc), Math.abs(dl)) !== r) continue;
        const c = c0 + dc;
        const l = l0 + dl;
        if (c < 0 || l < 0 || c >= COLS || l >= LINHAS) continue;
        const i = l * COLS + c;
        if (!noMeio(g, i, meio)) continue;
        const d = distancia(centro(i), p);
        if (d < melhorD) {
          melhorD = d;
          melhor = i;
        }
      }
    }
    if (melhor !== null) return melhor;
  }
  return null;
}

/** Fila de prioridade mínima (heap binário) sobre índices de célula. */
class Heap {
  private itens: number[] = [];
  private prioridades: number[] = [];
  get tamanho() {
    return this.itens.length;
  }
  inserir(item: number, prioridade: number) {
    this.itens.push(item);
    this.prioridades.push(prioridade);
    let i = this.itens.length - 1;
    while (i > 0) {
      const pai = (i - 1) >> 1;
      if (this.prioridades[pai] <= this.prioridades[i]) break;
      this.trocar(i, pai);
      i = pai;
    }
  }
  remover(): number {
    const topo = this.itens[0];
    const ultimoItem = this.itens.pop()!;
    const ultimaPrio = this.prioridades.pop()!;
    if (this.itens.length > 0) {
      this.itens[0] = ultimoItem;
      this.prioridades[0] = ultimaPrio;
      let i = 0;
      for (;;) {
        const e = 2 * i + 1;
        const d = e + 1;
        let menor = i;
        if (e < this.itens.length && this.prioridades[e] < this.prioridades[menor]) menor = e;
        if (d < this.itens.length && this.prioridades[d] < this.prioridades[menor]) menor = d;
        if (menor === i) break;
        this.trocar(i, menor);
        i = menor;
      }
    }
    return topo;
  }
  private trocar(a: number, b: number) {
    [this.itens[a], this.itens[b]] = [this.itens[b], this.itens[a]];
    [this.prioridades[a], this.prioridades[b]] = [this.prioridades[b], this.prioridades[a]];
  }
}

const VIZINHOS: [number, number, number][] = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

function aEstrela(g: Grade, inicio: number, fim: number, meio: MeioRota): number[] | null {
  const custo = new Float32Array(COLS * LINHAS).fill(Infinity);
  const veioDe = new Int32Array(COLS * LINHAS).fill(-1);
  const fechado = new Uint8Array(COLS * LINHAS);
  const alvo = centro(fim);
  const heuristica = (i: number) => distancia(centro(i), alvo) / CELULA;
  const heap = new Heap();
  custo[inicio] = 0;
  heap.inserir(inicio, heuristica(inicio));

  while (heap.tamanho > 0) {
    const atual = heap.remover();
    if (atual === fim) break;
    if (fechado[atual]) continue;
    fechado[atual] = 1;
    const c = atual % COLS;
    const l = (atual / COLS) | 0;
    for (const [dc, dl, passo] of VIZINHOS) {
      const nc = c + dc;
      const nl = l + dl;
      if (nc < 0 || nl < 0 || nc >= COLS || nl >= LINHAS) continue;
      const j = nl * COLS + nc;
      if (fechado[j] || !noMeio(g, j, meio)) continue;
      // Diagonal não pode "cortar" um canto do outro meio.
      if (dc !== 0 && dl !== 0 && (!noMeio(g, l * COLS + nc, meio) || !noMeio(g, nl * COLS + c, meio))) continue;
      // Estradas evitam colar no litoral; navios evitam raspar a costa.
      const borda = g.distBorda[j];
      const penalidade = meio === 'terra' ? (borda < 2 ? 0.6 : 0) : borda < 3 ? (3 - borda) * 0.5 : 0;
      const novo = custo[atual] + passo * (1 + penalidade);
      if (novo < custo[j]) {
        custo[j] = novo;
        veioDe[j] = atual;
        heap.inserir(j, novo + heuristica(j));
      }
    }
  }

  if (veioDe[fim] === -1 && inicio !== fim) return null;
  const caminho: number[] = [];
  for (let i = fim; i !== -1; i = veioDe[i]) {
    caminho.push(i);
    if (i === inicio) break;
  }
  return caminho.reverse();
}

/** Segmento inteiramente dentro do meio (amostrado a cada 2 unidades). */
function visada(g: Grade, a: Ponto, b: Ponto, meio: MeioRota): boolean {
  const passos = Math.max(1, Math.ceil(distancia(a, b) / 2));
  for (let s = 1; s < passos; s++) {
    const t = s / passos;
    if (!noMeio(g, celulaDe({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }), meio)) return false;
  }
  return true;
}

/** Remove pontos intermediários enquanto houver linha de visada (string pulling). */
function simplificar(g: Grade, pts: Ponto[], meio: MeioRota): Ponto[] {
  if (pts.length <= 2) return pts;
  const saida: Ponto[] = [pts[0]];
  let ancora = 0;
  while (ancora < pts.length - 1) {
    let prox = ancora + 1;
    // Limita o salto para a curva final não se afastar demais do traçado válido.
    for (let k = pts.length - 1; k > ancora + 1; k--) {
      if (distancia(pts[ancora], pts[k]) <= 90 && visada(g, pts[ancora], pts[k], meio)) {
        prox = k;
        break;
      }
    }
    saida.push(pts[prox]);
    ancora = prox;
  }
  return saida;
}

const cache = new Map<string, TracadoRota>();

/** Traça uma rota entre dois pontos pelo meio indicado. Resultado em cache por coordenadas. */
export function tracarRota(a: Ponto, b: Ponto, meio: MeioRota): TracadoRota {
  const chave = `${meio}|${a.x},${a.y}|${b.x},${b.y}`;
  const salvo = cache.get(chave);
  if (salvo) return salvo;

  const g = obterGrade();
  const reta = (motivo: string): TracadoRota => ({
    d: `M${a.x},${a.y}L${b.x},${b.y}`,
    comprimento: distancia(a, b),
    impossivel: true,
    motivo,
  });

  let resultado: TracadoRota;
  const ini = encaixar(g, a, meio);
  const fim = encaixar(g, b, meio);
  if (ini === null || fim === null) {
    resultado = reta(meio === 'agua' ? 'Uma das cidades está longe demais da água para um porto.' : 'Uma das cidades está fora de terra firme.');
  } else {
    const celulas = aEstrela(g, ini, fim, meio);
    if (!celulas) {
      resultado = reta(
        meio === 'agua'
          ? 'Não há passagem por água entre essas cidades (ex.: lago fechado).'
          : 'Não há caminho por terra entre essas cidades (ex.: ilha). Use uma rota marítima.'
      );
    } else {
      const pontos = simplificar(g, celulas.map(centro), meio);
      const completo = [a, ...pontos, b];
      let comprimento = 0;
      for (let i = 1; i < completo.length; i++) comprimento += distancia(completo[i - 1], completo[i]);
      resultado = { d: suavizarAberto(completo), comprimento, impossivel: false };
    }
  }
  cache.set(chave, resultado);
  return resultado;
}

/** Distância sugerida em km para uma rota, a partir do traçado. */
export const distanciaKmSugerida = (t: TracadoRota) => Math.max(1, Math.round(t.comprimento * KM_POR_UNIDADE));
