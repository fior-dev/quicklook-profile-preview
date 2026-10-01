import { render } from "preact";
import { t } from "./i18n";
import type { PersonSummary } from "./source";
import css from "./style.css?inline";

export type CardState =
  | { kind: "loading" }
  | { kind: "ready"; person: Partial<PersonSummary> }
  | { kind: "error" };

const View = ({ state }: { state: CardState }) => (
  <div class="rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-lg">
    {state.kind === "loading" && <p>{t("cardLoading")}</p>}
    {state.kind === "error" && <p>{t("cardError")}</p>}
    {state.kind === "ready" && (
      <>
        <p class="font-semibold">{state.person.name}</p>
        <p class="text-gray-600">{state.person.headline}</p>
      </>
    )}
  </div>
);

export function createCard(doc: Document) {
  const host = doc.createElement("div");
  host.id = "quicklook-host";
  host.style.cssText = "position:fixed;z-index:2147483647;width:280px;display:none";
  const root = host.attachShadow({ mode: "open" });
  const style = doc.createElement("style");
  style.textContent = css;
  const mount = doc.createElement("div");
  root.append(style, mount);
  doc.body.append(host);

  return {
    host,
    show(state: CardState, anchor: DOMRect) {
      render(<View state={state} />, mount);
      host.style.top = `${anchor.bottom + 6}px`;
      host.style.left = `${Math.max(8, anchor.left)}px`;
      host.style.display = "block";
    },
    hide() {
      host.style.display = "none";
    },
  };
}
