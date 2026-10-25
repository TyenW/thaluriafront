export interface MonstroDomadoResumo {
  idDomado: number;
  apelido: string;
  especie: string;
  bestaDeCarga: boolean;
  golpesAtivos: string[];
}

export interface FichaPersonagem {
  id: number;
  nome: string;
  raca: string;
  vig: number;
  forca: number;
  des: number;
  men: number;
  esp: number;
  von: number;
  hpAtual: number;
  hpMax: number;
  sanAtual: number;
  sanMax: number;
  energiaAtual: number;
  energiaMax: number;
  manaAtual: number;
  manaMax: number;
  defFisica: number;
  defOculta: number;
  carteiraLatao?: number;
  cidadeAtual?: string;
  domados?: MonstroDomadoResumo[];
}

export interface SessaoCriacaoAtiva {
  usuarioId: number;
  personagem: string;
  etapa: string;
  opcoes: string;
  racaEscolhida: string;
  dicaMestre?: string;
  aprovada: boolean;
}
