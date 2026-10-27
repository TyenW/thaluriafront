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

O botão de uma espécie revelada vira **Desrevelar**: ela volta a aparecer como sombra (`???`) para os jogadores. O Mestre continua vendo a ficha completa; o botão mostra o que **os jogadores** enxergam.

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
| Itens | Catálogo de itens, com ilustração | Locais de coleta (só se for coletável) |
| Receitas | Manufatura | Insumos |
| Monstros | Espécies do bestiário, com ilustração e lenda | Golpes e Drops |
| Cidades | Assentamentos e posição no mapa | — |
| Rotas | Estradas e rotas marítimas | — |
| Lojas | Estabelecimentos | Estoque |

### § 2. Da lista

No computador, uma tabela com miniatura da ilustração. No celular, cartões: toque no nome para editar. A busca procura no nome e em todas as colunas visíveis.

### § 3. Do formulário em seções

O formulário é montado pelo esquema que o Motor envia (`/api/admin/esquema`). Cada campo pertence a uma **seção**; seis números curtos seguidos (como os atributos) ficam numa grade compacta.

Alguns campos só aparecem quando um interruptor está marcado: **Nome da rede** só com *Faz parte de uma rede*, e a sublista **Locais de coleta** só com *Coletável*. Loja fora de rede nunca guarda nome de rede; loja de rede sem nome é recusada.

### § 4. Da origem dos itens

> *Nada surge do nada em Thaluria: o que existe foi colhido, arrancado de uma fera ou feito por mãos.*

Todo item precisa de pelo menos uma **origem**, e pode ter várias:

| Origem | Quando conta |
| :--- | :--- |
| **Coletado** | Item marcado *Coletável* com ao menos um **local de coleta** |
| **Dropado** | Algum monstro o tem nos **drops** |
| **Craftado** | Alguma **receita** o produz |

Cada local de coleta diz **onde** (cidade, região, geologia, aquífero; vazio vale para qualquer lugar), a **chance de achar** (0 a 1) e a quantidade mínima e máxima.

Na aba **Itens**, o painel **Itens sem origem** lista os que não têm nenhuma, com selo vermelho na tabela, e oferece o atalho para resolver: *Tornar coletável*, *Monstro que dropa* ou *Criar receita* (que já abre com o item escolhido). O mesmo painel avisa coletáveis sem local e **drops com item fora do catálogo** (cadastros antigos feitos só pelo nome), com o atalho *Criar item*. O sistema avisa, mas não bloqueia: dá para criar o item antes do monstro ou da receita.

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
Item **do catálogo** (escolhido na lista, não mais digitado), probabilidade (0 a 1), quantidade mínima e máxima, raridade, qualidade (Q1 a Q5) e se é exclusivo.

### § 5. Do identificador

Se ficar vazio, o Motor o gera a partir do nome (*Lobo Gélido* → `LOBO_GELIDO`). Depois de criado, não muda.

---

## Capítulo VIII — Das Cidades e Rotas

### § 1. Das cidades
Toque no mapa do editor para posicionar. O editor avisa se a cidade cair no mar ou se um porto ficar longe da costa.

### § 2. Das rotas
Escolha origem e destino; o editor desenha o traçado e sugere a distância. Rotas marítimas exigem porto nas duas pontas.

---

## Capítulo IX — Do Comércio dos Reinos (`/mestre/comercio`)

> *Onde o Mestre vigia as bolsas dos mercadores, e quando lhe apraz, veste ele mesmo o avental e toma o balcão.*

### § 1. Do quadro geral

Ao abrir a aba, quatro números resumem o reino: **lojas**, **caixa somado**, **lotes em produção** e **lojas em alerta**. Abaixo deles, a lista de todas as lojas, com filtros por cidade, especialidade e alertas, e quatro ordenações (alertas primeiro, melhor semana, maior caixa, nome). No celular, cada loja é um cartão; no computador, uma linha de tabela.

#### Dos alertas

| Alerta | Quando surge |
| :--- | :--- |
| Caixa baixo | Caixa abaixo de 4 PO (o dobro da reserva) |
| Prateleiras vazias | Nenhuma unidade em estoque |
| Gastando mais do que vende | Saídas da semana 20% acima das entradas |
| Oficina parada | A loja conhece receitas mas nada está em produção |

### § 2. Da loja por dentro

Tocar numa loja abre o seu painel: caixa, estoque, **saldo da semana** e unidades vendidas, e quatro abas. O nome da rede só aparece no cabeçalho se a loja for de rede.

#### Da aba Estoque
As mercadorias aparecem como **cartões quadrados com a ilustração do item** (sem ilustração, um ícone do tipo). Sobre a imagem: a quantidade na prateleira (ou *Esgotado*) e o preço de balcão de hoje. Embaixo: tipo, raridade, a **procura** diária e quanto o preço está acima ou abaixo da referência (escassez encarece, fartura barateia). Há busca por nome e o filtro *Só o que tem na prateleira*.

No topo da aba Comércio, o quadro **Como usar o comércio** resume o passo a passo; recolha-o quando já souber de cor.

#### Da aba Produção
Os lotes na oficina, com quem os mandou fazer (**IA** ou **Mestre**) e o dia em que ficam prontos; e as receitas, com o **lucro por lote** calculado pelos preços de hoje.

Encomendas de arma mostram cada **peça** (lâmina, guarda, cabo...): com relógio enquanto está na bancada, com cadeado quando fica pronta e **reservada** para a encomenda, e por fim o dia da montagem. Toda ordem tem **Cancelar**: as peças prontas viram estoque comum (podem ser vendidas), os materiais que ainda não viraram peça voltam à prateleira e a mão de obra paga não volta.

No Estoque, uma peça reservada aparece com cadeado e *N reservada(s) para encomenda*: está na oficina, mas não vende. Armas da forja mostram o dano, a durabilidade, o alcance e os slots no cartão.

#### Da aba Livro-caixa
Os últimos 80 movimentos, com entradas em verde, saídas em vermelho e o caixa depois de cada um.

#### Da aba Administrar
Definir o caixa, o nível da loja, abastecer ou retirar estoque sem mexer no caixa, e dar um empurrão na procura de um item (festival, guerra, escassez).

### § 3. Do Mestre como mercador

#### Da venda a um aventureiro
Em **Estoque → Vender a jogador**: escolha o personagem, a quantidade e **o preço que quiser** (sugere-se o do balcão). Com *Cobrar da carteira*, o valor sai das moedas da ficha (com troco recalculado) e entra no caixa; sem ela, o item é entregue de graça. O item vai direto ao inventário da ficha, e a venda fica no livro-caixa.

#### Da encomenda à oficina
Em **Produção → Mandar fazer**: escolha os lotes e se:
- **o Mestre fornece os insumos**: nada sai do estoque nem do caixa (o herói trouxe o próprio material);
- **fica pronto agora**: pula os dias de produção.

Sem essas marcas, a loja gasta os próprios insumos e paga a mão de obra, como faria sozinha.

#### Da arma sob medida
Em **Produção → Encomendar arma**: escolha o tipo (Katana, Arco Longo...) e o material de cada parte, como um aventureiro que pede uma arma ao ferreiro. Ao lado, os números da arma **como esta oficina a faria** (os slots de efeito somam a qualidade do nível da loja). Peças já prontas na prateleira são usadas direto e poupam dias; o resto é forjado parte a parte, e a montagem vem no fim. As marcas *O jogador traz os materiais* e *Pronta agora* valem como na encomenda comum.

### § 4. Da vida própria das lojas (o que acontece a cada dia)

Ao **Avançar 1 dia** (aqui ou no Painel), cada loja, nesta ordem:

1. recebe os lotes que terminaram de ser produzidos;
2. **vende aos clientes da cidade**: a procura sobe quando o preço está baixo e cai quando está alto; capitais têm mais movimento que vilas;
3. sente a procura de cada item oscilar;
4. compra de fornecedores locais **só até o estoque-alvo** (o dobro da procura) e nunca gastando a reserva de 2 PO;
5. encomenda de outras cidades **só se a mercadoria chegar custando até 80% do que vende** (frete e escolta incluídos);
6. deixa a **IA do mercador** escolher a receita mais lucrativa por dia; se a melhor travar por falta de insumo, a loja passa a procurá-lo, e fornecedores e caravanas o trazem.

### § 5. Das lojas-base

Na primeira vez que o Motor acende com esta edição, cada cidade recebe as especialidades do seu porte que ainda não tem, com mercador, caixa, estoque e receitas:

| Porte | Especialidades |
| :--- | :--- |
| Reino / Capital | Empório, Taverna, Forja, Alquimia, Alfaiataria, Joalheria, Botânica |
| Cidade | Empório, Taverna, Forja, Alquimia, Alfaiataria |
| Fortaleza | Empório, Taverna, Forja |
| Vila | Empório, Taverna |

São criadas também 20 receitas-base (forjar espadas, costurar gibões, destilar poções, assar pão, fermentar hidromel, lavrar anéis...) e os itens de ofício que faltavam no catálogo. Tudo isso acontece **uma única vez**: o que o Mestre apagar depois não volta.

### § 6. Das caravanas no mapa

No **Mapa**, o Mestre vê as caravanas em viagem sobre as próprias estradas e rotas marítimas: uma **carroça** em terra, um **barco** no mar. O botão **Caravanas (N)** da barra do mapa as mostra ou esconde; na visão de jogador elas nunca aparecem.

| Sinal | Significado |
| :--- | :--- |
| Cor âmbar | Em trânsito |
| Cor cinza | Aguardando escolta para partir |
| Cor rubra com **!** | Carga extraviada (emboscada); há missão de resgate no quadro |
| Ponto verde | Viaja com escolta |

Tocar numa caravana destaca o caminho inteiro (já percorrido em pontilhado, o que falta em tracejado âmbar) e abre o seu cartão: carga e valor, loja de origem e de destino, situação, proteção, **previsão de chegada**, quilômetros percorridos e a missão em aberto, se houver. Na aba Comércio, o aviso *N caravanas* leva direto ao mapa.

As caravanas são salvas a cada dia de mercado e voltam no mesmo ponto da estrada quando o Motor reinicia. Quem esperava escolta parte desprotegida, e carga extraviada ganha nova missão de resgate. Caravanas entregues ou perdidas há mais de uma semana são esquecidas.

### § 7. Das receitas que o Mestre cria

Em **Gerenciar → Receitas**, o campo **Feita em** diz qual especialidade a produz sozinha. Vazio, qualquer loja a conhece. A receita nova vale para a IA na hora, sem reiniciar o Motor.

---

## Capítulo X — Da Forja (`/mestre/forja`)

> *Uma espada não nasce espada: nasce lâmina, guarda, cabo e pomo, e cada peça carrega a alma do metal de que foi feita.*

### § 1. Da cadeia

**Material → peça → arma.** Cada parte da arma é forjada de materiais (o *subcraft*), e as peças são montadas no fim. Os materiais decidem tudo: dano, durabilidade, peso, valor e raridade. Não há teto: quanto melhor o material, mais forte a arma.

### § 2. Dos materiais

Em **Gerenciar → Itens**, um item do tipo *Material de Forja* ganha a seção **Forja**: a **categoria** (Metal, Madeira, Couro, Fibra, Gema, Osso, Escama, Outro), o **bônus de dano** e a **durabilidade**. Na primeira subida desta versão, os materiais que já existiam receberam categoria pelo nome, e bônus e durabilidade pela raridade; ajuste à vontade. Mudar um material recalcula na hora todas as armas que o usam.

### § 3. Dos moldes

Aba **Moldes**: cada família de arma e suas partes. Já vêm seis, editáveis:

| Família | Partes |
| :--- | :--- |
| Espada (e lâminas curtas) | Lâmina ×2 · Guarda · Cabo · Pomo |
| Machado | Cabeça ×2 · Cabo |
| Contusão | Cabeça ×2 · Cabo |
| Haste | Ponta · Haste |
| Arco | Corpo · Corda |
| Besta | Corpo · Corda · Mecanismo |

Cada parte diz **quantos materiais** consome, **quantas horas** leva e **o que aceita**: uma categoria (*qualquer metal*) ou um **item específico** (*Seda da Aranha-Tecelã*). Cada opção pode dar um **bônus próprio**, que só vale naquela parte (a seda, como Corda, pode dar +2 de dano e +20 m de alcance). O molde diz ainda os **slots de efeito** e o tempo de **montagem**.

### § 4. Dos tipos de arma

Aba **Tipos de arma**: Katana, Espada Longa, Arco Longo... Cada tipo tem o **dado base**, o **alcance** (armas à distância) e o **molde** cujas partes usa. Vieram todos os do sistema que cabem nos seis moldes.

### § 5. Das receitas de arma

Aba **Receitas de arma**: dê um nome (*Katana de Aço Negro*), escolha o tipo e toque nos materiais de cada parte. Ao lado, os números da arma se recalculam a cada toque.

| Número | Como sai |
| :--- | :--- |
| Dano | Dado do tipo + soma dos bônus das partes |
| Durabilidade | A da **peça mais fraca** |
| Peso | Soma dos materiais |
| Valor | Soma dos materiais + mão de obra (na peça e na montagem) |
| Raridade | Média das raridades, pesada pela quantidade de cada material |

Dois metais diferentes na mesma parte viram **liga**: *Lâmina de Liga Metálica de Cobre e Ferro*, com os nomes em ordem alfabética e a média dos bônus. O mesmo metal duas vezes é só *Lâmina de Ferro*.

Ao salvar, as peças e a arma entram no catálogo (as peças com o tipo *Componente de Arma*) e as forjas passam a fabricar a arma sozinhas. Marque **Só por encomenda** para que ela só saia quando você mandar.

Os slots de efeito saem **vazios**; encantar virá depois e não aumenta o custo da arma.


---

## Capítulo XI — Da Disseminação (`/mestre/disseminacao`)

> *Um segredo de forja não dura para sempre: viaja nas bocas dos caravaneiros, devagar, de cidade em cidade.*

### § 1. Do que se espalha

Quando uma cidade adquire um saber novo, use **Conceder conhecimento** e escolha:

- um **tipo de arma** (saber fazer Katanas: todas as receitas e encomendas sob medida do tipo); ou
- uma **receita pronta** de qualquer coisa (arma, remédio, cosmético, armadura).

E a **cidade que adquiriu**. Ela já produz no mesmo dia. O que você nunca concedeu continua **comum**: vale no mundo todo, como sempre.

### § 2. Dos três estágios

| Estágio | Na cidade |
| :--- | :--- |
| **Rumor** | Sabe que existe. As lojas podem encomendar de quem produz; antes disso, nenhuma caravana leva o item até lá |
| **Comércio** | As lojas da especialidade e as Lojas Gerais passam a procurar o item e mantê-lo na prateleira |
| **Produção** | Os artesãos aprendem: a IA fabrica, e o ferreiro aceita encomendas sob medida do tipo |

### § 3. Do tempo

O saber anda pelas rotas (o caminho mais curto; rotas bloqueadas não levam), e cada cidade resiste antes de passar adiante, como se guardasse o segredo:

> **Rumor** = dia da concessão + sigilo + soma, trecho a trecho, de (km ÷ 100 × dias por 100 km + resistência)
> **Comércio** = Rumor + intervalo · **Produção** = Comércio + intervalo

Padrões: sigilo **7**, **2** dias por 100 km, resistência **3**, Rumor → Comércio **+10**, Comércio → Produção **+20**. Cada conhecimento tem os seus tempos, editáveis a qualquer hora (**Salvar tempos** recalcula as previsões).

### § 4. Da tela

À esquerda, os conhecimentos com quantas cidades estão em cada estágio. À direita, o escolhido:

- o **mapa**, com cada cidade na cor do seu estágio (cinza desconhecido, âmbar rumor, azul comércio, verde produção, vermelho revogada); a origem é o ponto grande, e tocar numa cidade a destaca na tabela;
- a **linha do tempo**: para cada cidade, o estágio de hoje e o dia de cada estágio (✓ = já aconteceu; *em N* = faltam N dias), com o caminho (saltos e km).

### § 5. Dos poderes do Mestre

| Ação | Efeito |
| :--- | :--- |
| **Pausar / Retomar** | O relógio do conhecimento para; ao retomar, tudo atrasa os dias parados |
| **Segredo** | Para de se espalhar: só quem já sabe continua sabendo |
| **Adiantar** (Rumor, Comércio ou Produção *agora*) | A cidade salta para o estágio na hora e passa a espalhar a partir dela |
| **Revogar** | A cidade esquece e não passa adiante (quem só ouviria por ela também não ouve) |
| **Voltar ao normal** | Desfaz o adiantar ou o revogar daquela cidade |
| **Excluir** | O saber volta a ser comum no mundo todo |

Na loja, uma receita regional que ainda não chegou à Produção daquela cidade aparece com *Ainda não se sabe fazer aqui*: a IA não a faz, mas você ainda pode mandar fazer. Itens regionais mostram, no cartão do Estoque, o estágio da cidade. A encomenda sob medida de um tipo regional é recusada até a cidade chegar à Produção (ou ser adiantada).

Os jogadores não veem nada disso: percebem só o item aparecendo nas lojas.

---

*Aqui finda o Livro IV.*
