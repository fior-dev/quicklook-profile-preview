import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "./fixtures/voyager-person.json";
import { start } from "../src/content";
import { fakeChrome, memoryStorage } from "./helpers";

const HOUR = 60 * 60_000;
const cardText = () => document.getElementById("quicklook-host")!.shadowRoot!.textContent ?? "";
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);
const hover = (el: Element) => el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
const leave = (el: Element) => el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));

describe("Guardião de requisições, visto pela página", () => {
  let status: number;
  let fetchMock: ReturnType<typeof vi.fn>;
  let storage: ReturnType<typeof memoryStorage>;
  const profileCalls = () => fetchMock.mock.calls.filter(([u]) => u.includes("memberIdentity"));
  const link = (i: number) => document.getElementById(`p${i}`)!;
  // Abre o Card de um Gatilho e sai, para o próximo hover começar do zero.
  const look = async (el: Element) => {
    hover(el);
    await wait(400);
    leave(el);
    await wait(400);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    vi.stubGlobal("chrome", fakeChrome());
    status = 200;
    document.body.innerHTML = Array.from({ length: 25 }, (_, i) => `<a id="p${i}" href="/in/pessoa-${i}/">P${i}</a>`).join("");
    fetchMock = vi.fn(async (url: string) =>
      url.startsWith("/voyager/api/me") ? new Response("{}") : new Response(JSON.stringify(fixture), { status }),
    );
    storage = memoryStorage();
    start(document, { fetch: fetchMock as unknown as typeof fetch, storage });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("Card já visto abre sem nova requisição dentro de 24h e busca de novo depois", async () => {
    await look(link(0));
    await look(link(0));
    expect(profileCalls()).toHaveLength(1);
    await wait(24 * HOUR);
    await look(link(0));
    expect(profileCalls()).toHaveLength(2);
  });

  it("hover repetido enquanto a busca está em andamento gera uma requisição só", async () => {
    let release!: () => void;
    fetchMock.mockImplementation(async (url: string) => {
      if (!url.includes("memberIdentity")) return new Response("{}");
      await new Promise<void>((r) => (release = r));
      return new Response(JSON.stringify(fixture));
    });
    hover(link(0));
    await wait(400);
    leave(link(0));
    hover(link(0));
    await wait(400);
    release();
    await wait(0);
    expect(profileCalls()).toHaveLength(1);
  });

  it("acima de 20 perfis por minuto mostra 'aguarde' e não faz requisição", async () => {
    for (let i = 0; i < 20; i++) await look(link(i));
    expect(profileCalls()).toHaveLength(20);
    hover(link(20));
    await wait(400);
    expect(cardText()).toContain("Wait a few seconds");
    expect(profileCalls()).toHaveLength(20);
  });

  it("depois de 429 avisa com o tempo restante, espera o backoff e ele cresce a cada 429 seguido", async () => {
    status = 429;
    hover(link(0));
    await wait(400);
    expect(cardText()).toContain("Try again in 30 s");
    leave(link(0));
    await wait(400);

    await look(link(1)); // dentro do backoff: não busca
    expect(profileCalls()).toHaveLength(1);

    await wait(30_000);
    hover(link(2));
    await wait(400);
    expect(profileCalls()).toHaveLength(2);
    expect(cardText()).toContain("Try again in 60 s");
  });

  it("depois de um sucesso o backoff volta ao início", async () => {
    status = 429;
    await look(link(0));
    await wait(30_000);
    status = 200;
    await look(link(1));
    status = 429;
    await wait(1000);
    hover(link(2));
    await wait(400);
    expect(cardText()).toContain("Try again in 30 s");
  });
});
