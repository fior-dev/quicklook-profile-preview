// O content script lê e grava o cache e o limitador em storage.session; por padrão só contextos confiáveis têm acesso.
chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" });

// Primeiro uso: abre o aviso de riscos (página de opções) para o Usuário ler e aceitar. Sem aceite, o Card não abre.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") chrome.runtime.openOptionsPage();
});
