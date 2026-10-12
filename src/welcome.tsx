import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { setLang, t } from "./i18n";
import { loadSettings, type SettingsSource } from "./settings";

const PRIVACY = "https://fior-dev.github.io/quicklook-profile-preview/PRIVACY";
const USER_AGREEMENT = "https://www.linkedin.com/legal/user-agreement";

// Aviso de primeiro uso (ADR 0001): risco explicado sem alarme, e o Card só abre depois do aceite.
export function Welcome({ sync }: { sync: SettingsSource }) {
  const [answer, setAnswer] = useState<"accepted" | "declined">();
  const [lang, setLangState] = useState("auto");
  useEffect(() => void loadSettings(sync).then((s) => setLangState(s.lang)), []);
  setLang(lang);

  const accept = () => sync.set({ accepted: true }).then(() => setAnswer("accepted"));
  const link = (href: string, label: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );

  return (
    <>
      <h1>{t("welcomeTitle")}</h1>
      <p>{t("welcomeIntro")}</p>
      <h2>{t("welcomeDoesTitle")}</h2>
      <ul>
        <li>{t("welcomeNo1")}</li>
        <li>{t("welcomeNo2")}</li>
        <li>{t("welcomeNo3")}</li>
      </ul>
      <h2>{t("welcomeRiskTitle")}</h2>
      <p>{t("welcomeRisk1")}</p>
      <p>{t("welcomeRisk2")}</p>
      <p>{t("welcomeConfirm")}</p>
      <p class="links">
        {t("welcomeReadAlso")} {link(PRIVACY, t("popupPrivacy"))}
        {link(USER_AGREEMENT, t("welcomeUserAgreement"))}
      </p>
      {answer ? (
        <p role="status">{t(answer === "accepted" ? "welcomeAccepted" : "welcomeDeclined")}</p>
      ) : (
        <div class="actions">
          <button type="button" class="primary" onClick={accept}>
            {t("welcomeAccept")}
          </button>
          <button type="button" onClick={() => setAnswer("declined")}>
            {t("welcomeDecline")}
          </button>
        </div>
      )}
    </>
  );
}

// ponytail: o teste renderiza `Welcome` direto; só a extensão real monta sozinha.
const app = typeof chrome !== "undefined" && chrome.runtime?.id && document.getElementById("app");
if (app) render(<Welcome sync={chrome.storage.sync} />, app);
