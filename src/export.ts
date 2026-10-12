import { t } from "./i18n";
import type { CompanySummary, PersonSummary } from "./source";

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

export const companyUrl = (slug: string) => `https://www.linkedin.com/company/${encodeURIComponent(slug)}/`;

export const sizeText = (size: NonNullable<CompanySummary["size"]>) =>
  t("companySize", size.end ? `${size.start}–${size.end}` : `${size.start}+`);

// Mesmo modelo fixo da Pessoa: título, tagline, linhas "- Campo: valor", link da página.
export function companyMarkdown(c: Partial<CompanySummary>, lang: string): string {
  const lines = [`# ${c.name}`, ""];
  if (c.tagline) lines.push(c.tagline, "");
  const fields: [string, string | undefined][] = [
    [t("exportIndustry"), c.industry],
    [t("exportSize"), c.size && sizeText(c.size)],
    [t("exportHeadquarters"), c.headquarters],
    [t("exportFollowers"), c.followers !== undefined ? new Intl.NumberFormat(lang || undefined).format(c.followers) : undefined],
    [t("exportWebsite"), c.website],
    [t("exportPage"), c.slug && companyUrl(c.slug)],
  ];
  for (const [k, v] of fields) if (v) lines.push(`- ${k}: ${v}`);
  return lines.join("\n") + "\n";
}
