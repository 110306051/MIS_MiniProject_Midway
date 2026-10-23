/**
 * 首頁主視覺：兩條通勤路線從青埔與信義出發，在新莊交會。
 * 線條會「畫出來」一次；系統設定減少動態時直接顯示完成狀態。
 */
export default function RouteArt() {
  const ink = "#17212b";
  return (
    <svg className="route-art" viewBox="0 0 640 440" role="img" aria-label="路線圖：小明從青埔、小華從信義出發，兩條線在新莊交會，小明通勤 48 分鐘、小華 40 分鐘">
      {/* 其他候選地區（淡出顯示） */}
      <g className="fade" fill="#fff" stroke="#b9c3c9" strokeWidth="3">
        <circle cx="250" cy="170" r="7" />
        <circle cx="400" cy="320" r="7" />
        <circle cx="200" cy="270" r="7" />
        <circle cx="500" cy="300" r="7" />
      </g>
      <g className="fade" fill="#85909b" fontSize="14">
        <text x="238" y="152" textAnchor="middle">林口</text>
        <text x="400" y="348" textAnchor="middle">板橋</text>
        <text x="188" y="296" textAnchor="middle">龜山</text>
        <text x="500" y="326" textAnchor="middle">三重</text>
      </g>

      {/* 兩條路線 */}
      <path className="seg draw" pathLength={1} d="M60 380 H190 L330 240 H340" stroke="#8246af" />
      <path className="seg draw b" pathLength={1} d="M590 80 H480 L340 220 V240" stroke="#0070bd" />

      {/* 起點 */}
      <g fill="#fff" strokeWidth="6">
        <circle cx="60" cy="380" r="13" stroke="#8246af" />
        <circle cx="590" cy="80" r="13" stroke="#0070bd" />
      </g>
      <g fontWeight="800" fontSize="20" fill={ink}>
        <text x="60" y="424" textAnchor="middle">青埔</text>
        <text x="590" y="48" textAnchor="middle">信義</text>
      </g>
      <g fontSize="13" fill="#4f5b66">
        <text x="96" y="424">小明上班</text>
        <text x="554" y="48" textAnchor="end">小華上班</text>
      </g>

      {/* 通勤分鐘數 */}
      <g className="fade" fontWeight="800" fontSize="18">
        <text x="300" y="352" fill="#5b2c80">48 分</text>
        <text x="380" y="150" fill="#00508a" textAnchor="end">40 分</text>
      </g>

      {/* 中間點 */}
      <g className="pop">
        <circle cx="340" cy="240" r="24" fill="#f5c400" stroke={ink} strokeWidth="7" />
      </g>
      <g className="fade">
        <rect x="372" y="184" width="168" height="62" rx="8" fill={ink} />
        <text x="388" y="212" fill="#fff" fontWeight="800" fontSize="20">新莊</text>
        <text x="388" y="234" fill="#d8dee2" fontSize="13">兩人通勤只差 8 分鐘</text>
      </g>
    </svg>
  );
}
