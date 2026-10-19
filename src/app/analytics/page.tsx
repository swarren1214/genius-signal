import { AnalyticsWorkspace } from "@/components/dashboard/analytics-workspace";
import { getAnalyticsData } from "@/lib/data/analytics";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return <AnalyticsWorkspace data={data} />;
}
