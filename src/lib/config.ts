/** Server-only environment/config helpers. Import only from server code (services, route handlers, Server Components). */

export const pendoConfig = {
  apiKey: process.env.PENDO_API_KEY ?? "",
  appId: process.env.PENDO_APP_ID ?? "",
};

export const newsConfig = {
  apiKey: process.env.NEWS_API_KEY ?? "",
};

export const isPendoConfigured = Boolean(pendoConfig.apiKey);
export const isNewsConfigured = Boolean(newsConfig.apiKey);

export const aiConfig = {
  apiKey: process.env.OPENAI_API_KEY ?? "",
  model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
};

export const isAiConfigured = Boolean(aiConfig.apiKey);
