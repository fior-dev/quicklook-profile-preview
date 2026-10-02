export type Settings = { enabled: boolean; lang: "auto" | "pt_BR" | "en"; delay: number };
export const DEFAULTS: Settings = { enabled: true, lang: "auto", delay: 400 };
export const DELAYS = [200, 400, 700, 1000];

// O que o código usa de chrome.storage.sync; o teste passa um falso.
export type SettingsSource = {
  get(keys: string[]): Promise<Record<string, any>>;
  onChanged: { addListener(cb: (changes: Record<string, { newValue?: unknown }>) => void): void };
};

export const loadSettings = async (src: Pick<SettingsSource, "get">): Promise<Settings> => ({
  ...DEFAULTS,
  ...(await src.get(Object.keys(DEFAULTS))),
});

// Chama `cb` já com o valor salvo e de novo a cada mudança, sem recarregar a aba.
export function watchSettings(src: SettingsSource, cb: (s: Settings) => void) {
  let current = DEFAULTS;
  loadSettings(src).then((s) => cb((current = s)));
  src.onChanged.addListener((changes) => {
    const next = { ...current };
    for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) if (k in changes) (next as any)[k] = changes[k].newValue ?? DEFAULTS[k];
    cb((current = next));
  });
}
