import SearchForm from "@/components/SearchForm";
import { getFeatures } from "@/lib/server/features";
import { currentUser } from "@/lib/server/auth";
import { getT } from "@/lib/server/locale";
import { getSearch, listPresets } from "@/lib/server/searches";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const [presets, previous, user, { L }] = await Promise.all([listPresets(), from ? getSearch(from) : null, currentUser().catch(() => null), getT()]);
  const features = getFeatures();

  return (
    <main className="page-form">
      <section className="page-hero">
        <h1>{L("告訴我們你們在哪裡上班", "Where do you two work?")}</h1>
        <p>
          {L("填完兩個人的通勤條件和一起住的預算，我們會算出幾個對雙方都說得過去的地區。", "Fill in both commutes and your shared budget, and we'll work out a few areas that are fair to both of you. ")}
          {user
            ? L("這次搜尋會存到你的帳號。", "This search will be saved to your account.")
            : L("登入後，搜尋會存到你的帳號，之後可以在「我的搜尋」找到。", "Log in to keep your searches under My searches.")}
        </p>
      </section>
      <SearchForm presets={presets} features={features} initial={previous?.input ?? null} initialFlex={previous?.budgetFlex ?? 0} />
    </main>
  );
}
