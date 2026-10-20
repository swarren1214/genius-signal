import type { Brand } from "@/lib/types";

export const logoDomainPattern = String.raw`(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}`;

const domains: Record<string, string> = {
  genius: "globalpayments.com",
  toast: "toasttab.com",
  square: "squareup.com",
  clover: "clover.com",
  touchbistro: "touchbistro.com",
  lightspeed: "lightspeedhq.com",
  spoton: "spoton.com",
};

export function brandLogoDomain(
  brand: Pick<Brand, "id" | "logoDomain">,
): string | null {
  const domain = (brand.logoDomain ?? domains[brand.id] ?? "")
    .trim()
    .toLowerCase();
  return new RegExp(`^(?:${logoDomainPattern})$`).test(domain)
    ? domain
    : null;
}

export function brandLogoUrl(
  brand: Pick<Brand, "id" | "logoDomain">,
  token?: string,
): string | null {
  const domain = brandLogoDomain(brand);
  if (!domain || !token?.startsWith("pk_")) return null;
  const url = new URL(`https://img.logo.dev/${domain}`);
  url.searchParams.set("token", token);
  url.searchParams.set("size", "64");
  url.searchParams.set("format", "png");
  url.searchParams.set("theme", "light");
  url.searchParams.set("retina", "true");
  url.searchParams.set("fallback", "404");
  return url.toString();
}
