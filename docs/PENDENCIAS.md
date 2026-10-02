# Pendências

| # | Pendência | Depende de | Origem |
|---|---|---|---|
| 4 | Adicionar `LICENSE` (MIT) ao repositório | ticket #17 | AGENTS.md, Git |
| 6 | Mapear endpoints Voyager dos Detalhes e gravar fixtures | tickets #9 a #15 | spec #1 |
| 7 | Criar o formulário Tally do Sinal de interesse | José (conta externa); usado no ticket #16 | spec #1 |
| 8 | Escrever `PRIVACY.md` e publicar via GitHub Pages | ticket #17, autorização do José | spec #1 |
| 9 | `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `.gitignore` e o spec seguem fora do git, por decisão do José em 01/10 | — | sessão 2026-10-01 |
| 10 | Gravar fixture de HTML em inglês (as duas capturas de "en" vieram com a página em português) | José, rodar `.scratch/capturar-html.js` com a interface do LinkedIn em inglês | ticket #4 |
| 11 | Confirmar o valor do grau de conexão para 3º ou mais (só vi `Distance1` e `Distance2`; o código aceita `Distance3`) | perfil de 3º grau | ticket #4 |
| 12 | Localização de perfis de terceiros: `address` e `locationName` vêm `null` na Voyager; só existe no HTML do topo (posicional) | decidir se entra nos Detalhes (#9) | ticket #4 |
| 13 | "Tempo no cargo" mostra só a data de início ("desde mar. de 2024"), não a duração | — | ticket #4 |
| 14 | Teto de 20 perfis/min do Guardião não é atômico entre abas e pode estourar em 1 ou 2 perfis | trancar via service worker se importar | ticket #5 |
| 15 | Card é branco sobre o LinkedIn escuro; falta tema automático | ticket #7 (issue "06: Tema e teclado") | sessão 2026-10-01 |
| 16 | Apagar `quicklook-*.json` de `Downloads` (dados reais de terceiros; já viraram fixtures anonimizadas) | José | sessão 2026-10-01 |
| 17 | Cookie `li_at` foi colado na conversa; José fez logout das sessões. Não colar cookies de novo | — | sessão 2026-10-01 |
