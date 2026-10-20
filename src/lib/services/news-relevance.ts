import type { Brand } from "@/lib/types";

function words(text: string): string[] {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
}

function containsAlias(text: string[], alias: string, gap = 0): boolean {
  const phrase = words(alias);
  if (!phrase[0]) return false;
  return text.some((word, start) => {
    if (word !== phrase[0]) return false;
    let cursor = start;
    for (const next of phrase.slice(1)) {
      const offset = text.slice(cursor + 1, cursor + 2 + gap).indexOf(next);
      if (offset < 0) return false;
      cursor += offset + 1;
    }
    return true;
  });
}

export function brandSearchAliases(brand: Brand): string[] {
  const company = brand.name.replace(/(?:\s+for)?\s+restaurants?$/i, "").trim();
  return [
    ...new Set([
      brand.name,
      ...brand.newsSearchTerms,
      ...(company !== brand.name ? [company] : []),
    ]),
  ];
}

export function matchArticleBrands(text: string, brands: Brand[]): string[] {
  const tokens = words(text);
  const context =
    /\b(?:restaurants?|restaurateurs?|foodservice|hospitality|merchants?|payments?|fintech|pos|checkout|ordering|commerce|kitchen)\b/i.test(
      tokens.join(" "),
    );
  return brands
    .filter((brand) => {
      const normalized = tokens.join(" ");
      if (
        brand.isOwnBrand &&
        /\bgenius act\b/.test(normalized) &&
        !/\bgenius (?:pos|platform|for restaurants|point of sale)\b/.test(
          normalized,
        )
      )
        return false;
      if (brand.isOwnBrand && context && containsAlias(tokens, brand.name, 3))
        return true;
      const candidates = tokens.filter((token, index) => {
        if (
          token === "toast" &&
          ["french", "avocado", "burnt", "buttered", "sourdough"].includes(
            tokens[index - 1],
          )
        )
          return false;
        if (token === "square") {
          const vicinity = tokens
            .slice(Math.max(0, index - 5), index + 7)
            .join(" ");
          return (
            ![
              "town",
              "times",
              "pioneer",
              "union",
              "trafalgar",
              "madison",
              "lincoln",
            ].includes(tokens[index - 1]) &&
            ![
              "tech",
              "enix",
              "feet",
              "foot",
              "meters",
              "metres",
              "mile",
              "root",
              "north",
              "south",
            ].includes(tokens[index + 1]) &&
            /\b(?:pos|payments?|checkout|terminal|register|handheld|merchants?|software|block|launches|introduces|expands|unveils)\b/.test(
              vicinity,
            )
          );
        }
        if (token === "clover")
          return (
            tokens[index + 1] !== "health" &&
            !/\b(?:medicare|medicaid|health insurance)\b/.test(normalized)
          );
        return true;
      });
      return (
        brand.newsSearchTerms.some((alias) =>
          containsAlias(candidates, alias),
        ) ||
        (context &&
          brandSearchAliases(brand).some((alias) =>
            containsAlias(candidates, alias),
          ))
      );
    })
    .map((brand) => brand.id);
}

export function brandNewsQuery(brand: Brand, days: number): string {
  const aliases = brandSearchAliases(brand).map((alias) => {
    const quoted = `"${alias.replaceAll('"', " ")}"`;
    if (["square", "clover", "toast"].includes(alias.toLowerCase()))
      return `(${quoted} (POS OR payments OR checkout OR kiosk OR software OR fintech))`;
    return quoted;
  });
  if (brand.isOwnBrand && /global payments genius/i.test(brand.name))
    aliases.push('(\"Global Payments\" Genius)');
  return `(${aliases.join(" OR ")}) (restaurant OR POS OR payments OR merchant) when:${days}d`;
}
