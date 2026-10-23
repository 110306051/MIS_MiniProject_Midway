/**
 * 種子資料（模擬）。座標為近似值；租金與生活機能分數皆為示範用估計。
 * rent2r：兩房整層月租中位數；amen 順序：超市商圈、公園綠地、餐廳夜生活、安靜住宅、寵物友善
 */

type Seed = { id: string; name: string; city: string; lat: number; lng: number; lines: string[]; rent2r: number; amen: number[] };

export const POINTS: Seed[] = [
  // 台北市
  { id: "zhongshan", name: "中山", city: "台北市", lat: 25.0526, lng: 121.5205, lines: ["R", "G"], rent2r: 33000, amen: [1, 0.6, 1, 0.3, 0.4] },
  { id: "daan", name: "大安", city: "台北市", lat: 25.033, lng: 121.5435, lines: ["R", "BR"], rent2r: 38000, amen: [1, 0.8, 1, 0.5, 0.5] },
  { id: "guting", name: "古亭", city: "台北市", lat: 25.0263, lng: 121.5229, lines: ["G", "O"], rent2r: 32000, amen: [0.9, 0.6, 0.8, 0.5, 0.4] },
  { id: "songshan", name: "松山", city: "台北市", lat: 25.0498, lng: 121.5776, lines: ["G", "TRA"], rent2r: 31000, amen: [0.9, 0.7, 0.8, 0.5, 0.5] },
  { id: "xinyi-xs", name: "信義（象山）", city: "台北市", lat: 25.0328, lng: 121.5701, lines: ["R"], rent2r: 36000, amen: [0.9, 1, 0.8, 0.6, 0.6] },
  { id: "shilin", name: "士林", city: "台北市", lat: 25.0937, lng: 121.5262, lines: ["R"], rent2r: 28000, amen: [0.8, 0.8, 0.9, 0.5, 0.6] },
  { id: "beitou", name: "北投", city: "台北市", lat: 25.1321, lng: 121.4986, lines: ["R"], rent2r: 25000, amen: [0.6, 0.9, 0.6, 0.8, 0.7] },
  { id: "neihu", name: "內湖", city: "台北市", lat: 25.0836, lng: 121.587, lines: ["BR"], rent2r: 30000, amen: [0.8, 0.9, 0.6, 0.8, 0.7] },
  { id: "nangang", name: "南港", city: "台北市", lat: 25.052, lng: 121.6066, lines: ["BL", "BR", "TRA", "HSR"], rent2r: 30000, amen: [0.7, 0.8, 0.5, 0.7, 0.6] },
  { id: "wanhua", name: "萬華", city: "台北市", lat: 25.0353, lng: 121.4999, lines: ["BL", "TRA"], rent2r: 24000, amen: [0.8, 0.5, 0.8, 0.3, 0.4] },
  { id: "jingmei", name: "景美", city: "台北市", lat: 24.9928, lng: 121.5408, lines: ["G"], rent2r: 26000, amen: [0.8, 0.7, 0.7, 0.6, 0.6] },
  // 新北市
  { id: "banqiao", name: "板橋", city: "新北市", lat: 25.0143, lng: 121.4635, lines: ["BL", "TRA", "HSR", "Y"], rent2r: 26000, amen: [1, 0.7, 0.9, 0.5, 0.5] },
  { id: "xinpu", name: "新埔", city: "新北市", lat: 25.0233, lng: 121.4682, lines: ["BL", "Y"], rent2r: 25000, amen: [0.9, 0.6, 0.8, 0.5, 0.5] },
  { id: "xinzhuang", name: "新莊", city: "新北市", lat: 25.036, lng: 121.452, lines: ["O", "A"], rent2r: 22000, amen: [0.8, 0.6, 0.7, 0.6, 0.6] },
  { id: "sanchong", name: "三重", city: "新北市", lat: 25.0617, lng: 121.4874, lines: ["O", "A"], rent2r: 23000, amen: [0.8, 0.6, 0.7, 0.4, 0.5] },
  { id: "luzhou", name: "蘆洲", city: "新北市", lat: 25.085, lng: 121.464, lines: ["O"], rent2r: 20000, amen: [0.7, 0.6, 0.6, 0.6, 0.6] },
  { id: "taishan", name: "泰山（A4 新北產業園區）", city: "新北市", lat: 25.0617, lng: 121.4597, lines: ["A", "Y"], rent2r: 21000, amen: [0.6, 0.6, 0.5, 0.6, 0.7] },
  { id: "zhonghe", name: "中和", city: "新北市", lat: 24.999, lng: 121.499, lines: ["O", "Y"], rent2r: 22000, amen: [0.8, 0.5, 0.7, 0.5, 0.5] },
  { id: "yonghe", name: "永和", city: "新北市", lat: 25.009, lng: 121.515, lines: ["O"], rent2r: 24000, amen: [0.9, 0.6, 0.8, 0.4, 0.4] },
  { id: "xindian", name: "新店", city: "新北市", lat: 24.9675, lng: 121.541, lines: ["G", "Y"], rent2r: 24000, amen: [0.7, 0.9, 0.6, 0.7, 0.7] },
  { id: "tucheng", name: "土城", city: "新北市", lat: 24.973, lng: 121.444, lines: ["BL"], rent2r: 20000, amen: [0.6, 0.7, 0.5, 0.7, 0.6] },
  { id: "shulin", name: "樹林", city: "新北市", lat: 24.9913, lng: 121.4245, lines: ["TRA"], rent2r: 18000, amen: [0.6, 0.6, 0.5, 0.7, 0.7] },
  { id: "xizhi", name: "汐止", city: "新北市", lat: 25.0679, lng: 121.6618, lines: ["TRA"], rent2r: 21000, amen: [0.7, 0.7, 0.5, 0.7, 0.7] },
  { id: "linkou", name: "林口", city: "新北市", lat: 25.07, lng: 121.361, lines: ["A"], rent2r: 20000, amen: [0.7, 0.8, 0.5, 0.8, 0.8] },
  { id: "tamsui", name: "淡水", city: "新北市", lat: 25.1678, lng: 121.4455, lines: ["R", "DS"], rent2r: 18000, amen: [0.7, 0.8, 0.7, 0.7, 0.7] },
  // 桃園市
  { id: "guishan-a7", name: "龜山（體育大學 A7）", city: "桃園市", lat: 25.035, lng: 121.371, lines: ["A"], rent2r: 15000, amen: [0.5, 0.7, 0.3, 0.9, 0.9] },
  { id: "nankan", name: "南崁", city: "桃園市", lat: 25.051, lng: 121.287, lines: [], rent2r: 15000, amen: [0.8, 0.6, 0.6, 0.7, 0.8] },
  { id: "kengkou", name: "坑口（A11）", city: "桃園市", lat: 25.0849, lng: 121.2453, lines: ["A"], rent2r: 14000, amen: [0.5, 0.6, 0.4, 0.8, 0.8] },
  { id: "taoyuan", name: "桃園區", city: "桃園市", lat: 24.993, lng: 121.301, lines: ["TRA"], rent2r: 16000, amen: [0.9, 0.6, 0.8, 0.5, 0.6] },
  { id: "qingpu", name: "青埔", city: "桃園市", lat: 25.013, lng: 121.215, lines: ["A", "HSR"], rent2r: 17000, amen: [0.7, 0.8, 0.5, 0.8, 0.8] },
  { id: "zhongli", name: "中壢", city: "桃園市", lat: 24.9536, lng: 121.2256, lines: ["TRA", "A"], rent2r: 14000, amen: [0.8, 0.5, 0.8, 0.5, 0.6] },
  { id: "neili", name: "內壢", city: "桃園市", lat: 24.9727, lng: 121.2585, lines: ["TRA"], rent2r: 13500, amen: [0.7, 0.5, 0.6, 0.6, 0.7] },
  { id: "bade", name: "八德", city: "桃園市", lat: 24.953, lng: 121.298, lines: [], rent2r: 13000, amen: [0.6, 0.6, 0.5, 0.7, 0.8] },
];

export const WORKPLACES = [
  { id: "tpe-main", name: "台北車站", city: "台北市", lat: 25.0478, lng: 121.517, lines: ["R", "BL", "A", "TRA", "HSR"] },
  { id: "xinyi", name: "信義區（市府站）", city: "台北市", lat: 25.0411, lng: 121.5654, lines: ["BL", "R"] },
  { id: "neihu-sci", name: "內湖科學園區", city: "台北市", lat: 25.08, lng: 121.575, lines: ["BR"] },
  { id: "nangang-sw", name: "南港軟體園區", city: "台北市", lat: 25.059, lng: 121.616, lines: ["BR", "BL"] },
  { id: "banqiao-st", name: "板橋車站", city: "新北市", lat: 25.0143, lng: 121.4635, lines: ["BL", "TRA", "HSR", "Y"] },
  { id: "xinzhuang-cbd", name: "新莊副都心", city: "新北市", lat: 25.061, lng: 121.448, lines: ["A", "O"] },
  { id: "linkou-cgmh", name: "林口長庚醫院", city: "桃園市", lat: 25.0615, lng: 121.383, lines: ["A"] },
  { id: "huaya", name: "龜山華亞科技園區", city: "桃園市", lat: 25.056, lng: 121.373, lines: ["A"] },
  { id: "airport", name: "桃園機場", city: "桃園市", lat: 25.0797, lng: 121.2342, lines: ["A"] },
  { id: "qingpu-hsr", name: "高鐵桃園站（青埔）", city: "桃園市", lat: 25.013, lng: 121.215, lines: ["A", "HSR"] },
  { id: "taoyuan-st", name: "桃園火車站", city: "桃園市", lat: 24.989, lng: 121.313, lines: ["TRA"] },
  { id: "zhongli-st", name: "中壢火車站", city: "桃園市", lat: 24.9536, lng: 121.2256, lines: ["TRA"] },
];

export const ROOM_FACTOR: Record<string, number> = { studio: 0.55, "2r": 1, "3r": 1.35 };
