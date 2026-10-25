/**
 * Constrói (uma única vez) toda a geometria estática do mapa a partir dos dados
 * do atlas: costas, lago, ilhas, territórios, símbolos de terreno e estradas.
 */
import {
  ALTURA_MAPA,
  CIDADES_ATLAS,
  CONTORNO_CONTINENTE,
  CONTORNO_LAGO,
  ESTRADAS_ATLAS,
  ILHAS,
  LARGURA_MAPA,
  REINOS,
  RIOS_ATLAS,
  ROTAS_MARITIMAS_ATLAS,
  ZONAS_TERRENO,
  type IdReino,
  type TipoTerreno,
} from '../../data/atlasThaluria';
import {
  caminhoEstrada,
  caminhoPoligono,
  caminhoSuaveFechado,
  celulasTerritorio,
  criarBlob,
  criarRng,
  distancia,
  hashTexto,
  pontoNoPoligono,
  suavizarAberto,
  territorioDoPonto,
  tremer,
  tremerPoligono,
  type Ponto,
} from './geometria';

export interface SimboloTerreno {
  tipo: TipoTerreno;
  x: number;
  y: number;
  s: number;
  chave: string;
}

export interface EstradaDesenhada {
  chave: string;
  de: string;
  para: string;
  d: string;
  principal: boolean;
}

export interface RotaMaritimaDesenhada {
  chave: string;
  de: string;
  para: string;
  d: string;
}

export interface TerritorioDesenhado {
  id: IdReino;
  /** Contorno (com bordas tremidas) do território. */
  d: string;
}

export interface AtlasConstruido {
  terra: string;
  lago: string;
  ilhas: { id: string; d: string }[];
  territorios: TerritorioDesenhado[];
  simbolos: SimboloTerreno[];
  estradas: EstradaDesenhada[];
  rotasMaritimas: RotaMaritimaDesenhada[];
  rios: string[];
  ondas: Ponto[];
  /** Polígonos usados para traçar rotas por terra ou por água. */
  poligonos: { costa: Ponto[]; lago: Ponto[]; ilhas: Ponto[][] };
}

let cache: AtlasConstruido | null = null;

const ESPACAMENTO: Record<TipoTerreno, number> = {
  pico_nevado: 15,
  montanha: 15,
  vulcao: 36,
  floresta: 12,
  colina: 17,
  arvore_morta: 13,
  capim: 12,
};

const TAMANHO: Record<TipoTerreno, [number, number]> = {
  pico_nevado: [11, 18],
  montanha: [10, 16],
  vulcao: [17, 22],
  floresta: [7, 10.5],
  colina: [10, 15],
  arvore_morta: [8, 12],
  capim: [4, 6],
};

export function construirAtlas(): AtlasConstruido {
  if (cache) return cache;

  // --- Costas ---------------------------------------------------------------
  const costa = tremerPoligono(CONTORNO_CONTINENTE, 4, 0.2);
  const lagoPts = tremerPoligono(CONTORNO_LAGO, 3, 0.16);
  const terra = caminhoSuaveFechado(costa, 0.9);
  const lago = caminhoSuaveFechado(lagoPts, 0.9);

  const ilhasPts = ILHAS.map((ilha) => {
    const blob = criarBlob(ilha.cx, ilha.cy, ilha.rx, ilha.ry, hashTexto(ilha.id), ilha.n ?? 11);
    const pts = tremerPoligono(blob, 3, 0.16);
    return { id: ilha.id, pts, d: caminhoSuaveFechado(pts, 0.9) };
  });

  // --- Territórios ----------------------------------------------------------
  const sementes = REINOS.map((r) => r.semente);
  const celulas = celulasTerritorio(sementes, LARGURA_MAPA, ALTURA_MAPA);
  const territorios: TerritorioDesenhado[] = REINOS.map((r) => {
    const pts = tremerPoligono(celulas[r.id], 4, 0.09);
    return { id: r.id, d: caminhoPoligono(pts) };
  });

  // --- Símbolos de terreno --------------------------------------------------
  const centrosCidades = CIDADES_ATLAS.map((c) => ({ x: c.x, y: c.y }));
  const simbolos: SimboloTerreno[] = [];
  const grade = new Map<string, Ponto[]>();
  const TAM_CELULA = 32;

  const vizinhoPerto = (p: Ponto, minimo: number): boolean => {
    const cx = Math.floor(p.x / TAM_CELULA);
    const cy = Math.floor(p.y / TAM_CELULA);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const lista = grade.get(`${cx + dx},${cy + dy}`);
        if (!lista) continue;
        for (const q of lista) if (distancia(p, q) < minimo) return true;
      }
    }
    return false;
  };

  ZONAS_TERRENO.forEach((zona, zi) => {
    const rng = criarRng(hashTexto(`zona-${zi}-${zona.tipo}`));
    let colocados = 0;
    let tentativas = 0;
    while (colocados < zona.n && tentativas < zona.n * 40) {
      tentativas++;
      const ang = rng() * Math.PI * 2;
      const raio = Math.sqrt(rng());
      const p: Ponto = { x: zona.cx + Math.cos(ang) * zona.rx * raio, y: zona.cy + Math.sin(ang) * zona.ry * raio };

      if (!pontoNoPoligono(p, costa)) continue;
      if (pontoNoPoligono(p, lagoPts)) continue;
      if (territorioDoPonto(p, sementes) !== zona.reino) continue;
      if (centrosCidades.some((c) => distancia(c, p) < 24)) continue;
      if (vizinhoPerto(p, ESPACAMENTO[zona.tipo])) continue;

      const [smin, smax] = TAMANHO[zona.tipo];
      simbolos.push({
        tipo: zona.tipo,
        x: p.x,
        y: p.y,
        s: smin + rng() * (smax - smin),
        chave: `${zi}-${colocados}`,
      });
      const k = `${Math.floor(p.x / TAM_CELULA)},${Math.floor(p.y / TAM_CELULA)}`;
      const lista = grade.get(k) ?? [];
      lista.push(p);
      grade.set(k, lista);
      colocados++;
    }
  });
  // Ordem de pintura: de cima para baixo, assim os símbolos "à frente" cobrem os de trás.
  simbolos.sort((a, b) => a.y - b.y);

  // --- Estradas e rotas -----------------------------------------------------
  const porNome = new Map(CIDADES_ATLAS.map((c) => [c.nome, c]));
  const estradas: EstradaDesenhada[] = [];
  for (const e of ESTRADAS_ATLAS) {
    const a = porNome.get(e.de);
    const b = porNome.get(e.para);
    if (!a || !b) continue;
    estradas.push({
      chave: `${e.de}|${e.para}`,
      de: e.de,
      para: e.para,
      d: caminhoEstrada(a, b),
      principal: !!e.principal,
    });
  }

  const rotasMaritimas: RotaMaritimaDesenhada[] = [];
  for (const r of ROTAS_MARITIMAS_ATLAS) {
    const a = porNome.get(r.de);
    const b = porNome.get(r.para);
    if (!a || !b) continue;
    rotasMaritimas.push({
      chave: `${r.de}|${r.para}`,
      de: r.de,
      para: r.para,
      d: `M${a.x},${a.y}Q${r.controle.x},${r.controle.y} ${b.x},${b.y}`,
    });
  }

  const rios = RIOS_ATLAS.map((pts, i) => {
    const densos: Ponto[] = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const seg = tremer(pts[k], pts[k + 1], 3, 0.12 + (i % 2) * 0.02);
      densos.push(...seg.slice(0, -1));
    }
    densos.push(pts[pts.length - 1]);
    return suavizarAberto(densos);
  });

  // --- Ondas decorativas no mar --------------------------------------------
  const ondas: Ponto[] = [];
  const rngOndas = criarRng(777);
  let tentOndas = 0;
  while (ondas.length < 90 && tentOndas < 4000) {
    tentOndas++;
    const p: Ponto = { x: 30 + rngOndas() * (LARGURA_MAPA - 60), y: 30 + rngOndas() * (ALTURA_MAPA - 60) };
    if (pontoNoPoligono(p, costa)) continue;
    // Afasta da costa: testa pontos ao redor.
    let perto = false;
    for (let a = 0; a < 8 && !perto; a++) {
      const q = { x: p.x + Math.cos((a * Math.PI) / 4) * 34, y: p.y + Math.sin((a * Math.PI) / 4) * 34 };
      if (pontoNoPoligono(q, costa)) perto = true;
    }
    if (perto) continue;
    if (ILHAS.some((i) => distancia({ x: i.cx, y: i.cy }, p) < Math.max(i.rx, i.ry) + 40)) continue;
    if (p.x < 330 && p.y > 925) continue; // reserva o espaço do título
    if (p.x > 1230 && p.y > 950) continue; // reserva a escala
    if (p.x < 200 && p.y < 190) continue; // reserva a rosa dos ventos
    if (ondas.some((o) => distancia(o, p) < 62)) continue;
    ondas.push(p);
  }

  cache = {
    ondas,
    terra,
    lago,
    ilhas: ilhasPts.map(({ id, d }) => ({ id, d })),
    territorios,
    simbolos,
    estradas,
    rotasMaritimas,
    rios,
    poligonos: { costa, lago: lagoPts, ilhas: ilhasPts.map((i) => i.pts) },
  };
  return cache;
}
