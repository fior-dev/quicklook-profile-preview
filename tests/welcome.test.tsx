import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "preact";
import { act } from "preact/test-utils";
import { start } from "../src/content";
import { Popup } from "../src/popup";
import { setLang } from "../src/i18n";
import { Welcome } from "../src/welcome";
import { fakeChrome, fakeSync, linkedinFetch, memoryStorage, messages } from "./helpers";
import pt from "../_locales/pt_BR/messages.json";

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 0)));

describe("aviso de primeiro uso", () => {
  let root: HTMLElement;
  beforeEach(() => {
    vi.stubGlobal("chrome", fakeChrome());
    document.body.innerHTML = '<div id="root"></div>';
    root = document.getElementById("root")!;
  });
  afterEach(() => {
    setLang("auto");
    vi.unstubAllGlobals();
  });

  it("explica o risco sem esconder: o que não faz, a regra do LinkedIn, risco baixo mas não zero, e os links", async () => {
    await act(() => render(<Welcome sync={fakeSync({ accepted: false })} />, root));
    await settle();
    for (const k of ["welcomeNo1", "welcomeNo2", "welcomeRisk1", "welcomeRisk2", "welcomeConfirm"]) {
      expect(root.textContent).toContain((messages as any)[k].message);
    }
    const hrefs = [...root.querySelectorAll("a")].map((a) => a.href);
    expect(hrefs).toContain("https://fior-dev.github.io/quicklook-profile-preview/PRIVACY");
    expect(hrefs).toContain("https://www.linkedin.com/legal/user-agreement");
    for (const a of root.querySelectorAll("a")) expect(a.rel).toContain("noopener");
  });

  it("aceitar grava accepted em storage.sync; recusar não grava nada", async () => {
    const sync = fakeSync({ accepted: false });
    const set = vi.spyOn(sync, "set");
    await act(() => render(<Welcome sync={sync} />, root));
    await settle();
    const [accept, decline] = [...root.querySelectorAll("button")];
    await act(() => {
      decline.click();
    });
    expect(set).not.toHaveBeenCalled();
    expect(root.textContent).toContain(messages.welcomeDeclined.message);

    render(null, root);
    await act(() => render(<Welcome sync={sync} />, root));
    await settle();
    await act(() => {
      root.querySelector<HTMLButtonElement>("button.primary")!.click();
    });
    await settle();
    expect(set).toHaveBeenCalledWith({ accepted: true });
    expect(root.querySelector('[role="status"]')?.textContent).toBe(messages.welcomeAccepted.message);
    expect(accept).toBeTruthy();
  });

  it("segue o idioma escolhido no popup", async () => {
    await act(() => render(<Welcome sync={fakeSync({ lang: "pt_BR" })} />, root));
    await settle();
    expect(root.textContent).toContain(pt.welcomeTitle.message);
  });

  it("sem aceite o Card não abre nem faz requisição; depois do aceite abre, sem recarregar", async () => {
    vi.useFakeTimers();
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = '<a id="g" href="/in/ana-exemplo/">Ana</a>';
    const sync = fakeSync({ accepted: false });
    const fetchMock = linkedinFetch();
    start(document, { fetch: fetchMock as unknown as typeof fetch, storage: memoryStorage(), settings: sync });
    const g = document.getElementById("g")!;
    g.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(document.getElementById("quicklook-host")!.style.display).toBe("none");
    expect(fetchMock).not.toHaveBeenCalled();

    await sync.set({ accepted: true });
    g.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);
    expect(document.getElementById("quicklook-host")!.style.display).toBe("block");
    vi.useRealTimers();
  });

  it("popup avisa quando falta aceitar e leva ao aviso", async () => {
    const session = { get: vi.fn(async () => ({})), remove: vi.fn(async () => {}) };
    await act(() => render(<Popup sync={fakeSync({ accepted: false })} session={session} />, root));
    await settle();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain(messages.popupNeedsAccept.message);
    await act(() => {
      [...root.querySelectorAll("button")].find((b) => b.textContent === messages.popupReview.message)!.click();
    });
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
  });
});
