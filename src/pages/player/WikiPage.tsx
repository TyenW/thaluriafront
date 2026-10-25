import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { ScrollText, Lock, Unlock, BookOpen, RefreshCw } from 'lucide-react';
import { mundoService } from '../../services/mundoService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';

interface CapituloWikiItem {
  id: string;
  titulo: string;
  subtitulo: string;
  categoria: string;
  resumo: string;
  conteudo: string;
}

const TODOS_CAPITULOS: CapituloWikiItem[] = [
  {
    id: 'Status',
    titulo: 'Status & Regras Vitais',
    subtitulo: 'Atributos Primários e Fórmulas de Combate',
    categoria: 'Fundamentos',
    resumo: 'Fórmulas de HP, Sanidade, Energia, Mana, Defesa Física e Defesa Oculta.',
    conteudo: `O sistema de Thalúria RPG é construído sobre 6 Atributos Primários:
- Vigor (VIG): rege o HP máximo, vigor físico e tempo até colapso biológico.
- Força (FOR): rege o dano contundente, capacidade de carga e técnicas marciais pesadas.
- Destreza (DES): rege esquiva física, agilidade tridimensional e pontaria com projéteis.
- Mental (MEN): rege raciocínio tático, erudição e resistência a ilusões.
- Espírito (ESP): canalização da Mana elemental e ressonância etérea.
- Vontade (VON): firmeza moral, Sanidade máxima e resistência a burnout.`,
  },
  {
    id: 'Economia e Comercio',
    titulo: 'Economia & Escala de Latão',
    subtitulo: 'Moedas Canônicas e Comércio Regional',
    categoria: 'Economia',
    resumo: 'A base 10 moedas em Latão (long) e a precificação dinâmica da Regra do Camarão.',
    conteudo: `A economia de Thalúria opera sem arredondamento de ponto flutuante:
- Todas as transações usam números inteiros (long) em Latão (PL = 1).
- Tabela de paridade: 1 Édito = 1000 Talentos = 100.000.000.000 Latão.
- Estabelecimentos: Forja, Alfaiataria, Loja Geral, Alquimia, Joalheria, Taverna.
- Preços dinâmicos: oscilam entre 40% (piso) e 250% (teto) com base no balanço regional de Oferta e Demanda.`,
  },
  {
    id: 'Grafiturgia Elemental',
    titulo: 'Grafiturgia Elemental (01 a 06)',
    subtitulo: 'Teoria de Grafos Arcanos e Conjuração',
    categoria: 'Magia',
    resumo: 'Construção geométrica de feitiços através de nós elementais, pontes e colapso de grafo.',
    conteudo: `A magia em Thalúria é baseada em Grafos Arcanos:
- Nós: Elementos primários e fontes de energia mágica.
- Arestas: Pontes de fluxo místico que determinam alcance, potência e custo em Mana.
- Limite Mental: Forçar feitiços sem Mana queima Sanidade direta na razão configurada pela raça do conjurador.`,
  },
  {
    id: 'Raças por Reino',
    titulo: 'Compêndio de Raças por Reino',
    subtitulo: 'As 11 Espécies Canônicas e Modificadores',
    categoria: 'Espécies',
    resumo: 'Intervalos de criação, modificador estrutural e modificador metabólico de cada espécie.',
    conteudo: `As espécies distribuem-se pelos 5 Reinos:
- Frosthelm: Anões e Genasi do Gelo/Água.
- Sylvanor: Elfos da Floresta e Fadas (Pixies).
- Aurelia: Homens-Lagarto e Kobolds.
- Drakos: Draconatos e Genasi do Fogo.
- Valthera: Drow (Elfos Negros) e Shadar-kai.
- Terras Centrais: Humanos (versatilidade canônica).`,
  },
  {
    id: 'Bestiario Regional',
    titulo: 'Bestiário & Sistema de Doma Pokémon',
    subtitulo: 'Monstros, Movesets e Bestas de Carga',
    categoria: 'Exploração',
    resumo: 'Captura de feras, learnsets de 4 ataques ativos e inventário colossal.',
    conteudo: `O ecossistema de monstros de Thalúria integra combate e transporte:
- Cada espécie possui 4 golpes ativos (físico, especial ou status tático).
- Monstros domesticados (domesticavel = true) podem combater ao lado do mestre ou servir como Besta de Carga.
- Bestas de carga de porte COLOSSAL suportam itens pesados de mais de 25 slots na sela de viagem.`,
  },
];

export const WikiPage: React.FC = () => {
  const { usuario } = useAuth();
  const [capitulosLiberados, setCapitulosLiberados] = useState<string[]>([]);
  const [capituloSelecionado, setCapituloSelecionado] = useState<CapituloWikiItem>(TODOS_CAPITULOS[0]);
  const [loading, setLoading] = useState(true);

  const carregarWiki = async () => {
    setLoading(true);
    try {
      const data = await mundoService.obterConteudoVisivel(usuario?.papel || 'JOGADOR');
      setCapitulosLiberados(data.capitulosWiki || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarWiki();
  }, [usuario]);

  const isLiberado = (id: string) => {
    if (usuario?.papel === 'MESTRE') return true;
    return capitulosLiberados.includes(id);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-linha pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-pergaminho flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-amber-400" />
            <span>Documentação & Wiki de Thalúria</span>
          </h1>
          <p className="text-xs text-nevoa font-sans-clean mt-1">
            Conhecimento do mundo desbloqueado progressivamente pelo Mestre durante a campanha.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={carregarWiki} loading={loading} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Atualizar Grimório
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lista de Capítulos Lateral */}
        <div className="lg:col-span-4 space-y-2.5">
          <h3 className="text-xs font-cinzel font-bold text-amber-500/80 uppercase tracking-widest px-1">
            Capítulos do Compêndio
          </h3>
          {TODOS_CAPITULOS.map((cap) => {
            const liberado = isLiberado(cap.id);
            const selecionado = capituloSelecionado.id === cap.id;

            return (
              <button
                key={cap.id}
                onClick={() => setCapituloSelecionado(cap)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  selecionado
                    ? 'bg-ouro/15 border-ouro/60 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                    : 'bg-painel border-linha hover:border-linha-forte hover:bg-painel-alto'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded font-cinzel">
                      {cap.categoria}
                    </span>
                    {liberado ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-cinzel">
                        <Unlock className="w-3 h-3" /> Liberado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-red-400 font-cinzel">
                        <Lock className="w-3 h-3" /> Selado
                      </span>
                    )}
                  </div>
                  <h4 className={`text-sm font-cinzel font-bold ${selecionado ? 'text-pergaminho' : 'text-texto-2'}`}>
                    {cap.titulo}
                  </h4>
                  <p className="text-xs text-nevoa font-sans-clean line-clamp-1 mt-0.5">
                    {cap.subtitulo}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Leitor do Capítulo Selecionado */}
        <div className="lg:col-span-8">
          <Card variant="grimorio" className="p-6 sm:p-8 min-h-[450px]">
            {isLiberado(capituloSelecionado.id) ? (
              <div className="space-y-6">
                <div className="border-b border-linha pb-4">
                  <div className="flex items-center gap-2 text-xs text-amber-500 font-cinzel mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{capituloSelecionado.categoria}</span>
                  </div>
                  <h2 className="text-2xl font-cinzel font-bold gold-gradient-text">
                    {capituloSelecionado.titulo}
                  </h2>
                  <p className="text-sm text-nevoa font-sans-clean mt-1">
                    {capituloSelecionado.subtitulo}
                  </p>
                </div>

                <div className="p-4 bg-amber-950/20 border border-amber-600/20 rounded-lg text-xs font-cinzel text-amber-200/90 leading-relaxed">
                  {capituloSelecionado.resumo}
                </div>

                <div className="prose prose-invert max-w-none text-sm font-sans-clean text-texto-2 leading-relaxed whitespace-pre-line">
                  {capituloSelecionado.conteudo}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-600/40 flex items-center justify-center mb-4 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-cinzel font-bold text-red-300 mb-2">
                  Capítulo Selado pelo Mestre
                </h3>
                <p className="text-xs text-nevoa font-sans-clean max-w-md mx-auto mb-4">
                  O conteúdo de <strong>"{capituloSelecionado.titulo}"</strong> ainda não foi descoberto ou revelado na campanha atual.
                </p>
                <div className="text-[11px] font-cinzel text-amber-500/80 px-3 py-1 bg-amber-950/30 border border-amber-600/30 rounded">
                  Status: Bloqueado via Fog-of-War (/api/conteudo/visivel)
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
