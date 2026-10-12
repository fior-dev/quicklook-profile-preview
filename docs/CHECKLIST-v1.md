# Checklist da v1, por história do spec

Números das histórias: seção "User Stories" do spec (issue #1 no GitHub, `https://github.com/fior-dev/quicklook-profile-preview/issues/1`; cópia local em `.scratch/quicklook-v1/spec.md`). Não confundir com os números das issues dos tickets (#2 a #18), que são outra lista.

Estado em 12/10/2026. A fonte de "validado" é o que o José escreveu na conversa de 11 e 12/10; o que ele não citou fica em "só teste automático".

## Validado pelo José no LinkedIn real

| Histórias | O quê | O que ele disse |
|---|---|---|
| 1, 2, 3, 13 | Card abre em link e avatar de Pessoa e Empresa, no feed, busca, perfil, Empresa e mensagens | "o card abre e traz infos em todas as telas do linkedin" |
| 18 a 23, 35 | Resumo da Pessoa e da Empresa | "está entregando nas funcionalidades" |
| 7, 8, 15 | `Esc` e botão X fecham o Card; não abre sobre o próprio perfil | "botão X e esc para fechar o card" e "não abrir o card sobre o proprio perfil" (12/10) |
| 24 | Experiências passadas | "as experiências estão sendo puxadas corretamente" |
| 26 | Conexões em comum | "conexões em comum aparecem" (12/10) |
| 36, 37 | Pessoas que o Usuário conhece e Vagas, na Empresa | "o formato que vc traz as pessoas já está ótimo"; "vagas testado e funcionando ok" (12/10) |
| (extra) | Aviso de primeiro uso: aceitar, recusar, Card só abre depois do aceite, pt e en | "validado o teste de primeiro uso conforme instruções, tudo passou" (12/10) |
| 39, 40 | Enviar mensagem abre a página de mensagem, sem enviar | "ele abre a pagina de envio de mensagem e isso ficou bom" |
| 41 a 45 | Copiar, salvar `.md`, confirmação, abrir perfil | "todos os botões estão funcionando conforme esperado" |
| 65, 67 | Tema claro e escuro; português e inglês | "é claro escuro funcionando português e inglês também" |
| (extra) | Arrastar o Card pela alça do topo | "O arrastar o card está funcionando" |

## Fora da v1 (decisão do José em 12/10/2026)

| Histórias | O quê | Por quê |
|---|---|---|
| 25 | Formação | "pouco importa"; a página chega sem a lista, precisa de captura de rede |
| 27, 28 | Postagens da Pessoa | não precisa |
| 29, 30, 31 | Contato e links da Pessoa | não precisa |
| 33, 34 | Botão PT/EN (Perfil secundário) | "os textos já vêm de acordo com o perfil" |
| 38 | Postagens da Empresa | não precisa |
| 11, 12 | `Alt+Q` e `Tab` | "não é relevante"; o código existe e passa nos testes, mas o José não testou |

## Sem validação manual (só teste automático)

4 a 6, 9, 10, 14, 16, 17, 32, 46 a 64, 66, 68 a 71. O José disse confiar nos testes automáticos. A lista, para referência:

- 16 (links promocionais)
- 55 a 60 (popup: ligar/desligar, idioma, delay, limpar cache, links, aplicar sem recarregar)
- 61 a 64 (Sinal de interesse: botão no popup e aviso em `/sales/` e `/talent/`)
- 46 a 48 (Card parcial e "Reportar problema")

As histórias de mantenedor (72 a 76) e as de privacidade (68 a 71) não dependem de teste no navegador; ver `PRIVACY.md`, `LICENSE` e `tests/`.
