import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { SecaoRecolhivel } from '../common/SecaoRecolhivel';

const Passo: React.FC<{ n: number; titulo: string; children: React.ReactNode }> = ({ n, titulo, children }) => (
  <li className="flex gap-3">
    <span className="shrink-0 w-6 h-6 rounded-full border border-ouro/50 bg-amber-950/40 text-amber-300 font-cinzel text-xs font-bold flex items-center justify-center">{n}</span>
    <div className="min-w-0">
      <h5 className="font-cinzel text-xs font-bold text-pergaminho">{titulo}</h5>
      <p className="text-[11px] text-texto-2 leading-relaxed">{children}</p>
    </div>
  </li>
);

/** Passo a passo de como o Mestre usa o comércio. Começa aberto e lembra se foi recolhido. */
export const GuiaComercio: React.FC = () => (
  <SecaoRecolhivel chave="comercio-guia" icone={<HelpCircle className="w-4 h-4 text-amber-400" />} titulo="Como usar o comércio" abertaPorPadrao>
    <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Passo n={1} titulo="Crie lojas e itens">
        Em{' '}
        <Link to="/mestre/gerenciar?entidade=lojas" className="text-amber-400 underline">
          Gerenciar → Lojas
        </Link>{' '}
        escolha a cidade, a especialidade e o caixa inicial. Só marque “Faz parte de uma rede” se a loja tiver filiais: lojas da mesma rede se abastecem entre si. Os itens
        com ilustração aparecem com a imagem na prateleira.
      </Passo>
      <Passo n={2} titulo="Deixe o mundo girar">
        “Avançar 1 dia” simula o mercado: clientes compram, fornecedores entregam por caravana e as oficinas produzem sozinhas o que dá lucro. Em “Passar tempo…” você
        avança vários dias de uma vez ou escolhe “Só simular o mercado”: as lojas trabalham sem passar o dia da campanha (ótimo para aquecer o mundo antes da primeira
        sessão). Os alertas (caixa baixo, prateleira vazia, oficina parada) mostram quem precisa de você.
      </Passo>
      <Passo n={3} titulo="Venda aos jogadores">
        Na aba Estoque, “Vender a jogador” põe o item no inventário da ficha. O preço vem do balcão (sobe na escassez, cai na fartura) e você pode mudá-lo ou entregar sem
        cobrar.
      </Passo>
      <Passo n={4} titulo="Mande produzir">
        Na aba Produção estão as receitas que a loja conhece, com custo, lucro e o que falta de insumo. Você escolhe os lotes, pode fornecer os insumos por conta do Mestre e
        pode concluir na hora (para uma encomenda feita em cena).
      </Passo>
      <Passo n={5} titulo="Acompanhe o caixa">
        O Livro-caixa registra cada venda, compra e produção com o saldo depois de cada uma. É ali que se descobre por que uma loja está perdendo dinheiro.
      </Passo>
      <Passo n={6} titulo="Intervenha quando quiser">
        Em Administrar você ajusta o caixa, o nível da oficina (mais nível, mais lotes ao mesmo tempo), abastece ou retira estoque e define quanto os clientes procuram de
        cada item.
      </Passo>
    </ol>
  </SecaoRecolhivel>
);
