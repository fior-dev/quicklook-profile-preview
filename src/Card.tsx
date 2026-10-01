import { render } from "preact";
import { t } from "./i18n";
import type { PersonSummary } from "./source";
import css from "./style.css?inline";

export type CardState =
  | { kind: "loading" }
  | { kind: "ready"; person: Partial<PersonSummary> }
  | { kind: "limited"; mode: "wait" | "backoff"; retryAt: number }
  | { kind: "error" };

const GAP = 6;
const MARGIN = 8;
const WIDTH = 280;

const View = ({ state, onClose }: { state: CardState; onClose: () => void }) => (
  <div class="relative rounded-lg border border-gray-300 bg-white p-3 pr-8 text-sm text-gray-900 shadow-lg">
    <button type="button" class="absolute top-1 right-2 text-gray-500" aria-label={t("cardClose")} onClick={onClose}>
      ×
    </button>
    {state.kind === "loading" && <p>{t("cardLoading")}</p>}
    {state.kind === "error" && <p>{t("cardError")}</p>}
    {state.kind === "limited" && (
      <p>
        {state.mode === "wait"
          ? t("cardWait")
          : t("cardBackoff", String(Math.max(1, Math.ceil((state.retryAt - Date.now()) / 1000))))}
      </p>
    )}
    {state.kind === "ready" && (
      <>
        <p class="font-semibold">{state.person.name}</p>
        <p class="text-gray-600">{state.person.headline}</p>
      </>
    )}
  </div>
);

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
      render(<View state={state} onClose={onClose} />, mount);
      host.style.display = "block";
      // Abaixo do Gatilho; se não couber, acima; horizontalmente sempre dentro da tela.
      const h = host.offsetHeight;
      const below = anchor.bottom + GAP;
      const top = below + h > win.innerHeight && anchor.top - GAP - h >= 0 ? anchor.top - GAP - h : below;
      host.style.top = `${top}px`;
      host.style.left = `${Math.max(MARGIN, Math.min(anchor.left, win.innerWidth - WIDTH - MARGIN))}px`;
    },
    hide() {
      host.style.display = "none";
    },
  };
}
