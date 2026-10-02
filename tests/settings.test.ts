import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "../src/content";
import { setLang } from "../src/i18n";
import { fakeChrome, fakeSync, linkedinFetch, memoryStorage } from "./helpers";
import pt from "../_locales/pt_BR/messages.json";

const host = () => document.getElementById("quicklook-host")!;
const isOpen = () => host().style.display === "block";
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);
const hover = () => document.getElementById("g")!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

describe("configurações aplicadas nas abas abertas", () => {
  let sync: ReturnType<typeof fakeSync>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", fakeChrome());
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = `<a id="g" href="/in/ana-exemplo/">Ana</a>`;
    sync = fakeSync();
    fetchMock = linkedinFetch();
    start(document, { fetch: fetchMock as unknown as typeof fetch, storage: memoryStorage(), settings: sync });
    await wait(0);
  });

  afterEach(() => {
    setLang("auto");
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("desligar fecha o Card aberto e impede novos, sem recarregar", async () => {
    hover();
    await wait(400);
    expect(isOpen()).toBe(true);
    await sync.set({ enabled: false });
    expect(isOpen()).toBe(false);
    const calls = fetchMock.mock.calls.length;
    hover();
    await wait(2000);
    expect(isOpen()).toBe(false);
    expect(fetchMock.mock.calls.length).toBe(calls);
  });

  it("desligar durante a espera do hover cancela a abertura", async () => {
    hover();
    await wait(200);
    await sync.set({ enabled: false });
    await wait(1000);
    expect(isOpen()).toBe(false);
  });

  it("mudar o delay muda o tempo de abertura", async () => {
    await sync.set({ delay: 1000 });
    hover();
    await wait(500);
    expect(isOpen()).toBe(false);
    await wait(600);
    expect(isOpen()).toBe(true);
  });

  it("escolher idioma troca os textos do Card; automático volta ao navegador", async () => {
    fetchMock.mockImplementation(async () => new Response("{}"));
    await sync.set({ lang: "pt_BR" });
    hover();
    await wait(400);
    expect(host().shadowRoot!.textContent).toContain(pt.cardError.message);
  });
});
