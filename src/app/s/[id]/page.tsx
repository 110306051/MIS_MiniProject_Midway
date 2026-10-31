import { notFound } from "next/navigation";
import ResultsView from "@/components/ResultsView";
import { getFeatures } from "@/lib/server/features";
import { getSearch, getVotes } from "@/lib/server/searches";

export const dynamic = "force-dynamic";

export default async function SearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const search = await getSearch(id);
  if (!search) notFound(); // 回傳 404 並顯示 not-found.tsx
  const votes = await getVotes(id);
  return <ResultsView search={search} initialVotes={votes} features={getFeatures()} />;
}
