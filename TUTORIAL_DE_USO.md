# 📖 Manual Prático de Uso — Thalúria RPG

Este guia foi elaborado para que você possa iniciar e testar o ecossistema completo (Back-end Java + Front-end React) em poucos minutos no seu computador.

---

## ⚡ Início Rápido em 2 Terminais

### Terminal 1: Iniciar o Servidor Java

Abra um terminal do PowerShell e execute:

```powershell
cd c:\Users\Usuário\Desktop\codigos\thaluriaback
& "C:\JavaJDK\bin\java.exe" -cp "bin;lib/sqlite-jdbc.jar;lib/slf4j-api.jar;lib/slf4j-simple.jar" servidor.ServidorThaluriaAPI 8080
```

> **Resultado:** O servidor exibirá `Servidor Thaluria API iniciado na porta 8080`. Mantenha esse terminal aberto.

---

### Terminal 2: Iniciar o Front-end React

Abra um segundo terminal do PowerShell e execute:

```powershell
cd c:\Users\Usuário\Desktop\codigos\thaluriafront
npm run dev
```

> **Resultado:** O Vite exibirá `Local: http://localhost:5173/`. Acesse esse link no seu navegador (Chrome, Edge ou Firefox).

---

## 🔑 Credenciais Pré-Cadastradas

| Perfil | Usuário | Senha | O que você pode fazer |
| :--- | :--- | :--- | :--- |
| **Jogador 1** | `jogador1` | `123456` | Ver suas fichas, inspecionar o mapa dos 5 Reinos, consultar o bestiário, consultar a wiki com capítulos bloqueados/liberados, inspecionar o inventário de 50 slots e ver a prévia do VTT 3D. |
| **Mestre** | `mestre` | `thaluriaadmin` | Painel de controle supremo: avançar dias de mercado da campanha, monitorar fichas sendo criadas em tempo real (com envio de dicas e rerolls), liberar capítulos da wiki e revelar monstros no bestiário com 1 clique. |

> 💡 **Dica de Usabilidade:** Na tela de login, você pode clicar nos botões de atalho **"Jogador 1"** ou **"Mestre"** para preencher automaticamente os campos sem precisar digitar!

---

## 🎮 Roteiro de Teste Recomendado

1. **Faça login como Jogador 1:**
   * Observe a interface de grimório escuro com bordas douradas.
   * Veja o card da ficha *"Aventureiro de Ironhold"* com barras de Vida, Sanidade, Energia e Mana.
   * Clique em **"Wiki & Regras"** no menu: note que capítulos não liberados estão com cadeado vermelho (**"Selado"**).
2. **Abra outra aba (ou faça logout) e entre como Mestre:**
   * Observe o banner de autoridade no topo: `MODO MESTRE ATIVO`.
   * Clique em **"Fog-of-War & Mundo"** (`/mestre/mundo`).
   * No bloco de capítulos da Wiki, clique no botão **"Liberar para Jogadores"** ao lado de *"Economia e Comercio"*.
   * No bloco de Bestiário, clique em **"Revelar Fera"** ao lado de *"Lobo Glacial de Frostdale"*.
3. **Volte ao Jogador 1:**
   * Recarregue a página da Wiki: o capítulo *"Economia e Comercio"* agora estará com o selo verde **"Liberado"** e você poderá ler todo o texto sobre a escala de 10 moedas em Latão e a Regra do Camarão!
   * Acesse a página do **Bestiário**: o *Lobo Glacial de Frostdale* agora exibirá seu nome completo, bioma de Tundra e seus 4 golpes do Moveset estilo Pokémon!

---

## ☁️ Como Expor para Jogadores Remotos (Vercel + Cloudflare Tunnel)

Quando você for jogar com amigos remotamente:

1. Baixe o executável gratuito `cloudflared` da Cloudflare.
2. No seu computador, com o servidor Java rodando na porta 8080, execute:
   ```powershell
   cloudflared tunnel --url http://localhost:8080
   ```
3. O terminal gerará um link seguro HTTPS (ex.: `https://minha-api-thaluria.trycloudflare.com`).
4. Na Vercel, nas configurações do projeto (`Environment Variables`), adicione:
   ```env
   VITE_API_URL=https://minha-api-thaluria.trycloudflare.com
   ```
5. Pronto! Os jogadores poderão entrar pelo link da Vercel (no celular ou computador) e jogar com você enquanto o seu servidor Java no seu PC processa todas as regras e salva tudo no `thaluria.db`.
