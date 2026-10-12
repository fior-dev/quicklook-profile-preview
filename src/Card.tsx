import { render } from "preact";
import { useState } from "preact/hooks";
import { companyMarkdown, companyUrl, detailsMarkdown, fileName, formatSince, messageUrl, personMarkdown, profileUrl, sizeText } from "./export";
import type { Detail } from "./details";
import { t } from "./i18n";
import type { CompanySummary, Field, PersonSummary } from "./source";
import css from "./style.css?inline";

// Carrega uma seção de Detalhes; "limited" e "error" viram mensagem dentro da seção, sem derrubar o Card.
export type Loader = (section: string) => Promise<Detail | "limited" | "error">;
export type Placeholder = { name?: string; photo?: string };
export type CardState =
  | { kind: "loading"; placeholder: Placeholder }
  | { kind: "ready"; person: Partial<PersonSummary>; failed: Field[]; lang: string; load: Loader }
  | { kind: "company"; company: Partial<CompanySummary>; failed: Field[]; lang: string; load: Loader }
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
    <div data-drag class="absolute top-0 right-8 left-0 h-3 cursor-move touch-none" aria-hidden="true" />
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
    {state.kind === "ready" && <Summary key={state.person.slug} {...state} />}
    {state.kind === "company" && <CompanyView key={state.company.slug} {...state} />}
  </div>
);

const BTN = "rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600";

type ActionsProps = { text: () => string; fileSlug: string; pageUrl?: string; messageUrl?: string };

// Copiar e salvar usam a Exportação do que já foi carregado; mensagem e página só abrem páginas do LinkedIn.
const Actions = ({ text, fileSlug, pageUrl, messageUrl: msg }: ActionsProps) => {
  const [done, setDone] = useState<"copied" | "saved" | "failed">();
  const copy = () =>
    navigator.clipboard.writeText(text()).then(
      () => setDone("copied"),
      () => setDone("failed"),
    );
  const save = () => {
    const url = URL.createObjectURL(new Blob([text()], { type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: fileName(fileSlug) });
    a.click();
    URL.revokeObjectURL(url);
    setDone("saved");
  };
  return (
    <div role="group" aria-label={t("actionsLabel")} class="mt-2 flex flex-wrap items-center gap-1">
      {msg && (
        <a class={BTN} href={msg} target="_blank" rel="noopener noreferrer">
          {t("actionMessage")}
        </a>
      )}
      {pageUrl && (
        <a class={BTN} href={pageUrl} target="_blank" rel="noopener noreferrer">
          {t("actionProfile")}
        </a>
      )}
      <button type="button" class={BTN} onClick={copy}>
        {t("actionCopy")}
      </button>
      <button type="button" class={BTN} onClick={save}>
        {t("actionSave")}
      </button>
      <span role="status" class="text-xs text-gray-500 dark:text-gray-400">
        {done && t(done === "copied" ? "actionCopied" : done === "saved" ? "actionSaved" : "actionFailed")}
      </span>
    </div>
  );
};

type Section = { state: "loading" | "limited" | "error" | Detail; open: boolean };

const DetailBody = ({ s }: { s: Section["state"] }) => {
  if (s === "loading") return <p class="text-gray-500 dark:text-gray-400">{t("cardLoading")}</p>;
  if (s === "error") return <p>{t("detailError")}</p>;
  if (s === "limited") return <p>{t("detailLimited")}</p>;
  const empty = <p class="text-gray-500 dark:text-gray-400">{t("detailEmpty")}</p>;
  const link = "text-blue-700 underline dark:text-blue-400";
  switch (s.kind) {
    case "experience":
      return s.items.length ? (
        <ul class="space-y-1">
          {s.items.map((i) => (
            <li>
              <span class="font-medium">{i.title}</span> · {i.company}
              <span class="block text-xs text-gray-500 dark:text-gray-400">{i.dates}</span>
            </li>
          ))}
        </ul>
      ) : (
        empty
      );
    case "mutual":
      return s.text ? <p>{s.text}</p> : empty;
    case "jobs":
      return s.items.length ? (
        <ul class="space-y-1">
          {s.items.map((j) => (
            <li>
              <a class={link} href={j.url} target="_blank" rel="noopener noreferrer">
                {j.title}
              </a>
              {j.location && <span class="block text-xs text-gray-500 dark:text-gray-400">{j.location}</span>}
            </li>
          ))}
        </ul>
      ) : (
        empty
      );
    case "known":
      return s.text ? (
        <a class={link} href={s.url} target="_blank" rel="noopener noreferrer">
          {s.text}
        </a>
      ) : (
        empty
      );
  }
};

// Cada seção só busca quando aberta pela primeira vez (ou de novo, depois de erro).
const Details = ({ ids, load, onLoaded }: { ids: string[]; load: Loader; onLoaded: (d: Detail) => void }) => {
  const [sections, setSections] = useState<Record<string, Section>>({});
  const toggle = (id: string) => {
    const cur = sections[id];
    if (cur && cur.state !== "error" && cur.state !== "limited") return setSections({ ...sections, [id]: { ...cur, open: !cur.open } });
    setSections({ ...sections, [id]: { open: true, state: "loading" } });
    load(id).then((r) => {
      if (typeof r !== "string") onLoaded(r);
      setSections((all) => ({ ...all, [id]: { open: true, state: r } }));
    });
  };
  return (
    <div class="mt-2 border-t border-gray-300 pt-1 dark:border-gray-600">
      {ids.map((id) => (
        <div>
          <button type="button" class="flex w-full justify-between py-1 text-left font-medium" aria-expanded={!!sections[id]?.open} onClick={() => toggle(id)}>
            {t(`detail_${id}`)}
            <span aria-hidden="true">{sections[id]?.open ? "−" : "+"}</span>
          </button>
          {sections[id]?.open && (
            <div class="pb-1 text-xs">
              <DetailBody s={sections[id].state} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Detalhes já carregados entram na Exportação; trocar de Pessoa/Empresa (key) zera a lista.
const useLoaded = () => {
  const [loaded, setLoaded] = useState<Detail[]>([]);
  return [loaded, (d: Detail) => setLoaded((all) => [...all.filter((x) => x.kind !== d.kind), d])] as const;
};

const Partial_ = ({ failed }: { failed: Field[] }) =>
  failed.length > 0 ? (
    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      {t("cardPartial")}{" "}
      <a class="underline" href={reportUrl(failed)} target="_blank" rel="noopener noreferrer">
        {t("cardReport")}
      </a>
    </p>
  ) : null;

const CompanyView = ({ company: c, failed, lang, load }: { company: Partial<CompanySummary>; failed: Field[]; lang: string; load: Loader }) => {
  const [loaded, onLoaded] = useLoaded();
  return (
  <>
    <div class="flex gap-2">
      <Avatar src={c.logo} />
      <div>
        <p class="font-semibold">{c.name}</p>
        {c.followers !== undefined && (
          <p class="text-xs text-gray-500 dark:text-gray-400">{t("companyFollowers", new Intl.NumberFormat(lang || undefined).format(c.followers))}</p>
        )}
      </div>
    </div>
    {c.tagline && <p class="mt-1 text-gray-600 dark:text-gray-400">{c.tagline}</p>}
    {(c.industry || c.size) && (
      <p class="mt-1">{[c.industry, c.size && sizeText(c.size)].filter(Boolean).join(" · ")}</p>
    )}
    {c.headquarters && <p class="text-gray-500 dark:text-gray-400">{c.headquarters}</p>}
    {c.website && (
      <p class="truncate">
        <a class="text-blue-700 underline dark:text-blue-400" href={c.website} target="_blank" rel="noopener noreferrer">
          {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      </p>
    )}
    <Details ids={["jobs", "known"]} load={load} onLoaded={onLoaded} />
    <Actions text={() => companyMarkdown(c, lang, loaded)} fileSlug={c.slug ?? "empresa"} pageUrl={c.slug && companyUrl(c.slug)} />
    <Partial_ failed={failed} />
  </>
  );
};

const Summary = ({ person: p, failed, lang, load }: { person: Partial<PersonSummary>; failed: Field[]; lang: string; load: Loader }) => {
  const [loaded, onLoaded] = useLoaded();
  const since = p.since && formatSince(p.since, lang);
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
      <Details ids={["experience", "mutual"]} load={load} onLoaded={onLoaded} />
      <Actions text={() => personMarkdown(p, lang, loaded)} fileSlug={p.slug ?? "perfil"} pageUrl={p.slug && profileUrl(p.slug)} messageUrl={p.urn && messageUrl(p.urn)} />
      <Partial_ failed={failed} />
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
  // Depois de arrastado, o Card fica onde o Usuário o pôs até fechar (as trocas de estado não o reposicionam).
  let moved = false;
  mount.addEventListener("pointerdown", (e) => {
    const grip = (e.target as Element).closest("[data-drag]");
    if (!grip) return;
    e.preventDefault();
    const pe = e as PointerEvent;
    const dx = pe.clientX - host.offsetLeft;
    const dy = pe.clientY - host.offsetTop;
    const move = (m: Event) => {
      const p = m as PointerEvent;
      moved = true;
      host.style.left = `${Math.max(0, Math.min(p.clientX - dx, win.innerWidth - WIDTH))}px`;
      host.style.top = `${Math.max(0, Math.min(p.clientY - dy, win.innerHeight - 40))}px`;
    };
    const up = () => {
      mount.removeEventListener("pointermove", move);
      mount.removeEventListener("pointerup", up);
    };
    mount.addEventListener("pointermove", move);
    mount.addEventListener("pointerup", up);
    grip.setPointerCapture?.(pe.pointerId);
  });

  return {
    host,
    show(state: CardState, anchor: DOMRect) {
      render(<View state={state} theme={detectTheme(doc)} onClose={onClose} />, mount);
      host.style.display = "block";
      if (moved) return;
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
      moved = false;
      host.style.display = "none";
    },
  };
}
