/**
 * Atlas de Thalúria — dados cartográficos do continente.
 *
 * Aqui ficam só coordenadas e nomes (o "desenho"). O que o jogador PODE ver
 * (Fog-of-War) continua vindo da API Java: uma cidade do atlas só aparece
 * se a API devolver uma cidade com o mesmo nome e visibilidade != OCULTO.
 *
 * Sistema de coordenadas: viewBox 1536 x 1024.
 */
import type { Ponto, SementeTerritorio } from '../components/map/geometria';

export const LARGURA_MAPA = 1536;
export const ALTURA_MAPA = 1024;

export type IdReino = 'frosthelm' | 'sylvanor' | 'aurelia' | 'drakos' | 'valthera' | 'campos';

export interface Reino {
  id: IdReino;
  nome: string;
  /** Cor da aguada (wash) do território. */
  cor: string;
  /** Posição do rótulo do reino. */
  rotulo: Ponto;
  rotacao?: number;
  /** Semente do diagrama de territórios. */
  semente: SementeTerritorio;
}

export const REINOS: Reino[] = [
  { id: 'frosthelm', nome: 'Frosthelm', cor: '#8fa7b3', rotulo: { x: 540, y: 128 }, semente: { id: 'frosthelm', x: 470, y: 200 } },
  { id: 'sylvanor', nome: 'Sylvanor', cor: '#7f9a55', rotulo: { x: 1060, y: 150 }, semente: { id: 'sylvanor', x: 1040, y: 230 } },
  { id: 'aurelia', nome: 'Aurelia', cor: '#d4a64a', rotulo: { x: 400, y: 392 }, semente: { id: 'aurelia', x: 430, y: 450 } },
  { id: 'drakos', nome: 'Drakos', cor: '#b0553a', rotulo: { x: 1290, y: 400 }, semente: { id: 'drakos', x: 1270, y: 450 } },
  { id: 'valthera', nome: 'Valthera', cor: '#7d6a92', rotulo: { x: 700, y: 650 }, semente: { id: 'valthera', x: 700, y: 720 } },
  // Região do sudeste sem reino nomeado na arte original — ajuste o nome à vontade.
  { id: 'campos', nome: 'Campos Meridionais', cor: '#c9b36a', rotulo: { x: 1130, y: 700 }, rotacao: -4, semente: { id: 'campos', x: 1120, y: 690 } },
];

/** Contorno grosseiro do continente (é "tremido" proceduralmente depois). */
export const CONTORNO_CONTINENTE: Ponto[] = [
  { x: 300, y: 140 }, { x: 380, y: 80 }, { x: 520, y: 50 }, { x: 700, y: 60 }, { x: 790, y: 112 },
  { x: 830, y: 90 }, { x: 950, y: 60 }, { x: 1100, y: 40 }, { x: 1220, y: 90 }, { x: 1290, y: 200 },
  { x: 1300, y: 290 }, { x: 1360, y: 300 }, { x: 1480, y: 340 }, { x: 1510, y: 440 }, { x: 1500, y: 520 },
  { x: 1420, y: 570 }, { x: 1330, y: 620 }, { x: 1335, y: 700 }, { x: 1250, y: 765 }, { x: 1150, y: 795 },
  { x: 1040, y: 795 }, { x: 960, y: 835 }, { x: 900, y: 885 }, { x: 780, y: 895 }, { x: 660, y: 885 },
  { x: 540, y: 885 }, { x: 470, y: 840 }, { x: 420, y: 760 }, { x: 430, y: 690 }, { x: 340, y: 645 },
  { x: 250, y: 625 }, { x: 170, y: 560 }, { x: 140, y: 480 }, { x: 180, y: 400 }, { x: 170, y: 330 },
  { x: 230, y: 260 }, { x: 290, y: 200 },
];

export const CONTORNO_LAGO: Ponto[] = [
  { x: 720, y: 470 }, { x: 760, y: 420 }, { x: 840, y: 395 }, { x: 930, y: 405 }, { x: 995, y: 450 },
  { x: 1000, y: 520 }, { x: 960, y: 575 }, { x: 880, y: 600 }, { x: 790, y: 590 }, { x: 735, y: 545 },
];

export interface Ilha {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  n?: number;
}

export const ILHAS: Ilha[] = [
  // Ilhas de Varell (nordeste)
  { id: 'varell-a', cx: 1385, cy: 150, rx: 48, ry: 34 },
  { id: 'varell-b', cx: 1300, cy: 92, rx: 28, ry: 20 },
  { id: 'varell-c', cx: 1440, cy: 80, rx: 24, ry: 18 },
  { id: 'varell-d', cx: 1345, cy: 190, rx: 20, ry: 14 },
  // Ilhas de Seraphis (oeste)
  { id: 'sera-a', cx: 112, cy: 505, rx: 38, ry: 28 },
  { id: 'sera-b', cx: 70, cy: 440, rx: 24, ry: 18 },
  { id: 'sera-c', cx: 150, cy: 580, rx: 30, ry: 20 },
  { id: 'sera-d', cx: 90, cy: 360, rx: 22, ry: 16 },
  // Ilhas do Crepúsculo (sudeste)
  { id: 'crep-a', cx: 1225, cy: 905, rx: 62, ry: 40 },
  { id: 'crep-b', cx: 1130, cy: 880, rx: 26, ry: 16 },
  { id: 'crep-c', cx: 1335, cy: 940, rx: 22, ry: 16 },
  // Ilhas Negras (sul)
  { id: 'negras-a', cx: 560, cy: 965, rx: 54, ry: 34 },
  { id: 'negras-b', cx: 480, cy: 940, rx: 24, ry: 16 },
  { id: 'negras-c', cx: 640, cy: 985, rx: 20, ry: 13 },
  // Ilha de Azzura (no Lago Esmeralda)
  { id: 'azzura', cx: 848, cy: 520, rx: 44, ry: 26 },
  // Pequenos ilhotes
  { id: 'ilhota-1', cx: 245, cy: 120, rx: 18, ry: 12 },
  { id: 'ilhota-2', cx: 330, cy: 790, rx: 16, ry: 11 },
];

export type TipoCidade = 'capital' | 'cidade' | 'vila' | 'porto' | 'fortaleza';

export interface CidadeAtlas {
  nome: string;
  reino: IdReino | 'ilhas';
  tipo: TipoCidade;
  x: number;
  y: number;
  /** Lado preferencial do rótulo. */
  rotulo?: 'direita' | 'esquerda' | 'abaixo' | 'acima';
}

export const CIDADES_ATLAS: CidadeAtlas[] = [
  // Frosthelm
  { nome: 'Frosthelm', reino: 'frosthelm', tipo: 'capital', x: 553, y: 187, rotulo: 'direita' },
  { nome: 'Thaldrim', reino: 'frosthelm', tipo: 'porto', x: 318, y: 142, rotulo: 'direita' },
  { nome: 'Valkar', reino: 'frosthelm', tipo: 'porto', x: 248, y: 253, rotulo: 'direita' },
  { nome: 'Kelvorn', reino: 'frosthelm', tipo: 'cidade', x: 725, y: 222, rotulo: 'direita' },
  { nome: 'Eirnhold', reino: 'frosthelm', tipo: 'fortaleza', x: 602, y: 243, rotulo: 'direita' },
  // Sylvanor
  { nome: 'Verdan', reino: 'sylvanor', tipo: 'capital', x: 995, y: 243, rotulo: 'direita' },
  { nome: 'Eldergrove', reino: 'sylvanor', tipo: 'vila', x: 1043, y: 98, rotulo: 'direita' },
  { nome: 'Ravenford', reino: 'sylvanor', tipo: 'cidade', x: 858, y: 232, rotulo: 'direita' },
  { nome: 'Willowbrook', reino: 'sylvanor', tipo: 'vila', x: 1138, y: 222, rotulo: 'direita' },
  { nome: 'Moonhaven', reino: 'sylvanor', tipo: 'porto', x: 1262, y: 236, rotulo: 'esquerda' },
  { nome: 'Stonehollow', reino: 'sylvanor', tipo: 'cidade', x: 1078, y: 320, rotulo: 'direita' },
  // Aurelia
  { nome: 'Aurelia', reino: 'aurelia', tipo: 'capital', x: 437, y: 452, rotulo: 'direita' },
  { nome: 'Solara', reino: 'aurelia', tipo: 'cidade', x: 315, y: 345, rotulo: 'direita' },
  { nome: 'Cedrath', reino: 'aurelia', tipo: 'cidade', x: 586, y: 401, rotulo: 'direita' },
  { nome: 'Brisamar', reino: 'aurelia', tipo: 'porto', x: 178, y: 445, rotulo: 'direita' },
  { nome: 'Valdoria', reino: 'aurelia', tipo: 'cidade', x: 498, y: 548, rotulo: 'direita' },
  { nome: 'Tamaris', reino: 'aurelia', tipo: 'porto', x: 282, y: 610, rotulo: 'direita' },
  // Drakos
  { nome: 'Drakos', reino: 'drakos', tipo: 'capital', x: 1252, y: 470, rotulo: 'direita' },
  { nome: 'Karthul', reino: 'drakos', tipo: 'cidade', x: 1105, y: 426, rotulo: 'direita' },
  { nome: 'Velgrath', reino: 'drakos', tipo: 'cidade', x: 1397, y: 443, rotulo: 'esquerda' },
  { nome: 'Ravenstoke', reino: 'drakos', tipo: 'cidade', x: 1347, y: 536, rotulo: 'direita' },
  { nome: 'Cinderport', reino: 'drakos', tipo: 'porto', x: 1332, y: 600, rotulo: 'esquerda' },
  // Valthera
  { nome: 'Valthera', reino: 'valthera', tipo: 'capital', x: 693, y: 722, rotulo: 'direita' },
  { nome: 'Caelum', reino: 'valthera', tipo: 'cidade', x: 549, y: 679, rotulo: 'direita' },
  { nome: 'Duskvale', reino: 'valthera', tipo: 'cidade', x: 810, y: 702, rotulo: 'direita' },
  { nome: 'Shadowfen', reino: 'valthera', tipo: 'cidade', x: 553, y: 791, rotulo: 'direita' },
  { nome: 'Eldenreach', reino: 'valthera', tipo: 'cidade', x: 818, y: 793, rotulo: 'direita' },
  { nome: 'Noctisport', reino: 'valthera', tipo: 'porto', x: 650, y: 870, rotulo: 'direita' },
  // Campos Meridionais
  { nome: 'Lunara', reino: 'campos', tipo: 'cidade', x: 1008, y: 640, rotulo: 'direita' },
  { nome: 'Monteluz', reino: 'campos', tipo: 'cidade', x: 1108, y: 668, rotulo: 'direita' },
  { nome: 'Ravenspire', reino: 'campos', tipo: 'fortaleza', x: 1060, y: 747, rotulo: 'esquerda' },
  { nome: 'Porto Real', reino: 'campos', tipo: 'porto', x: 1250, y: 755, rotulo: 'direita' },
  // Ilhas
  { nome: 'Azzura', reino: 'ilhas', tipo: 'fortaleza', x: 848, y: 520, rotulo: 'abaixo' },
  { nome: 'Varell', reino: 'ilhas', tipo: 'porto', x: 1385, y: 150, rotulo: 'abaixo' },
  { nome: 'Crepúsculo', reino: 'ilhas', tipo: 'porto', x: 1225, y: 905, rotulo: 'abaixo' },
  // Cidades Canônicas da Campanha (compatibilidade total e integração de lore)
  { nome: 'Frostdale', reino: 'frosthelm', tipo: 'porto', x: 448, y: 84, rotulo: 'acima' },
  { nome: 'Ironhold', reino: 'frosthelm', tipo: 'fortaleza', x: 650, y: 275, rotulo: 'direita' },
  { nome: 'Valdorian', reino: 'aurelia', tipo: 'cidade', x: 595, y: 505, rotulo: 'direita' },
  { nome: 'Porto Oakhaven', reino: 'sylvanor', tipo: 'porto', x: 1218, y: 106, rotulo: 'esquerda' },
  { nome: 'Sunreach', reino: 'drakos', tipo: 'porto', x: 1272, y: 286, rotulo: 'direita' },
];

export interface EstradaAtlas {
  de: string;
  para: string;
  principal?: boolean;
}

export const ESTRADAS_ATLAS: EstradaAtlas[] = [
  // Frosthelm
  { de: 'Frosthelm', para: 'Thaldrim', principal: true },
  { de: 'Thaldrim', para: 'Valkar' },
  { de: 'Frosthelm', para: 'Kelvorn' },
  { de: 'Frosthelm', para: 'Eirnhold' },
  { de: 'Eirnhold', para: 'Cedrath', principal: true },
  { de: 'Kelvorn', para: 'Ravenford', principal: true },
  // Sylvanor
  { de: 'Verdan', para: 'Ravenford', principal: true },
  { de: 'Verdan', para: 'Eldergrove', principal: true },
  { de: 'Verdan', para: 'Willowbrook', principal: true },
  { de: 'Verdan', para: 'Stonehollow', principal: true },
  { de: 'Willowbrook', para: 'Moonhaven' },
  { de: 'Stonehollow', para: 'Karthul', principal: true },
  { de: 'Cedrath', para: 'Ravenford', principal: true },
  // Aurelia
  { de: 'Aurelia', para: 'Solara', principal: true },
  { de: 'Aurelia', para: 'Cedrath', principal: true },
  { de: 'Aurelia', para: 'Valdoria', principal: true },
  { de: 'Aurelia', para: 'Brisamar', principal: true },
  { de: 'Solara', para: 'Brisamar' },
  { de: 'Valdoria', para: 'Tamaris' },
  { de: 'Brisamar', para: 'Tamaris' },
  { de: 'Valdoria', para: 'Caelum', principal: true },
  // Valthera
  { de: 'Valthera', para: 'Caelum', principal: true },
  { de: 'Valthera', para: 'Duskvale', principal: true },
  { de: 'Valthera', para: 'Shadowfen', principal: true },
  { de: 'Valthera', para: 'Eldenreach', principal: true },
  { de: 'Shadowfen', para: 'Noctisport' },
  { de: 'Duskvale', para: 'Lunara', principal: true },
  // Drakos
  { de: 'Drakos', para: 'Karthul', principal: true },
  { de: 'Drakos', para: 'Velgrath', principal: true },
  { de: 'Drakos', para: 'Ravenstoke', principal: true },
  { de: 'Velgrath', para: 'Ravenstoke' },
  { de: 'Ravenstoke', para: 'Cinderport' },
  { de: 'Karthul', para: 'Lunara', principal: true },
  // Campos Meridionais
  { de: 'Lunara', para: 'Monteluz', principal: true },
  { de: 'Monteluz', para: 'Ravenspire' },
  { de: 'Monteluz', para: 'Porto Real', principal: true },
  { de: 'Ravenstoke', para: 'Monteluz' },
  { de: 'Ravenspire', para: 'Eldenreach' },
  // Conexões com as cidades canônicas da campanha
  { de: 'Frostdale', para: 'Ironhold', principal: true },
  { de: 'Ironhold', para: 'Frosthelm', principal: true },
  { de: 'Frostdale', para: 'Thaldrim' },
  { de: 'Ironhold', para: 'Valdorian', principal: true },
  { de: 'Valdorian', para: 'Valdoria' },
  { de: 'Valdorian', para: 'Porto Oakhaven', principal: true },
  { de: 'Valdorian', para: 'Sunreach', principal: true },
  { de: 'Sunreach', para: 'Karthul' },
];

export interface RotaMaritimaAtlas {
  de: string;
  para: string;
  /** Ponto de controle (curva quadrática) para a rota contornar a costa. */
  controle: Ponto;
}

export const ROTAS_MARITIMAS_ATLAS: RotaMaritimaAtlas[] = [
  { de: 'Thaldrim', para: 'Valkar', controle: { x: 255, y: 160 } },
  { de: 'Valkar', para: 'Brisamar', controle: { x: 100, y: 350 } },
  { de: 'Brisamar', para: 'Tamaris', controle: { x: 120, y: 520 } },
  { de: 'Tamaris', para: 'Noctisport', controle: { x: 300, y: 840 } },
  { de: 'Noctisport', para: 'Porto Real', controle: { x: 960, y: 985 } },
  { de: 'Porto Real', para: 'Cinderport', controle: { x: 1420, y: 700 } },
  { de: 'Porto Real', para: 'Crepúsculo', controle: { x: 1320, y: 840 } },
  { de: 'Moonhaven', para: 'Varell', controle: { x: 1340, y: 165 } },
  { de: 'Frostdale', para: 'Porto Oakhaven', controle: { x: 800, y: 50 } },
  { de: 'Porto Oakhaven', para: 'Sunreach', controle: { x: 1350, y: 320 } },
  { de: 'Porto Oakhaven', para: 'Moonhaven', controle: { x: 1250, y: 195 } },
];

export interface RotuloMar {
  texto: string;
  x: number;
  y: number;
  rotacao?: number;
  tamanho?: number;
}

export const ROTULOS_MAR: RotuloMar[] = [
  { texto: 'Mar do Oeste', x: 105, y: 215, rotacao: -12, tamanho: 26 },
  { texto: 'Mar do Leste', x: 1420, y: 262, rotacao: 12, tamanho: 26 },
  { texto: 'Mar do Sul', x: 360, y: 905, rotacao: 10, tamanho: 26 },
  { texto: 'Mar Sombrio', x: 1400, y: 840, rotacao: -12, tamanho: 26 },
  { texto: 'Mar Meridional', x: 880, y: 970, rotacao: -3, tamanho: 24 },
  { texto: 'Lago Esmeralda', x: 862, y: 452, tamanho: 20 },
  { texto: 'Ilhas de Varell', x: 1385, y: 40, tamanho: 15 },
  { texto: 'Ilhas de Seraphis', x: 105, y: 625, tamanho: 15 },
  { texto: 'Ilhas do Crepúsculo', x: 1225, y: 975, tamanho: 15 },
  { texto: 'Ilhas Negras', x: 540, y: 1008, tamanho: 15 },
];

export type TipoTerreno =
  | 'pico_nevado'
  | 'montanha'
  | 'vulcao'
  | 'floresta'
  | 'colina'
  | 'arvore_morta'
  | 'capim';

export interface ZonaTerreno {
  tipo: TipoTerreno;
  reino: IdReino;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  n: number;
}

export const ZONAS_TERRENO: ZonaTerreno[] = [
  // Frosthelm
  { tipo: 'pico_nevado', reino: 'frosthelm', cx: 520, cy: 150, rx: 210, ry: 80, n: 55 },
  { tipo: 'pico_nevado', reino: 'frosthelm', cx: 660, cy: 235, rx: 120, ry: 40, n: 18 },
  { tipo: 'montanha', reino: 'frosthelm', cx: 400, cy: 235, rx: 110, ry: 40, n: 16 },
  // Sylvanor
  { tipo: 'floresta', reino: 'sylvanor', cx: 1000, cy: 190, rx: 230, ry: 120, n: 120 },
  { tipo: 'floresta', reino: 'sylvanor', cx: 900, cy: 320, rx: 110, ry: 50, n: 28 },
  { tipo: 'colina', reino: 'sylvanor', cx: 1180, cy: 330, rx: 80, ry: 35, n: 9 },
  // Aurelia
  { tipo: 'colina', reino: 'aurelia', cx: 330, cy: 470, rx: 160, ry: 110, n: 26 },
  { tipo: 'floresta', reino: 'aurelia', cx: 560, cy: 560, rx: 80, ry: 40, n: 16 },
  { tipo: 'floresta', reino: 'aurelia', cx: 260, cy: 400, rx: 60, ry: 50, n: 12 },
  { tipo: 'montanha', reino: 'aurelia', cx: 640, cy: 345, rx: 70, ry: 55, n: 14 },
  // Drakos
  { tipo: 'montanha', reino: 'drakos', cx: 1260, cy: 425, rx: 200, ry: 105, n: 50 },
  { tipo: 'vulcao', reino: 'drakos', cx: 1250, cy: 405, rx: 70, ry: 35, n: 3 },
  // Valthera
  { tipo: 'montanha', reino: 'valthera', cx: 700, cy: 640, rx: 230, ry: 55, n: 30 },
  { tipo: 'arvore_morta', reino: 'valthera', cx: 690, cy: 770, rx: 250, ry: 90, n: 70 },
  // Campos Meridionais
  { tipo: 'capim', reino: 'campos', cx: 1100, cy: 690, rx: 200, ry: 80, n: 46 },
  { tipo: 'colina', reino: 'campos', cx: 1000, cy: 740, rx: 100, ry: 35, n: 10 },
  { tipo: 'colina', reino: 'campos', cx: 1235, cy: 655, rx: 80, ry: 35, n: 8 },
];

/**
 * Rios decorativos, da nascente (primeiro ponto) à foz (último). Afinam na nascente e engrossam
 * na foz; o último ponto fica um pouco dentro da água para o encontro ficar limpo.
 */
export const RIOS_ATLAS: Ponto[][] = [
  // Frosthelm: desce das montanhas e entra no lago pelo oeste
  [{ x: 560, y: 215 }, { x: 540, y: 300 }, { x: 590, y: 360 }, { x: 650, y: 420 }, { x: 700, y: 470 }, { x: 735, y: 496 }],
  // Sylvanor: corre pela floresta até a margem norte
  [{ x: 760, y: 235 }, { x: 790, y: 320 }, { x: 772, y: 380 }, { x: 778, y: 428 }],
  // Drakos: nasce nas cordilheiras do leste e chega pela margem leste
  [{ x: 1190, y: 345 }, { x: 1130, y: 380 }, { x: 1085, y: 430 }, { x: 1040, y: 470 }, { x: 990, y: 488 }],
  // Valthera: desce das montanhas pelo sul do título e deságua no escoadouro (afluente do rio do lago)
  [{ x: 625, y: 742 }, { x: 690, y: 726 }, { x: 760, y: 720 }, { x: 830, y: 708 }, { x: 879, y: 702 }],
  // Escoadouro: sai do lago pelo sul e deságua no Mar Meridional
  [{ x: 878, y: 590 }, { x: 893, y: 655 }, { x: 872, y: 725 }, { x: 905, y: 800 }, { x: 936, y: 872 }],
];

/** Índices dos rios que saem do lago (engrossam a partir do lago, não da nascente). */
export const RIOS_ESCOADOUROS = new Set([4]);
