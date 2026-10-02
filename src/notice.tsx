import { render } from "preact";
import { INTEREST_URL } from "./interest";
import { detectTheme } from "./Card";
import { setLang, t } from "./i18n";
import type { SettingsSource } from "./settings";
import css from "./style.css?inline";

const SEEN = "interestNoticeSeen";

// Aviso único em /sales/ e /talent/, onde o QuickLook não funciona; fechado (ou clicado), não volta.
// ponytail: só olha o caminho ao carregar; navegação interna para /sales/ sem recarregar não mostra o aviso.
export async function showInterestNotice(doc: Document, src: SettingsSource, path = doc.location.pathname) {
  if (!/^\/(sales|talent)(\/|$)/.test(path)) return;
  const got = await src.get([SEEN, "enabled", "lang"]);
  if (got[SEEN] || got.enabled === false) return;
  setLang(got.lang ?? "auto"); // o aviso pode sair antes de watchSettings aplicar o idioma escolhido

  const host = doc.createElement("div");
  host.id = "quicklook-notice";
  host.style.cssText = "position:fixed;z-index:2147483647;right:16px;bottom:16px;width:280px";
  const root = host.attachShadow({ mode: "open" });
  const style = doc.createElement("style");
  style.textContent = css;
  const mount = doc.createElement("div");
  root.append(style, mount);
  doc.body.append(host);

  const dismiss = () => {
    host.remove();
    return src.set({ [SEEN]: true });
  };
  render(
    <div role="status" data-theme={detectTheme(doc)} class="relative rounded-lg border border-gray-300 bg-white p-3 pr-8 text-sm text-gray-900 shadow-lg dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
      <button type="button" class="absolute top-1 right-2 text-lg leading-none text-gray-500 dark:text-gray-400" aria-label={t("noticeClose")} onClick={dismiss}>
        ×
      </button>
      <p>{t("noticeText")}</p>
      <a class="mt-1 inline-block text-blue-700 underline dark:text-blue-400" href={INTEREST_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss}>
        {t("noticeAction")}
      </a>
    </div>,
    mount,
  );
}
