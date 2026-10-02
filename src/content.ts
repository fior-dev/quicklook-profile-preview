import { createCard, type CardState, type Placeholder } from "./Card";
import { createGuard, type Store } from "./guard";
import { setLang } from "./i18n";
import { showInterestNotice } from "./notice";
import { DEFAULTS, watchSettings, type SettingsSource } from "./settings";
import { fetchOwnSlug, fetchPersonSummary } from "./source";

const CLOSE_MS = 300;

// Só caminho /in/<slug> em www.linkedin.com. Links promocionais ("/premium/...") caem fora por URL;
// nada de texto da interface, que muda com o idioma. Avatar vale porque o LinkedIn o envolve num <a>.
export function personSlug(a: HTMLAnchorElement): string | null {
  const u = new URL(a.getAttribute("href") ?? "", "https://www.linkedin.com/");
  if (u.hostname !== "www.linkedin.com") return null;
  // Sufixo de idioma opcional ("/in/slug/pt/") marca o Perfil secundário; por ora o Card usa o perfil principal.
  const raw = /^\/in\/([^/]+)(?:\/[a-z]{2})?\/?$/.exec(u.pathname)?.[1];
  if (!raw) return null;
  // O href já vem codificado ("fl%C3%A1vio"); devolvemos o slug puro para a Fonte codificar uma vez só.
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// Nome e foto que a página já mostra, para o Card não parecer vazio enquanto carrega.
const placeholderOf = (a: HTMLAnchorElement): Placeholder => {
  const name = a.textContent?.replace(/\s+/g, " ").trim().slice(0, 80);
  const img = (a.closest("li, [data-view-name]") ?? a).querySelector<HTMLImageElement>('img[src*="licdn"], img[src*="media.li"]');
  return { name: name || undefined, photo: img?.src.startsWith("https://") ? img.src : undefined };
};

const triggerOf = (n: EventTarget | null) => (n as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;

export function start(doc: Document, deps: { fetch: typeof fetch; storage: Store; settings: SettingsSource }) {
  const guard = createGuard(deps.storage, (slug) => fetchPersonSummary(slug, { fetch: deps.fetch, cookie: doc.cookie }));
  let open: ReturnType<typeof setTimeout> | undefined;
  let close: ReturnType<typeof setTimeout> | undefined;
  let current = 0; // invalida buscas em andamento quando o Card fecha ou troca de alvo
  let shown: HTMLAnchorElement | null = null;
  let ownSlug: Promise<string | null> | undefined;
  let settings = DEFAULTS;

  const hide = () => {
    // Fechar com o foco dentro do Card devolve o foco ao Gatilho.
    if (doc.activeElement === card.host) shown?.focus();
    clearTimeout(open);
    clearTimeout(close);
    current++;
    shown = null;
    card.hide();
  };
  const scheduleClose = () => {
    clearTimeout(open);
    clearTimeout(close);
    close = setTimeout(hide, CLOSE_MS);
  };
  const card = createCard(doc, hide);
  const cookie = () => doc.cookie;

  showInterestNotice(doc, deps.settings);
  watchSettings(deps.settings, (s) => {
    settings = s;
    setLang(s.lang);
    if (!s.enabled) hide();
  });

  card.host.addEventListener("mouseover", () => clearTimeout(close));
  card.host.addEventListener("mouseout", scheduleClose);

  // Depois de recarregar a extensão, a aba mantém o script antigo com o contexto invalidado (chrome.* lança).
  // Ele se retira em silêncio; só um F5 na aba traz o script novo.
  const alive = () => !!chrome.runtime?.id || (card.host.remove(), false);

  const openCard = async (a: HTMLAnchorElement, slug: string, focus = false) => {
    if (!alive() || !settings.enabled) return;
    ownSlug ??= fetchOwnSlug({ fetch: deps.fetch, cookie: cookie() });
    const id = ++current;
    if (slug === (await ownSlug)) return;
    if (id !== current) return;
    shown = a;
    const rect = a.getBoundingClientRect();
    card.show({ kind: "loading", placeholder: placeholderOf(a) }, rect);
    if (focus) card.focus();
    let state: CardState;
    try {
      const r = await guard.person(slug, doc.documentElement.lang);
      state =
        "limited" in r
          ? { kind: "limited", mode: r.limited, retryAt: r.retryAt }
          : r.person.name
            ? { kind: "ready", person: r.person, failed: r.failed, lang: doc.documentElement.lang }
            : { kind: "error" };
    } catch {
      state = { kind: "error" };
    }
    if (id !== current || !alive()) return;
    card.show(state, rect);
  };

  // Alt+Q com um Gatilho focado abre o Card e leva o foco para ele; Esc fecha e devolve o foco ao Gatilho.
  doc.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return hide();
    if (!e.altKey || e.code !== "KeyQ" || !settings.enabled) return;
    const a = triggerOf(doc.activeElement);
    const slug = a && personSlug(a);
    if (!a || !slug) return;
    e.preventDefault();
    clearTimeout(open);
    clearTimeout(close);
    if (a === shown) card.focus();
    else openCard(a, slug, true);
  });

  doc.addEventListener("mouseover", (e) => {
    if (!alive() || !settings.enabled) return;
    const a = triggerOf(e.target);
    const slug = a && personSlug(a);
    if (!a || !slug) return;
    clearTimeout(close);
    if (a === shown) return;
    clearTimeout(open);
    open = setTimeout(() => openCard(a, slug), settings.delay);
  });

  doc.addEventListener("mouseout", (e) => {
    const a = triggerOf(e.target);
    if (!a) return;
    // Mover entre filhos do mesmo link (avatar -> nome) não é sair do Gatilho.
    if (e.relatedTarget && a.contains(e.relatedTarget as Node)) return;
    scheduleClose();
  });
}

// ponytail: o teste importa `start` direto; só a extensão real (chrome.runtime.id) dispara sozinha.
if (typeof chrome !== "undefined" && chrome.runtime?.id) start(document, { fetch: window.fetch.bind(window), storage: chrome.storage.session, settings: chrome.storage.sync });
