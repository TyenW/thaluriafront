export interface HabilidadeInataData {
  nome: string;
  tipoAcao: string;
  custoEnergia: number;
  custoMana: number;
  alcanceMetros: number;
  dadoBase?: string;
  descricao: string;
}

export interface ModificadorRacialData {
  titulo: string;
  formula: string;
  descricao: string;
}

export interface RacaInfo {
  id: string;
  nome: string;
  reinoOrigem: string;
  raridade: 'COMUM' | 'INCOMUM' | 'RARA' | 'ANCESTRAL_MITICA';
  descricao: string;
  limitesAtributos: {
    VIG: [number, number];
    FOR: [number, number];
    DES: [number, number];
    MEN: [number, number];
    ESP: [number, number];
    VON: [number, number];
  };
  modEstrutural: ModificadorRacialData;
  modMetabolico: ModificadorRacialData;
  habilidadeInata: HabilidadeInataData;
}

export const TODAS_AS_RACAS: Record<string, RacaInfo> = {
  'Humano': {
    id: 'Humano',
    nome: 'Humano',
    reinoOrigem: 'Terras Centrais',
    raridade: 'COMUM',
    descricao: 'Versatilidade canônica e adaptabilidade única no continente de Thalúria.',
    limitesAtributos: {
      VIG: [3, 8],
      FOR: [3, 8],
      DES: [3, 8],
      MEN: [3, 8],
      ESP: [3, 8],
      VON: [3, 8],
    },
    modEstrutural: {
      titulo: 'Equilíbrio Mortal Padrão',
      formula: 'Fórmulas Canônicas Padrão de Vitalidade e Defesa',
      descricao: 'O Humano não possui penalidades biológicas, mantendo fórmulas de vitalidade balanceadas entre a matéria e o etéreo.',
    },
    modMetabolico: {
      titulo: 'Homeostase Versátil',
      formula: 'Taxa Padrão (1 Energia = 2 Mana / Descanso Regular)',
      descricao: 'Metabolismo equilibrado sem exigências nutricionais extremas ou queimas forçadas de sanidade.',
    },
    habilidadeInata: {
      nome: 'Determinação Humana (Golpe Oportunista)',
      tipoAcao: 'Ataque Corporal',
      custoEnergia: 1,
      custoMana: 0,
      alcanceMetros: 1.5,
      dadoBase: '1d4',
      descricao: 'Golpe adaptável e versátil em combate corpo a corpo somando FOR e DES.',
    },
  },

  'Anões': {
    id: 'Anões',
    nome: 'Anões',
    reinoOrigem: 'Frosthelm',
    raridade: 'COMUM',
    descricao: 'Filhos da pedra e da montanha, mestres da forja pesada e da resistência física.',
    limitesAtributos: {
      VIG: [5, 11],
      FOR: [5, 10],
      DES: [2, 6],
      MEN: [3, 7],
      ESP: [1, 5],
      VON: [4, 9],
    },
    modEstrutural: {
      titulo: 'Carapaça de Rocha e Aço',
      formula: 'Defesa Física = 8 + DES + (FOR ÷ 2)',
      descricao: 'A densidade óssea dos Anões absorve impactos pesados, convertendo musculatura bruta em escudo corpóreo.',
    },
    modMetabolico: {
      titulo: 'Tenacidade Inabalável na Agonia',
      formula: 'Turnos de Morte = 5 + VIG turnos',
      descricao: 'Ao cair a 0 de HP, o Anão resiste ao colapso por muito mais tempo antes da morte biológica.',
    },
    habilidadeInata: {
      nome: 'Impacto Sísmico (Quebra-Rocha)',
      tipoAcao: 'Ataque Corporal',
      custoEnergia: 2,
      custoMana: 0,
      alcanceMetros: 1.5,
      dadoBase: '1d4',
      descricao: 'Golpe de esmagamento com onda de choque que derruba oponentes no chão (Caído).',
    },
  },

  'Genasi do Gelo e Água': {
    id: 'Genasi do Gelo e Água',
    nome: 'Genasi do Gelo e Água',
    reinoOrigem: 'Frosthelm',
    raridade: 'INCOMUM',
    descricao: 'Seres de ressonância elemental glacial pura com alta condutividade mística.',
    limitesAtributos: {
      VIG: [3, 7],
      FOR: [2, 6],
      DES: [4, 9],
      MEN: [3, 8],
      ESP: [5, 11],
      VON: [3, 8],
    },
    modEstrutural: {
      titulo: 'Vaso Glacial Cristalino',
      formula: 'Mana Máxima = 15 + (ESP × 3) + VON + VIG',
      descricao: 'Reserva arcana expandida pelas veias criogênicas que canalizam a energia mística.',
    },
    modMetabolico: {
      titulo: 'Fusão Criogênica Eficiente',
      formula: 'Conversão: 1 Energia = 4 Mana',
      descricao: 'Dobro de eficiência ao queimar reservas biológicas para manter canalizações ativas.',
    },
    habilidadeInata: {
      nome: 'Estilhaço Criogênico (Lança Glacial)',
      tipoAcao: 'Disparo / Projétil',
      custoEnergia: 1,
      custoMana: 3,
      alcanceMetros: 8.0,
      dadoBase: '1d8',
      descricao: 'Lança pontiaguda de gelo que perfura à distância, impondo -2 na Defesa Física e -50% de mobilidade ao alvo.',
    },
  },

  'Elfos da Floresta': {
    id: 'Elfos da Floresta',
    nome: 'Elfos da Floresta',
    reinoOrigem: 'Sylvanor',
    raridade: 'COMUM',
    descricao: 'Guardiões ágeis das copas antigas, com sintonia biológica perfeita com a natureza.',
    limitesAtributos: {
      VIG: [3, 7],
      FOR: [2, 6],
      DES: [5, 11],
      MEN: [4, 9],
      ESP: [3, 8],
      VON: [3, 7],
    },
    modEstrutural: {
      titulo: 'Cinética Silvestre Imparável',
      formula: 'Energia Máxima = 15 + (VIG × 2) + DES + MEN',
      descricao: 'Vigor aeróbico excepcional permitindo corridas prolongadas e manobras acrobáticas.',
    },
    modMetabolico: {
      titulo: 'Revitalização Arbórea',
      formula: 'Recuperação de Energia em Descanso = 10 + (VIG × 3)',
      descricao: 'Descansos breves sob vegetação restauram completamente o estresse muscular.',
    },
    habilidadeInata: {
      nome: 'Disparo do Zéfiro (Flecha Guiada)',
      tipoAcao: 'Disparo / Projétil',
      custoEnergia: 2,
      custoMana: 0,
      alcanceMetros: 25.0,
      dadoBase: 'Arma',
      descricao: 'Disparo guiado por ventos que concede +1d20 no teste de acerto e não quebra furtividade.',
    },
  },

  'Fadas': {
    id: 'Fadas',
    nome: 'Fadas',
    reinoOrigem: 'Sylvanor',
    raridade: 'RARA',
    descricao: 'Pequenos seres etéreos luminosos com agilidade acrobática sobrenatural e asas translúcidas.',
    limitesAtributos: {
      VIG: [1, 4],
      FOR: [1, 3],
      DES: [5, 10],
      MEN: [4, 9],
      ESP: [6, 12],
      VON: [3, 8],
    },
    modEstrutural: {
      titulo: 'Evasão Espectral Feérica',
      formula: 'Defesa Física = 8 + (DES × 2) + (MEN ÷ 2)',
      descricao: 'Voo veloz e silhueta diminuta tornam golpes físicos quase impossíveis de acertar.',
    },
    modMetabolico: {
      titulo: 'Lucidez Feérica Antiloucura',
      formula: 'Multiplicador de Burnout = 1x (Mínimo)',
      descricao: 'A mente feérica resiste a estresse místico sem sofrer colapsos acelerados de sanidade.',
    },
    habilidadeInata: {
      nome: 'Poeira Feérica Cintilante',
      tipoAcao: 'Explosão Mágica',
      custoEnergia: 0,
      custoMana: 3,
      alcanceMetros: 4.0,
      dadoBase: '1d6',
      descricao: 'Nuvem mágica de pólen estelar que cega e desorienta alvos (-3 em testes por 1 rodada).',
    },
  },

  'Homens-Lagarto': {
    id: 'Homens-Lagarto',
    nome: 'Homens-Lagarto',
    reinoOrigem: 'Aurelia',
    raridade: 'COMUM',
    descricao: 'Predadores reptilianos implacáveis com biologia adaptada aos pântanos e escamas rígidas.',
    limitesAtributos: {
      VIG: [5, 11],
      FOR: [5, 10],
      DES: [3, 7],
      MEN: [1, 5],
      ESP: [1, 5],
      VON: [4, 9],
    },
    modEstrutural: {
      titulo: 'Vitalidade Primitiva Escamada',
      formula: 'HP Máximo = 25 + (VIG × 4) + FOR + VON',
      descricao: 'Couraça dérmica grossa e musculatura reptiliana fornecem a maior reserva de vida de Thalúria.',
    },
    modMetabolico: {
      titulo: 'Firmeza dos Sangue-Frio',
      formula: 'Turnos de Morte = 4 + (VIG ÷ 2) + (VON ÷ 2) turnos',
      descricao: 'O metabolismo reduzido diminui a perda de sangue em hemorragias agudas.',
    },
    habilidadeInata: {
      nome: 'Bote da Mandíbula Voraz',
      tipoAcao: 'Ataque Corporal',
      custoEnergia: 3,
      custoMana: 0,
      alcanceMetros: 1.5,
      dadoBase: '1d6',
      descricao: 'Mordida brutal que agarra a presa e recupera 5 + Grau_VIG de Energia do predador.',
    },
  },

  'Kobolds': {
    id: 'Kobolds',
    nome: 'Kobolds',
    reinoOrigem: 'Aurelia',
    raridade: 'COMUM',
    descricao: 'Engenhosos e ardilosos habitantes dos túneis e ruínas sob o deserto de Aurelia.',
    limitesAtributos: {
      VIG: [2, 6],
      FOR: [1, 5],
      DES: [5, 11],
      MEN: [4, 10],
      ESP: [2, 6],
      VON: [1, 5],
    },
    modEstrutural: {
      titulo: 'Esquiva Rasteira Rápida',
      formula: 'Defesa Física = 5 + DES + MEN',
      descricao: 'Estatura baixa e previsão tática garantem agilidade instintiva para desviar de golpes.',
    },
    modMetabolico: {
      titulo: 'Digestão e Sono Rústico',
      formula: 'Descanso em Conforto Péssimo opera a 75% e Precário a 100%',
      descricao: 'Capaz de descansar e recuperar vigor mesmo nas piores masmorras e covis úmidos.',
    },
    habilidadeInata: {
      nome: 'Golpe Sujo e Frasco de Cal',
      tipoAcao: 'Golpe Tático / Evasivo',
      custoEnergia: 2,
      custoMana: 0,
      alcanceMetros: 3.0,
      dadoBase: '1d4',
      descricao: 'Arremesso de cal que cega oponente por 1 rodada e permite fuga sem ataque de oportunidade.',
    },
  },

  'Draconatos': {
    id: 'Draconatos',
    nome: 'Draconatos',
    reinoOrigem: 'Drakos',
    raridade: 'ANCESTRAL_MITICA',
    descricao: 'Nobreza draconiana lendária portadora do sangue dos Titãs Primordiais de Thalúria.',
    limitesAtributos: {
      VIG: [5, 11],
      FOR: [5, 11],
      DES: [2, 6],
      MEN: [2, 7],
      ESP: [3, 8],
      VON: [4, 9],
    },
    modEstrutural: {
      titulo: 'HP Titânico Draconiano',
      formula: 'HP Máximo = 25 + (VIG × 3) + (FOR × 2) + VON',
      descricao: 'Estrutura corporal maciça com escamas reforçadas por energia dracônica latente.',
    },
    modMetabolico: {
      titulo: 'Resistência Muscular Primordial',
      formula: 'Divisor de Custo Faltante em Técnicas = 2 (Metade do Dano)',
      descricao: 'Ao forçar golpes além do limite de energia, seu corpo absorve o desgaste com muito menor risco.',
    },
    habilidadeInata: {
      nome: 'Sopro Primordial Draconiano',
      tipoAcao: 'Sopro Elemental em Área',
      custoEnergia: 3,
      custoMana: 3,
      alcanceMetros: 4.0,
      dadoBase: '2d6',
      descricao: 'Cone elemental destruidor (1d8 afinidade) infligindo dano massivo em cone e efeitos táticos.',
    },
  },

  'Genasi do Fogo': {
    id: 'Genasi do Fogo',
    nome: 'Genasi do Fogo',
    reinoOrigem: 'Drakos',
    raridade: 'INCOMUM',
    descricao: 'Descendentes das chamas vivas dos vulcões de Drakos, ardentes e implacáveis.',
    limitesAtributos: {
      VIG: [3, 7],
      FOR: [2, 6],
      DES: [4, 9],
      MEN: [3, 8],
      ESP: [5, 11],
      VON: [4, 9],
    },
    modEstrutural: {
      titulo: 'Chama Interior Mágica',
      formula: 'Mana Máxima = 10 + (ESP × 2) + (VON × 2) + VIG',
      descricao: 'Energia térmica interna alimenta canais arcanos de alta combustão.',
    },
    modMetabolico: {
      titulo: 'Combustão Espontânea de Mana',
      formula: 'Regeneração Contínua: +2 Mana Base + (MEN+ESP)/4 por Turno',
      descricao: 'O calor biológico recarrega a energia mágica constantemente mesmo em meio ao combate.',
    },
    habilidadeInata: {
      nome: 'Pulso de Brasas e Onda de Calor',
      tipoAcao: 'Explosão Mágica',
      custoEnergia: 1,
      custoMana: 3,
      alcanceMetros: 6.0,
      dadoBase: '1d8',
      descricao: 'Rajada de calor que empurra alvos 2m para trás e consome 2 de Energia do oponente.',
    },
  },

  'Drow': {
    id: 'Drow',
    nome: 'Drow',
    reinoOrigem: 'Valthera',
    raridade: 'INCOMUM',
    descricao: 'Elfos subterrâneos de Valthera forjados na escuridão eterna, astutos e letais.',
    limitesAtributos: {
      VIG: [2, 6],
      FOR: [2, 6],
      DES: [5, 11],
      MEN: [4, 10],
      ESP: [3, 8],
      VON: [4, 9],
    },
    modEstrutural: {
      titulo: 'Escudo Mental das Sombras',
      formula: 'Defesa Oculta = 8 + VON + (MEN ÷ 2)',
      descricao: 'Mente treinada contra intrigas e magia psíquica do submundo abissal.',
    },
    modMetabolico: {
      titulo: 'Comunhão no Escuro',
      formula: 'Sanidade recuperada em apenas 2 horas de descanso = SAN_MAX / 10',
      descricao: 'A mente drow se recupera do trauma psicológico com facilidade na escuridão.',
    },
    habilidadeInata: {
      nome: 'Lâmina do Veneno das Sombras',
      tipoAcao: 'Ataque Corporal',
      custoEnergia: 2,
      custoMana: 0,
      alcanceMetros: 6.0,
      dadoBase: 'Arma',
      descricao: 'Golpe furtivo com toxina paralisante impondo -3 Defesa Física e perda de Energia ao alvo.',
    },
  },

  'Shadar-kai': {
    id: 'Shadar-kai',
    nome: 'Shadar-kai',
    reinoOrigem: 'Valthera',
    raridade: 'ANCESTRAL_MITICA',
    descricao: 'Nômades sombrios do plano das sombras tocados pelo silêncio da Rainha dos Corvos.',
    limitesAtributos: {
      VIG: [3, 8],
      FOR: [2, 6],
      DES: [4, 9],
      MEN: [3, 7],
      ESP: [4, 9],
      VON: [5, 11],
    },
    modEstrutural: {
      titulo: 'Espírito Inextinguível do Vazio',
      formula: 'Sanidade Máxima = 25 + (VON × 4) + MEN + VIG',
      descricao: 'A alma shadar-kai sobrevive a horrores sobrenaturais sem entrar em loucura.',
    },
    modMetabolico: {
      titulo: 'Lucidez no Limiar da Alma',
      formula: 'Rodadas Lúcidas a 0 de SAN = +1 Rodada Completa de Ação',
      descricao: 'Mesmo ao ter a mente despedaçada, o Shadar-kai consegue desferir um último golpe com precisão fria.',
    },
    habilidadeInata: {
      nome: 'Ceifa Espectral do Vazio (Lâmina da Alma)',
      tipoAcao: 'Ataque Corporal',
      custoEnergia: 1,
      custoMana: 2,
      alcanceMetros: 3.0,
      dadoBase: 'Arma',
      descricao: 'Golpe necrótico pelas sombras que rouba vitalidade, curando HP do usuário.',
    },
  },
};

export const obterInfoRaca = (racaNome?: string): RacaInfo => {
  if (!racaNome) return TODAS_AS_RACAS['Humano'];
  const racaLimpa = racaNome.trim();
  // Busca exata ou por aproximação
  for (const [chave, info] of Object.entries(TODAS_AS_RACAS)) {
    if (chave.toLowerCase() === racaLimpa.toLowerCase() || info.nome.toLowerCase() === racaLimpa.toLowerCase()) {
      return info;
    }
  }
  return TODAS_AS_RACAS['Humano'];
};
