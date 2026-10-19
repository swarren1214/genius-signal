import { z } from "zod";

export const pendoAppIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "Select an explicit application, not the default app.")
  .refine(
    (id) => Number.isSafeInteger(Number(id)),
    "Application ID is outside the supported range.",
  );
export const pendoAppSchema = z.object({
  appId: pendoAppIdSchema,
  appName: z.string().trim().max(150),
});
export const pendoScopeSchema = z
  .object({
    apps: z.array(pendoAppSchema).min(1).max(8),
    appName: z.string().trim().max(150),
  })
  .refine(
    (scope) =>
      new Set(scope.apps.map((app) => app.appId)).size === scope.apps.length,
    "Select each application only once.",
  );
export type PendoScope = z.infer<typeof pendoScopeSchema>;

export function resolvePendoScope(
  settings: unknown,
  fallback: { appId: string; appName: string },
): PendoScope {
  const legacy = z
    .object({ appId: z.string(), appName: z.string().optional() })
    .safeParse(settings);
  if (
    legacy.success &&
    !(settings && typeof settings === "object" && "apps" in settings)
  )
    return pendoScopeSchema.parse({
      apps: [{ appId: legacy.data.appId, appName: legacy.data.appName ?? "" }],
      appName: legacy.data.appName ?? "",
    });
  if (settings) return pendoScopeSchema.parse(settings);
  return pendoScopeSchema.parse({
    apps: fallback.appId
      .split(",")
      .map((appId) => ({
        appId: appId.trim(),
        appName: fallback.appId.includes(",") ? "" : fallback.appName,
      })),
    appName: fallback.appName,
  });
}

export function scopeAppIds(scope: PendoScope): string[] {
  return scope.apps.map((app) => app.appId).sort();
}
