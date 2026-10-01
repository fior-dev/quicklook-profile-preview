import { createCard } from "./Card";
import { fetchPersonSummary } from "./source";

const HOVER_MS = 400;
const CLOSE_MS = 300;

// Só caminho /in/<slug> em www.linkedin.com; nada de texto da interface, que muda com o idioma.
export function personSlug(a: HTMLAnchorElement): string | null {
  const u = new URL(a.getAttribute("href") ?? "", "https://www.linkedin.com/");
  if (u.hostname !== "www.linkedin.com") return null;
  return /^\/in\/([^/]+)\/?$/.exec(u.pathname)?.[1] ?? null;
}

export function start(doc: Document, deps: { fetch: typeof fetch }) {
  const card = createCard(doc);
  let open: ReturnType<typeof setTimeout> | undefined;
  let close: ReturnType<typeof setTimeout> | undefined;
  let current = 0;

  const scheduleClose = () => {
    clearTimeout(open);
    clearTimeout(close);
    close = setTimeout(() => {
      current++;
      card.hide();
    }, CLOSE_MS);
  };

  card.host.addEventListener("mouseover", () => clearTimeout(close));
  card.host.addEventListener("mouseout", scheduleClose);

  doc.addEventListener("mouseover", (e) => {
    const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
    const slug = a && personSlug(a);
    if (!a || !slug) return;
    clearTimeout(close);
    clearTimeout(open);
    open = setTimeout(async () => {
      const id = ++current;
      const rect = a.getBoundingClientRect();
      card.show({ kind: "loading" }, rect);
      const { person, failed } = await fetchPersonSummary(slug, { fetch: deps.fetch, cookie: doc.cookie });
      if (id !== current) return;
      card.show(failed.length === 2 ? { kind: "error" } : { kind: "ready", person }, rect);
    }, HOVER_MS);
  });

  doc.addEventListener("mouseout", (e) => {
    if ((e.target as Element).closest?.("a[href]")) scheduleClose();
  });
}

// ponytail: o teste importa `start` direto; só a extensão real (chrome.runtime.id) dispara sozinha.
if (typeof chrome !== "undefined" && chrome.runtime?.id) start(document, { fetch: window.fetch.bind(window) });
