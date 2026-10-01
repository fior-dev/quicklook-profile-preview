import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import fixture from "./fixtures/voyager-person.json";
import { start } from "../src/content";

const messages = JSON.parse(readFileSync("_locales/en/messages.json", "utf8"));

const host = () => document.getElementById("quicklook-host")!;
const cardText = () => host().shadowRoot!.textContent ?? "";
const isOpen = () => host().style.display === "block";
const fire = (el: Element | ShadowRoot, type: string, init: MouseEventInit = {}) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));
const hover = (el: Element) => fire(el, "mouseover");
const leave = (el: Element) => fire(el, "mouseout");
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);
const rect = (r: Partial<DOMRect>) => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, ...r }) as DOMRect;

describe("página com Gatilhos de Pessoa", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", { i18n: { getMessage: (k: string) => messages[k]?.message ?? "" } });
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = `
      <a id="g" href="https://www.linkedin.com/in/ana-exemplo/">Ana</a>
      <a id="avatar" href="/in/bia-exemplo/"><img alt="" src="x.png"><span id="avatar-name">Bia</span></a>
      <a id="outro" href="/in/caio-exemplo">Caio</a>
      <a id="eu" href="/in/eu-mesmo/">Eu</a>
      <a id="promo" href="/premium/products/?utm=x">Experimente o Premium</a>`;
    fetchMock = vi.fn(async (url: string) =>
      url.startsWith("/voyager/api/me")
        ? new Response(JSON.stringify({ included: [{ publicIdentifier: "eu-mesmo" }] }))
        : new Response(JSON.stringify(fixture)),
    );
    start(document, { fetch: fetchMock as unknown as typeof fetch });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const profileCalls = () => fetchMock.mock.calls.filter(([u]) => u.includes("memberIdentity"));
  const openOn = async (el: Element) => {
    hover(el);
    await wait(400);
  };

  it("hover de 400 ms abre o Card com nome e headline", async () => {
    await openOn(document.getElementById("g")!);
    expect(cardText()).toContain("Ana Exemplo");
    expect(cardText()).toContain("Engenheira de Software na Empresa Fictícia");
    const [url, init] = profileCalls()[0];
    expect(url).toContain("memberIdentity=ana-exemplo");
    expect(init.headers["csrf-token"]).toBe("ajax:123");
    expect(init.credentials).toBe("include");
  });

  it("hover mais curto que o delay não abre o Card", async () => {
    const g = document.getElementById("g")!;
    hover(g);
    await wait(200);
    leave(g);
    await wait(1000);
    expect(profileCalls()).toHaveLength(0);
    expect(isOpen()).toBe(false);
  });

  it("resposta inesperada mostra a mensagem de erro", async () => {
    fetchMock.mockResolvedValue(new Response("{}"));
    await openOn(document.getElementById("g")!);
    expect(cardText()).toContain(messages.cardError.message);
  });

  it("avatar dentro do link é Gatilho, e mover entre filhos não fecha", async () => {
    const name = document.getElementById("avatar-name")!;
    await openOn(name);
    expect(isOpen()).toBe(true);
    fire(name, "mouseout", { relatedTarget: document.querySelector("#avatar img") });
    await wait(1000);
    expect(isOpen()).toBe(true);
    expect(profileCalls()).toHaveLength(1);
  });

  it("mover o mouse do Gatilho para o Card não fecha; sair dos dois fecha após 300 ms", async () => {
    const g = document.getElementById("g")!;
    await openOn(g);
    leave(g);
    await wait(250);
    fire(host(), "mouseover");
    await wait(1000);
    expect(isOpen()).toBe(true);
    fire(host(), "mouseout");
    await wait(299);
    expect(isOpen()).toBe(true);
    await wait(1);
    expect(isOpen()).toBe(false);
  });

  it("Esc fecha o Card", async () => {
    await openOn(document.getElementById("g")!);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(isOpen()).toBe(false);
  });

  it("botão X fecha o Card", async () => {
    await openOn(document.getElementById("g")!);
    const x = host().shadowRoot!.querySelector("button")!;
    expect(x.getAttribute("aria-label")).toBe(messages.cardClose.message);
    x.click();
    expect(isOpen()).toBe(false);
  });

  it("só um Card aberto: o segundo Gatilho troca o conteúdo do mesmo Card", async () => {
    await openOn(document.getElementById("g")!);
    await openOn(document.getElementById("outro")!);
    expect(document.querySelectorAll("#quicklook-host")).toHaveLength(1);
    expect(profileCalls().map(([u]) => u)).toEqual([
      expect.stringContaining("ana-exemplo"),
      expect.stringContaining("caio-exemplo"),
    ]);
  });

  it("não abre sobre o próprio perfil nem sobre link promocional", async () => {
    await openOn(document.getElementById("eu")!);
    await openOn(document.getElementById("promo")!);
    expect(isOpen()).toBe(false);
    expect(profileCalls()).toHaveLength(0);
  });

  it("Gatilho inserido depois do carregamento funciona", async () => {
    document.body.insertAdjacentHTML("beforeend", '<a id="novo" href="/in/dani-exemplo/">Dani</a>');
    await openOn(document.getElementById("novo")!);
    expect(isOpen()).toBe(true);
    expect(profileCalls()[0][0]).toContain("dani-exemplo");
  });

  describe("posição", () => {
    beforeEach(() => {
      vi.stubGlobal("innerWidth", 1000);
      vi.stubGlobal("innerHeight", 600);
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(100);
    });
    const openAt = async (r: Partial<DOMRect>) => {
      const g = document.getElementById("g")!;
      g.getBoundingClientRect = () => rect(r);
      await openOn(g);
    };

    it("aparece abaixo do Gatilho quando cabe", async () => {
      await openAt({ top: 100, bottom: 120, left: 50 });
      expect(host().style.top).toBe("126px");
      expect(host().style.left).toBe("50px");
    });

    it("troca para cima quando não cabe embaixo, e recua da borda direita", async () => {
      await openAt({ top: 540, bottom: 560, left: 900 });
      expect(host().style.top).toBe("434px");
      expect(host().style.left).toBe("712px");
    });
  });
});
