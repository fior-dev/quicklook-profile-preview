# Política de privacidade / Privacy policy

QuickLook - Profile Preview · Atualizada em / Updated: 2026-10-01

## Português (Brasil)

**Resumo:** a extensão não tem servidor, não coleta nada e não envia nada para ninguém. Tudo acontece no seu navegador.

**O que ela lê.** Quando você para o mouse sobre uma Pessoa ou Empresa no LinkedIn, a extensão pede ao próprio LinkedIn, com a sua sessão já aberta, os dados que você teria acesso ao abrir o perfil: nome, cargo, empresa, localização, grau de conexão, "Sobre" e, quando você pede, os Detalhes. Ela só lê o que o LinkedIn já mostra a você.

**Onde ficam.**
- Cache de perfis já vistos: na memória de sessão do navegador (`chrome.storage.session`). Expira em 24 horas e some quando você fecha o navegador. O botão "Limpar cache" do popup apaga tudo na hora.
- Configurações (ligar/desligar, idioma, atraso do hover) e a marca de que você já viu o aviso do Sales Navigator/Recruiter: em `chrome.storage.sync`. O Chrome pode sincronizar esses valores com a sua conta Google; eles não contêm dados do LinkedIn.

**O que nunca acontece.**
- Nenhum dado seu ou de outras pessoas é enviado a servidores do desenvolvedor ou de terceiros. Não existe servidor.
- Sem telemetria, estatística de uso, anúncio ou rastreador.
- A extensão não envia mensagens, não conecta, não segue e não executa nenhuma ação no LinkedIn por você. "Enviar mensagem" apenas abre a janela de mensagem; quem envia é você.
- Os dados exportados (copiar ou salvar `.md`) vão só para a sua área de transferência ou para o seu disco, por ação sua.

**Formulário de interesse.** O botão "Quero no Sales Navigator / Recruiter" abre um formulário externo (Tally) em nova aba. É opcional, e só o que você digitar nele é enviado, por você, ao Tally. A extensão não envia nada.

**Permissões.** `storage` (cache e configurações) e acesso a `https://www.linkedin.com/*` (ler os dados do perfil e exibir o Card). Nenhuma outra.

**Sem vínculo.** Esta extensão é independente e não tem relação com o LinkedIn.

**Contato.** Abra uma issue em https://github.com/fior-dev/quicklook-profile-preview/issues.

## English

**Summary:** the extension has no server, collects nothing and sends nothing to anyone. Everything happens in your browser.

**What it reads.** When you hover a Person or Company on LinkedIn, the extension asks LinkedIn itself, using your already logged-in session, for the data you could see by opening the profile: name, position, company, location, connection degree, "About" and, when you ask, the Details. It only reads what LinkedIn already shows you.

**Where it is stored.**
- Cache of profiles already seen: in the browser's session memory (`chrome.storage.session`). It expires after 24 hours and disappears when you close the browser. The popup's "Clear cache" button erases it immediately.
- Settings (on/off, language, hover delay) and the flag that you already saw the Sales Navigator/Recruiter notice: in `chrome.storage.sync`. Chrome may sync these values with your Google account; they contain no LinkedIn data.

**What never happens.**
- No data about you or other people is sent to the developer's or any third party's servers. There is no server.
- No telemetry, usage statistics, ads or trackers.
- The extension does not send messages, connect, follow or perform any action on LinkedIn for you. "Send message" only opens the message window; you send it.
- Exported data (copy or save `.md`) goes only to your clipboard or disk, by your action.

**Interest form.** The "I want it on Sales Navigator / Recruiter" button opens an external form (Tally) in a new tab. It is optional, and only what you type there is sent, by you, to Tally. The extension sends nothing.

**Permissions.** `storage` (cache and settings) and access to `https://www.linkedin.com/*` (read profile data and show the Card). No others.

**Not affiliated.** This extension is independent and has no relationship with LinkedIn.

**Contact.** Open an issue at https://github.com/fior-dev/quicklook-profile-preview/issues.
