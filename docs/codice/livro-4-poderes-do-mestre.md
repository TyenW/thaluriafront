# Livro IV — Dos Poderes do Mestre

> *Onde se registram as prerrogativas do Mestre da Mesa: vigiar forjas, erguer e desfazer névoas, governar contas, criar criaturas com seus retratos e entregar tesouros aos aventureiros.*

[← Livro III](livro-3-caminho-do-aventureiro.md) · [Pórtico](../../README.md) · [Livro V →](livro-5-artes-visuais.md)

---

## Capítulo I — Da Câmara de Controle (`/mestre`)

### § 1. Do dia de campanha

O botão de avançar o dia move o calendário do mercado. Preços e estoques das lojas seguem o dia.

### § 2. Das fichas da campanha

Todas as fichas de todos os jogadores, com busca por nome ou raça. Em cada cartão:

| Botão | Efeito |
| :--- | :--- |
| **Inspecionar & Editar** | Abre a ficha com todos os poderes |
| 🎁 **Conceder itens** | Abre a ficha direto na aba Inventário |
| 🗑️ | Exclui a ficha, após confirmação |

---

## Capítulo II — Das Sessões ao Vivo (`/mestre/sessoes`)

### § 1. Da vigia

A lista se renova a cada 2,5 segundos e mostra cada jogador que está forjando personagem, em que etapa está e o que sorteou.

### § 2. Das intervenções

| Intervenção | Efeito |
| :--- | :--- |
| **Dica** | Envia um recado que aparece na tela do jogador |
| **Reroll** | Concede nova rolagem de atributos |
| **Impulso Dracônico** | Libera a raça Draconato |
| **Aprovar** | Autoriza a consagração da ficha |

---

## Capítulo III — Da Névoa de Guerra (`/mestre/mundo`)

### § 1. Da aba Mapa
Escolha, cidade por cidade, o que os jogadores enxergam: **Oculto**, **Só nome e rota** ou **Revelado**. Na página **Mapa**, o botão *Ver atlas completo* mostra o continente sem névoa, só para o Mestre.

### § 2. Da aba Wiki
Libere capítulos da Wiki um a um.

### § 3. Da aba Bestiário
Revele espécies. Ao revelar, o jogador passa a ver a ilustração, a lenda e os golpes.

---

## Capítulo IV — Das Contas da Mesa (`/mestre/jogadores`)

### § 1. Do cadastro
Crie contas, defina papel (Jogador ou Mestre) e senha. Deixar a senha vazia ao editar mantém a atual.

### § 2. Do limite de fichas
Os botões − e + ajustam na hora quantas fichas cada conta pode ter. No celular a tabela vira uma lista de cartões, com os mesmos botões.

---

## Capítulo V — Da Concessão de Itens

> *Este é o capítulo que o Mestre mais pediu: de como entregar a espada ao herói.*

### § 1. Do caminho

1. Vá ao **Painel** e toque no 🎁 da ficha, **ou** abra a ficha e escolha a aba **Inventário**.
2. Na faixa dourada *Mestre*, toque em **Conceder item**.
3. Busque no catálogo por nome, tipo ou raridade e toque no item.
4. Ajuste a quantidade (1 a 99.999) e toque em **Conceder**.

O modal continua aberto depois de cada entrega, para que se distribua um saque inteiro de uma vez. Toque em **Concluir** ao terminar.

### § 2. Dos ajustes depois da entrega

Cada item do inventário ganha, só para o Mestre:

| Botão | Efeito |
| :--- | :--- |
| **−** | Retira uma unidade (a pilha some ao chegar a zero) |
| **+** | Concede mais uma unidade |
| **Retirar tudo** | Remove a pilha inteira, após confirmação |

### § 3. Das regras guardadas pelo Motor

- Só se concede o que existe no **catálogo de itens** (Gerenciar → Itens).
- Entregar um item que o herói já tem **soma** à pilha existente.
- Uma pilha não passa de 99.999 unidades.
- Um item que esteja em algum inventário não pode ser apagado do catálogo; o Motor recusa e diz onde ele está.

### § 4. Das rotas por trás do botão

| Rota | Parâmetros |
| :--- | :--- |
| `POST /api/fichas/inventario/conceder` | `fichaId`, `itemId`, `quantidade` |
| `POST /api/fichas/inventario/retirar` | `fichaId`, `itemId`, `quantidade` (vazia = tudo) |

Ambas devolvem `{ "inventario": [...] }` já atualizado.

---

## Capítulo VI — Do Gerenciamento do Mundo (`/mestre/gerenciar`)

### § 1. Das seis entidades

| Aba | O que se cria | Filhos editados dentro |
| :--- | :--- | :--- |
| Itens | Catálogo de itens, com ilustração | — |
| Receitas | Manufatura | Insumos |
| Monstros | Espécies do bestiário, com ilustração e lenda | Golpes e Drops |
| Cidades | Assentamentos e posição no mapa | — |
| Rotas | Estradas e rotas marítimas | — |
| Lojas | Estabelecimentos | Estoque |

### § 2. Da lista

No computador, uma tabela com miniatura da ilustração. No celular, cartões: toque no nome para editar. A busca procura no nome e em todas as colunas visíveis.

### § 3. Do formulário em seções

O formulário é montado pelo esquema que o Motor envia (`/api/admin/esquema`). Cada campo pertence a uma **seção**; seis números curtos seguidos (como os atributos) ficam numa grade compacta.

---

## Capítulo VII — Da Criação de Monstros

### § 1. Das seções do formulário

| Seção | Campos |
| :--- | :--- |
| **Identidade** | Ilustração, nome, elemento primário e secundário, porte, descrição/lenda |
| **Habitat** | Região, geologia e aquífero nativos |
| **Atributos base** | VIG, FOR, DES, MEN, ESP, VON (0 a 500) |
| **Regras de combate** | Domesticável, chefe solo, multiplicador de HP do chefe |

### § 2. Da ilustração

- **Enviar do dispositivo:** qualquer PNG, JPG, WEBP ou GIF de até 15 MB. A imagem é reduzida a 512 px e convertida para WEBP antes de seguir.
- **Endereço:** cole um link `https://...`.
- O Motor só aceita imagens (`data:image/...`) ou endereços `http(s)`; qualquer outra coisa é recusada.

### § 3. Do espelho do jogador

Ao lado do formulário (acima, no celular) fica o cartão **Como os jogadores verão**, que muda a cada letra digitada: ilustração, cor do elemento, selos de chefe e domável, lenda.

### § 4. Dos golpes e drops

Ao salvar uma espécie nova, o botão diz **Salvar e cadastrar golpes e drops**: o editor continua aberto e mostra as sublistas.

#### Dos golpes
Nome, categoria (físico, contato, especial elemental, status tático), elemento, dados (quantidade × faces), custos, atributos de escala, grau de desbloqueio e **slot inicial** (1 a 4 = já equipado; 0 = só aprendível).

#### Dos drops
Item, probabilidade (0 a 1), quantidade mínima e máxima, raridade, qualidade (Q1 a Q5) e se é exclusivo.

### § 5. Do identificador

Se ficar vazio, o Motor o gera a partir do nome (*Lobo Gélido* → `LOBO_GELIDO`). Depois de criado, não muda.

---

## Capítulo VIII — Das Cidades e Rotas

### § 1. Das cidades
Toque no mapa do editor para posicionar. O editor avisa se a cidade cair no mar ou se um porto ficar longe da costa.

### § 2. Das rotas
Escolha origem e destino; o editor desenha o traçado e sugere a distância. Rotas marítimas exigem porto nas duas pontas.

---

*Aqui finda o Livro IV.*
