# Livro VI — Dos Pactos com o Servidor

> *Onde se lavram, cláusula por cláusula, os acordos firmados entre a Interface e o Motor: que se pede, por qual caminho e o que se recebe em troca.*

[← Livro V](livro-5-artes-visuais.md) · [Pórtico](../../README.md) · [Livro VII →](livro-7-travessia-para-a-vercel.md)

---

## Capítulo I — Das Cláusulas Gerais

### § 1. Da forma do pedido
- `GET`: parâmetros na URL.
- `POST`: corpo `application/x-www-form-urlencoded; charset=UTF-8`.
- O Motor aceita os dois formatos em qualquer rota (lê URL e corpo juntos).

### § 2. Da forma da resposta
- Sucesso: JSON, código 200.
- Recusa: `{"erro": "mensagem legível"}`, com 400 (dado inválido), 401 (credencial), 404 (não encontrado) ou 500 (falha interna).

### § 3. Do CORS
O Motor responde `Access-Control-Allow-Origin: *` e trata o `OPTIONS` prévio. Por isso a Vercel consegue falar com ele por outro domínio.

---

## Capítulo II — Das Rotas de Acesso

| Rota | Parâmetros | Devolve |
| :--- | :--- | :--- |
| `POST /api/login` | `username`, `senha` | `id`, `username`, `papel`, `limiteFichas`, `pity` |

---

## Capítulo III — Das Rotas da Forja

| Rota | Parâmetros | Ofício |
| :--- | :--- | :--- |
| `POST /api/criacao/iniciar` | `usuarioId`, `username`, `nomePersonagem` | Sorteia ou retoma a sessão de criação |
| `GET /api/criacao/sessao` | `usuarioId` | Estado atual da sessão |
| `POST /api/criacao/escolher-raca` | `usuarioId`, `indiceOpcao`, `linhagemDraconica` | Escolhe a raça e rola atributos |
| `POST /api/criacao/finalizar` | `usuarioId` | Grava a ficha definitiva |

---

## Capítulo IV — Das Rotas da Ficha

### § 1. Leitura e edição

| Rota | Parâmetros | Ofício |
| :--- | :--- | :--- |
| `GET /api/fichas` | `id` **ou** `usuarioId` **ou** `papel=MESTRE` | Uma ficha, as do jogador ou todas |
| `POST /api/fichas/atualizar` | `id` e só o que mudou: `nome`, `imagemUrl`, `vig`…`von`, `hpAtual`, `sanAtual`, `energiaAtual`, `manaAtual`, `pontosEssencia`, `cidadeId`, `moeda_OURO`… | Devolve os valores recalculados |
| `POST /api/fichas/excluir` | `id` | Apaga a ficha e tudo o que é dela |

### § 2. Perícias, história, condições e magias

| Rota | Parâmetros principais |
| :--- | :--- |
| `POST /api/fichas/pericias/salvar` | `fichaId`, `pericia`, `nome`, `atributoBase`, `grau`, `maestria`, `descricao` |
| `POST /api/fichas/pericias/remover` | `fichaId`, `pericia` |
| `POST /api/fichas/historia/salvar` | `fichaId`, `historia`, `aparencia`, `personalidade`, `anotacoes` |
| `POST /api/fichas/condicoes/salvar` | `fichaId`, `id?`, `nome`, `tipo`, `intensidade`, `duracaoTurnos`, `descricao` |
| `POST /api/fichas/condicoes/remover` | `fichaId`, `id` |
| `POST /api/fichas/condicoes/avancar-turno` | `fichaId` |
| `POST /api/fichas/magias/salvar` | `fichaId`, `id?`, `nome`, `escola`, `elemento`, `circulo`, custos, `alcanceM`, `dado`, `tempoConjuracao`, `duracao`, `descricao`, `preparada` |
| `POST /api/fichas/magias/remover` | `fichaId`, `id` |

### § 3. Inventário *(novo nesta edição)*

| Rota | Parâmetros | Recusa quando |
| :--- | :--- | :--- |
| `POST /api/fichas/inventario/conceder` | `fichaId`, `itemId`, `quantidade` (1–99.999, padrão 1) | Ficha ou item inexistente; quantidade fora da faixa |
| `POST /api/fichas/inventario/retirar` | `fichaId`, `itemId`, `quantidade` (vazia = pilha inteira) | O personagem não possui o item |

Resposta de ambas:

```json
{
  "status": "CONCEDIDO",
  "inventario": [
    { "id": 2, "nome": "Espada Longa de Ferro", "tipo": "ARMA", "raridade": "COMUM",
      "descricao": "...", "precoLatao": 150000, "pesoKg": 2.5, "imagemUrl": null, "quantidade": 3 }
  ]
}
```

---

## Capítulo V — Das Rotas do Mundo

| Rota | Parâmetros | Ofício |
| :--- | :--- | :--- |
| `GET /api/conteudo/visivel` | `papel` | Wiki, cidades, rotas e bestiário, filtrados pela névoa |
| `POST /api/mestre/controle-mundo` | `acao` = `AVANCAR_DIA` (`dias`), `LIBERAR_WIKI` (`capitulo`), `REVELAR_MONSTRO` (`monstroId`), `VISIBILIDADE_CIDADE` (`cidade`, `nivel`) | Comanda a névoa e o calendário |

### § 1. Da entrada do bestiário
Cada criatura revelada traz agora, além de nome, região, elemento, porte e golpes: `elementoSecundario`, `chefe`, `domesticavel`, `imagemUrl` e `descricao`. As não reveladas trazem só `{ "id", "revelado": false, "nome": "???" }`.

---

## Capítulo VI — Das Rotas do Mestre

| Rota | Parâmetros | Ofício |
| :--- | :--- | :--- |
| `GET /api/mestre/sessoes-ao-vivo` | — | Sessões de criação em andamento |
| `POST /api/mestre/assistir-sessao` | `usuarioId`, `acao` (`DICA`, `REROLL`, `IMPULSO_DRACONICO`, `APROVAR`), `dica` | Intervém numa forja |
| `GET/POST /api/mestre/usuarios` | `username`, `senha`, `papel`, `limiteFichas` | Lista, cria ou altera contas |
| `POST /api/mestre/usuarios/excluir` | `id` | Apaga uma conta |

---

## Capítulo VII — Do Gerenciador Genérico (`/api/admin/*`)

### § 1. Das rotas

| Rota | Parâmetros | Ofício |
| :--- | :--- | :--- |
| `GET /api/admin/esquema` | — | Esquema de todas as entidades |
| `GET /api/admin/listar` | `entidade`, `pai?` | Registros de uma entidade |
| `POST /api/admin/salvar` | `entidade`, `id?`, campos | Insere (sem `id`) ou atualiza |
| `POST /api/admin/excluir` | `entidade`, `id` | Exclui, se não estiver em uso |

### § 2. Do esquema de um campo

```json
{
  "coluna": "imagem_url", "rotulo": "Ilustração", "tipo": "IMAGEM",
  "obrigatorio": false, "min": null, "max": null, "opcoes": [],
  "referencia": null, "ajuda": "...", "padrao": null, "naLista": false,
  "grupo": "Identidade"
}
```

### § 3. Dos tipos de campo

| Tipo | Validação no Motor |
| :--- | :--- |
| `TEXTO` | Até 120 caracteres |
| `TEXTO_LONGO` | Até 5000 caracteres |
| `INTEIRO`, `REAL` | Número dentro de `min`/`max` |
| `BOOLEANO` | `true`/`1`/`sim` |
| `ENUM` | Um dos valores de `opcoes` |
| `REFERENCIA` | Id de outra entidade |
| `IMAGEM` *(novo)* | `data:image/(png|jpeg|webp|gif);base64,...` ou `http(s)://...`, até 1,5 milhão de caracteres |

### § 4. Do campo `grupo` *(novo)*
Nome da seção do formulário. A Interface agrupa os campos seguidos de mesmo grupo sob um título.

---

*Aqui finda o Livro VI.*
