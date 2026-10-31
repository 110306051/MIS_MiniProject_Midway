import Link from "next/link";
import HeroRoutes from "@/components/site/HeroRoutes";
import Reveal from "@/components/site/Reveal";
import { getT } from "@/lib/server/locale";

export default async function Landing() {
  const { L, locale } = await getT();
  const en = locale === "en";

  const steps = [
    { n: "01", t: L("輸入兩人的工作地", "Drop in both workplaces"), d: L("各自的通勤方式、每週進辦公室幾天，以及最多能忍受幾分鐘。", "How each of you gets to work, how many days a week, and the longest ride you'll put up with.") },
    { n: "02", t: L("調整你們在乎的事", "Tune what matters"), d: L("公平、省時、省錢、生活機能，兩個人一起拉權重，推薦即時重算。", "Fairness, time, money, neighbourhood. Drag the weights together and the ranking updates live.") },
    { n: "03", t: L("一起選出中間點", "Pick your midpoint"), d: L("把連結傳給對方，各自按喜歡，再看那一區預算內有哪些房子。", "Share one link, heart the places you like, then browse what's actually in budget there.") },
  ];
  const others = [
    L("先選行政區，再篩房子", "Choose a district first, then filter"),
    L("只考慮一個人的通勤", "Plans around one person's commute"),
    L("看平均房價判斷貴不貴", "Judges an area by its average rent"),
    L("找完再轉述給室友", "Screenshots sent to your flatmate"),
  ];
  const ours = [
    L("先給條件，系統反推適合的地區", "Give conditions; it works back to the areas"),
    L("同時算兩個人的通勤，並標出誰比較辛苦", "Times both commutes and flags who has it harder"),
    L("看預算內實際有幾間房子，行情偏高的地區也不會錯過", "Counts homes truly in budget, even in pricey areas"),
    L("同一個連結一起調整、一起投票", "One link to tune and vote on together"),
  ];

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="kicker">
              <span className="k-a" />
              <span className="k-b" />
              {L("給兩個通勤族的租屋推薦", "Rental search for two commuters")}
            </p>
            <h1 className={en ? "en" : ""}>
              <span className="ln"><span>{L("兩條通勤路線，", "Two commutes.")}</span></span>
              <span className="ln"><span>{L("找一個", "One home ")}<mark>{L("共同的家", "in between")}</mark>{L("。", ".")}</span></span>
            </h1>
            <p className="sub">
              {L(
                "你在桃園上班，室友在台北。一般租屋網要你先決定住哪裡；中途租反過來，從兩個人的通勤時間和預算，算出對雙方都說得過去的地區。",
                "You work in Taoyuan, your flatmate in Taipei. Most rental sites make you pick a district first. Midway works backwards from both commutes and your shared budget to the areas that are fair to you both."
              )}
            </p>
            <div className="hero-cta">
              <Link href="/search" className="sun-btn big">
                {L("開始找中間點", "Find our midpoint")}
                <span aria-hidden="true">→</span>
              </Link>
              <a href="#how" className="text-btn">
                {L("先看看怎麼運作", "See how it works")}
              </a>
            </div>
          </div>
          <HeroRoutes />
        </div>
        <div className="hero-ticker" aria-hidden="true">
          <div>
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k}>
                {(en
                  ? ["Qingpu", "Xinzhuang", "Sanchong", "Banqiao", "Linkou", "Zhongli", "Neihu", "Nangang", "Xinyi", "Taoyuan", "Yonghe", "Shulin"]
                  : ["青埔", "新莊", "三重", "板橋", "林口", "中壢", "內湖", "南港", "信義", "桃園", "永和", "樹林"]
                ).map((x) => (
                  <em key={x}>{x}</em>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <Reveal className="sec-head">
          <h2>{L("三站，兩個人一起決定", "Three stops to a shared address")}</h2>
          <p className="lead">{L("不用各自查 Google 地圖、再到租屋網一區一區翻。", "No more checking maps separately and trawling listings district by district.")}</p>
        </Reveal>
        <Reveal as="ol" className="stops">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="stop-n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </Reveal>
      </section>

      <section className="section compare-sec">
        <Reveal className="sec-head">
          <h2>{L("跟一般租屋網哪裡不一樣", "How it differs from a listings site")}</h2>
          <p className="lead">{L("租屋網擅長「幫一個人篩房子」，我們處理的是「兩個人要住哪裡」。", "Listing sites filter homes for one person. Midway answers where two people should live.")}</p>
        </Reveal>
        <Reveal className="versus">
          <div className="vs-old">
            <h3>{L("一般租屋平台", "Typical rental platform")}</h3>
            <svg viewBox="0 0 200 24" aria-hidden="true"><path d="M8 12 H192" /><circle cx="8" cy="12" r="6" /><circle cx="192" cy="12" r="6" /></svg>
            <ul>{others.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="vs-new">
            <h3>Midway {en ? "" : "中途租"}</h3>
            <svg viewBox="0 0 200 24" aria-hidden="true">
              <path className="va" d="M8 12 H100" />
              <path className="vb" d="M192 12 H100" />
              <circle className="ca" cx="8" cy="12" r="6" />
              <circle className="cb" cx="192" cy="12" r="6" />
              <circle className="cm" cx="100" cy="12" r="8" />
            </svg>
            <ul>{ours.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </Reveal>
      </section>

      <section className="cta-band">
        <svg className="cta-lines" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path className="ca" d="M-40 210 H200 L300 110 H330" />
          <path className="cb" d="M1240 50 H1000 L900 150 H870" />
          <circle className="ea" cx="330" cy="110" r="9" />
          <circle className="eb" cx="870" cy="150" r="9" />
        </svg>
        <div className="cta-inner">
          <h2>{L("準備好一起找了嗎？", "Ready to meet in the middle?")}</h2>
          <Link href="/search" className="sun-btn big">
            {L("開始找中間點", "Find our midpoint")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <footer className="site-foot">{L("中途租 Midway 課堂專案原型。房源與租金為模擬資料。", "Midway is a class project prototype. Listings and rents are simulated.")}</footer>
    </main>
  );
}
