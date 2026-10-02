import { t } from "./i18n";
import type { PersonSummary } from "./source";

export const profileUrl = (slug: string) => `https://www.linkedin.com/in/${encodeURIComponent(slug)}/`;

// URL de composição de mensagem com o destinatário preenchido; só abre a janela, nunca envia.
// Não confirmado no LinkedIn real: padrão `/messaging/compose/?recipient=<id do urn>` (ver docs/PENDENCIAS.md).
export const messageUrl = (urn: string) =>
  `https://www.linkedin.com/messaging/compose/?recipient=${encodeURIComponent(urn.split(":").pop() ?? "")}`;

export const formatSince = (since: NonNullable<PersonSummary["since"]>, lang: string) =>
  new Intl.DateTimeFormat(lang || undefined, { month: "short", year: "numeric" }).format(new Date(since.year, since.month - 1));

// Modelo fixo: título, linhas "- Campo: valor" na ordem abaixo, depois o Sobre. Só entra o que foi carregado.
export function personMarkdown(p: Partial<PersonSummary>, lang: string): string {
  const lines = [`# ${p.name}${p.pronouns ? ` (${p.pronouns})` : ""}`, ""];
  if (p.headline) lines.push(p.headline, "");
  const job = [p.title, p.company].filter(Boolean).join(" · ");
  const fields: [string, string | undefined][] = [
    [t("exportPosition"), job && `${job}${p.since ? ` (${t("cardSince", formatSince(p.since, lang))})` : ""}`],
    [t("exportLocation"), p.location],
    [t("exportConnection"), p.degree && t(`cardDegree${p.degree}`)],
    [t("exportProfile"), p.slug && profileUrl(p.slug)],
  ];
  for (const [k, v] of fields) if (v) lines.push(`- ${k}: ${v}`);
  if (p.about) lines.push("", `## ${t("exportAbout")}`, "", p.about);
  return lines.join("\n") + "\n";
}

export const fileName = (slug: string) => `${slug.replace(/[^\w.-]+/g, "_")}.md`;
