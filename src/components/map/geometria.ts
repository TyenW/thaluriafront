/**
 * Utilitários geométricos para gerar o mapa de Thalúria de forma procedural.
 * Tudo é determinístico (RNG com semente) para o mapa ser idêntico a cada renderização.
 */

export interface Ponto {
  x: number;
  y: number;
}

/** RNG determinístico (mulberry32). */
export function criarRng(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function chavePonto(p: Ponto): string {
  return `${Math.round(p.x)},${Math.round(p.y)}`;
}

/**
 * Subdivide o segmento a→b com deslocamento do ponto médio (fractal).
 * O deslocamento depende apenas dos extremos em ordem canônica, então uma
 * aresta compartilhada por dois reinos recebe exatamente o mesmo traçado.
 */
export function tremer(a: Ponto, b: Ponto, profundidade: number, rugosidade: number): Ponto[] {
  const ka = chavePonto(a);
  const kb = chavePonto(b);
  const inverter = ka > kb;
  const p0 = inverter ? b : a;
  const p1 = inverter ? a : b;
  const pontos = subdividir(p0, p1, profundidade, rugosidade, `${chavePonto(p0)}|${chavePonto(p1)}`);
  return inverter ? pontos.reverse() : pontos;
}

function subdividir(a: Ponto, b: Ponto, prof: number, rug: number, chave: string): Ponto[] {
  if (prof <= 0) return [a, b];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comp = Math.hypot(dx, dy);
  if (comp < 3) return [a, b];
  const rng = criarRng(hashTexto(chave));
  const desloc = (rng() * 2 - 1) * rug * comp;
  const meio: Ponto = {
    x: (a.x + b.x) / 2 + (-dy / comp) * desloc,
    y: (a.y + b.y) / 2 + (dx / comp) * desloc,
  };
  const esq = subdividir(a, meio, prof - 1, rug, `${chave}L`);
  const dir = subdividir(meio, b, prof - 1, rug, `${chave}R`);
  return [...esq.slice(0, -1), ...dir];
}

/** Aplica `tremer` em todas as arestas de um polígono fechado. */
export function tremerPoligono(pontos: Ponto[], profundidade: number, rugosidade: number): Ponto[] {
  const saida: Ponto[] = [];
  for (let i = 0; i < pontos.length; i++) {
    const a = pontos[i];
    const b = pontos[(i + 1) % pontos.length];
    const seg = tremer(a, b, profundidade, rugosidade);
    saida.push(...seg.slice(0, -1));
  }
  return saida;
}

/** Caminho SVG suave (Catmull-Rom → Bézier) para uma curva fechada. */
export function caminhoSuaveFechado(pts: Ponto[], tensao = 0.5): string {
  const n = pts.length;
  if (n < 3) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + ((p2.x - p0.x) * tensao) / 3;
    const c1y = p1.y + ((p2.y - p0.y) * tensao) / 3;
    const c2x = p2.x - ((p3.x - p1.x) * tensao) / 3;
    const c2y = p2.y - ((p3.y - p1.y) * tensao) / 3;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return `${d}Z`;
}

/** Caminho SVG poligonal fechado (sem suavização). */
export function caminhoPoligono(pts: Ponto[]): string {
  if (pts.length === 0) return '';
  return `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}Z`;
}

/** Ponto dentro de polígono (ray casting). */
export function pontoNoPoligono(p: Ponto, poly: Ponto[]): boolean {
  let dentro = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
}

/** Recorta um polígono por um semiplano  nx*x + ny*y <= c  (Sutherland–Hodgman). */
function recortarSemiplano(poly: Ponto[], nx: number, ny: number, c: number): Ponto[] {
  const saida: Ponto[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = nx * a.x + ny * a.y - c;
    const db = nx * b.x + ny * b.y - c;
    if (da <= 0) saida.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      saida.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return saida;
}

export interface SementeTerritorio {
  id: string;
  x: number;
  y: number;
  peso?: number;
}

/** Distância de potência: a menor define o território de um ponto. */
export function territorioDoPonto(p: Ponto, sementes: SementeTerritorio[]): string {
  let melhor = sementes[0].id;
  let menor = Infinity;
  for (const s of sementes) {
    const d = (p.x - s.x) ** 2 + (p.y - s.y) ** 2 - (s.peso ?? 0);
    if (d < menor) {
      menor = d;
      melhor = s.id;
    }
  }
  return melhor;
}

/** Células de Voronoi (potência) recortadas no retângulo dado. */
export function celulasTerritorio(
  sementes: SementeTerritorio[],
  largura: number,
  altura: number,
): Record<string, Ponto[]> {
  const resultado: Record<string, Ponto[]> = {};
  for (const si of sementes) {
    let poly: Ponto[] = [
      { x: -50, y: -50 },
      { x: largura + 50, y: -50 },
      { x: largura + 50, y: altura + 50 },
      { x: -50, y: altura + 50 },
    ];
    for (const sj of sementes) {
      if (sj.id === si.id) continue;
      const nx = sj.x - si.x;
      const ny = sj.y - si.y;
      const c = (sj.x ** 2 + sj.y ** 2 - si.x ** 2 - si.y ** 2 + (si.peso ?? 0) - (sj.peso ?? 0)) / 2;
      poly = recortarSemiplano(poly, nx, ny, c);
      if (poly.length === 0) break;
    }
    resultado[si.id] = poly;
  }
  return resultado;
}

/** Blob orgânico (ilhas) em torno de um centro. */
export function criarBlob(cx: number, cy: number, rx: number, ry: number, semente: number, n = 10): Ponto[] {
  const rng = criarRng(semente);
  const pts: Ponto[] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const r = 0.68 + rng() * 0.45;
    pts.push({ x: cx + Math.cos(ang) * rx * r, y: cy + Math.sin(ang) * ry * r });
  }
  return pts;
}

export function distancia(a: Ponto, b: Ponto): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Curva de estrada levemente sinuosa entre dois pontos (caminho SVG). */
export function caminhoEstrada(a: Ponto, b: Ponto): string {
  const comp = distancia(a, b);
  const pts = tremer(a, b, Math.max(2, Math.min(4, Math.round(comp / 60))), 0.07);
  return suavizarAberto(pts);
}

export function suavizarAberto(pts: Ponto[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}
