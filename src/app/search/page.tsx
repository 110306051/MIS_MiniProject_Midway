import SearchForm from "@/components/SearchForm";
import { getFeatures } from "@/lib/server/features";
import { currentUser } from "@/lib/server/auth";
import { getSearch, listPresets } from "@/lib/server/searches";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const [presets, previous, user] = await Promise.all([listPresets(), from ? getSearch(from) : null, currentUser().catch(() => null)]);
  const features = getFeatures();

  return (
    <main className="page-form">
      <section className="hero">
        <h1>告訴我們你們在哪裡上班</h1>
        <p>填完兩個人的通勤條件和一起住的預算，我們會算出幾個對雙方都說得過去的地區。{user ? "這次搜尋會存到你的帳號。" : "登入後，搜尋會存到你的帳號，之後可以在「我的搜尋」找到。"}</p>
      </section>
      <SearchForm presets={presets} features={features} initial={previous?.input ?? null} initialFlex={previous?.budgetFlex ?? 0} />
    </main>
  );
}
