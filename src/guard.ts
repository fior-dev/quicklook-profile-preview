export type Limited = { limited: "wait" | "backoff"; retryAt: number };
export type Fetched = { failed: string[]; rateLimited?: boolean };
type Sources = Record<string, (slug: string) => Promise<Fetched>>;
export type Store = {
  get(keys: string | string[]): Promise<Record<string, any>>;
  set(items: Record<string, unknown>): Promise<void>;
};

const DAY = 24 * 60 * 60_000;
const MINUTE = 60_000;
const CAP = 20; // perfis por minuto, somando todas as abas
const BACKOFF_BASE = 30_000;
const BACKOFF_MAX = 15 * MINUTE;

type Rate = { stamps: number[]; blockedUntil: number; strikes: number };

// Mesma interface da Fonte LinkedIn, por tipo (Pessoa, Empresa): cache 24h, uma busca por perfil, teto por minuto e backoff em 429.
// ponytail: ler-e-gravar em storage.session não é atômico entre abas; o teto pode estourar em 1 ou 2 perfis. Trancar via service worker se importar.
export function createGuard<S extends Sources>(storage: Store, sources: S) {
  type Result<K extends keyof S> = Awaited<ReturnType<S[K]>> | Limited;
  const inflight = new Map<string, Promise<any>>();

  const updateRate = async (fn: (r: Rate) => void) => {
    const r: Rate = { stamps: [], blockedUntil: 0, strikes: 0, ...(await storage.get("rate")).rate };
    fn(r);
    await storage.set({ rate: r });
    return r;
  };

  const run = async (kind: keyof S & string, slug: string, lang: string): Promise<any> => {
    const key = `cache:${kind}:${lang}:${slug}`;
    const now = Date.now();
    const got = await storage.get([key, "rate"]);
    if (got[key] && now - got[key].at < DAY) return got[key].result;

    const rate: Rate = { stamps: [], blockedUntil: 0, strikes: 0, ...got.rate };
    if (rate.blockedUntil > now) return { limited: "backoff", retryAt: rate.blockedUntil };
    const recent = rate.stamps.filter((s) => now - s < MINUTE);
    if (recent.length >= CAP) return { limited: "wait", retryAt: recent[0] + MINUTE };
    await updateRate((r) => (r.stamps = [...r.stamps.filter((s) => now - s < MINUTE), now]));

    const result = await sources[kind](slug);
    if (result.rateLimited) {
      const r = await updateRate((r) => {
        r.strikes++;
        r.blockedUntil = Date.now() + Math.min(BACKOFF_BASE * 2 ** (r.strikes - 1), BACKOFF_MAX);
      });
      return { limited: "backoff", retryAt: r.blockedUntil };
    }
    if (rate.strikes) await updateRate((r) => (r.strikes = 0));
    if (!result.failed.length) await storage.set({ [key]: { at: Date.now(), result } });
    return result;
  };

  return {
    get<K extends keyof S & string>(kind: K, slug: string, lang: string): Promise<Result<K>> {
      const key = `${kind}:${lang}:${slug}`;
      let p = inflight.get(key);
      if (!p) {
        p = run(kind, slug, lang).finally(() => inflight.delete(key));
        inflight.set(key, p);
      }
      return p;
    },
  };
}
