import { vi } from "vitest";
import { readFileSync } from "node:fs";
import type { Store } from "../src/guard";

export const messages = JSON.parse(readFileSync("_locales/en/messages.json", "utf8"));

// chrome.i18n falso que lê o messages.json real e aplica $1, para faltar chave quebrar o teste.
export const fakeChrome = () => ({
  i18n: {
    getMessage: (k: string, subs: string[] = []) =>
      (messages[k]?.message ?? "").replace(/\$(\d)/g, (_: string, i: string) => subs[Number(i) - 1] ?? ""),
  },
  runtime: { getManifest: () => ({ version: "9.9.9" }) },
});

export const memoryStorage = (): Store => {
  const data: Record<string, unknown> = {};
  return {
    get: async (keys) => Object.fromEntries([keys].flat().filter((k) => k in data).map((k) => [k, structuredClone(data[k])])),
    set: async (items) => void Object.assign(data, structuredClone(items)),
  };
};

const read = (f: string) => readFileSync(`tests/fixtures/${f}`, "utf8");
export const fixtures = {
  profile: read("person-profile.json"),
  positions: read("person-positions.json"),
  topcard: read("person-topcard.html"),
  experience: read("person-experience.html"),
};

// `fetch` falso do LinkedIn: roteia por URL e devolve as fixtures gravadas. `overrides` troca uma rota por vez.
export const linkedinFetch = (overrides: Partial<Record<keyof typeof fixtures | "me", () => Response>> = {}) =>
  vi.fn(async (url: string) => {
    const pick = (k: keyof typeof fixtures | "me", body: string) => (overrides[k] ?? (() => new Response(body)))();
    if (url.startsWith("/voyager/api/me")) return pick("me", JSON.stringify({ included: [{ publicIdentifier: "eu-mesmo" }] }));
    if (url.includes("memberIdentity")) return pick("profile", fixtures.profile);
    if (url.includes("profilePositionGroups")) return pick("positions", fixtures.positions);
    if (url.includes("/details/experience/")) return pick("experience", fixtures.experience);
    return pick("topcard", fixtures.topcard);
  });
