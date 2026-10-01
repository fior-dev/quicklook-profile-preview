import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import fixture from "./fixtures/voyager-person.json";
import { start } from "../src/content";

const messages = JSON.parse(readFileSync("_locales/en/messages.json", "utf8"));

const cardText = () => document.getElementById("quicklook-host")!.shadowRoot!.textContent ?? "";
const hover = (el: Element) => el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

describe("página com Gatilho de Pessoa", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", { i18n: { getMessage: (k: string) => messages[k]?.message ?? "" } });
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = '<a id="g" href="https://www.linkedin.com/in/ana-exemplo/">Ana</a>';
    fetchMock = vi.fn(async () => new Response(JSON.stringify(fixture)));
    start(document, { fetch: fetchMock as unknown as typeof fetch });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("hover de 400 ms abre o Card com nome e headline", async () => {
    hover(document.getElementById("g")!);
    await vi.advanceTimersByTimeAsync(400);
    expect(cardText()).toContain("Ana Exemplo");
    expect(cardText()).toContain("Engenheira de Software na Empresa Fictícia");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("memberIdentity=ana-exemplo");
    expect(init.headers["csrf-token"]).toBe("ajax:123");
    expect(init.credentials).toBe("include");
  });

  it("hover mais curto que o delay não abre o Card", async () => {
    const g = document.getElementById("g")!;
    hover(g);
    await vi.advanceTimersByTimeAsync(200);
    g.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("quicklook-host")!.style.display).toBe("none");
  });

  it("resposta inesperada mostra a mensagem de erro", async () => {
    fetchMock.mockResolvedValue(new Response("{}"));
    hover(document.getElementById("g")!);
    await vi.advanceTimersByTimeAsync(400);
    expect(cardText()).toContain(messages.cardError.message);
  });
});
