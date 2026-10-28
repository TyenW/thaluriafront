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
  RIOS_ESCOADOUROS,
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
  /** Florestas: copas do mesmo maciço se fundem num contorno só. */
  grupo?: string;
  /** Copa da borda de baixo do maciço: só ela mostra tronco. */
  base?: boolean;
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
  /** Fronteiras entre reinos, cada trecho uma única vez (o traço-ponto não se embaralha). */
  fronteiras: string;
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

/** Arredonda uma poligonal aberta (cortes de Chaikin), mantendo as pontas. */
function suavizarChaikin(pts: Ponto[], vezes: number): Ponto[] {
  let atual = pts;
  for (let v = 0; v < vezes; v++) {
    const prox: Ponto[] = [atual[0]];
    for (let i = 0; i < atual.length - 1; i++) {
      const a = atual[i];
      const b = atual[i + 1];
      prox.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    prox.push(atual[atual.length - 1]);
    atual = prox;
  }
  return atual;
}

/** Contorno de um rio que vai de `larguras[0]` (nascente) a `larguras[1]` (foz), em unidades do mapa. */
function rioAfunilado(pts: Ponto[], [w0, w1]: [number, number]): string {
  const acumulado = [0];
  for (let i = 1; i < pts.length; i++) acumulado.push(acumulado[i - 1] + distancia(pts[i - 1], pts[i]));
  const total = acumulado[acumulado.length - 1] || 1;
  const esq: Ponto[] = [];
  const dir: Ponto[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const comp = Math.hypot(dx, dy) || 1;
    const t = acumulado[i] / total;
    // Engrossa devagar no começo e mais perto da foz, como um rio que recebe afluentes.
    const meia = (w0 + (w1 - w0) * Math.pow(t, 1.4)) / 2;
    const nx = (-dy / comp) * meia;
    const ny = (dx / comp) * meia;
    esq.push({ x: pts[i].x + nx, y: pts[i].y + ny });
    dir.push({ x: pts[i].x - nx, y: pts[i].y - ny });
  }
  const f = (p: Ponto) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  return `M${f(pts[0])}` + esq.map((p) => `L${f(p)}`).join('') + dir.reverse().map((p) => `L${f(p)}`).join('') + 'Z';
}

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
  const pontosTerritorios = REINOS.map((r) => tremerPoligono(celulas[r.id], 4, 0.09));
  const territorios: TerritorioDesenhado[] = REINOS.map((r, i) => ({ id: r.id, d: caminhoPoligono(pontosTerritorios[i]) }));

  // Cada borda é de dois reinos e sai idêntica nos dois polígonos (ver `tremer`): desenha-se
  // uma vez só, em trechos contínuos, para o tracejado seguir certo ao longo da fronteira.
  const chaveP = (p: Ponto) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  const arestasVistas = new Set<string>();
  const trechosFronteira: string[] = [];
  for (const pts of pontosTerritorios) {
    let atual: Ponto[] = [];
    const fechar = () => {
      if (atual.length > 1) trechosFronteira.push(atual.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(''));
      atual = [];
    };
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const k = [chaveP(a), chaveP(b)].sort().join('|');
      if (arestasVistas.has(k)) {
        fechar();
        continue;
      }
      arestasVistas.add(k);
      if (atual.length === 0) atual.push(a);
      atual.push(b);
    }
    fechar();
  }
  const fronteiras = trechosFronteira.join('');

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

  // Área dos títulos dos reinos fica sem símbolos, para o nome respirar (aproximação da caixa do texto).
  const caixasTitulos = REINOS.map((r) => {
    const campos = r.id === 'campos';
    const largura = r.nome.length * (campos ? 21 : 35) + 30;
    return { x0: r.rotulo.x - largura / 2, x1: r.rotulo.x + largura / 2, y0: r.rotulo.y - (campos ? 34 : 62), y1: r.rotulo.y + 12 };
  });
  const sobTitulo = (p: Ponto) => caixasTitulos.some((c) => p.x > c.x0 && p.x < c.x1 && p.y > c.y0 && p.y < c.y1);
  const pontoValido = (p: Ponto, reino: string) =>
    pontoNoPoligono(p, costa) &&
    !pontoNoPoligono(p, lagoPts) &&
    territorioDoPonto(p, sementes) === reino &&
    !centrosCidades.some((c) => distancia(c, p) < 24) &&
    !sobTitulo(p);
  const registrar = (p: Ponto) => {
    const k = `${Math.floor(p.x / TAM_CELULA)},${Math.floor(p.y / TAM_CELULA)}`;
    const lista = grade.get(k) ?? [];
    lista.push(p);
    grade.set(k, lista);
  };

  ZONAS_TERRENO.forEach((zona, zi) => {
    const rng = criarRng(hashTexto(`zona-${zi}-${zona.tipo}`));

    // Florestas em maciços: 3 a 6 copas sobrepostas por grupo, com clareiras entre os grupos.
    if (zona.tipo === 'floresta') {
      const grupos = Math.max(2, Math.round(zona.n / 4));
      let feitos = 0;
      for (let tentativa = 0; feitos < grupos && tentativa < grupos * 40; tentativa++) {
        const ang = rng() * Math.PI * 2;
        const raio = Math.sqrt(rng());
        const centro: Ponto = { x: zona.cx + Math.cos(ang) * zona.rx * raio, y: zona.cy + Math.sin(ang) * zona.ry * raio };
        if (!pontoValido(centro, zona.reino) || vizinhoPerto(centro, 30)) continue;
        const copas: SimboloTerreno[] = [];
        const n = 3 + Math.floor(rng() * 4);
        for (let i = 0; i < n * 3 && copas.length < n; i++) {
          const q: Ponto = { x: centro.x + (rng() - 0.5) * 18, y: centro.y + (rng() - 0.5) * 11 };
          if (!pontoValido(q, zona.reino)) continue;
          const [smin, smax] = TAMANHO.floresta;
          copas.push({ tipo: 'floresta', x: q.x, y: q.y, s: smin + rng() * (smax - smin), chave: `${zi}-${feitos}-${i}`, grupo: `${zi}-${feitos}` });
        }
        if (copas.length < 2) continue;
        // Troncos só nas copas mais baixas do maciço (as que "encostam" no chão do desenho).
        const fundo = Math.max(...copas.map((c) => c.y));
        for (const c of copas) c.base = c.y > fundo - 4;
        simbolos.push(...copas);
        registrar(centro);
        feitos++;
      }
      return;
    }
    let colocados = 0;
    let tentativas = 0;
    while (colocados < zona.n && tentativas < zona.n * 40) {
      tentativas++;
      const ang = rng() * Math.PI * 2;
      const raio = Math.sqrt(rng());
      const p: Ponto = { x: zona.cx + Math.cos(ang) * zona.rx * raio, y: zona.cy + Math.sin(ang) * zona.ry * raio };

      if (!pontoValido(p, zona.reino)) continue;
      if (vizinhoPerto(p, ESPACAMENTO[zona.tipo])) continue;

      const [smin, smax] = TAMANHO[zona.tipo];
      simbolos.push({
        tipo: zona.tipo,
        x: p.x,
        y: p.y,
        s: smin + rng() * (smax - smin),
        chave: `${zi}-${colocados}`,
      });
      registrar(p);
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

  // Rios em bico de pena: forma afunilada (fina na nascente, larga na foz), não um traço uniforme.
  const rios = RIOS_ATLAS.map((pts, i) => {
    const densos: Ponto[] = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const seg = tremer(pts[k], pts[k + 1], 3, 0.12 + (i % 2) * 0.02);
      densos.push(...seg.slice(0, -1));
    }
    densos.push(pts[pts.length - 1]);
    return rioAfunilado(suavizarChaikin(densos, 2), RIOS_ESCOADOUROS.has(i) ? [2.4, 3.6] : [0.7, 3.2]);
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
    fronteiras,
    simbolos,
    estradas,
    rotasMaritimas,
    rios,
    poligonos: { costa, lago: lagoPts, ilhas: ilhasPts.map((i) => i.pts) },
  };
  return cache;
}
