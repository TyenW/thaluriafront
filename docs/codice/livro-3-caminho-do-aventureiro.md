# Livro III — Do Caminho do Aventureiro

> *Onde o jogador aprende a entrar no reino, a forjar o seu herói, a ler a própria ficha e a percorrer mapas e bestiários.*

[← Livro II](livro-2-rituais-de-invocacao.md) · [Pórtico](../../README.md) · [Livro IV →](livro-4-poderes-do-mestre.md)

---

## Capítulo I — Da Entrada no Reino

### § 1. Do portão (`/login`)

Digite usuário e senha, ou toque num dos atalhos de conta. A sessão fica guardada no navegador até que se clique em **Sair**.

### § 2. Do menu

No computador o menu fica no topo. No celular e no tablet, abre-se pelo botão ☰. São estes os caminhos:

| Caminho | Destino |
| :--- | :--- |
| Personagens | Suas fichas |
| Mapa | O atlas do continente |
| Bestiário | Criaturas estudadas |
| Inventário & Moedas | Visão geral das mochilas |
| Wiki & Regras | Capítulos liberados pelo Mestre |
| VTT 3D | Mesa virtual (em breve) |

---

## Capítulo II — Da Forja do Personagem (`/criar`)

### § 1. Das quatro etapas

1. **Identidade** — o nome do herói (até 60 letras).
2. **Sorteio de Raças** — o Motor oferece Humano e mais duas raças. Recarregar a página retoma o mesmo sorteio; não há sorteio novo de graça.
3. **Seis Atributos** — VIG, FOR, DES, MEN, ESP e VON, rolados dentro das faixas da raça.
4. **Consagração** — a ficha é gravada no `thaluria.db`.

### § 2. Do Pity

Cada criação sem raça mítica soma um ponto de sorte (*pity*). Ao escolher Draconato, o contador volta a zero. O seu pity aparece no menu, ao lado do nome.

### § 3. Do olho do Mestre

Enquanto forja, o Mestre pode assistir, mandar dicas, conceder nova rolagem ou o Impulso Dracônico (ver Livro IV, Capítulo II).

---

## Capítulo III — Da Ficha e de Seus Recursos

### § 1. Do cabeçalho

Mostra retrato, patamar, nível de ressonância, condições ativas, raça, reino de origem e cidade atual. Toque no retrato para trocá-lo por uma imagem do dispositivo ou por um endereço da internet. A imagem é reduzida a 512 px antes de seguir para o servidor.

### § 2. Das quatro barras

| Barra | Defesa associada |
| :--- | :--- |
| Vida (HP) | Defesa Física; turnos de agonia |
| Sanidade (SAN) | Defesa Oculta |
| Energia | — |
| Mana | Regeneração por turno |

Os botões **−5, −1, +1, +5** gravam no servidor a cada toque. **Restaurar tudo** devolve as quatro ao máximo, após confirmação.

### § 3. Das ações gerais

- **Editar ficha** — nome e atributos.
- **Sincronizar** — relê a ficha do servidor (útil quando o Mestre altera algo).
- **Excluir** — apaga a ficha para sempre, com perícias, inventário, moedas e companheiros.

---

## Capítulo IV — Das Dez Abas da Ficha

A aba aberta fica gravada no endereço (`?aba=inventario`), de modo que um link leva direto a ela. As setas ← → do teclado trocam de aba.

### § 1. Atributos
Os seis atributos e o que deles deriva.

### § 2. Perícias
Grau e maestria de cada perícia; perícias próprias podem ser criadas e removidas.

### § 3. Magias
Grimório pessoal: escola, elemento, círculo, custos de mana e energia, alcance, dado, tempo de conjuração e duração. Marque as **preparadas**.

### § 4. Condições
Efeitos positivos, negativos ou neutros, com intensidade de 1 a 10 e duração em turnos. **Avançar turno** desconta um turno de todas e encerra as que acabarem.

### § 5. Inventário
Cada item mostra ilustração (se houver), tipo, raridade em cor, descrição, quantidade, peso e preço de referência em latão. O topo soma a carga e avisa quando ela passa de **FOR × 5 kg**. Os itens chegam por **concessão do Mestre**, lojas e oficinas.

#### Das cores da raridade

| Raridade | Cor |
| :--- | :--- |
| Comum | cinza-pergaminho |
| Incomum | verde |
| Raro | azul |
| Épico | púrpura |
| Lendário | ouro |
| Mítico | rosa |

### § 6. Moedas
As dez moedas físicas do reino, da maior à menor: **Édito, Talento, Diamante, Cobalto, Platina, Ouro, Prata, Cobre, Ferro e Latão**. Cada uma é guardada como está, sem troco automático.

### § 7. Progressão
Pontos de Essência (PE) e avanço de patamar.

### § 8. História
História, aparência, personalidade e anotações livres.

### § 9. Companheiros
Criaturas domadas, seus quatro golpes ativos e se servem de besta de carga.

### § 10. Raça & Inata
A habilidade inata da raça: dado, custos e alcance.

---

## Capítulo V — Do Atlas (`/mapa`)

### § 1. Dos gestos

- Arraste para mover; role a roda ou faça pinça para aproximar.
- Toque numa cidade para abrir o seu painel. No celular, o painel sobe de baixo como uma folha.

### § 2. Da névoa

| O que se vê | Significado |
| :--- | :--- |
| Nada | A cidade está oculta |
| Glifo tracejado | Só nome e rotas são conhecidos |
| Glifo cheio | Informações completas (bioma, solo, água, lojas) |

### § 3. Das rotas

Estradas principais, secundárias e marítimas. O painel da cidade lista as rotas conectadas, com distância e perigo de 1 a 10.

---

## Capítulo VI — Do Bestiário (`/bestiario`)

### § 1. Do que se vê

Cada criatura revelada mostra **ilustração**, nome, elementos, porte, região, a **lenda** escrita pelo Mestre, selos de *Chefe* e *Domável*, e os quatro golpes ativos.

### § 2. Do que não se vê

Criaturas não estudadas aparecem como **???**. A busca ignora essas criaturas, para que seus nomes não escapem.

---

## Capítulo VII — Do Inventário Geral e da Wiki

### § 1. Inventário & Moedas (`/inventario`)
Visão de todas as mochilas dos seus personagens. Para alterar, abra a ficha.

### § 2. Wiki & Regras (`/wiki`)
Cinco capítulos: *Status & Regras Vitais*, *Economia & Escala de Latão*, *Grafiturgia Elemental*, *Compêndio de Raças por Reino* e *Bestiário & Sistema de Doma*. Os que o Mestre ainda não liberou aparecem **selados**.

---

*Aqui finda o Livro III.*
