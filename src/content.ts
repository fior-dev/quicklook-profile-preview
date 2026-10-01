import { createCard } from "./Card";
import { fetchOwnSlug, fetchPersonSummary } from "./source";

const HOVER_MS = 400;
const CLOSE_MS = 300;

// Só caminho /in/<slug> em www.linkedin.com. Links promocionais ("/premium/...") caem fora por URL;
// nada de texto da interface, que muda com o idioma. Avatar vale porque o LinkedIn o envolve num <a>.
export function personSlug(a: HTMLAnchorElement): string | null {
  const u = new URL(a.getAttribute("href") ?? "", "https://www.linkedin.com/");
  if (u.hostname !== "www.linkedin.com") return null;
  return /^\/in\/([^/]+)\/?$/.exec(u.pathname)?.[1] ?? null;
}

const triggerOf = (n: EventTarget | null) => (n as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;

export function start(doc: Document, deps: { fetch: typeof fetch }) {
  let open: ReturnType<typeof setTimeout> | undefined;
  let close: ReturnType<typeof setTimeout> | undefined;
  let current = 0; // invalida buscas em andamento quando o Card fecha ou troca de alvo
  let shown: HTMLAnchorElement | null = null;
  let ownSlug: Promise<string | null> | undefined;

  const hide = () => {
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

  card.host.addEventListener("mouseover", () => clearTimeout(close));
  card.host.addEventListener("mouseout", scheduleClose);
  doc.addEventListener("keydown", (e) => e.key === "Escape" && hide());

  doc.addEventListener("mouseover", (e) => {
    const a = triggerOf(e.target);
    const slug = a && personSlug(a);
    if (!a || !slug) return;
    clearTimeout(close);
    if (a === shown) return;
    clearTimeout(open);
    open = setTimeout(async () => {
      ownSlug ??= fetchOwnSlug({ fetch: deps.fetch, cookie: cookie() });
      const id = ++current;
      if (slug === (await ownSlug)) return;
      if (id !== current) return;
      shown = a;
      const rect = a.getBoundingClientRect();
      card.show({ kind: "loading" }, rect);
      const { person, failed } = await fetchPersonSummary(slug, { fetch: deps.fetch, cookie: cookie() });
      if (id !== current) return;
      card.show(failed.length === 2 ? { kind: "error" } : { kind: "ready", person }, rect);
    }, HOVER_MS);
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
if (typeof chrome !== "undefined" && chrome.runtime?.id) start(document, { fetch: window.fetch.bind(window) });
