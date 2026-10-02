import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "../src/content";
import { fakeChrome, fakeSync, fixtures, linkedinFetch, memoryStorage, messages } from "./helpers";

const host = () => document.getElementById("quicklook-host")!;
const root = () => host().shadowRoot!;
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);
const byText = (sel: string, text: string) => [...root().querySelectorAll<HTMLElement>(sel)].find((e) => e.textContent?.trim() === text)!;

// Exportação esperada para a fixture person-*.json (idioma en, página em pt-BR).
const EXPECTED = `# Pedro Exemplo (he/him)

Engenheiro de Pesquisa @ Empresa Fictícia Labs | Estudante de Engenharia

- Position: Engenheiro de Pesquisa · Empresa Fictícia Labs (since mar. de 2024)
- Connection: 2nd degree
- Profile: https://www.linkedin.com/in/pedro-exemplo/

## About

`;

describe("Ações do Card", () => {
  let fetchMock: ReturnType<typeof linkedinFetch>;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", fakeChrome());
    writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    document.documentElement.lang = "pt-BR";
    document.cookie = 'JSESSIONID="ajax:123"';
    document.body.innerHTML = `<a id="g" href="/in/pedro-exemplo/">Pedro</a>`;
    fetchMock = linkedinFetch();
    start(document, { fetch: fetchMock as unknown as typeof fetch, storage: memoryStorage(), settings: fakeSync() });
    document.getElementById("g")!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await wait(400);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const exported = () => {
    byText("button", messages.actionCopy.message).click();
    return writeText.mock.calls[0][0] as string;
  };

  it("Copiar põe a Exportação na área de transferência e confirma", async () => {
    const text = exported();
    await wait(0);
    const about = JSON.parse(fixtures.profile).included.find((o: any) => o.summary).summary;
    expect(text).toBe(EXPECTED + about + "\n");
    expect(root().querySelector('[role="status"]')?.textContent).toBe(messages.actionCopied.message);
  });

  it("falha na área de transferência avisa em vez de confirmar", async () => {
    writeText.mockRejectedValueOnce(new Error("negado"));
    byText("button", messages.actionCopy.message).click();
    await wait(0);
    expect(root().querySelector('[role="status"]')?.textContent).toBe(messages.actionFailed.message);
  });

  it("Salvar baixa um .md com o mesmo conteúdo e confirma", async () => {
    const text = exported();
    await wait(50); // deixa a confirmação de copiar assentar antes de salvar
    let blob!: Blob;
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), "blob:x"));
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("pedro-exemplo.md");
    });
    byText("button", messages.actionSave.message).click();
    await wait(50);
    expect(click).toHaveBeenCalled();
    expect(await blob.text()).toBe(text);
    expect(root().querySelector('[role="status"]')?.textContent).toBe(messages.actionSaved.message);
  });

  it("Abrir perfil e Enviar mensagem são links para nova aba, sem envio", () => {
    const profile = byText("a", messages.actionProfile.message) as HTMLAnchorElement;
    expect(profile.href).toBe("https://www.linkedin.com/in/pedro-exemplo/");
    expect(profile.target).toBe("_blank");
    expect(profile.rel).toContain("noopener");
    const msg = byText("a", messages.actionMessage.message) as HTMLAnchorElement;
    expect(msg.href).toMatch(/^https:\/\/www\.linkedin\.com\/messaging\/compose\/\?recipient=ACoAA\w+$/);
    expect(msg.target).toBe("_blank");
    // Nenhuma requisição de escrita: só GETs de leitura.
    expect(fetchMock.mock.calls.every(([, init]: any[]) => !init?.method || init.method === "GET")).toBe(true);
  });
});
