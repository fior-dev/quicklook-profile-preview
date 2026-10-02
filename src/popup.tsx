import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { setLang, t } from "./i18n";
import { DELAYS, loadSettings, DEFAULTS, type Settings, type SettingsSource } from "./settings";

const REPO = "https://github.com/fior-dev/quicklook-profile-preview";
const PRIVACY = `${REPO}/blob/main/PRIVACY.md`;

type Session = { get(keys: null): Promise<Record<string, unknown>>; remove(keys: string[]): Promise<void> };

// Apaga o cache de Pessoas e Empresas (chaves "cache:..."); o limitador de requisições fica.
export const clearCache = async (session: Session) =>
  session.remove(Object.keys(await session.get(null)).filter((k) => k.startsWith("cache:")));

export function Popup({ sync, session }: { sync: SettingsSource & { set(items: Partial<Settings>): Promise<void> }; session: Session }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [cleared, setCleared] = useState(false);
  useEffect(() => void loadSettings(sync).then(setS), []);
  setLang(s.lang);

  const save = (patch: Partial<Settings>) => {
    setS({ ...s, ...patch });
    return sync.set(patch);
  };

  return (
    <>
      <h1>{t("popupTitle")}</h1>
      <label>
        {t("popupEnabled")}
        <input type="checkbox" checked={s.enabled} onChange={(e) => save({ enabled: e.currentTarget.checked })} />
      </label>
      <label>
        {t("popupLanguage")}
        <select onChange={(e) => save({ lang: e.currentTarget.value as Settings["lang"] })}>
          <option value="auto" selected={s.lang === "auto"}>{t("popupLangAuto")}</option>
          <option value="pt_BR" selected={s.lang === "pt_BR"}>Português (Brasil)</option>
          <option value="en" selected={s.lang === "en"}>English</option>
        </select>
      </label>
      <label>
        {t("popupDelay")}
        <select onChange={(e) => save({ delay: Number(e.currentTarget.value) })}>
          {DELAYS.map((ms) => (
            <option value={ms} selected={ms === s.delay}>
              {ms} ms
            </option>
          ))}
        </select>
      </label>
      <div class="row">
        <button type="button" onClick={() => clearCache(session).then(() => setCleared(true))}>
          {t("popupClearCache")}
        </button>
        {cleared && <span class="ok" role="status">{t("popupCleared")}</span>}
      </div>
      <footer>
        <a href={PRIVACY} target="_blank" rel="noopener noreferrer">{t("popupPrivacy")}</a>
        <a href={REPO} target="_blank" rel="noopener noreferrer">{t("popupGithub")}</a>
      </footer>
    </>
  );
}

// ponytail: o teste renderiza `Popup` direto; só a extensão real monta sozinha.
const app = typeof chrome !== "undefined" && chrome.runtime?.id && document.getElementById("app");
if (app) render(<Popup sync={chrome.storage.sync} session={chrome.storage.session} />, app);
