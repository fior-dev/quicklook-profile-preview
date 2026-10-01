# Dados via Voyager e HTML do perfil, com o risco do LinkedIn aceito

O Card busca dados na API interna Voyager e, como último recurso, no HTML da página do perfil, porque o que já está renderizado na página (feed, busca) não traz os campos que justificam a extensão. Isso se enquadra literalmente na seção 8.2 do User Agreement do LinkedIn, que proíbe "browser plugins and add-ons" de fazer scraping. Aceitamos o risco (restrição da conta do Usuário, pedido de remoção da extensão) e o reduzimos assim: busca só sob demanda do Usuário, Resumo no hover e Detalhes só quando pedidos, cache curto em `storage.session`, deduplicação, teto de requisições, pausa com aviso em 429, nada sai do navegador.

## Considered Options

- Usar só o que está na página: sem risco, mas inútil no feed, onde a extensão mais importa.
- Técnicas anti-detecção (jitter, simular humano, evitar horários): rejeitado. O tráfego já é humano por construção, e camuflagem faz a extensão parecer ferramenta de scraping em massa, o que a Chrome Web Store reprova.
