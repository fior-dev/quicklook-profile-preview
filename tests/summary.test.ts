import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "../src/content";
import { fakeChrome, fakeSync, fixtures, linkedinFetch, memoryStorage, messages } from "./helpers";

const host = () => document.getElementById("quicklook-host")!;
const root = () => host().shadowRoot!;
const text = () => root().textContent ?? "";
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);

describe("Resumo da Pessoa, visto pela página", () => {
  let fetchMock: ReturnType<typeof linkedinFetch>;
  const open = async (overrides: Parameters<typeof linkedinFetch>[0] = {}) => {
    fetchMock = linkedinFetch(overrides);
    start(document, { fetch: fetchMock as unknown as typeof fetch, storage: memoryStorage(), settings: fakeSync() });
    document.getElementById("g")!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await wait(400);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", fakeChrome());
    document.documentElement.lang = "pt-BR";
    document.body.innerHTML = `<ul><li><img src="https://media.licdn.com/placeholder.jpg"><a id="g" href="/in/pedro-exemplo/">Pedro  Exemplo
      </a></li></ul>`;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("com a fixture completa mostra todos os campos do Resumo, sem aviso de falha", async () => {
    await open();
    expect(text()).toContain("Pedro Exemplo");
    expect(text()).toContain("(he/him)");
    expect(text()).toContain("Engenheiro de Pesquisa @ Empresa Fictícia Labs | Estudante de Engenharia");
    expect(text()).toContain("Engenheiro de Pesquisa · Empresa Fictícia Labs");
    expect(text()).toContain("since");
    expect(text()).toContain(messages.cardDegree2.message);
    expect(text()).toContain("Pessoa fictícia usada nos testes");
    expect(text()).toContain("…");
    expect(text()).toContain(messages.cardMore.message);
    expect(text()).not.toContain(messages.cardPartial.message);
    expect(root().querySelector("img")!.getAttribute("src")).toMatch(/^https:\/\/media\.example\.com\/.*200_200/);
  });

  it("o Sobre vem cortado e o Usuário expande para ler tudo", async () => {
    await open();
    const full = JSON.parse(fixtures.profile).included[0].summary as string;
    expect(text()).not.toContain(full);
    root().querySelector<HTMLButtonElement>("p button")!.click();
    await wait(0);
    expect(text()).toContain(full);
    expect(text()).toContain(messages.cardLess.message);
  });

  it("mostra nome e foto da página enquanto a resposta não chega", async () => {
    let release!: () => void;
    const slow = new Promise<void>((r) => (release = r));
    await open({ profile: () => new Promise<Response>(() => {}) as unknown as Response });
    expect(text()).toContain("Pedro Exemplo");
    expect(text()).toContain(messages.cardLoading.message);
    expect(root().querySelector("img")!.getAttribute("src")).toBe("https://media.licdn.com/placeholder.jpg");
    release();
    await slow;
  });

  it("faz no máximo quatro requisições por perfil e lê só o começo do HTML", async () => {
    await open();
    expect(fetchMock.mock.calls.map(([u]) => u).filter((u) => !u.includes("/me"))).toHaveLength(4);
  });

  it("sem o cargo na Voyager mostra o que tem, o aviso e o link de reportar sem dados do perfil", async () => {
    await open({ positions: () => new Response("erro", { status: 500 }) });
    expect(text()).toContain("Pedro Exemplo");
    expect(text()).toContain(messages.cardPartial.message);
    const link = root().querySelector<HTMLAnchorElement>("a")!;
    const url = new URL(link.href);
    expect(url.origin + url.pathname).toBe("https://github.com/fior-dev/quicklook-profile-preview/issues/new");
    const body = url.searchParams.get("body")!;
    expect(body).toContain("9.9.9");
    expect(body).toContain("company");
    expect(body).not.toMatch(/Pedro|Exemplo|pedro/);
    expect(link.rel).toContain("noopener");
  });

  it("HTML de experiência em formato inesperado não quebra: o cargo vira campo que falhou", async () => {
    await open({ experience: () => new Response("<html><body>nada aqui</body></html>") });
    expect(text()).toContain("Pedro Exemplo");
    expect(text()).toContain(messages.cardPartial.message);
    expect(text()).not.toContain("Engenheiro de Pesquisa ·");
  });

  it("resposta da Voyager em formato inesperado mostra a mensagem de erro e não lança", async () => {
    await open({ profile: () => new Response('{"algo":"novo"}') });
    expect(text()).toContain(messages.cardError.message);
  });

  it("429 em qualquer das requisições vira aviso de limitação", async () => {
    await open({ experience: () => new Response("", { status: 429 }) });
    expect(text()).toContain("limiting requests");
  });

  it("sem grau de conexão no HTML o Card abre sem o grau e sem aviso", async () => {
    await open({ topcard: () => new Response("<html></html>") });
    expect(text()).not.toMatch(/degree|connected/);
    expect(text()).not.toContain(messages.cardPartial.message);
  });

  it("funciona igual com a interface em inglês", async () => {
    document.documentElement.lang = "en";
    await open();
    expect(text()).toContain("Pedro Exemplo");
    expect(text()).toContain(messages.cardDegree2.message);
  });
});
