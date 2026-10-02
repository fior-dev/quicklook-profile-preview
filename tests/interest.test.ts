import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTEREST_URL } from "../src/interest";
import { showInterestNotice } from "../src/notice";
import { fakeChrome, fakeSync, messages } from "./helpers";

const notice = () => document.getElementById("quicklook-notice");

describe("aviso do Sinal de interesse", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", fakeChrome());
    document.body.innerHTML = "";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("aparece em /sales/ e /talent/, com o link do formulário em nova aba", async () => {
    for (const path of ["/sales/home", "/talent/hire/123"]) {
      document.body.innerHTML = "";
      await showInterestNotice(document, fakeSync(), path);
      const a = notice()!.shadowRoot!.querySelector("a")!;
      expect(a.href).toBe(INTEREST_URL);
      expect(a.target).toBe("_blank");
      expect(a.rel).toContain("noopener");
    }
  });

  it("não aparece no resto do LinkedIn nem com a extensão desligada", async () => {
    await showInterestNotice(document, fakeSync(), "/feed/");
    await showInterestNotice(document, fakeSync(), "/in/salesperson/");
    await showInterestNotice(document, fakeSync({ enabled: false }), "/sales/home");
    expect(notice()).toBeNull();
  });

  it("fechado, não volta; a flag fica em storage.sync", async () => {
    const sync = fakeSync();
    await showInterestNotice(document, sync, "/sales/home");
    const close = notice()!.shadowRoot!.querySelector<HTMLButtonElement>(`button[aria-label="${messages.noticeClose.message}"]`)!;
    close.click();
    await Promise.resolve();
    expect(notice()).toBeNull();
    expect(await sync.get(["interestNoticeSeen"])).toEqual({ interestNoticeSeen: true });
    await showInterestNotice(document, sync, "/sales/home");
    expect(notice()).toBeNull();
  });

  it("clicar em 'Quero que funcione' também conta como visto", async () => {
    const sync = fakeSync();
    await showInterestNotice(document, sync, "/talent/x");
    notice()!.shadowRoot!.querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await Promise.resolve();
    expect((await sync.get(["interestNoticeSeen"])).interestNoticeSeen).toBe(true);
  });
});
