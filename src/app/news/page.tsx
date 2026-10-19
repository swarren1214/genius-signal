import { NewsWorkspace } from "@/components/dashboard/news-workspace";
import { newsArticles } from "@/lib/mock-data";
import { getNewsFeed } from "@/lib/data/news";

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ search?: string; article?: string }> }) {
  const [news, params] = await Promise.all([getNewsFeed(), searchParams]);
  const hasArticles = news.articles.length > 0;
  return <NewsWorkspace key={`${params.search ?? ""}-${params.article ?? ""}`} articles={hasArticles ? news.articles : newsArticles} isLive={news.isLive && hasArticles} initialSearch={params.search} initialArticle={params.article} />;
}
