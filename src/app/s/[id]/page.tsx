import Link from "next/link";
import ResultsView from "@/components/ResultsView";
import { getFeatures } from "@/lib/server/features";
import { getSearch, getVotes } from "@/lib/server/searches";

export const dynamic = "force-dynamic";

export default async function SearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const search = await getSearch(id);
  if (!search) {
    return (
      <main className="not-found">
        <h1>找不到這個搜尋</h1>
        <p className="hint">連結可能打錯了，或資料已被刪除。</p>
        <Link className="primary-btn" href="/search">
          重新搜尋
        </Link>
      </main>
    );
  }
  const votes = await getVotes(id);
  return <ResultsView search={search} initialVotes={votes} features={getFeatures()} />;
}
