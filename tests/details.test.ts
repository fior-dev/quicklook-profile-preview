import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "../src/content";
import { experiencesFrom, jobsFrom, knownFrom, mutualFrom } from "../src/details";
import { fakeChrome, fakeSync, fixtures, linkedinFetch, memoryStorage, messages } from "./helpers";

const root = () => document.getElementById("quicklook-host")!.shadowRoot!;
const text = () => root().textContent ?? "";
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);
const button = (label: string) => [...root().querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes(label))!;

describe("parsers dos Detalhes (fixtures anonimizadas)", () => {
  it("experiências: cargo, empresa e datas de cada posição", () => {
    const items = experiencesFrom(fixtures.experience);
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ title: "Engenheiro de Pesquisa", company: "Empresa Fictícia Labs · Estágio", dates: "mar. de 2024 - set. de 2024 · 7 meses" });
    expect(items[1].title).toBe("Instrutor");
  });

  it("conexões em comum: texto do LinkedIn e nomes dos perfis citados", () => {
    expect(mutualFrom(JSON.parse(fixtures.mutual))).toEqual({
      kind: "mutual",
      text: "Ana Exemplo, Bruno Exemplo, and 18 other mutual connections",
      people: [
        { name: "Ana Exemplo", urn: "urn:li:fsd_profile:ACoAAana" },
        { name: "Bruno Exemplo", urn: "urn:li:fsd_profile:ACoAAbruno" },
      ],
    });
    expect(mutualFrom({ included: [] })).toEqual({ kind: "mutual", text: "", people: [] });
  });

  it("vagas: título, local e link canônico, sem repetir a mesma vaga", () => {
    expect(jobsFrom(fixtures.jobs)).toEqual([
      { title: "Engenheira de Software Sênior", location: "Florianópolis, SC (Remoto)", url: "https://www.linkedin.com/jobs/view/1000000001/" },
      { title: "Gerente de Produto", location: "São Paulo, SP (Híbrido)", url: "https://www.linkedin.com/jobs/view/1000000002/" },
    ]);
  });

  it("pessoas que o Usuário conhece: link da busca com network=F e currentCompany", () => {
    expect(knownFrom(fixtures.companyHome)).toMatchObject({ kind: "known", text: "Carla e mais 7 conexões trabalham aqui" });
    expect(knownFrom("<html><a href='/search/results/people/?currentCompany=1'>51 a 200</a></html>")).toBeUndefined();
  });
});

describe("seções de Detalhes no Card", () => {
  let fetchMock: ReturnType<typeof linkedinFetch>;
  const calls = (part: string): any[][] => fetchMock.mock.calls.filter(([u]: any[]) => u.includes(part));
  const open = async (id: string, overrides: Parameters<typeof linkedinFetch>[0] = {}) => {
    fetchMock = linkedinFetch(overrides);
    start(document, { fetch: fetchMock as unknown as typeof fetch, storage: memoryStorage(), settings: fakeSync() });
    document.getElementById(id)!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await wait(400);
  };
  const expand = async (label: string) => {
    button(label).click();
    await wait(50);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", fakeChrome());
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => {}) } });
    document.documentElement.lang = "pt-BR";
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = `<a id="p" href="/in/pedro-exemplo/">Pedro</a><a id="c" href="/company/empresa-ficticia/">Empresa</a>`;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("nenhuma requisição de Detalhes antes de abrir a seção; abrir busca uma vez e reabrir não repete", async () => {
    await open("p");
    expect(calls("TopCardSupplementary")).toHaveLength(0);
    expect(calls("details/experience")).toHaveLength(1); // só a do Resumo (cargo atual), 64 KB
    const before = calls("details/experience").length;
    await expand(messages.detail_mutual.message);
    expect(text()).toContain("18 other mutual connections");
    expect(calls("TopCardSupplementary")).toHaveLength(1);
    await expand(messages.detail_mutual.message); // fecha
    await expand(messages.detail_mutual.message); // reabre
    expect(calls("TopCardSupplementary")).toHaveLength(1);
    expect(calls("details/experience")).toHaveLength(before);
  });

  it("Experiências da Pessoa aparecem com cargo, empresa e datas", async () => {
    await open("p");
    await expand(messages.detail_experience.message);
    expect(text()).toContain("Instrutor");
    expect(text()).toContain("jun. de 2022 - ago. de 2022 · 3 meses");
  });

  it("falha de uma seção mostra a mensagem nela e mantém o resto do Card; clicar de novo tenta outra vez", async () => {
    let status = 500;
    await open("p", { mutual: () => new Response(status === 200 ? fixtures.mutual : "{}", { status }) });
    await expand(messages.detail_mutual.message);
    expect(text()).toContain(messages.detailError.message);
    expect(text()).toContain("Pedro Exemplo");
    status = 200;
    await expand(messages.detail_mutual.message);
    expect(text()).toContain("18 other mutual connections");
  });

  it("429 numa seção avisa que é preciso aguardar", async () => {
    await open("p", { mutual: () => new Response("", { status: 429 }) });
    await expand(messages.detail_mutual.message);
    expect(text()).toContain(messages.detailLimited.message);
  });

  it("Exportação inclui só as seções abertas, depois do Sobre", async () => {
    await open("p");
    await expand(messages.detail_mutual.message);
    button(messages.actionCopy.message).click();
    const out = (navigator.clipboard.writeText as any).mock.calls[0][0] as string;
    expect(out).toContain(`## ${messages.detail_mutual.message}\n\nAna Exemplo, Bruno Exemplo, and 18 other mutual connections\n`);
    expect(out).not.toContain(messages.detail_experience.message);
    expect(out.indexOf("## About")).toBeLessThan(out.indexOf(`## ${messages.detail_mutual.message}`));
  });

  it("Empresa: vagas e pessoas conhecidas sob demanda, e entram na Exportação", async () => {
    await open("c");
    expect(calls("/jobs/")).toHaveLength(0);
    await expand(messages.detail_jobs.message);
    const link = [...root().querySelectorAll<HTMLAnchorElement>("a")].find((a) => a.textContent === "Gerente de Produto")!;
    expect(link.href).toBe("https://www.linkedin.com/jobs/view/1000000002/");
    expect(link.target).toBe("_blank");
    await expand(messages.detail_known.message);
    expect(text()).toContain("Carla e mais 7 conexões trabalham aqui");
    button(messages.actionCopy.message).click();
    const out = (navigator.clipboard.writeText as any).mock.calls[0][0] as string;
    expect(out).toContain("- Gerente de Produto — São Paulo, SP (Híbrido): https://www.linkedin.com/jobs/view/1000000002/");
    expect(out).toContain("Carla e mais 7 conexões trabalham aqui: https://www.linkedin.com/search/results/people/");
  });
});

describe("links vindos do HTML", () => {
  it("pessoas conhecidas: href fora de https://www.linkedin.com é descartado", () => {
    const evil = (href: string) => `<a href="${href}">x e mais 2 conexões</a>`;
    expect(knownFrom(evil("javascript:alert(1)//search/results/people/?network=%5B%22F%22%5D&currentCompany=1"))).toBeUndefined();
    expect(knownFrom(evil("https://evil.example/search/results/people/?network=%5B%22F%22%5D&currentCompany=1"))).toBeUndefined();
  });
});
