import { NewsWorkspace } from "@/components/dashboard/news-workspace";
import { getNewsFeed } from "@/lib/data/news";
import { getBrands } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ search?: string; article?: string }> }) {
  const [news, params] = await Promise.all([getNewsFeed(), searchParams]);
  return <NewsWorkspace key={`${params.search ?? ""}:${params.article ?? ""}`} news={news} brands={getBrands()} initialSearch={params.search} initialArticle={params.article} />;
}