import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "../src/content";
import { fakeChrome, fakeSync, fixtures, linkedinFetch, memoryStorage, messages } from "./helpers";

const host = () => document.getElementById("quicklook-host")!;
const root = () => host().shadowRoot!;
const text = () => root().textContent ?? "";
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);
const hover = (el: Element) => el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

// Exportação esperada da fixture tests/fixtures/company.json (idioma en, página em pt-BR).
const EXPECTED = `# Empresa Fictícia Labs

Plataforma fictícia usada nos testes da extensão.

- Industry: Desenvolvimento de software
- Size: 51–200 employees
- Headquarters: Florianópolis, SC, BR
- Followers: 80.604
- Website: https://empresa-ficticia.example
- Page: https://www.linkedin.com/company/empresa-ficticia/
`;

describe("Card de Empresa", () => {
  let fetchMock: ReturnType<typeof linkedinFetch>;
  const open = async (id = "c", overrides: Parameters<typeof linkedinFetch>[0] = {}) => {
    fetchMock = linkedinFetch(overrides);
    start(document, { fetch: fetchMock as unknown as typeof fetch, storage: memoryStorage(), settings: fakeSync() });
    hover(document.getElementById(id)!);
    await wait(400);
  };
  const companyCalls = (): any[][] => fetchMock.mock.calls.filter(([u]: any[]) => u.includes("/organization/companies"));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", fakeChrome());
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => {}) } });
    document.documentElement.lang = "pt-BR";
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = `
      <a id="c" href="https://www.linkedin.com/company/empresa-ficticia/">Empresa</a>
      <a id="logo" href="/company/empresa-ficticia"><img alt="" src="https://media.licdn.com/x.png"></a>
      <a id="aba" href="/company/empresa-ficticia/posts/">Posts</a>
      <a id="escola" href="/school/uni-ficticia/">Uni</a>`;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("hover em link de Empresa mostra todos os campos do Resumo, sem aviso de falha", async () => {
    await open();
    for (const s of ["Empresa Fictícia Labs", "Plataforma fictícia usada nos testes", "Desenvolvimento de software", "51–200 employees", "Florianópolis, SC, BR", "80.604 followers", "empresa-ficticia.example"]) {
      expect(text()).toContain(s);
    }
    expect(text()).not.toContain(messages.cardPartial.message);
    const [url, init] = companyCalls()[0];
    expect(url).toContain("universalName=empresa-ficticia");
    expect(init.headers["csrf-token"]).toBe("ajax:123");
    expect(root().querySelector<HTMLImageElement>("img")!.src).toBe("https://media.licdn.com/dms/image/v2/EXEMPLO/company-logo_200_200/logo-exemplo");
  });

  it("avatar dentro do link de Empresa também é Gatilho; abas e escolas não são", async () => {
    await open("logo");
    expect(host().style.display).toBe("block");
    hover(document.getElementById("aba")!);
    hover(document.getElementById("escola")!);
    await wait(1000);
    expect(companyCalls()).toHaveLength(1);
  });

  it("Ações da Empresa: abrir página, sem enviar mensagem; copiar dá a Exportação com campos e link", async () => {
    await open();
    const links = [...root().querySelectorAll("a")].map((a) => a.textContent);
    expect(links).toContain(messages.actionProfile.message);
    expect(links).not.toContain(messages.actionMessage.message);
    [...root().querySelectorAll("button")].find((b) => b.textContent === messages.actionCopy.message)!.click();
    expect((navigator.clipboard.writeText as any).mock.calls[0][0]).toBe(EXPECTED);
  });

  it("setor que não resolve vira Card parcial com 'Reportar problema' sem dados da Empresa", async () => {
    const broken = JSON.parse(fixtures.company);
    broken.included.find((o: any) => o.universalName).industries = [];
    broken.included = broken.included.filter((o: any) => o.$type !== "com.linkedin.voyager.common.Industry");
    await open("c", { company: () => new Response(JSON.stringify(broken)) });
    expect(text()).toContain("Empresa Fictícia Labs");
    expect(text()).toContain(messages.cardPartial.message);
    const href = root().querySelector<HTMLAnchorElement>('a[href^="https://github.com"]')!.href;
    expect(decodeURIComponent(href)).toContain("industry");
    expect(decodeURIComponent(href)).not.toContain("Fictícia");
  });

  it("resposta inesperada ou 403 mostra o erro", async () => {
    await open("c", { company: () => new Response("{}", { status: 403 }) });
    expect(text()).toContain(messages.cardError.message);
  });

  it("429 passa pelo Guardião: avisa o backoff", async () => {
    await open("c", { company: () => new Response("", { status: 429 }) });
    expect(text()).toContain("30");
  });

  it("segunda visita dentro de 24h não repete a requisição", async () => {
    await open();
    document.getElementById("c")!.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    await wait(400);
    hover(document.getElementById("c")!);
    await wait(400);
    expect(companyCalls()).toHaveLength(1);
  });
});
