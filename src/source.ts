export type PersonSummary = {
  slug: string;
  urn: string;
  name: string;
  pronouns: string;
  headline: string;
  about: string;
  photo: string;
  title: string;
  company: string;
  since: { month: number; year: number };
  location: string;
  degree: 1 | 2 | 3;
};
export type Field = "name" | "headline" | "company" | "title" | "degree" | "industry";
export type SourceResult = { person: Partial<PersonSummary>; failed: Field[]; rateLimited?: boolean };
export type CompanySummary = {
  slug: string;
  name: string;
  tagline: string;
  industry: string;
  size: { start: number; end?: number };
  headquarters: string;
  followers: number;
  website: string;
  logo: string;
};
export type CompanyResult = { company: Partial<CompanySummary>; failed: Field[]; rateLimited?: boolean };
export type SourceDeps = { fetch: typeof fetch; cookie: string; timeoutMs?: number };

// Formatos vistos em capturas reais do LinkedIn em 01/10/2026 (ver tests/fixtures), exceto onde marcado.
const PROFILE = "/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=";
const POSITIONS = "/voyager/api/identity/dash/profilePositionGroups?q=viewee&profileUrn=";
const TOPCARD_BYTES = 320_000; // o grau de conexão aparece a ~15% de uma página de ~1 MB
const EXPERIENCE_BYTES = 64_000; // o primeiro cargo aparece nos primeiros ~35 KB

export const csrfFrom = (cookie: string) => {
  const m = /JSESSIONID=(?:"([^"]+)"|([^;]+))/.exec(cookie);
  return m ? (m[1] ?? m[2]) : "";
};

export class RateLimited extends Error {}

const PRONOUNS: Record<string, string> = { HE_HIM: "he/him", SHE_HER: "she/her", THEY_THEM: "they/them" };

const photoFrom = (pic: any): string | undefined => {
  const v = pic?.displayImage?.vectorImage;
  const art = v?.artifacts?.find((a: any) => a.width === 200) ?? v?.artifacts?.[0];
  const url = v?.rootUrl && art ? v.rootUrl + art.fileIdentifyingUrlPathSegment : undefined;
  return url?.startsWith("https://") ? url : undefined;
};

// ponytail: varre `data`, `elements` e `included` atrás do primeiro objeto com firstName.
const findProfile = (json: any): any =>
  [json?.data, ...(json?.data?.elements ?? []), ...(json?.elements ?? []), ...(json?.included ?? [])].find(
    (o) => typeof o?.firstName === "string",
  );

// A primeira posição sem data de fim, na ordem em que o LinkedIn lista (`*elements`, não `included`).
const currentGroup = (json: any) => {
  const byUrn = new Map<string, any>((json?.included ?? []).map((g: any) => [g.entityUrn, g]));
  const ordered: any[] = (json?.data?.["*elements"] ?? []).map((u: string) => byUrn.get(u)).filter(Boolean);
  return ordered.find((g) => g.companyName && g.dateRange?.start && !g.dateRange.end);
};

// O valor vem escapado dentro de um script da página: ...profile_network_distance_<id>...stringValue":"Distance2".
export const degreeFrom = (html: string): 1 | 2 | 3 | undefined => {
  const d = /profile_network_distance_[\w-]+[\s\S]{0,300}?Distance(\d)/.exec(html)?.[1];
  return d === "1" || d === "2" || d === "3" ? (Number(d) as 1 | 2 | 3) : undefined;
};

// O cargo é o <p> logo antes do <p> "Empresa · Tipo" (ou só "Empresa"). Não depende do idioma.
export const titleFrom = (html: string, company: string): string | undefined => {
  const ps = [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("p")].map((p) => p.textContent?.trim() ?? "");
  const i = ps.findIndex((t, n) => n > 0 && (t === company || t.startsWith(company + " ·")));
  return i > 0 && ps[i - 1] ? ps[i - 1] : undefined;
};

// Lê só o começo da resposta: cancela o fluxo ao passar do limite ou quando `done` aceita o texto.
export async function readUpTo(res: Response, max: number, done: (text: string) => boolean): Promise<string> {
  if (!res.body?.getReader) return (await res.text()).slice(0, max);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (text.length < max) {
      const { value, done: end } = await reader.read();
      if (end) break;
      text += decoder.decode(value, { stream: true });
      if (done(text)) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return text;
}

export async function fetchPersonSummary(slug: string, deps: SourceDeps): Promise<SourceResult> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), deps.timeoutMs ?? 8000);
  const get = async (path: string, accept: string) => {
    const res = await deps.fetch(path, { credentials: "include", signal: ctl.signal, headers: { accept, "csrf-token": csrfFrom(deps.cookie) } });
    if (res.status === 429) throw new RateLimited();
    if (!res.ok) throw new Error(String(res.status));
    return res;
  };
  const json = (path: string) => get(path, "application/vnd.linkedin.normalized+json+2.1").then((r) => r.json());
  const html = (path: string, max: number, done: (t: string) => boolean) =>
    get(path, "text/html").then((r) => readUpTo(r, max, done));

  const person: Partial<PersonSummary> = {};
  const failed: Field[] = [];
  const enc = encodeURIComponent(slug);
  try {
    const topcard = html(`/in/${enc}/`, TOPCARD_BYTES, (t) => degreeFrom(t) !== undefined);
    topcard.catch(() => {}); // evita rejeição não tratada enquanto o perfil é lido

    let profile: any;
    try {
      profile = findProfile(await json(PROFILE + enc));
    } catch (e) {
      if (e instanceof RateLimited) throw e;
    }
    const name = profile && [profile.firstName, profile.lastName].filter(Boolean).join(" ");
    if (!name) return { person: {}, failed: ["name", "headline"] };

    person.name = name;
    person.slug = slug;
    if (typeof profile.entityUrn === "string") person.urn = profile.entityUrn;
    if (profile.headline) person.headline = profile.headline;
    else failed.push("headline");
    const pronoun = profile.pronounUnion?.standardizedPronoun;
    if (pronoun) person.pronouns = PRONOUNS[pronoun] ?? pronoun.toLowerCase().replace("_", "/");
    if (profile.summary) person.about = profile.summary;
    const photo = photoFrom(profile.profilePicture);
    if (photo) person.photo = photo;
    const location = profile.address || profile.locationName;
    if (location) person.location = location;

    try {
      const group = currentGroup(await json(POSITIONS + encodeURIComponent(profile.entityUrn)));
      if (group) {
        person.company = group.companyName;
        person.since = { month: group.dateRange.start.month, year: group.dateRange.start.year };
        try {
          const title = titleFrom(
            await html(`/in/${enc}/details/experience/`, EXPERIENCE_BYTES, () => false),
            group.companyName,
          );
          if (title) person.title = title;
          else failed.push("title");
        } catch (e) {
          if (e instanceof RateLimited) throw e;
          failed.push("title");
        }
      }
    } catch (e) {
      if (e instanceof RateLimited) throw e;
      failed.push("company");
    }

    try {
      const degree = degreeFrom(await topcard);
      if (degree) person.degree = degree;
    } catch (e) {
      if (e instanceof RateLimited) throw e;
      failed.push("degree");
    }
    return { person, failed };
  } catch (e) {
    return { person: {}, failed: ["name", "headline"], rateLimited: e instanceof RateLimited };
  } finally {
    clearTimeout(timer);
    ctl.abort(); // encerra qualquer leitura de HTML que ainda esteja aberta
  }
}

// Slug do próprio Usuário, para não abrir Card sobre ele. `/me` confirmado em captura real: `publicIdentifier` no MiniProfile.
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

// Formato visto em captura real de 11/10/2026 (tests/fixtures/company.json, anonimizada): uma requisição traz tudo.
const COMPANY = "/voyager/api/organization/companies?q=universalName&universalName=";

export async function fetchCompanySummary(slug: string, deps: SourceDeps): Promise<CompanyResult> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), deps.timeoutMs ?? 8000);
  try {
    const res = await deps.fetch(COMPANY + encodeURIComponent(slug), {
      credentials: "include",
      signal: ctl.signal,
      headers: { accept: "application/vnd.linkedin.normalized+json+2.1", "csrf-token": csrfFrom(deps.cookie) },
    });
    if (res.status === 429) return { company: {}, failed: ["name"], rateLimited: true };
    if (!res.ok) return { company: {}, failed: ["name"] };
    const json: any = await res.json();
    const pool: any[] = [json?.data, ...(json?.data?.elements ?? []), ...(json?.included ?? [])];
    const c = pool.find((o) => typeof o?.universalName === "string" && typeof o?.name === "string");
    if (!c) return { company: {}, failed: ["name"] };

    const company: Partial<CompanySummary> = { slug, name: c.name };
    const failed: Field[] = [];
    if (c.tagline) company.tagline = c.tagline;
    // O setor vem em `industries` (texto) e, resolvido, em um objeto Industry de `*companyIndustries`.
    const industry = c.industries?.[0] ?? pool.find((o) => o?.entityUrn === c["*companyIndustries"]?.[0])?.localizedName;
    if (industry) company.industry = industry;
    else if (c["*companyIndustries"]?.length) failed.push("industry");
    if (c.staffCountRange?.start) company.size = { start: c.staffCountRange.start, end: c.staffCountRange.end };
    const hq = c.headquarter;
    const place = hq && [hq.city, hq.geographicArea, hq.country].filter(Boolean).join(", ");
    if (place) company.headquarters = place;
    const followers = pool.find((o) => o?.entityUrn === c["*followingInfo"])?.followerCount;
    if (typeof followers === "number") company.followers = followers;
    if (c.companyPageUrl?.startsWith("https://") || c.companyPageUrl?.startsWith("http://")) company.website = c.companyPageUrl;
    const logo = photoFrom({ displayImage: { vectorImage: c.logos?.logo } });
    if (logo) company.logo = logo;
    return { company, failed };
  } catch {
    return { company: {}, failed: ["name"] };
  } finally {
    clearTimeout(timer);
  }
}
