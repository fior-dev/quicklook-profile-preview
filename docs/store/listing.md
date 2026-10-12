# Chrome Web Store: textos e respostas do painel

Preparado em 12/10/2026 para o envio como **não listada** (ticket #18). Nada daqui foi enviado: o envio exige autorização do José, pedida na hora.

## Ficha

| Campo | Valor |
|---|---|
| Nome | QuickLook - Profile Preview (sem "LinkedIn" no nome) |
| Idioma padrão | Português (Brasil) |
| Categoria | Produtividade |
| Visibilidade | Não listada (depois pública) |
| Site / código | https://github.com/fior-dev/quicklook-profile-preview |
| Suporte | https://github.com/fior-dev/quicklook-profile-preview/issues |
| Política de privacidade | https://fior-dev.github.io/quicklook-profile-preview/PRIVACY |
| Pacote | `quicklook-profile-preview-0.1.0.zip`, gerado por `npm run package` |

## Descrição curta (máx. 132 caracteres; vem do `manifest.json`, chave `extDescription`)

- pt-BR: Veja o resumo de uma pessoa ou empresa do LinkedIn ao passar o mouse, sem sair da página.
- en: See a summary of a LinkedIn person or company on hover, without leaving the page.

## Descrição longa, pt-BR

Passe o mouse sobre o nome ou a foto de uma pessoa ou empresa no LinkedIn e veja um resumo num cartão, sem abrir o perfil e sem perder o lugar no feed.

O que o cartão mostra:
• Pessoa: nome, pronomes, headline, cargo e empresa atuais, grau de conexão e o "Sobre". Ao abrir as seções: experiências e conexões em comum.
• Empresa: nome, slogan, setor, tamanho, sede, seguidores, site, vagas abertas e pessoas que você conhece que trabalham lá.
• Ações: enviar mensagem (só abre a janela, você envia), abrir o perfil, copiar o resumo e salvar em Markdown.
• Tema claro e escuro, português e inglês, e o cartão pode ser arrastado.

Privacidade em primeiro lugar:
• Nada sai do seu navegador. Não há servidor, anúncios nem telemetria.
• Só lê o que o LinkedIn já mostra a você, e só quando você para o mouse sobre um nome ou foto.
• Guarda um cache curto (24 horas) que some ao fechar o navegador.
• Pede só duas permissões: armazenamento e acesso a www.linkedin.com.

Importante: o LinkedIn tem regras próprias de uso que não permitem extensões que leem perfis. O risco prático é baixo, mas existe, e a decisão de usar é sua. A extensão explica isso no primeiro uso. QuickLook é independente e não tem vínculo com o LinkedIn.

Código aberto (MIT): https://github.com/fior-dev/quicklook-profile-preview

## Descrição longa, en

Hold the mouse over the name or photo of a person or company on LinkedIn and see a summary in a card, without opening the profile and without losing your place in the feed.

What the card shows:
• Person: name, pronouns, headline, current position and company, connection degree and "About". Open the sections for experience and mutual connections.
• Company: name, tagline, industry, size, headquarters, followers, website, open jobs and people you know who work there.
• Actions: send message (it only opens the window, you send it), open the profile, copy the summary and save it as Markdown.
• Light and dark theme, Portuguese and English, and the card can be dragged.

Privacy first:
• Nothing leaves your browser. No server, ads or telemetry.
• It only reads what LinkedIn already shows you, and only when you hold the mouse over a name or photo.
• It keeps a short cache (24 hours) that disappears when you close the browser.
• It asks for just two permissions: storage and access to www.linkedin.com.

Important: LinkedIn has its own rules of use that do not allow extensions that read profiles. The practical risk is low, but it exists, and the decision to use it is yours. The extension explains this on first use. QuickLook is independent and has no affiliation with LinkedIn.

Open source (MIT): https://github.com/fior-dev/quicklook-profile-preview

## Finalidade única (campo "Single purpose")

Mostrar, num cartão ao passar o mouse sobre o nome ou a foto de uma pessoa ou empresa no LinkedIn, um resumo dela, sem sair da página.

## Justificativa das permissões (aba "Privacy practices")

- **`storage`**: guarda as configurações do Usuário (ligar/desligar, idioma, atraso do hover, aceite do aviso de primeiro uso) em `chrome.storage.sync`, e um cache de 24 h dos resumos já vistos em `chrome.storage.session`, que some ao fechar o navegador.
- **Host `https://www.linkedin.com/*`**: o script de conteúdo roda nas páginas do LinkedIn para detectar o nome e a foto de pessoas e empresas e desenhar o cartão, e consulta o próprio LinkedIn, com a sessão do Usuário, só para obter o resumo do perfil que ele está olhando. Nenhum outro site é acessado.
- **Código remoto**: não. Todo o código está no pacote.
- **Outras permissões**: nenhuma (sem `tabs`, `cookies`, `scripting`, `activeTab`).
- **Páginas da extensão**: o popup do ícone (configurações) e a página de opções (aviso de primeiro uso).

## Uso de dados (declarações do painel)

- Tipos de dados coletados (transmitidos para fora do navegador): **nenhum**. A extensão processa localmente o conteúdo que o LinkedIn já exibe ao Usuário e não o envia a ninguém.
- Marcar as três declarações: não vendo dados a terceiros; não uso dados para finalidades alheias à função única; não uso dados para avaliar crédito ou empréstimo.
- Conferir os rótulos exatos da tela no momento do envio: o painel muda de texto com frequência. **Não confirmado** aqui: não abri o painel.

## Imagens

- Ícones 16/32/48/128 px: `icons/` (já no pacote, referenciados no `manifest.json`).
- **Capturas de tela (a fazer pelo José)**: 1280×800, de 1 a 5, no LinkedIn real. Sugestão:
  1. Card de uma Pessoa no feed (Resumo completo).
  2. Card com a seção "Experiências" aberta.
  3. Card de uma Empresa.
  4. Card no tema escuro.
  5. Aviso de primeiro uso.
- Cuidado com dados de terceiros nas imagens: use perfis de figuras públicas ou cubra nomes e fotos de pessoas que não autorizaram.
- **Peça promocional pequena (440×280): obrigatória** segundo https://developer.chrome.com/docs/webstore/images. Pronta em `docs/store/promo-440x280.png` (fundo azul com a lupa, sem texto).
- Ícone de 128 px: arte de 96 px com 16 px de margem transparente, como a loja recomenda (já ajustado).
- Passo a passo completo da publicação: `docs/RUNBOOK-publicar-na-loja.md`.

## Lista de envio

1. `npm run package` e conferir que o `.zip` abre sem erro.
2. José conferir o aviso de primeiro uso.
3. Capturas de tela feitas.
4. José autorizar o envio, na hora.
5. Painel: preencher a ficha, "Privacy practices" e visibilidade "Não listada".
