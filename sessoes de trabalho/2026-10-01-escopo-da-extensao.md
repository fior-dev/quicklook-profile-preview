# Sessão 01/10/2026, escopo da extensão

Li a extensão de referência e as políticas do LinkedIn e da Chrome Web Store, conduzi a entrevista de escopo e escrevi glossário, ADRs, spec e AGENTS.md; nenhum código de produto foi escrito.

## A pergunta que abriu a sessão

Como criar uma extensão parecida com "LinkedIn Profile Popups" (`ggdddcfhmnhnhlejphfldpmofkkombeh`), mas com output melhor, publicar para o público e aprender a desenvolver extensões com boas práticas.

## Resposta curta

Escopo da v1 fechado em `.scratch/quicklook-v1/spec.md`: Card interativo em todo `www.linkedin.com` (menos Sales Navigator/Recruiter), Resumo no hover e Detalhes sob demanda, dados via Voyager + HTML do perfil, sem backend nem telemetria, Preact + Tailwind em Shadow DOM. Nome: "QuickLook - Profile Preview".

## O que descobri

- A extensão instalada estava em `%LOCALAPPDATA%\Google\Chrome\User Data\Profile 2\Extensions\ggdddcfhmnhnhlejphfldpmofkkombeh\1.0.0_0`, não em `Default`. Copiei para `reference/linkedin-profile-popups/`.
- A referência lê `JSESSIONID` e chama `/voyager/api/identity/dash/profiles?q=memberIdentity`; como a Voyager não traz empresa, quase todo hover também baixa o HTML do perfil. Cache de 7 dias em `storage.local` (`li-ext:profile:`). Detalhes em `docs/research/reference-extension.md`.
- O backend da referência (`linked-in-extension.vercel.app/api/log-info`) só recebe telemetria opt-in, com chave fixa no cliente.
- A seção 8.2 do User Agreement do LinkedIn proíbe plugins de scraping. A referência não faz nada a respeito. Aceitamos o risco com mitigações (ADR 0001).
- O painel da Chrome Web Store mostra usuários semanais, instalações e desinstalações, mas não uso por funcionalidade. **Não confirmado** no painel real: vem do meu conhecimento da documentação.
- Os links developer.chrome.com do documento de pesquisa, exceto Limited Use, não foram abertos pelo agente. **Não confirmado.**

## O que foi alterado, e por quem

Tudo pelo agente: `git init` foi feito pelo José; o agente criou `reference/`, `.gitignore`, `CONTEXT.md`, `docs/research/reference-extension.md`, `docs/adr/0001-*`, `docs/adr/0002-*`, `.scratch/quicklook-v1/spec.md`, `AGENTS.md`, `CLAUDE.md`, `docs/PENDENCIAS.md` e este arquivo.

## Onde eu errei

- Na primeira resposta indiquei o caminho da extensão em `Default`; ela estava em `Profile 2`. Procurar em todos os perfis com `Get-ChildItem -Recurse` resolveu.
- Gravei o `.gitignore` com `Set-Content -Encoding utf8` no PowerShell 5.1, que colocou BOM. Regravei pelo Bash.
- O José propôs jitter e simulação de comportamento humano para o limitador. Recusei: o tráfego já é humano, e camuflagem faz a extensão parecer scraper em massa. Ficou um limitador honesto (dedupe, teto, backoff em 429 com aviso).

## Aberto

1. Quebrar o spec em tickets com `/to-tickets`, ainda no Opus; depois trocar para Sonnet.
2. `LICENSE` MIT ainda não adicionada ao repositório.
3. Arquivos fora de `docs/` ficam sem commit, por decisão do José.

Resolvido no fim da sessão: seams confirmados; as skills de fluxo estão instaladas (eu errei ao dizer que não estavam, olhei só a lista da sessão); "30%" é 30% da janela usados; criei o repositório público `fior-dev/quicklook-profile-preview` via MCP do GitHub e empurrei `main`.

Os itens também estão em `docs/PENDENCIAS.md`.

## Arquivos desta sessão

`CONTEXT.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `docs/research/reference-extension.md`, `docs/adr/0001-voyager-com-risco-aceito.md`, `docs/adr/0002-sem-backend-sem-telemetria.md`, `docs/PENDENCIAS.md`, `.scratch/quicklook-v1/spec.md`
