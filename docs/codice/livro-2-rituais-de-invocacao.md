# Livro II — Dos Rituais de Invocação

> *Onde se ensina, passo a passo e sem atalhos perigosos, a acender o Motor, a abrir os portões da Interface e a conferir que tudo responde.*

[← Livro I](livro-1-fundacao-e-arquitetura.md) · [Pórtico](../../README.md) · [Livro III →](livro-3-caminho-do-aventureiro.md)

---

## Capítulo I — Dos Instrumentos Necessários

### § 1. Para a Torre do Motor

- **JDK 21**. O ritual procura primeiro em `C:\JavaJDK\bin`, depois em `JAVA_HOME`, e por fim no `java` do sistema.
- As bibliotecas em `thaluriaback/lib/` (driver do SQLite).

> 🕯️ Se o `java -version` do seu terminal disser `1.8`, é o Java antigo respondendo. O `iniciar_servidor.bat` já prefere `C:\JavaJDK`, então use-o.

### § 2. Para a Torre da Interface

- **Node.js 20 ou mais novo** e **npm**.

---

## Capítulo II — Do Acendimento do Motor

### § 1. Pelo ritual pronto (recomendado)

```powershell
cd c:\Users\Usuário\Desktop\codigos\thaluriaback
.\iniciar_servidor.bat
```

O ritual faz três coisas, nesta ordem:

1. Liberta a porta **8080** se outro processo a estiver ocupando.
2. Recompila as classes Java em `bin/`.
3. Acende o servidor.

### § 2. Do sinal de que o Motor despertou

```text
🏰 [THALÚRIA RPG] Servidor API HTTP iniciado na porta 8080
```

### § 3. Das mudanças no banco ao despertar

A cada acendimento, `BancoDados.inicializarEsquema()` cria as tabelas que faltarem e acrescenta colunas novas. Nesta edição foram acrescentadas:

| Tabela | Coluna | Uso |
| :--- | :--- | :--- |
| `monstros_catalogo` | `imagem_url` | Ilustração da espécie |
| `monstros_catalogo` | `descricao` | Lenda exibida no bestiário |
| `itens` | `imagem_url` | Ilustração do item |

Nada é apagado; fichas e itens antigos seguem intactos.

---

## Capítulo III — Da Abertura dos Portões da Interface

### § 1. Primeira vez

```powershell
cd c:\Users\Usuário\Desktop\codigos\thaluriafront
npm install
```

### § 2. Em todo dia de jogo

```powershell
npm run dev
```

Abra **http://localhost:5173**. Para que jogadores na mesma rede entrem pelo celular, use `npm run dev -- --host` e passe a eles o endereço de rede que o Vite mostrar.

---

## Capítulo IV — Das Contas Primeiras

### § 1. Das credenciais semeadas

Quando a tabela de usuários está vazia, o Motor cria:

| Título | Usuário | Senha | Limite de fichas |
| :--- | :--- | :--- | :--- |
| Mestre da Mesa | `mestre` | `thaluriaadmin` | 999 |
| Aventureiro | `jogador1` | `123456` | 2 |

### § 2. Da prudência

Troque a senha do Mestre em **Mestre → Jogadores** antes de expor o reino à internet.

---

## Capítulo V — Dos Encantamentos do npm

| Comando | Quando usar |
| :--- | :--- |
| `npm run dev` | Para jogar e para trabalhar no código |
| `npm run build` | Antes de publicar; falha se houver erro de tipos |
| `npm run preview` | Para ver o pacote final como a Vercel o servirá |
| `npm run lint` | Para passar o crivo do `oxlint` |

---

## Capítulo VI — Da Prova de que Tudo Responde

### § 1. Roteiro de verificação

1. Entre como **Mestre**. A faixa *MODO MESTRE* deve surgir no topo.
2. Abra **Gerenciar → Monstros → Novo**, envie uma imagem e veja o cartão de pré-visualização mudar.
3. Abra **Painel**, escolha uma ficha e clique no ícone de presente (🎁). Conceda um item.
4. Entre como **jogador1** em outra janela anônima, abra a ficha e veja o item na aba **Inventário**.

### § 2. Se algo falhar

Consulte o [Apêndice — Remédios](apendice-glossario-e-remedios.md#capítulo-ii--dos-remédios-para-males-comuns).

---

*Aqui finda o Livro II.*
