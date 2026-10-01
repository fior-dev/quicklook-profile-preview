import { readFileSync } from "node:fs";
import type { Store } from "../src/guard";

export const messages = JSON.parse(readFileSync("_locales/en/messages.json", "utf8"));

// chrome.i18n falso que lê o messages.json real e aplica $1, para faltar chave quebrar o teste.
export const fakeChrome = () => ({
  i18n: {
    getMessage: (k: string, subs: string[] = []) =>
      (messages[k]?.message ?? "").replace(/\$(\d)/g, (_: string, i: string) => subs[Number(i) - 1] ?? ""),
  },
});

export const memoryStorage = (): Store => {
  const data: Record<string, unknown> = {};
  return {
    get: async (keys) => Object.fromEntries([keys].flat().filter((k) => k in data).map((k) => [k, structuredClone(data[k])])),
    set: async (items) => void Object.assign(data, structuredClone(items)),
  };
};
