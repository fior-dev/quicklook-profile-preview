# Dados via Voyager e HTML do perfil, com o risco do LinkedIn aceito

O Card busca dados na API interna Voyager e, como último recurso, no HTML da página do perfil, porque o que já está renderizado na página (feed, busca) não traz os campos que justificam a extensão. Isso se enquadra literalmente na seção 8.2 do User Agreement do LinkedIn, que proíbe "browser plugins and add-ons" de fazer scraping. Aceitamos o risco (restrição da conta do Usuário, pedido de remoção da extensão) e o reduzimos assim: busca só sob demanda do Usuário, Resumo no hover (no máximo 4 requisições por Pessoa, ver abaixo) e Detalhes só quando pedidos, cache curto em `storage.session`, deduplicação, teto de requisições, pausa com aviso em 429, nada sai do navegador.

## Requisições no hover

Em 01/10/2026 o critério do Resumo deixou de ser "uma requisição leve". Para ter cargo e grau de conexão, que não existem na Voyager para perfis de terceiros, o Resumo de uma Pessoa faz até 4 requisições, uma vez a cada 24 h (cache): perfil (Voyager), cargos (Voyager), HTML de `/details/experience/` lido só até ~64 KB e HTML do perfil lido só até o grau (~320 KB). Empresa: 1. Cada seção de Detalhes: 1, só quando aberta. O teto de 4 por perfil no hover é decisão de arquitetura e de funcionalidade, e todas passam pelo Guardião (cache, deduplicação, ~20 perfis/min, backoff em 429).

## Aviso ao instalar

O risco aceito aqui vale para quem usa a extensão, não só para quem a mantém. Por isso, ao instalar, o Usuário vê uma página com o risco explicado em linguagem simples e só usa o Card depois de aceitar. O aviso diz a verdade nos dois sentidos: o risco prático é baixo (a extensão lê só o que o Usuário já pode ver, sob demanda, sem guardar nada fora do navegador), mas existe, porque os termos do LinkedIn proíbem extensões desse tipo.

## Considered Options

- Usar só o que está na página: sem risco, mas inútil no feed, onde a extensão mais importa.
- Técnicas anti-detecção (jitter, simular humano, evitar horários): rejeitado. O tráfego já é humano por construção, e camuflagem faz a extensão parecer ferramenta de scraping em massa, o que a Chrome Web Store reprova.
