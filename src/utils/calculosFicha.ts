import type { FichaPersonagem, PericiaFicha } from '../types/ficha';

/** Grau = ⌊Valor / 10⌋ (mesma regra de Atributo.grauDe no back-end). */
export const grauDe = (valor: number) => Math.floor(Math.max(0, valor) / 10);

export interface PatamarInfo {
  minimo: number;
  titulo: string;
  desc: string;
}

/** Patamares de Ascensão por Potencial de Alma (PA), do maior para o menor. */
export const PATAMARES: PatamarInfo[] = [
  { minimo: 10001, titulo: 'Transcendente', desc: 'Anomalia Viva' },
  { minimo: 10000, titulo: 'Ápice', desc: 'O Ser Perfeito' },
  { minimo: 7500, titulo: 'Supremo', desc: 'Divindade Terrena' },
  { minimo: 5000, titulo: 'Ascendente', desc: 'Abaixo do Céu' },
  { minimo: 2800, titulo: 'Grão-mestre', desc: 'Pilar do Mundo' },
  { minimo: 1400, titulo: 'Mestre', desc: 'Campeão Regional' },
  { minimo: 600, titulo: 'Especialista', desc: 'Mestre de Ofício' },
  { minimo: 200, titulo: 'Adepto', desc: 'Combatente Calejado' },
  { minimo: 50, titulo: 'Desperto', desc: 'Vanguarda Novata' },
  { minimo: 0, titulo: 'Mortal', desc: 'Desperto / Civil' },
];

export const patamarPorPA = (pa: number): PatamarInfo =>
  PATAMARES.find((p) => pa >= p.minimo) ?? PATAMARES[PATAMARES.length - 1];

export interface DerivadosFicha {
  graus: Record<'VIG' | 'FOR' | 'DES' | 'MEN' | 'ESP' | 'VON', number>;
  pa: number;
  nr: number;
  ordem: number;
  patamar: string;
  turnosMorte: number;
  manaRegen: number;
  cargaMaxKg: number;
}

/**
 * Valores derivados exibidos na ficha. Usa o valor do servidor quando ele vier
 * preenchido e, na falta, a Equação Unificada de Poder já usada pela interface.
 */
export function calcularDerivados(ficha: FichaPersonagem): DerivadosFicha {
  const { vig, forca, des, men, esp, von } = ficha;

  const somaQuadrados = (forca ** 2 + des ** 2 + esp ** 2 + men ** 2) / 2.5;
  const produtoCruzado = (vig + von) * (des + men);
  const maior = Math.max(forca, des, esp, men, vig, von);
  const menor = Math.min(forca, des, esp, men, vig, von);
  const fatorEstabilidade = maior >= 101 ? 1.0 : 1.0 - (maior - menor) / 100.0;
  const paCalculado = Math.max(0, ((somaQuadrados + produtoCruzado) * fatorEstabilidade) / 5.6);

  const pa = ficha.poderAtaque ?? Number(paCalculado.toFixed(1));
  const nr = ficha.nivelRessonancia ?? Math.floor(Math.sqrt(pa));
  const grauVig = grauDe(vig);

  return {
    graus: {
      VIG: grauVig,
      FOR: grauDe(forca),
      DES: grauDe(des),
      MEN: grauDe(men),
      ESP: grauDe(esp),
      VON: grauDe(von),
    },
    pa,
    nr,
    ordem: ficha.ordem ?? Math.floor(nr / 10),
    patamar: ficha.patamar || patamarPorPA(pa).titulo,
    turnosMorte: ficha.turnosMorte ?? (ficha.raca === 'Anões' ? 5 + grauVig : 3 + Math.floor(grauVig / 2)),
    manaRegen: ficha.manaRegen ?? 2 + Math.floor((esp + von) / 10),
    cargaMaxKg: forca * 5,
  };
}

/** As 15 perícias canônicas de Thalúria (usadas quando a ficha ainda não tem perícias salvas). */
export const PERICIAS_PADRAO: { pericia: string; nome: string; atributoBase: string; descricao: string }[] = [
  { pericia: 'ATLETISMO', nome: 'Atletismo', atributoBase: 'FOR', descricao: 'Corrida, escalada, salto, nado e testes de esforço físico muscular' },
  { pericia: 'INTIMIDACAO_FISICA', nome: 'Intimidação Física', atributoBase: 'FOR', descricao: 'Coerção pela presença física, força bruta e imposição corporal' },
  { pericia: 'FURTIVIDADE', nome: 'Furtividade', atributoBase: 'DES', descricao: 'Mover-se sem ser detectado, camuflagem e passos silenciosos' },
  { pericia: 'ACROBACIA', nome: 'Acrobacia', atributoBase: 'DES', descricao: 'Equilíbrio, esquivas acrobáticas, manobras e amortecimento de quedas' },
  { pericia: 'PRESTIDIGITACAO', nome: 'Prestidigitação', atributoBase: 'DES', descricao: 'Arrombamento de fechaduras, mãos leves, roubo e desarmar armadilhas' },
  { pericia: 'PONTARIA_LUTA', nome: 'Pontaria / Luta', atributoBase: 'DES', descricao: 'Precisão em ataques corporais finos e disparos de projéteis' },
  { pericia: 'SOBREVIVENCIA_BRUTA', nome: 'Sobrevivência Bruta', atributoBase: 'VIG', descricao: 'Resistência a fome, sede, toxinas, intempéries e climas extremos' },
  { pericia: 'ENGANACAO', nome: 'Enganação', atributoBase: 'MEN', descricao: 'Mentiras, disfarces, blefes e manipulação de informações' },
  { pericia: 'PERSUASAO_DIPLOMACIA', nome: 'Persuasão / Diplomacia', atributoBase: 'MEN', descricao: 'Negociação, diplomacia, retórica e convencer pela lógica' },
  { pericia: 'INVESTIGACAO', nome: 'Investigação', atributoBase: 'MEN', descricao: 'Dedução lógica, busca por pistas, documentos e engenhocas' },
  { pericia: 'MEDICINA_ALQUIMIA', nome: 'Medicina / Alquimia', atributoBase: 'MEN', descricao: 'Tratamento de feridas, diagnóstico de doenças e identificação de poções' },
  { pericia: 'INTIMIDACAO_PSICOLOGICA', nome: 'Intimidação Psicológica', atributoBase: 'VON', descricao: 'Pressão de aura, olhar penetrante e imposição da força de espírito' },
  { pericia: 'INTUICAO_EMPATIA', nome: 'Intuição / Empatia', atributoBase: 'VON', descricao: 'Percepção de mentiras, leitura de intenções e sensibilidade emocional' },
  { pericia: 'OCULTISMO_ARCANISMO', nome: 'Ocultismo / Arcanismo', atributoBase: 'ESP', descricao: 'Identificação de magias, leitura de IA/grafos, rituais e contra-mágica' },
  { pericia: 'ADESTRAMENTO', nome: 'Adestramento', atributoBase: 'ESP', descricao: 'Comunicação com feras, domesticação e comando de criaturas' },
];

/**
 * Perícias da ficha. O servidor sempre devolve as 15 canônicas mescladas às salvas;
 * a lista padrão (grau 0, como no servidor) só cobre respostas sem o campo.
 */
export function listarPericias(ficha: FichaPersonagem): PericiaFicha[] {
  if (ficha.pericias && ficha.pericias.length > 0) return ficha.pericias;
  return PERICIAS_PADRAO.map((p) => ({ ...p, grau: 0, maestria: 0, personalizada: false }));
}

/** Regra de mesa: Grau 0 = 2d20 (pior) + 0; Grau ≥ 1 = (Grau)d20 (melhor) + Maestria × 5. */
export const dadoDePericia = (grau: number, maestria: number) =>
  grau <= 0 ? '2d20 (pior) + 0' : `${grau}d20 (melhor) + ${maestria * 5}`;

export const ATRIBUTOS_INFO = [
  { chave: 'vig', sigla: 'VIG', nome: 'Vigor', pilar: 'fisico', desc: 'Sustentação vital de HP, imunidade e energia biológica.' },
  { chave: 'forca', sigla: 'FOR', nome: 'Força', pilar: 'fisico', desc: 'Poder de tração, impacto de golpes e capacidade de carga.' },
  { chave: 'des', sigla: 'DES', nome: 'Destreza', pilar: 'fisico', desc: 'Cinética, velocidade reflexiva, esquiva e ataques finos.' },
  { chave: 'men', sigla: 'MEN', nome: 'Mental', pilar: 'etereo', desc: 'Processamento lógico, arcanismo teórico e dedução investigativa.' },
  { chave: 'esp', sigla: 'ESP', nome: 'Espírito', pilar: 'etereo', desc: 'Condutividade de mana, canalização arcana e conexão com feras.' },
  { chave: 'von', sigla: 'VON', nome: 'Vontade', pilar: 'etereo', desc: 'Escudo da alma contra loucura, autoridade psíquica e sanidade.' },
] as const;

export type ChaveAtributo = (typeof ATRIBUTOS_INFO)[number]['chave'];
