import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "../src/content";
import { fakeChrome, fakeSync, linkedinFetch, memoryStorage, messages } from "./helpers";

const host = () => document.getElementById("quicklook-host")!;
const card = () => host().shadowRoot!;
const isOpen = () => host().style.display === "block";
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);
const key = (init: KeyboardEventInit) => document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
const altQ = () => key({ altKey: true, code: "KeyQ", key: "œ" });

describe("teclado", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const link = () => document.getElementById("g") as HTMLAnchorElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", fakeChrome());
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = `<a id="g" href="/in/ana-exemplo/">Ana</a><button id="b">x</button>`;
    fetchMock = linkedinFetch();
    start(document, { fetch: fetchMock as unknown as typeof fetch, storage: memoryStorage(), settings: fakeSync() });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("Alt+Q com o Gatilho focado abre o Card na hora e leva o foco para ele", async () => {
    link().focus();
    altQ();
    await wait(0);
    expect(isOpen()).toBe(true);
    expect(card().textContent).toContain("Pedro Exemplo");
    expect(document.activeElement).toBe(host());
    expect(card().activeElement?.getAttribute("role")).toBe("dialog");
  });

  it("Alt+Q fora de um Gatilho não faz nada", async () => {
    document.getElementById("b")!.focus();
    altQ();
    await wait(500);
    expect(isOpen()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Esc fecha e o foco volta ao Gatilho", async () => {
    link().focus();
    altQ();
    await wait(0);
    key({ key: "Escape" });
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(link());
  });

  it("Esc com o Card aberto por hover não rouba o foco de outro elemento", async () => {
    link().dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await wait(400);
    document.getElementById("b")!.focus();
    key({ key: "Escape" });
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(document.getElementById("b"));
  });

  it("controles do Card são focáveis em ordem e têm nome acessível", async () => {
    link().focus();
    altQ();
    await wait(0);
    expect(card().querySelector('[role="dialog"]')?.getAttribute("aria-label")).toBe(messages.cardLabel.message);
    const controls = [...card().querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])")];
    expect(controls.length).toBeGreaterThan(0);
    for (const c of controls) expect(c.getAttribute("aria-label") || c.textContent?.trim()).toBeTruthy();
    for (const img of card().querySelectorAll("img")) expect(img.getAttribute("alt")).toBeTruthy();
  });
});

describe("tema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", fakeChrome());
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = `<a id="g" href="/in/ana-exemplo/">Ana</a>`;
    document.body.style.backgroundColor = "";
    start(document, { fetch: linkedinFetch() as unknown as typeof fetch, storage: memoryStorage(), settings: fakeSync() });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const themeWith = async (bg: string) => {
    document.body.style.backgroundColor = bg;
    document.getElementById("g")!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await wait(400);
    return host().shadowRoot!.querySelector("[data-theme]")!.getAttribute("data-theme");
  };

  it("fundo escuro da página dá Card escuro", async () => {
    expect(await themeWith("rgb(27, 31, 35)")).toBe("dark");
  });

  it("fundo claro da página dá Card claro", async () => {
    expect(await themeWith("rgb(244, 242, 238)")).toBe("light");
  });

  it("sem cor de fundo opaca, segue prefers-color-scheme", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("dark") }));
    expect(await themeWith("")).toBe("dark");
  });
});
