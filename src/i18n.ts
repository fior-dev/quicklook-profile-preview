import pt_BR from "../_locales/pt_BR/messages.json";
import en from "../_locales/en/messages.json";

const bundles: Record<string, Record<string, { message: string }>> = { pt_BR, en };
let forced: string | undefined;

// "auto" (ou qualquer outro valor) segue o idioma do navegador via chrome.i18n.
export const setLang = (lang: string) => void (forced = lang in bundles ? lang : undefined);

export const t = (key: string, ...subs: string[]): string => {
  const m = forced && bundles[forced][key]?.message;
  return m ? m.replace(/\$(\d)/g, (_, i) => subs[Number(i) - 1] ?? "") : chrome.i18n.getMessage(key, subs);
};
