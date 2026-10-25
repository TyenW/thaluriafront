# Apêndice — Glossário e Remédios

> *Para que nenhum leitor se perca entre os termos do reino, e para que todo mal comum tenha o seu unguento.*

[← Livro VII](livro-7-travessia-para-a-vercel.md) · [Pórtico](../../README.md)

---

## Capítulo I — Do Glossário

### § 1. Termos do jogo

| Termo | Significado |
| :--- | :--- |
| **Ficha** | O registro de um personagem |
| **Patamar** | Faixa de poder do personagem |
| **NR** | Nível de Ressonância |
| **PE** | Pontos de Essência, gastos na progressão |
| **PA** | Potencial de Alma |
| **Pity** | Sorte acumulada para raças míticas na forja |
| **Latão (PL)** | Menor moeda; base de todos os preços |
| **Névoa de guerra** | O que o Mestre ainda esconde dos jogadores |
| **Golpe ativo** | Um dos quatro golpes equipados de uma criatura |
| **Drop** | Item que uma criatura pode deixar ao cair |

### § 2. Termos da obra

| Termo | Significado |
| :--- | :--- |
| **Interface** | Este repositório (front-end) |
| **Motor** | O servidor Java (`thaluriaback`) |
| **Esquema** | Descrição das entidades que o Motor envia ao gerenciador |
| **Token de cor** | Nome de uma cor da paleta (`nevoa`, `painel`...) |
| **Sob demanda** | Página baixada só quando aberta (`lazy`) |
| **Túnel** | Ponte HTTPS da Cloudflare até o PC do Mestre |
| **Selo (token)** | Prova de entrada enviada em cada pedido; o Motor decide o que ela permite |

---

## Capítulo II — Dos Remédios para Males Comuns

### § 1. "Tempo de resposta excedido"
O Motor não está aceso ou a porta está errada. Rode `iniciar_servidor.bat` e confira a mensagem da porta 8080.

### § 2. "Entidade desconhecida" ou formulário sem o campo de imagem
O Motor está com classes antigas. Feche-o e rode `iniciar_servidor.bat`, que recompila tudo.

### § 3. "Ilustração: envie uma imagem..."
O endereço colado não começa com `http://` ou `https://`, ou o arquivo não é imagem.

### § 4. "Item em uso: inventário de N ficha(s)"
Retire o item dos inventários (Livro IV, Capítulo V) antes de apagá-lo do catálogo.

### § 5. A página da Vercel abre, mas nada carrega
- `VITE_API_URL` vazio ou com o endereço antigo do túnel → atualize e faça redeploy.
- Túnel desligado → acenda o `cloudflared`.
- Endereço com `http://` → o navegador bloqueia; use o `https://` do túnel.

### § 6. Recarregar `/fichas/3` na Vercel dá 404
O `vercel.json` sumiu ou foi alterado. Ele deve reescrever `/(.*)` para `/index.html`.

### § 7. "Sessão expirada ou inválida. Entre novamente."
O token venceu (30 dias), o Mestre trocou a sua senha, ou o Motor foi atualizado e as sessões antigas deixaram de valer. Basta entrar de novo.

### § 8. "Apenas o Mestre pode fazer isso." / "Esta ficha pertence a outro jogador."
O Motor recusou o pedido (403). Entre com a conta certa.

### § 9. "Muitas tentativas erradas"
Oito senhas erradas em 15 minutos. Espere o tempo indicado ou reinicie o Motor.

### § 10. `java -version` mostra 1.8
É o Java antigo do sistema. Use o `iniciar_servidor.bat`, que prefere `C:\JavaJDK`, ou ajuste o `JAVA_HOME`.

---

*Assim se encerra o Códice de Thalúria. Que os dados vos sejam favoráveis.*
