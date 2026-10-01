# Pesquisa: extensão de referência "LinkedIn Profile Popups"

> Fonte do código: `reference/linkedin-profile-popups/` (MV3, v1.0.0). Todos os `.js` são minificados em **uma única linha** (`wc -l` = 1), então as citações de código usam **identificadores/strings literais** entre aspas em vez de números de linha. Os bundles trazem source maps inline (`//# sourceMappingURL=data:application/json;base64,...`) que revelam os módulos TypeScript originais: `src/content/hoverPopup.ts`, `src/shared/profileFetcher.ts`, `profileCache.ts`, `viewerCache.ts`, `profileCard.ts`, `helpers.ts` (content.js) e `src/background/background.ts`, `src/shared/imageCache.ts`, `node_modules/idb` (background.js).

## 1. Arquitetura

| Arquivo | Papel |
|---|---|
| `manifest.json` | MV3; `background.service_worker: "background.js"`, `"type": "module"`; content script `content.js` em `https://www.linkedin.com/*`, `run_at: "document_idle"`; `action.default_popup: "extensionWindow.html"`; `permissions: ["activeTab","storage"]`; `host_permissions: ["https://www.linkedin.com/*","https://linked-in-extension.vercel.app/*"]`; contém `key` fixa. |
| `content.js` | Núcleo: detecção de hover, busca de dados (Voyager + HTML), cache, renderização do card (`#li-ext-popup`), CSS injetado (`#li-ext-styles`), highlight de links (debug), telemetria. |
| `background.js` | Service worker: proxy/cache de imagens (IndexedDB `"li-ext-images"` via lib `idb`) e envio de telemetria ao backend Vercel (`chrome.runtime.onMessage`, `chrome.runtime.onInstalled`). |
| `extensionWindow.html` + `extensionWindow/extensionWindow.js` | Popup da action: toggles "Profile Popups", "Share Telemetry" e, só em dev mode, "Highlighting" e "View Profile Cache". |
| `viewer.html` + `viewer.js` | Página interna com grid dos perfis cacheados (`li-ext:profile:*`) e botão "Clear All" (`#clear-btn`). |

**Fluxo de mensagens**

- content -> background (campo `type`, via `chrome.runtime.sendMessage`):
  - `"resolveImage"` `{url}` -> `{ok, base64}`; o SW faz `fetch(url,{credentials:"omit"})` e cacheia o `ArrayBuffer` (background.js, `"resolveImage"===t.type`).
  - `"logInstall"` `{username, installedAt}` -> POST ao backend.
  - `"logProfileView"` `{viewerUsername, viewedUsername, isConnected, viewedAt}` -> POST ao backend.
- popup -> content (campo `action`, via `chrome.tabs.sendMessage` na aba ativa): `"setPopups"`, `"setHighlight"`, `"toggleDevMode"`, todos com `{enabled}` (extensionWindow.js; listener em content.js `"setHighlight"===e.action`).
- popup -> viewer: apenas `chrome.tabs.create({url: chrome.runtime.getURL("viewer.html")})`.

**Storage / cache**

- `chrome.storage.local`, chave `"li-ext:profile:" + profileUrl` -> `{data, cachedAt}`; TTL **6048e5 ms = 7 dias**, expurgado na leitura (content.js `Date.now()-o.cachedAt>6048e5`).
- Caches em memória por página: `h=new Map` (perfis) e `t=new Map` (imagens base64).
- IndexedDB `"li-ext-images"` (background), mesmo TTL de 7 dias.
- `localStorage["li_ext_viewer"]` no **origin do linkedin.com** = `{csrf, username}` do usuário logado (content.js `m="li_ext_viewer"`).
- Flags: `devMode`, `popupsEnabled` (default true), `highlighting`, `telemetryLogging` (default **false**), `pendingInstallLogTime` (ISO ou `"completed"`).

## 2. De onde vêm os dados

Orquestrador `M` (content.js / `profileFetcher.ts`): memória -> `storage.local` -> Voyager -> fallback HTML.

1. **CSRF**: lê o cookie `JSESSIONID` de `document.cookie` (regex `/JSESSIONID=(?:"([^"]+)"|([^;]+))/`) e o reenvia no header `csrf-token`.
2. **Voyager API (interna, não documentada)**:
   - `GET /voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=<slug>`, headers `accept: application/vnd.linkedin.normalized+json+2.1` e `csrf-token`, `credentials:"include"`, abort em 8 s (`setTimeout(()=>i.abort(),8e3)`).
   - Extrai de `data` ou `elements[]`: `firstName`, `lastName`, `headline`, `locationName`, `isConnection`; foto via `profilePicture|picture` -> `displayImage~`/`vectorImage.rootUrl` + maior `artifacts[].fileIdentifyingUrlPathSegment` (função `I`). Força `pronouns:null, company:null`.
   - `GET /voyager/api/me`: só para descobrir o username do próprio usuário (usado na telemetria).
3. **Fallback: scraping do HTML do perfil** (função `L`): `fetch(profileUrl,{credentials:"include"})` + `DOMParser`. Nome = `title` sem `" | LinkedIn"`; acha `h1, h2, h3, h4` (ou folha `a, span, strong`) com texto igual ao nome e sobe ancestrais buscando `<p>`: pronomes (regex `y`, ex. "He/Him"); os demais `<p>` viram `subtitle`, `company`, `location` **por posição** (`i[0]`, `i[1]`, `i[2]`). Foto: `img[src*="profile-displayphoto"]`. Conexão: `script:not([src])` contendo `profile_network_distance_` e `"Distance1"`. Disparado sempre que algum campo vem `null`; como o Voyager sempre devolve `company:null`, na prática **quase todo perfil gera também o fetch do HTML**.
4. Thumb imediata: `img[src*="licdn"], img[src*="media.li"]` no `li`/`[data-view-name]` mais próximo do link.

**Backend `linked-in-extension.vercel.app`** (background.js)

- Único endpoint: `POST https://linked-in-extension.vercel.app/api/log-info`, header `x-install-key: dab5c16d…dc38` (**segredo fixo no cliente**, logo não é autenticação real).
- Payloads: `{type:"install", username, installedAt}` e `{type:"profileView", viewerUsername, viewedUsername, isConnected, viewedAt}`.
- Nada é *recebido* do backend; os dados exibidos vêm só do LinkedIn. Mas **dados saem do navegador**: identidade do usuário + quais perfis ele inspecionou + se são conexões (histórico de navegação). Só acontece com `telemetryLogging` = true (opt-in; extensionWindow.html: "This telemetry helps improve profile data extraction").

**Campos exibidos no card** (renderer em content.js e viewer.js, classes `li-ext-*`): avatar (ou inicial), `name`, `pronouns`, `subtitle` (headline), `company`, `location`, badge "Connected"/"Not connected".

## 3. Trigger / UX

- `document.addEventListener("mouseover")` delegado; alvo = `closest('a[href^="https://www.linkedin.com/in/"], a[href^="/in/"]')` (const `z`). Ou seja, **links de perfil**, não imagens (apesar da `description` do manifest).
- Normalização (`a`): só `www.linkedin.com`, sem querystring, path `/in/<slug>` com locale opcional de 2 letras.
- Ignora "Try Premium/Upgrade" (regex `c`), aria-labels "is a premium member"/"manage notifications about" (regex `s`) e o próprio perfil da página atual (`u`).
- Delay de **350 ms** (`setTimeout(...,350)`); `mouseout` cancela e esconde. Mostra "Loading..." com a thumb, depois re-renderiza; `U!==s` descarta respostas de hovers antigos.
- Posição: `position: fixed`, `z-index: 99999`, `pointer-events: none`; card ~240x220 px acima do link (`t.top-220-10`), vai para baixo se ficar `<8px`, centralizado e limitado por `window.innerWidth-240-8`. Com `pointer-events:none` o card **não é clicável**.
- `MutationObserver` em `document.body` (subtree) reaplica highlight no SPA.
- extensionWindow: mostra "Active on LinkedIn" se a URL da aba ativa contém `linkedin.com`; toggles persistem no storage e notificam a aba.
- viewer: grid de cards com "Cached <data>" (`Intl.DateTimeFormat`) e "Clear All".

## 4. Pontos fracos / oportunidades para um "output melhor"

- **Poucos campos**: sem experiência atual detalhada (cargo + empresa + tempo), formação, about, skills, nº de conexões/seguidores, grau 2nd/3rd (só booleano 1st), conexões em comum, Open to Work, contato, idiomas, atividade recente. `company`/`location` do fallback são posicionais (`i[1]`, `i[2]`): frágeis e podem vir trocados.
- **Fragilidade**: API Voyager não documentada + heurísticas de texto em inglês ("Try Premium", regex de pronomes), nome casado pelo `title`, JSON embutido `profile_network_distance_`.
- **Performance/carga**: quase todo hover = 2 requisições autenticadas (Voyager + página HTML inteira); `chrome.storage.local.get` a cada `mouseover` (`await r()` no handler); MutationObserver sempre ativo no body inteiro; imagens trafegam como base64 via mensagem.
- **Bug MV3**: listeners `onMessage` declarados `async` (retornam Promise; o `!0` fica dentro da Promise), contrariando o padrão "return true para resposta assíncrona" da doc de messaging.
- **UX/a11y**: card não interativo (sem copiar/abrir/salvar), sem foco/teclado, sem i18n, sem dark mode, só `/in/`.
- **Segurança/privacidade**: segredo fixo no cliente, escrita em `localStorage` do LinkedIn, telemetria de histórico de visualização.
- Ponto bom a manter: renderização com `textContent`/`createElement` (sem `innerHTML`).

## 5. Fundamentos MV3

- Service worker efêmero, encerrado por inatividade; registrar listeners no topo, não confiar em estado global: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- Content scripts em *isolated world* (DOM compartilhado, JS separado): https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Messaging (`sendMessage`, `return true` para resposta assíncrona): https://developer.chrome.com/docs/extensions/develop/concepts/messaging
- Permissões vs host permissions; `activeTab`: https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions , https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- Requisições cross-origin (content script segue a origem da página; extensão precisa de host_permissions): https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- CSP padrão do MV3: https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy
- Proibição de código hospedado remotamente: https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code
- `chrome.storage` (local/session/sync, quotas): https://developer.chrome.com/docs/extensions/reference/api/storage
- Boas práticas de segurança: https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure

## 6. Riscos para publicação

**Chrome Web Store**
- Políticas do programa: https://developer.chrome.com/docs/webstore/program-policies/policies
- Limited Use: só coletar/usar/transmitir dados "necessary for the extension's disclosed single purpose"; histórico de navegação proibido salvo como feature visível ao usuário; exige declaração afirmativa de conformidade em site da extensão: https://developer.chrome.com/docs/webstore/program-policies/limited-use
- Dados do usuário e política de privacidade obrigatória: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq , https://developer.chrome.com/docs/webstore/program-policies/privacy
- Propósito único: https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq
- Permissões mínimas e justificativa no dashboard: https://developer.chrome.com/docs/webstore/program-policies/permissions , https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Efeito do backend da referência: `logProfileView` envia identidade + histórico de visualização a servidor próprio -> exige disclosure, privacy policy, conformidade Limited Use e justificativa do host `linked-in-extension.vercel.app`. Sem backend, a maior parte desse ônus desaparece.

**LinkedIn User Agreement, seção 8.2** (https://www.linkedin.com/legal/user-agreement) proíbe:
- "software, devices, scripts, robots or any other means or processes (such as crawlers, browser plugins and add-ons or any other technology) to scrape or copy the Services, including profiles and other data";
- "Copy, use, display or distribute any information ... obtained from the Services ... without the consent of the content owner";
- "bots or other unauthorized automated methods to access the Services".
Chamar Voyager e baixar páginas de perfil a cada hover se enquadra literalmente; riscos: restrição da conta do usuário e denúncia/remoção da extensão. Ver também https://www.linkedin.com/legal/crawling-terms . Cache persistente de dados de terceiros e envio a servidor agravam o quadro.

## 7. Perguntas em aberto (entrevista de design)

1. Quais campos formam o "output melhor"? (experiência atual com tempo, formação, about, skills, conexões em comum, grau, Open to Work, contato?)
2. Card interativo (copiar, abrir, salvar, notas) ou só leitura?
3. Fonte de dados: Voyager (rico, frágil, risco ToS) vs. HTML do perfil vs. só o que já está renderizado na página?
4. Haverá backend? Que dados sairiam do navegador e por quê (resumo por LLM? sync?). Sem backend = publicação bem mais simples.
5. Cache: duração, `storage.local` vs `storage.session`, botão de limpar, persistir dados de terceiros ou não?
6. Gatilho: hover em links, em avatares, atalho de teclado, clique? Delay configurável?
7. Escopo: feed, busca, mensagens, Sales Navigator/Recruiter?
8. i18n (pt-BR/en) e heurísticas independentes do idioma da UI do LinkedIn.
9. Throttling/rate limit para não parecer automação.
10. Stack: TS + bundler? Shadow DOM para isolar CSS do card? Framework de UI?
11. Publicação pública na CWS ou unlisted/portfólio? Aceita o risco do ToS do LinkedIn?
12. Telemetria: nenhuma, local, ou opt-in?
