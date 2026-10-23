import Link from "next/link";
import RouteArt from "@/components/site/RouteArt";

export default function Landing() {
  return (
    <main className="landing">
      <section className="hero-wrap">
        <div className="hero-copy">
          <h1>
            <span className="line">兩條通勤路線，</span>
            <span className="line">找一個共同的家。</span>
          </h1>
          <p>你在桃園上班，室友在台北。一般租屋網要你先決定住哪裡；中途租反過來，從兩個人的通勤時間和預算，算出對雙方都說得過去的地區。</p>
          <div className="hero-cta">
            <Link href="/search" className="yellow-btn">
              開始找中間點
            </Link>
            <a href="#how" className="link-btn">
              先看看怎麼運作
            </a>
          </div>
        </div>
        <RouteArt />
      </section>

      <div className="band" id="how">
        <section className="section">
          <h2>三步驟，兩個人一起決定</h2>
          <p className="lead">不用各自查 Google 地圖、再到租屋網一區一區翻。</p>
          <ol className="stops">
            <li>
              <h3>輸入兩人的工作地</h3>
              <p>各自的通勤方式、每週進辦公室幾天，以及最多能忍受幾分鐘。</p>
            </li>
            <li>
              <h3>調整你們在乎的事</h3>
              <p>公平、省時、省錢、生活機能，兩個人一起拉權重，推薦即時重算。</p>
            </li>
            <li>
              <h3>一起選出中間點</h3>
              <p>把連結傳給對方，各自按喜歡，再看那一區預算內有哪些房子。</p>
            </li>
          </ol>
        </section>
      </div>

      <section className="section">
        <h2>跟一般租屋網哪裡不一樣</h2>
        <p className="lead">租屋網擅長「幫一個人篩房子」，我們處理的是「兩個人要住哪裡」。</p>
        <div className="versus">
          <div>
            <h3>一般租屋平台</h3>
            <ul>
              <li>先選行政區，再篩房子</li>
              <li>只考慮一個人的通勤</li>
              <li>看平均房價判斷貴不貴</li>
              <li>找完再轉述給室友</li>
            </ul>
          </div>
          <div>
            <h3>中途租</h3>
            <ul>
              <li>先給條件，系統反推適合的地區</li>
              <li>同時算兩個人的通勤，並標出誰比較辛苦</li>
              <li>看預算內實際有幾間房子，行情偏高的地區也不會錯過</li>
              <li>同一個連結一起調整、一起投票</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="cta-band">
        <section className="section">
          <h2>準備好一起找了嗎？</h2>
          <Link href="/search" className="yellow-btn">
            開始找中間點
          </Link>
        </section>
      </div>
      <footer className="site-foot">中途租 Midway 課堂專案原型。房源與租金為模擬資料。</footer>
    </main>
  );
}
