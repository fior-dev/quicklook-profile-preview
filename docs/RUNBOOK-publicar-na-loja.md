# Publicar a extensão na Chrome Web Store

Procedimento da primeira publicação, escrito em 12/10/2026 enquanto o José publicava pela primeira vez. Serve para repetir a publicação e para explicar o processo a outra pessoa.

Fontes oficiais lidas em 12/10/2026 (developer.chrome.com): [register](https://developer.chrome.com/docs/webstore/register), [publish](https://developer.chrome.com/docs/webstore/publish), [images](https://developer.chrome.com/docs/webstore/images), [review-process](https://developer.chrome.com/docs/webstore/review-process), [cws-dashboard-distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution), [cws-dashboard-privacy](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy). O que as páginas não dizem está marcado **não confirmado**: confira na tela do painel.

## Quem faz o quê

A publicação acontece no **Painel do Desenvolvedor da Chrome Web Store** (https://chrome.google.com/webstore/devconsole), dentro da conta Google do José. Só ele consegue entrar lá. O agente não tem acesso e não publica nada; prepara os arquivos e os textos e guia cada tela.

"Autorização do envio", no `AGENTS.md`, quer dizer: o José decide, na hora, clicar em **Enviar para revisão**. Antes disso nada fica visível a ninguém.

## Etapas

### 0. Pronto antes (feito pelo agente)

- Pacote: `npm run package` gera `quicklook-profile-preview-<versão>.zip` a partir do build de produção.
- Ícones em `icons/` (o de 128 px já vai no `.zip`) e peça promocional `docs/store/promo-440x280.png`.
- Textos, finalidade única, justificativas e declarações: `docs/store/listing.md`.
- Política de privacidade publicada: https://fior-dev.github.io/quicklook-profile-preview/PRIVACY

### 1. Conta de desenvolvedor (uma vez só, feita pelo José)

1. Entrar no painel com a conta Google que será a dona da extensão.
2. Aceitar o contrato do desenvolvedor.
3. Pagar a **taxa única de registro**. O valor não está na página oficial (**não confirmado**; costuma ser US$ 5, confirme na tela).
4. Informar o **e-mail de contato**. A documentação recomenda um endereço só para publicação, verificado com frequência, e avisa que ele **não pode ser trocado depois**.

Não confirmado nas docs: verificação em duas etapas e a declaração "comerciante/não comerciante" (exigência europeia). O painel pede o que for necessário.

Uma conta nova pode publicar até duas extensões no início.

### 2. Capturas de tela (feitas pelo José)

- Mínimo 1, ideal 5. Tamanho **1280×800** (preferido) ou 640×400, cantos retos, sem margem. A loja reduz tudo para 640×400.
- Sugestão: (1) Card de uma Pessoa no feed; (2) Card com "Experiências" aberta; (3) Card de uma Empresa; (4) Card no tema escuro; (5) aviso de primeiro uso.
- Privacidade: nas imagens, use perfis de figuras públicas ou cubra nome e foto de quem não autorizou.
- Como tirar com o tamanho certo, sem o Card fechar: deixe o mouse parado sobre o nome (o Card abre), aperte F12, `Ctrl+Shift+M` (modo dispositivo), escolha "Responsive" com 1280×800, depois `Ctrl+Shift+P`, digite "screenshot" e escolha "Capture screenshot". Usar só o teclado evita mover o mouse. Alternativa: o Card abre também com `Alt+Q` num link focado.

### 3. Criar o item e enviar o pacote (José, no painel)

1. **Add new item** → escolher o `.zip` → **Upload**. A aba Package fica só de leitura.
2. Aba **Store listing**: descrição (colar de `docs/store/listing.md`), categoria Produtividade, idioma, ícone 128 px (vem do pacote), capturas e **peça promocional pequena 440×280, que é obrigatória** (sem ela a extensão aparece depois das que têm). Adicionar a tradução em inglês.
3. Aba **Privacy practices**: finalidade única, justificativa de cada permissão (`storage` e o host `https://www.linkedin.com/*`), código remoto = **não**, tipos de dados coletados (nenhum), as certificações e o link da política de privacidade. As declarações são mostradas aos usuários e devem bater com `PRIVACY.md`.
4. Aba **Distribution**: gratuita; países; **visibilidade**.
   - **Unlisted (não listada)**: não aparece na busca da loja; quem tiver o link instala. É a escolha da primeira versão.
   - **Public**: aparece na loja.
   - **Private**: só e-mails/grupos que você indicar.
   As três passam pela mesma revisão.
5. Aba **Test instructions**: só é preciso se o revisor precisar de login ou passos especiais. Aqui o revisor precisa de uma conta do LinkedIn para ver o Card funcionando. **Não confirmado** se a revisão pedirá isso; se pedir, a aba é o lugar de explicar que o Card só abre com o usuário logado no LinkedIn.

### 4. Enviar para revisão (decisão do José)

1. Clicar em **Submit for Review** e confirmar.
2. Na janela de confirmação, desmarcar a publicação automática para **publicar manualmente** depois da aprovação. Depois da aprovação há **30 dias** para publicar; passado isso o envio volta a rascunho.
3. A revisão leva em geral alguns dias e pode chegar a algumas semanas; passadas três semanas, contatar o suporte. Fatores que alongam: conta e extensão novas, permissão de host (aqui só o LinkedIn, não `<all_urls>`), código minificado.

### 5. Depois do envio

- **Aprovada**: o e-mail de publicação avisa; publicar (se deixou manual). Para uma versão listada ao público depois, mudar a visibilidade para Public (**não confirmado** como e se exige nova revisão; as três visibilidades seguem a mesma política).
- **Recusada**: o e-mail de publicação traz a política violada e como recorrer. Corrigir e reenviar, ou usar **Appeal** na página do item. O risco conhecido aqui é a regra do LinkedIn (ADR 0001); se o motivo for esse, a defesa está em `docs/adr/0001-voyager-com-risco-aceito.md` (só lê o que o usuário já vê, sob demanda, nada sai do navegador, aviso ao usuário).
- **Atualizações** passam pela mesma revisão: subir a versão em `manifest.json` (campo `version`), `npm run package`, e enviar o novo `.zip` na aba Package do item.

## Lista de conferência antes de clicar em enviar

1. `npm run package` rodou e o `.zip` tem a versão certa.
2. Capturas de tela feitas e sem dados de quem não autorizou.
3. Descrições, finalidade única e justificativas coladas de `docs/store/listing.md`.
4. Política de privacidade abre em https://fior-dev.github.io/quicklook-profile-preview/PRIVACY.
5. Visibilidade **Unlisted**, publicação manual.
