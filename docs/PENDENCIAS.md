# Pendências
| # | Pendência | Depende de | Origem |
|---|---|---|---|
| 6 | Mapear endpoints Voyager dos Detalhes e gravar fixtures | tickets #9 a #15 | spec #1 |
| 9 | `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `.gitignore` e o spec seguem fora do git, por decisão do José em 01/10 | — | sessão 2026-10-01 |
| 10 | Gravar fixture de HTML em inglês (as duas capturas de "en" vieram com a página em português) | José, rodar `.scratch/capturar-html.js` com a interface do LinkedIn em inglês | ticket #4 |
| 11 | Confirmar o valor do grau de conexão para 3º ou mais (só vi `Distance1` e `Distance2`; o código aceita `Distance3`) | perfil de 3º grau | ticket #4 |
| 12 | Localização de perfis de terceiros: a Voyager só traz `location.countryCode` (ex.: `BR`) e o texto ("Florianópolis, Santa Catarina, Brasil") só existe no HTML do topo, em posição; fora do Card por enquanto | decidir se vale ler do HTML | ticket #4, captura de 11/10 |
| 13 | "Tempo no cargo" mostra só a data de início ("desde mar. de 2024"), não a duração | — | ticket #4 |
| 14 | Teto de 20 perfis/min do Guardião não é atômico entre abas e pode estourar em 1 ou 2 perfis | trancar via service worker se importar | ticket #5 |
| 16 | Apagar de `Downloads` os `quicklook-*.json` (dados reais de terceiros; os de 01/10 já viraram fixtures anonimizadas, os de 11/10 ainda não: `quicklook-detalhes-*`, `quicklook-empresa-bubble`). Três deles (`quicklook-detalhes-*`) trazem também o `JSESSIONID` da sessão atual, visto em 12/10 | José | sessão 2026-10-01 |
| 17 | Cookie `li_at` foi colado na conversa; José fez logout das sessões. Não colar cookies de novo | — | sessão 2026-10-01 |
| 20 | Depois da v1, se houver demanda: **formação** (história 25), **contato** (29 a 31), **postagens** (27, 28, 38). Precisam de captura de rede (`.scratch/capturar-rede.js`). Fora da v1: issues #11 e #12; o PT/EN (histórias 33 e 34, issue #13) foi descartado | José, rodar a captura | decisão de 12/10; `docs/CHECKLIST-v1.md` |
| 21 | Aviso do Sales Navigator só olha o caminho ao carregar a página; navegação interna sem recarregar não o mostra | — | ticket #16 |
| 23 | A decoração `TopCardSupplementary-120` traz o grau (`memberDistance: DISTANCE_2`), seguidores e a Formação principal numa chamada só; pode substituir a leitura de 320 KB de HTML do grau. Falta ver o formato para 1º grau e 3º+ | captura de perfil 1º e 3º grau | captura de 11/10 |
| 24 | Cargos agrupados na mesma empresa e a Formação ainda não foram vistos no parser de experiências (`experiencesFrom`); a lista inclui o cargo atual | captura de perfil com cargos agrupados | ticket #9 |
| 25 | Sinal de que há Perfil secundário: a seção `SupportedLocales` do HTML do perfil tem `initialContent` preenchido (num perfil) ou `$undefined` (noutro). Visto em captura de 11/10, falta a requisição da troca | captura de rede da troca de idioma | ticket #13 |
| 22 | Card muito alto (Sobre expandido) passa da borda da tela; hoje a saída é arrastar pela alça do topo. Avaliar altura máxima com rolagem | — | feedback do José, 10/10 |
| 26 | Revisar o texto do aviso de primeiro uso (`welcome*` em `_locales/*/messages.json`) e, se quiser peso jurídico, passar por advogado: a frase "não responde por medidas do LinkedIn" é intenção, não parecer | José | ADR 0001 |
| 27 | Publicar na loja (#18): `.zip`, ícones, peça promocional e textos prontos. Faltam: capturas de tela (José), conta de desenvolvedor (José) e a decisão de enviar para revisão (José). Passo a passo em `docs/RUNBOOK-publicar-na-loja.md` | José | ticket #18 |
| 28 | Dados reais de terceiros no histórico. O conteúdo atual já é sintético (12/10): `person-topcard.html`, `person-experience.html`, `company-home.html`, o comentário de `src/details.ts`, a #25 e os nomes na sessão `2026-10-01-popup-tema-acoes-e-interesse.md`. Falta reescrever o histórico com `git filter-repo` (não instalado; `pip install git-filter-repo`), junto com a #29, e fazer force-push em `main`. Commits antigos seguem acessíveis por SHA até o GitHub fazer coleta de lixo; para garantir, pedir ao suporte ("Removing sensitive data from a repository") | autorização do José para reescrever e para o force-push | revisão de segurança, 12/10 |
| 29 | E-mail pessoal como autor nos 28 commits públicos; trocar para o noreply do GitHub (e reescrever junto com a #28, se quiser) | José, configurações do GitHub | revisão de segurança, 12/10 |
| 30 | Dependabot alerts desligado no repositório (`npm audit` deu 0 em 12/10) | autorização do José | revisão de segurança, 12/10 |
