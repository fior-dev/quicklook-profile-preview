import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "preact";
import { act } from "preact/test-utils";
import { clearCache, Popup } from "../src/popup";
import { setLang } from "../src/i18n";
import { INTEREST_URL } from "../src/interest";
import { fakeChrome, fakeSync, messages } from "./helpers";
import pt from "../_locales/pt_BR/messages.json";

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 0)));

const fakeSession = (data: Record<string, unknown>) => ({
  get: vi.fn(async () => ({ ...data })),
  remove: vi.fn(async (keys: string[]) => keys.forEach((k) => delete data[k])),
  data,
});

describe("popup", () => {
  let root: HTMLElement;
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const mount = async (sync = fakeSync(), session = fakeSession({})) => {
    render(null, root);
    await act(() => render(<Popup sync={sync} session={session} />, root));
    await settle();
    return { sync, session };
  };

  beforeEach(() => {
    vi.stubGlobal("chrome", fakeChrome());
    document.body.innerHTML = '<div id="root"></div>';
    root = document.getElementById("root")!;
  });
  afterEach(() => {
    setLang("auto");
    vi.unstubAllGlobals();
  });

  it("mostra os valores salvos e grava cada mudança em storage.sync", async () => {
    const sync = fakeSync({ enabled: false, delay: 700 });
    await mount(sync);
    expect(q<HTMLInputElement>('input[type="checkbox"]').checked).toBe(false);
    const [lang, delay] = root.querySelectorAll("select");
    expect(delay.value).toBe("700");

    const set = vi.spyOn(sync, "set");
    await act(() => {
      q<HTMLInputElement>('input[type="checkbox"]').click();
    });
    expect(set).toHaveBeenLastCalledWith({ enabled: true });
    await act(() => {
      delay.value = "1000";
      delay.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(set).toHaveBeenLastCalledWith({ delay: 1000 });
    await act(() => {
      lang.value = "pt_BR";
      lang.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(set).toHaveBeenLastCalledWith({ lang: "pt_BR" });
  });

  it("idioma escolhido troca os textos do popup", async () => {
    await mount(fakeSync({ lang: "pt_BR" }));
    expect(root.textContent).toContain(pt.popupEnabled.message);
    await mount(fakeSync({ lang: "auto" }));
    expect(root.textContent).toContain(messages.popupEnabled.message);
  });

  it("Limpar cache apaga só as chaves cache:, e confirma", async () => {
    const session = fakeSession({ "cache:en:ana": 1, "cache:pt:bia": 2, rate: { stamps: [] } });
    await mount(fakeSync(), session);
    await act(() => {
      q<HTMLButtonElement>("button").click();
    });
    await settle();
    expect(session.data).toEqual({ rate: { stamps: [] } });
    expect(root.querySelector('[role="status"]')?.textContent).toBe(messages.popupCleared.message);
  });

  it("clearCache sem nada em cache não quebra", async () => {
    const session = fakeSession({});
    await clearCache(session);
    expect(session.remove).toHaveBeenCalledWith([]);
  });

  it("links de interesse, privacidade e GitHub abrem em nova aba", async () => {
    await mount();
    const links = [...root.querySelectorAll("a")];
    expect(links).toHaveLength(3);
    for (const a of links) {
      expect(a.target).toBe("_blank");
      expect(a.rel).toContain("noopener");
    }
    expect(links[0].href).toBe(INTEREST_URL);
    expect(links[1].href).toMatch(/PRIVACY\.md$/);
    expect(links[2].href).toBe("https://github.com/fior-dev/quicklook-profile-preview");
  });
});
