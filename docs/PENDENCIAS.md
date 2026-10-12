# Pendências
| # | Pendência | Depende de | Origem |
|---|---|---|---|
| 6 | Mapear endpoints Voyager dos Detalhes e gravar fixtures | tickets #9 a #15 | spec #1 |
| 8 | Escrever `PRIVACY.md` e publicar via GitHub Pages | ticket #17, autorização do José | spec #1 |
| 9 | `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `.gitignore` e o spec seguem fora do git, por decisão do José em 01/10 | — | sessão 2026-10-01 |
| 10 | Gravar fixture de HTML em inglês (as duas capturas de "en" vieram com a página em português) | José, rodar `.scratch/capturar-html.js` com a interface do LinkedIn em inglês | ticket #4 |
| 11 | Confirmar o valor do grau de conexão para 3º ou mais (só vi `Distance1` e `Distance2`; o código aceita `Distance3`) | perfil de 3º grau | ticket #4 |
| 12 | Localização de perfis de terceiros: a Voyager só traz `location.countryCode` (ex.: `BR`) e o texto ("Florianópolis, Santa Catarina, Brasil") só existe no HTML do topo, em posição; fora do Card por enquanto | decidir se vale ler do HTML | ticket #4, captura de 11/10 |
| 13 | "Tempo no cargo" mostra só a data de início ("desde mar. de 2024"), não a duração | — | ticket #4 |
| 14 | Teto de 20 perfis/min do Guardião não é atômico entre abas e pode estourar em 1 ou 2 perfis | trancar via service worker se importar | ticket #5 |
| 15 | Validar o tema escuro no LinkedIn real: o Card lê a cor de fundo de `body`/`html` (implementado no ticket #7, só testado em suíte) | José | ticket #7 |
| 16 | Apagar de `Downloads` os `quicklook-*.json` (dados reais de terceiros; os de 01/10 já viraram fixtures anonimizadas, os de 11/10 ainda não: `quicklook-detalhes-*`, `quicklook-empresa-bubble`) | José | sessão 2026-10-01 |
| 17 | Cookie `li_at` foi colado na conversa; José fez logout das sessões. Não colar cookies de novo | — | sessão 2026-10-01 |
| 18 | Confirmar a URL de composição de mensagem (`/messaging/compose/?recipient=<id do urn>` em `src/export.ts`, **não confirmado**): clicar "Enviar mensagem" no Card e ver se abre a conversa com a Pessoa | José | ticket #8 |
| 20 | Capturas de rede (`.scratch/capturar-rede.js`) para: **formação** (a página `/details/education/` chega sem a lista), **dados de contato** (o overlay chega sem o conteúdo), **postagens** da Pessoa e da Empresa (o HTML de atividade mistura reações e reposts e nem todo post traz o id) e **troca de idioma do perfil** (Perfil secundário) | José, rodar a captura | tickets #9, #11, #12, #13, #15 |
| 21 | Aviso do Sales Navigator só olha o caminho ao carregar a página; navegação interna sem recarregar não o mostra | — | ticket #16 |
| 23 | A decoração `TopCardSupplementary-120` traz o grau (`memberDistance: DISTANCE_2`), seguidores e a Formação principal numa chamada só; pode substituir a leitura de 320 KB de HTML do grau. Falta ver o formato para 1º grau e 3º+ | captura de perfil 1º e 3º grau | captura de 11/10 |
| 24 | Cargos agrupados na mesma empresa e a Formação ainda não foram vistos no parser de experiências (`experiencesFrom`); a lista inclui o cargo atual | captura de perfil com cargos agrupados | ticket #9 |
| 25 | Sinal de que há Perfil secundário: a seção `SupportedLocales` do HTML do perfil tem `initialContent` preenchido (num perfil) ou `$undefined` (noutro). Visto em captura de 11/10, falta a requisição da troca | captura de rede da troca de idioma | ticket #13 |
| 22 | Card muito alto (Sobre expandido) passa da borda da tela; hoje a saída é arrastar pela alça do topo. Avaliar altura máxima com rolagem | — | feedback do José, 10/10 |
