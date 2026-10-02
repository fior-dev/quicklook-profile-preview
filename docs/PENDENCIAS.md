# Pendências
| # | Pendência | Depende de | Origem |
|---|---|---|---|
| 6 | Mapear endpoints Voyager dos Detalhes e gravar fixtures | tickets #9 a #15 | spec #1 |
| 7 | Criar o formulário Tally do Sinal de interesse e trocar `INTEREST_URL` em `src/interest.ts` (hoje provisória) | José (conta externa) | spec #1, ticket #16 |
| 8 | Escrever `PRIVACY.md` e publicar via GitHub Pages | ticket #17, autorização do José | spec #1 |
| 9 | `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `.gitignore` e o spec seguem fora do git, por decisão do José em 01/10 | — | sessão 2026-10-01 |
| 10 | Gravar fixture de HTML em inglês (as duas capturas de "en" vieram com a página em português) | José, rodar `.scratch/capturar-html.js` com a interface do LinkedIn em inglês | ticket #4 |
| 11 | Confirmar o valor do grau de conexão para 3º ou mais (só vi `Distance1` e `Distance2`; o código aceita `Distance3`) | perfil de 3º grau | ticket #4 |
| 12 | Localização de perfis de terceiros: `address` e `locationName` vêm `null` na Voyager; só existe no HTML do topo (posicional) | decidir se entra nos Detalhes (#9) | ticket #4 |
| 13 | "Tempo no cargo" mostra só a data de início ("desde mar. de 2024"), não a duração | — | ticket #4 |
| 14 | Teto de 20 perfis/min do Guardião não é atômico entre abas e pode estourar em 1 ou 2 perfis | trancar via service worker se importar | ticket #5 |
| 15 | Validar o tema escuro no LinkedIn real: o Card lê a cor de fundo de `body`/`html` (implementado no ticket #7, só testado em suíte) | José | ticket #7 |
| 16 | Apagar `quicklook-*.json` de `Downloads` (dados reais de terceiros; já viraram fixtures anonimizadas) | José | sessão 2026-10-01 |
| 17 | Cookie `li_at` foi colado na conversa; José fez logout das sessões. Não colar cookies de novo | — | sessão 2026-10-01 |
| 18 | Confirmar a URL de composição de mensagem (`/messaging/compose/?recipient=<id do urn>` em `src/export.ts`, **não confirmado**): clicar "Enviar mensagem" no Card e ver se abre a conversa com a Pessoa | José | ticket #8 |
| 19 | Ligar o GitHub Pages para a política de privacidade e registrar a URL pública (o popup hoje aponta para `PRIVACY.md` no repositório) | autorização do José | ticket #17 |
| 20 | Tickets #9 a #15 (Detalhes, Perfil secundário, Empresa) precisam de capturas reais (`.scratch/capturar.js`) de cada endpoint antes de implementar | José, rodar a captura | spec #1 |
| 21 | Aviso do Sales Navigator só olha o caminho ao carregar a página; navegação interna sem recarregar não o mostra | — | ticket #16 |
