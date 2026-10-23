import type { Metrics } from "@/lib/types";

export default function HowItWorks({ source }: { source: Metrics["commuteSource"] }) {
  return (
    <div className="how">
      <ol className="steps">
        <li>
          <b>計算通勤</b>
          <span>
            {source === "estimate"
              ? "目前為估算模式：以直線距離、繞行係數、候車與轉乘時間估計。設定 Google Maps 金鑰後會改用 Routes API 查詢真實的尖峰時段通勤時間。"
              : "以 Google Routes API 查詢每個候選地點到兩人工作地的尖峰時段通勤時間（大眾運輸以工作日早上 9 點前抵達計算），結果快取 30 天。"}
          </span>
        </li>
        <li><b>硬性條件過濾</b><span>任一人通勤超過自己設定的上限就排除。租金不看該區的平均行情，而是看「預算內（含預算彈性）找不找得到房子」：至少有 2 間才推薦。所以行情偏高的地區，只要還有便宜的房子就不會被排除。</span></li>
        <li><b>四項分數正規化</b><span>把分鐘、元等不同單位轉成 0 到 1，越接近 1 越好。</span></li>
        <li><b>依權重加總</b><span>兩人一起決定四項的相對重要性，得到總分 S 並排序。</span></li>
        <li><b>挑出不同類型方案</b><span>除了總分最高，也放入「最公平」「最省時」「最省錢」「生活機能最好」的代表，避免推薦結果都很像。</span></li>
        <li><b>區域內房源再評分</b><span>選定區域後，用同一個公式對該區每一筆房源重新計分（各房源的實際座標、租金、是否可養寵物）。</span></li>
      </ol>
      <div className="formula">
        <div className="f-main">S = w<sub>f</sub>·f + w<sub>s</sub>·s + w<sub>r</sub>·r + w<sub>p</sub>·p</div>
        <dl>
          <dt><i className="wdot w-f" />公平 f</dt><dd>1 − max(t<sub>A</sub>/T<sub>A</sub>, t<sub>B</sub>/T<sub>B</sub>)　只看比較辛苦的那個人（minimax）</dd>
          <dt><i className="wdot w-s" />省時 s</dt><dd>1 − (d<sub>A</sub>t<sub>A</sub> + d<sub>B</sub>t<sub>B</sub>) / (d<sub>A</sub>T<sub>A</sub> + d<sub>B</sub>T<sub>B</sub>)　依進辦公室天數加權的總通勤（minisum）</dd>
          <dt><i className="wdot w-r" />成本 r</dt><dd>1 − 每月成本 / 預算　租金使用「可接受範圍內房源的中位數」，也就是你們實際會租到的價格；可勾選是否計入交通費</dd>
          <dt><i className="wdot w-p" />機能 p</dt><dd>所勾選生活機能在該區的分數平均</dd>
        </dl>
        <p className="hint">t：單程通勤分鐘；T：各自可接受的上限；d：每週進辦公室天數。</p>
      </div>
      <div className="limits">
        <h4>目前限制</h4>
        <ul>
          <li>租金行情、生活機能分數與房源皆為模擬資料。</li>
          <li>行情偏高地區的便宜房源通常有代價（屋齡、坪數、離站距離），系統會標示出來，但無法判斷屋況好壞。</li>
          <li>Google Route Matrix 不回傳搭乘路線，所以大眾運輸交通費以都會通月票估算。</li>
          <li>線性懲罰：假設 30→40 分鐘與 70→80 分鐘一樣痛苦。</li>
          <li>權重主觀：之後可用 AHP 兩兩比較決定權重。</li>
        </ul>
      </div>
    </div>
  );
}
