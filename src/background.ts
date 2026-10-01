// O content script lê e grava o cache e o limitador em storage.session; por padrão só contextos confiáveis têm acesso.
chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" });
