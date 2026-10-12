import { csrfFrom, RateLimited, readUpTo, type SourceDeps } from "./source";

// Seções de Detalhes: carregadas só quando o Usuário as abre. Formatos vistos em capturas reais de 11/10/2026.
export type Detail =
  | { kind: "experience"; items: { title: string; company: string; dates: string }[] }
  | { kind: "mutual"; text: string; people: { name: string; urn: string }[] }
  | { kind: "jobs"; items: { title: string; location: string; url: string }[] }
  | { kind: "known"; text: string; url: string };
export type DetailResult = { detail: Detail; failed: string[]; rateLimited?: boolean };

const EXPERIENCE_BYTES = 200_000; // as posições aparecem logo no começo de /details/experience/
const COMPANY_BYTES = 120_000; // vagas e "conexões trabalham aqui" aparecem nos primeiros ~45 KB
const MUTUAL = "/voyager/api/identity/dash/profiles?q=memberIdentity&decorationId=com.linkedin.voyager.dash.deco.identity.profile.TopCardSupplementary-120&memberIdentity=";

const paragraphs = (html: string) =>
  [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("p")].map((p) => p.textContent?.replace(/\s+/g, " ").trim() ?? "");

// Cada posição é uma sequência de <p>: cargo, "Empresa · Tipo", datas. A linha de datas tem dois anos ou um ano e " - ",
// o que vale em qualquer idioma. Cargos agrupados na mesma empresa: não confirmado.
const DATES = /(?:19|20)\d{2}.* - /;
export const experiencesFrom = (html: string): Extract<Detail, { kind: "experience" }>["items"] => {
  const ps = paragraphs(html);
  const items = [];
  for (let i = 2; i < ps.length; i++) {
    if (ps[i].length < 80 && DATES.test(ps[i]) && ps[i - 1] && ps[i - 2]) items.push({ title: ps[i - 2], company: ps[i - 1], dates: ps[i] });
  }
  return items;
};

// O texto ("A, B e mais 18 conexões em comum") vem pronto do LinkedIn, no idioma dele; os nomes vêm dos perfis citados.
export const mutualFrom = (json: any): Extract<Detail, { kind: "mutual" }> => {
  const included: any[] = json?.included ?? [];
  const insight = included.find((o) => o?.$type?.endsWith(".Insight") && o.text?.text);
  if (!insight) return { kind: "mutual", text: "", people: [] };
  const byUrn = new Map(included.map((o) => [o.entityUrn, o]));
  const people = (insight.text.attributesV2 ?? [])
    .map((a: any) => byUrn.get(a.detailDataUnion?.profileFullName))
    .filter((p: any) => p?.firstName)
    .map((p: any) => ({ name: [p.firstName, p.lastName].filter(Boolean).join(" "), urn: p.entityUrn as string }));
  return { kind: "mutual", text: insight.text.text, people };
};

// Cada vaga é um link com `currentJobId=<id>` que envolve <p> de cargo, empresa e local, nessa ordem.
export const jobsFrom = (html: string): Extract<Detail, { kind: "jobs" }>["items"] => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const seen = new Set<string>();
  const items = [];
  for (const a of doc.querySelectorAll<HTMLAnchorElement>('a[href*="currentJobId="]')) {
    const id = /currentJobId=(\d+)/.exec(a.getAttribute("href") ?? "")?.[1];
    const [title, , location] = [...a.querySelectorAll("p")].map((p) => p.textContent?.replace(/\s+/g, " ").trim() ?? "");
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    items.push({ title, location: location ?? "", url: `https://www.linkedin.com/jobs/view/${id}/` });
  }
  return items;
};

// "Carla e mais 7 conexões trabalham aqui": o link para a busca de pessoas com `network=["F"]` e `currentCompany`.
export const knownFrom = (html: string): Extract<Detail, { kind: "known" }> | undefined => {
  const a = [...new DOMParser().parseFromString(html, "text/html").querySelectorAll<HTMLAnchorElement>('a[href*="search/results/people"]')].find(
    (l) => /network=%5B%22F%22%5D/.test(l.getAttribute("href") ?? "") && /currentCompany=/.test(l.getAttribute("href") ?? ""),
  );
  const text = a?.textContent?.replace(/\s+/g, " ").trim();
  // O href vem da página e vai para um <a> do Card: só aceita https em www.linkedin.com (nada de javascript: ou outro domínio).
  const url = a && new URL(a.getAttribute("href") ?? "", "https://www.linkedin.com/");
  return text && url && url.protocol === "https:" && url.hostname === "www.linkedin.com" ? { kind: "known", text, url: url.href } : undefined;
};

// Um cliente por chamada: cabeçalhos do LinkedIn, tempo limite e 429 viram `rateLimited`.
async function run(deps: SourceDeps, body: (c: { json: (p: string) => Promise<any>; html: (p: string, max: number) => Promise<string> }) => Promise<Detail>, empty: Detail): Promise<DetailResult> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), deps.timeoutMs ?? 8000);
  const get = async (path: string, accept: string) => {
    const res = await deps.fetch(path, { credentials: "include", signal: ctl.signal, headers: { accept, "csrf-token": csrfFrom(deps.cookie) } });
    if (res.status === 429) throw new RateLimited();
    if (!res.ok) throw new Error(String(res.status));
    return res;
  };
  try {
    const detail = await body({
      json: (p) => get(p, "application/vnd.linkedin.normalized+json+2.1").then((r) => r.json()),
      html: (p, max) => get(p, "text/html").then((r) => readUpTo(r, max, () => false)),
    });
    return { detail, failed: [] };
  } catch (e) {
    return { detail: empty, failed: ["section"], rateLimited: e instanceof RateLimited };
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}

export const fetchExperience = (slug: string, deps: SourceDeps) =>
  run(deps, async (c) => ({ kind: "experience", items: experiencesFrom(await c.html(`/in/${encodeURIComponent(slug)}/details/experience/`, EXPERIENCE_BYTES)) }), { kind: "experience", items: [] });

export const fetchMutual = (slug: string, deps: SourceDeps) =>
  run(deps, async (c) => mutualFrom(await c.json(MUTUAL + encodeURIComponent(slug))), { kind: "mutual", text: "", people: [] });

export const fetchJobs = (slug: string, deps: SourceDeps) =>
  run(deps, async (c) => ({ kind: "jobs", items: jobsFrom(await c.html(`/company/${encodeURIComponent(slug)}/jobs/`, COMPANY_BYTES)) }), { kind: "jobs", items: [] });

export const fetchKnown = (slug: string, deps: SourceDeps) =>
  run(
    deps,
    async (c) => knownFrom(await c.html(`/company/${encodeURIComponent(slug)}/`, COMPANY_BYTES)) ?? { kind: "known", text: "", url: "" },
    { kind: "known", text: "", url: "" },
  );
