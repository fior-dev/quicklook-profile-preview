export type PersonSummary = { name: string; headline: string };
export type SourceResult = { person: Partial<PersonSummary>; failed: (keyof PersonSummary)[]; rateLimited?: boolean };
export type SourceDeps = { fetch: typeof fetch; cookie: string; timeoutMs?: number };

// Endpoint e formato vistos na referência, ainda NÃO confirmados no LinkedIn ao vivo (ticket #2).
const ENDPOINT = "/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=";

const csrfFrom = (cookie: string) => {
  const m = /JSESSIONID=(?:"([^"]+)"|([^;]+))/.exec(cookie);
  return m ? (m[1] ?? m[2]) : "";
};

// ponytail: varre `data`, `elements` e `included` atrás do primeiro objeto com firstName; afinar com a fixture real.
const findProfile = (json: any): any => {
  const pool = [json?.data, ...(json?.data?.elements ?? []), ...(json?.elements ?? []), ...(json?.included ?? [])];
  return pool.find((o) => typeof o?.firstName === "string");
};

export async function fetchPersonSummary(slug: string, deps: SourceDeps): Promise<SourceResult> {
  const none: SourceResult = { person: {}, failed: ["name", "headline"] };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), deps.timeoutMs ?? 8000);
  try {
    const res = await deps.fetch(ENDPOINT + encodeURIComponent(slug), {
      credentials: "include",
      signal: ctl.signal,
      headers: { accept: "application/vnd.linkedin.normalized+json+2.1", "csrf-token": csrfFrom(deps.cookie) },
    });
    if (!res.ok) return res.status === 429 ? { ...none, rateLimited: true } : none;
    const p = findProfile(await res.json());
    if (!p) return none;
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
    const headline = typeof p.headline === "string" ? p.headline : "";
    const person: Partial<PersonSummary> = {};
    const failed: (keyof PersonSummary)[] = [];
    if (name) person.name = name;
    else failed.push("name");
    if (headline) person.headline = headline;
    else failed.push("headline");
    return { person, failed };
  } catch {
    return none;
  } finally {
    clearTimeout(timer);
  }
}

// Slug do próprio Usuário, para não abrir Card sobre ele. Formato de `/me` NÃO confirmado; se falhar, devolve null e o Card abre normal.
export async function fetchOwnSlug(deps: SourceDeps): Promise<string | null> {
  try {
    const res = await deps.fetch("/voyager/api/me", {
      credentials: "include",
      headers: { accept: "application/vnd.linkedin.normalized+json+2.1", "csrf-token": csrfFrom(deps.cookie) },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const pool = [json?.data, ...(json?.included ?? [])];
    return pool.find((o) => typeof o?.publicIdentifier === "string")?.publicIdentifier ?? null;
  } catch {
    return null;
  }
}
