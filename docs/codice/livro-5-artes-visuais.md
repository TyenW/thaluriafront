# Livro V — Das Artes Visuais e da Boa Ordem

> *Onde se fixam as cores do brasão, as peças comuns com que se monta cada tela e as leis de escrita que todo artífice há de guardar.*

[← Livro IV](livro-4-poderes-do-mestre.md) · [Pórtico](../../README.md) · [Livro VI →](livro-6-pactos-com-o-servidor.md)

---

## Capítulo I — Da Paleta do Reino

### § 1. Da regra única

As cores moram em `src/index.css`, dentro de `@theme`. Cada `--color-x` vira utilitário do Tailwind (`text-x`, `bg-x/20`, `border-x`). **Não se escreve hexadecimal solto nas telas** (`text-[#8c93a4]`); usa-se o nome.

### § 2. Das superfícies

| Token | Uso |
| :--- | :--- |
| `fundo` | Fundo da página |
| `abismo` | Campos de formulário, fundos rebaixados |
| `painel` | Cartões e modais |
| `painel-alto` | Botões secundários, estados de *hover* |

### § 3. Dos contornos e textos

| Token | Uso |
| :--- | :--- |
| `linha` | Divisórias e bordas discretas |
| `linha-forte` | Bordas de campos e botões |
| `pergaminho` | Títulos e valores importantes |
| `texto` | Texto corrido |
| `texto-2` | Texto secundário |
| `nevoa` | Rótulos e legendas |
| `apagado` | Texto desabilitado ou de pouca importância |
| `ouro`, `ouro-escuro` | Destaques e acentos |

### § 4. Da tinta e do papel do atlas

`tinta`, `tinta-suave`, `tinta-rubra`, `tinta-escura`, `papel`, `papel-velho`, `papel-nevoa`, `papel-claro`.

### § 5. Da sobriedade

Nesta edição a obra ficou mais limpa:

- Cartões sem cantos ornamentais por padrão (`withOrnaments` agora começa falso).
- Selos (`Badge`) sem brilho.
- Botões dourados só brilham ao passar o cursor.
- O fundo da página guarda um único halo dourado no topo.
- Os 85 tons soltos pelo código viraram 21 tokens nomeados; só cinco tons muito específicos do atlas e da criação seguem escritos à mão.

---

## Capítulo II — Das Letras

| Família | Classe | Uso |
| :--- | :--- | :--- |
| Cinzel | `font-cinzel` | Títulos, rótulos, botões |
| Plus Jakarta Sans | `font-sans-clean` | Leitura e números |
| IM Fell English | (no atlas) | Cartografia |

Nenhum texto fica abaixo de **10 px**.

---

## Capítulo III — Das Peças Comuns (`components/common`)

### § 1. De moldura e estrutura

| Peça | Para quê |
| :--- | :--- |
| `CabecalhoPagina` | Título, ícone, descrição e ações de cada página; empilha no celular |
| `Card` | Painel (`grimorio`, `pergaminho`, `simple`) |
| `Abas` | Barra de abas rolável, acessível e navegável pelas setas |
| `Modal` | Janela; no celular sobe de baixo como folha. Tamanhos `sm`, `md`, `lg`, `xl` |
| `ModalConfirmacao` | Pergunta de sim ou não, com variante perigosa |
| `SecaoRecolhivel` | Bloco que abre e fecha |
| `CarregandoPagina` | Indicador enquanto uma página é baixada |

### § 2. De dados e avisos

| Peça | Para quê |
| :--- | :--- |
| `Badge` | Selos de raridade, elemento e estado |
| `Button` | Botões `gold`, `dark`, `outline`, `danger`, `ghost`, com `loading` |
| `EstadoVazio` | Aviso de lista vazia, com ação opcional |
| `Miniatura` | Quadradinho com a ilustração ou um ícone |
| `PainelAvisos` + `useAvisos` | Avisos temporários de sucesso e erro (substituem `alert`) |

### § 3. De formulário

| Peça | Para quê |
| :--- | :--- |
| Classe `.campo` | Estilo padrão de `input`, `select` e `textarea`; borda vermelha com `aria-invalid` |
| `Input` | Campo com rótulo e ícone |
| `CampoImagem` | Envio de imagem (reduzida a 512 px) ou endereço, com pré-visualização |

---

## Capítulo IV — Da Responsividade

### § 1. Dos pontos de quebra

| Prefixo | A partir de | Costume |
| :--- | :--- | :--- |
| *(nenhum)* | 0 px | Celular: uma coluna, botões largos |
| `sm:` | 640 px | Cabeçalhos em linha, modais centralizados |
| `md:` | 768 px | Tabelas aparecem; cartões somem |
| `lg:` | 1024 px | Duas ou três colunas, pré-visualização ao lado |
| `xl:` | 1280 px | Menu completo no topo |

### § 2. Das leis

1. **Tabela larga não entra no celular.** Desenhe cartões com `md:hidden` e a tabela com `hidden md:block` (veja `TabelaRegistros` e as contas dos jogadores).
2. **Alvos de toque** têm no mínimo `p-2` em volta do ícone.
3. **Grades** começam com uma coluna e crescem (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Exceção: blocos de números curtos, como os seis atributos (`grid-cols-3 sm:grid-cols-6`).
4. **Textos longos** usam `break-words` ou `truncate` dentro de `min-w-0`.
5. **Modais** cabem em 92% da altura da tela e rolam por dentro no celular.

---

## Capítulo V — Das Leis de Escrita do Código

### § 1. Da língua
Nomes, comentários e textos em português, como no resto da obra (`carregarFicha`, `aoSalvar`, `podeGerenciar`).

### § 2. Das páginas
Carregadas sob demanda em `App.tsx` pelo `sobDemanda(...)`. Página nova entra ali.

### § 3. Dos serviços
Toda rota nova do Motor ganha um método no serviço do assunto (`fichasService`, `adminService`...) e um tipo em `types/`.

### § 4. Das imagens
Use `utils/imagem.ts` (`validarArquivoImagem`, `otimizarImagem`). Nunca envie a imagem original.

### § 5. Do crivo
Antes de publicar: `npm run build` sem erros e `npm run lint` sem erros novos.

---

*Aqui finda o Livro V.*
