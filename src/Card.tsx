import { render } from "preact";
import { useState } from "preact/hooks";
import { t } from "./i18n";
import type { Field, PersonSummary } from "./source";
import css from "./style.css?inline";

export type Placeholder = { name?: string; photo?: string };
export type CardState =
  | { kind: "loading"; placeholder: Placeholder }
  | { kind: "ready"; person: Partial<PersonSummary>; failed: Field[]; lang: string }
  | { kind: "limited"; mode: "wait" | "backoff"; retryAt: number }
  | { kind: "error" };

const GAP = 6;
const MARGIN = 8;
const WIDTH = 280;
const ABOUT_PREVIEW = 200;
const REPO = "https://github.com/fior-dev/quicklook-profile-preview";

// Só versão e nomes dos campos que falharam: nada do perfil visto.
const reportUrl = (failed: Field[]) => {
  const version = chrome.runtime?.getManifest?.().version ?? "?";
  const body = `Versão: ${version}\nCampos que falharam: ${failed.join(", ")}`;
  return `${REPO}/issues/new?title=${encodeURIComponent("Card incompleto")}&body=${encodeURIComponent(body)}`;
};

// Corta no último espaço antes do limite; o Usuário expande para ler tudo.
const About = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const long = text.length > ABOUT_PREVIEW;
  const head = text.slice(0, ABOUT_PREVIEW);
  const shown = !long || open ? text : head.slice(0, head.lastIndexOf(" ") > ABOUT_PREVIEW / 2 ? head.lastIndexOf(" ") : ABOUT_PREVIEW) + "…";
  return (
    <p class="mt-1 whitespace-pre-line text-gray-700 dark:text-gray-300">
      {shown}
      {long && (
        <>
          {" "}
          <button type="button" class="text-blue-700 dark:text-blue-400 underline" onClick={() => setOpen(!open)}>
            {t(open ? "cardLess" : "cardMore")}
          </button>
        </>
      )}
    </p>
  );
};

const Avatar = ({ src }: { src?: string }) =>
  src ? <img src={src} alt={t("cardAvatarAlt")} class="h-12 w-12 shrink-0 rounded-full object-cover" /> : null;

// Lê a cor de fundo da página (não classes do LinkedIn, que mudam); sem cor opaca, segue o tema do sistema.
const luminance = (color: string) => {
  const c = color.match(/[\d.]+/g)?.map(Number);
  if (!c || c.length < 3 || (c.length > 3 && c[3] === 0)) return undefined;
  return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
};
export const detectTheme = (doc: Document): "dark" | "light" => {
  const win = doc.defaultView!;
  for (const el of [doc.body, doc.documentElement]) {
    const l = luminance(win.getComputedStyle(el).backgroundColor);
    if (l !== undefined) return l < 0.5 ? "dark" : "light";
  }
  return win.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const View = ({ state, theme, onClose }: { state: CardState; theme: string; onClose: () => void }) => (
  <div role="dialog" aria-label={t("cardLabel")} tabIndex={-1} data-theme={theme} class="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 pr-8 text-sm text-gray-900 dark:text-gray-100 shadow-lg">
    <button type="button" class="absolute top-1 right-2 text-lg leading-none text-gray-500 dark:text-gray-400" aria-label={t("cardClose")} onClick={onClose}>
      ×
    </button>
    {state.kind === "loading" && (
      <div class="flex gap-2">
        <Avatar src={state.placeholder.photo} />
        <div>
          {state.placeholder.name && <p class="font-semibold">{state.placeholder.name}</p>}
          <p class="text-gray-600 dark:text-gray-400">{t("cardLoading")}</p>
        </div>
      </div>
    )}
    {state.kind === "error" && <p>{t("cardError")}</p>}
    {state.kind === "limited" && (
      <p>
        {state.mode === "wait"
          ? t("cardWait")
          : t("cardBackoff", String(Math.max(1, Math.ceil((state.retryAt - Date.now()) / 1000))))}
      </p>
    )}
    {state.kind === "ready" && <Summary {...state} />}
  </div>
);

const Summary = ({ person: p, failed, lang }: { person: Partial<PersonSummary>; failed: Field[]; lang: string }) => {
  const since = p.since && new Intl.DateTimeFormat(lang || undefined, { month: "short", year: "numeric" }).format(new Date(p.since.year, p.since.month - 1));
  return (
    <>
      <div class="flex gap-2">
        <Avatar src={p.photo} />
        <div>
          <p class="font-semibold">
            {p.name}
            {p.pronouns && <span class="font-normal text-gray-500 dark:text-gray-400"> ({p.pronouns})</span>}
          </p>
          {p.degree && <p class="text-xs text-gray-500 dark:text-gray-400">{t(`cardDegree${p.degree}`)}</p>}
        </div>
      </div>
      {p.headline && <p class="mt-1 text-gray-600 dark:text-gray-400">{p.headline}</p>}
      {(p.title || p.company) && (
        <p class="mt-1">
          {[p.title, p.company].filter(Boolean).join(" · ")}
          {since && <span class="text-gray-500 dark:text-gray-400"> ({t("cardSince", since)})</span>}
        </p>
      )}
      {p.location && <p class="text-gray-500 dark:text-gray-400">{p.location}</p>}
      {p.about && <About text={p.about} />}
      {failed.length > 0 && (
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t("cardPartial")}{" "}
          <a class="underline" href={reportUrl(failed)} target="_blank" rel="noopener noreferrer">
            {t("cardReport")}
          </a>
        </p>
      )}
    </>
  );
};

export function createCard(doc: Document, onClose: () => void) {
  const host = doc.createElement("div");
  host.id = "quicklook-host";
  host.style.cssText = `position:fixed;z-index:2147483647;width:${WIDTH}px;display:none`;
  const root = host.attachShadow({ mode: "open" });
  const style = doc.createElement("style");
  style.textContent = css;
  const mount = doc.createElement("div");
  root.append(style, mount);
  doc.body.append(host);
  const win = doc.defaultView!;

  return {
    host,
    show(state: CardState, anchor: DOMRect) {
      render(<View state={state} theme={detectTheme(doc)} onClose={onClose} />, mount);
      host.style.display = "block";
      // Abaixo do Gatilho; se não couber, acima; horizontalmente sempre dentro da tela.
      const h = host.offsetHeight;
      const below = anchor.bottom + GAP;
      const top = below + h > win.innerHeight && anchor.top - GAP - h >= 0 ? anchor.top - GAP - h : below;
      host.style.top = `${top}px`;
      host.style.left = `${Math.max(MARGIN, Math.min(anchor.left, win.innerWidth - WIDTH - MARGIN))}px`;
    },
    focus() {
      (mount.firstElementChild as HTMLElement | null)?.focus();
    },
    hide() {
      host.style.display = "none";
    },
  };
}
