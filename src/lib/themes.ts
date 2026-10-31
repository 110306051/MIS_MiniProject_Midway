/**
 * 配色與字體組合（可在畫面右下角切換）
 * 每組配色只覆寫 globals.css 裡的 CSS 變數；字體組合依需要才載入 Google Fonts。
 */

type Vars = Record<string, string>;
export type Theme = { id: string; zh: string; en: string; swatches: string[]; vars: Vars };
export type FontSet = { id: string; zh: string; en: string; sample: string; href: string; vars: Vars };

export const THEME_COOKIE = "midway-theme";
export const FONT_COOKIE = "midway-font";

/**
 * 由一組「背景與基底色」推出整組變數。
 * 背景、卡片、分隔線、按鈕盡量直接使用色票；文字與兩人的路線另外挑同色系、不衝突的顏色。
 */
const make = (v: {
  ground: string; paper?: string; header?: string;
  /** 首頁主視覺與行動區的深色底 */
  dark: string; dark2: string; darkLine: string; darkText: string; darkDim: string; darkInk?: string; darkBtn: string; onDarkBtn: string; mark: string;
  ink: string; ink2: string; ink3: string; rule: string; rule2: string;
  a: string; aSoft: string; aInk: string; b: string; bSoft: string; bInk: string;
  mid: string; midSoft: string; midInk: string; onMid?: string; btn?: string; onBtn?: string;
}): Vars => ({
  "--ground": v.ground, "--paper": v.paper ?? "#ffffff", "--header": v.header ?? v.ground,
  "--night": v.dark, "--night-2": v.dark2, "--night-line": v.darkLine, "--night-text": v.darkText, "--night-dim": v.darkDim, "--hero-ink": v.darkInk ?? "#ffffff",
  "--hero-btn": v.darkBtn, "--on-hero-btn": v.onDarkBtn, "--mark": v.mark,
  "--ink": v.ink, "--ink-2": v.ink2, "--ink-3": v.ink3, "--rule": v.rule, "--rule-2": v.rule2,
  "--a": v.a, "--a-soft": v.aSoft, "--a-ink": v.aInk, "--b": v.b, "--b-soft": v.bSoft, "--b-ink": v.bInk,
  "--mid": v.mid, "--mid-soft": v.midSoft, "--mid-ink": v.midInk, "--on-mid": v.onMid ?? v.midInk,
  "--btn": v.btn ?? v.mid, "--on-btn": v.onBtn ?? v.onMid ?? v.midInk,
});

export const THEMES: Theme[] = [
  {
    id: "soft", zh: "柔和沙金", en: "Soft sand",
    swatches: ["#2f3437", "#f5f4f0", "#d6b98a", "#c17f7f", "#7095ab"],
    vars: {}, // globals.css 的預設值
  },
  {
    // 色票：#F8F9FC #7B86AA #BFC8EA #545051 #5B67A2 #738BE7
    id: "periwinkle", zh: "霧藍長春花", en: "Periwinkle",
    swatches: ["#2E3354", "#F8F9FC", "#BFC8EA", "#5B67A2", "#738BE7", "#545051"],
    vars: make({
      ground: "#F8F9FC", rule: "#E4E8F5", rule2: "#BFC8EA",
      dark: "#2E3354", dark2: "#363C62", darkLine: "#454D7C", darkText: "#C9D0EE", darkDim: "#8F98C2", darkBtn: "#BFC8EA", onDarkBtn: "#2E3354", mark: "#A9B8F2",
      ink: "#34364A", ink2: "#545051", ink3: "#7B86AA",
      btn: "#5B67A2", onBtn: "#ffffff",
      mid: "#738BE7", midSoft: "#E9EDFB", midInk: "#3C4782", onMid: "#ffffff",
      a: "#7D8BE0", aSoft: "#E8EAF4", aInk: "#454F85",
      b: "#D7A3A3", bSoft: "#F6ECEC", bInk: "#8E5F5F",
    }),
  },
  {
    // 色票：#FFFFFF #F9D0A2 #EE9373 #E5CB8E #42534A #F9E0D1 #DABAAC #98A568
    id: "apricot", zh: "杏桃橄欖", en: "Apricot & olive",
    swatches: ["#42534A", "#FFFFFF", "#F9E0D1", "#F9D0A2", "#EE9373", "#98A568"],
    vars: make({
      ground: "#FFFFFF", header: "#FFFFFF", rule: "#F4E7DE", rule2: "#DABAAC",
      dark: "#42534A", dark2: "#4A5D53", darkLine: "#5B6F64", darkText: "#EADDD2", darkDim: "#A9B4AC", darkInk: "#FFF8F2", darkBtn: "#F9D0A2", onDarkBtn: "#42534A", mark: "#F9D0A2",
      ink: "#42534A", ink2: "#6B7670", ink3: "#A39A93",
      btn: "#42534A", onBtn: "#ffffff",
      mid: "#F9D0A2", midSoft: "#FDF1E3", midInk: "#7A4F22",
      a: "#EE9373", aSoft: "#FCEBE4", aInk: "#B05A3D",
      b: "#B4BE7C", bSoft: "#EFF2E3", bInk: "#5D6A31",
    }),
  },
  {
    // 色票：#FCFDFD #E7D5E3 #767892 #A0B1DE #FDD3D9 #FED4AA #DFACB8
    id: "lavender", zh: "薰衣草粉彩", en: "Lavender pastel",
    swatches: ["#4A4C66", "#FCFDFD", "#E7D5E3", "#FDD3D9", "#FED4AA", "#A0B1DE"],
    vars: make({
      ground: "#FCFDFD", rule: "#F1E8EF", rule2: "#E7D5E3",
      dark: "#4A4C66", dark2: "#535572", darkLine: "#666987", darkText: "#E7D5E3", darkDim: "#A6A7BE", darkInk: "#FCFDFD", darkBtn: "#FDD3D9", onDarkBtn: "#4A4C66", mark: "#FED4AA",
      ink: "#3F4157", ink2: "#767892", ink3: "#A6A7B9",
      btn: "#767892", onBtn: "#ffffff",
      mid: "#FED4AA", midSoft: "#FFF2E5", midInk: "#7A4D1F",
      a: "#E3A9B8", aSoft: "#FDECEF", aInk: "#A0606F",
      b: "#A0B1DE", bSoft: "#EDF1FA", bInk: "#4F64A0",
    }),
  },
  {
    // 色票：#FEFCFA #B7BEC9 #4D5058 #F5DCD1 #F0BDBD #928C95 #B2CEF7
    id: "dusty", zh: "灰玫晴空", en: "Dusty rose & sky",
    swatches: ["#4D5058", "#FEFCFA", "#F5DCD1", "#F0BDBD", "#B2CEF7", "#928C95"],
    vars: make({
      ground: "#FEFCFA", rule: "#F0EAE6", rule2: "#B7BEC9",
      dark: "#4D5058", dark2: "#565A63", darkLine: "#686C77", darkText: "#E9DED8", darkDim: "#A7A2AA", darkInk: "#FEFCFA", darkBtn: "#F5DCD1", onDarkBtn: "#4D5058", mark: "#F0BDBD",
      ink: "#3C3F46", ink2: "#4D5058", ink3: "#928C95",
      btn: "#4D5058", onBtn: "#ffffff",
      mid: "#928C95", midSoft: "#F2F0F3", midInk: "#4A454D", onMid: "#ffffff",
      a: "#F0BDBD", aSoft: "#FBEDEC", aInk: "#A85B5B",
      b: "#B2CEF7", bSoft: "#EAF2FD", bInk: "#4C6FA8",
    }),
  },
  {
    // 色票：#FCFEF9 #EAF5D2 #283B51 #81A76A #82CC00 #ADD96A #C8CED1
    id: "lime", zh: "青檸海軍", en: "Lime & navy",
    swatches: ["#283B51", "#FCFEF9", "#EAF5D2", "#ADD96A", "#82CC00", "#81A76A"],
    vars: make({
      ground: "#FCFEF9", rule: "#E5EBDC", rule2: "#C8CED1",
      dark: "#283B51", dark2: "#30455E", darkLine: "#405872", darkText: "#D9E6C6", darkDim: "#93A3B3", darkInk: "#FCFEF9", darkBtn: "#ADD96A", onDarkBtn: "#1F2E10", mark: "#ADD96A",
      ink: "#283B51", ink2: "#566779", ink3: "#8E99A3",
      btn: "#283B51", onBtn: "#ffffff",
      mid: "#ADD96A", midSoft: "#F0F8E1", midInk: "#3D5E00", onMid: "#22320C",
      a: "#8FC06A", aSoft: "#EDF4E7", aInk: "#4F7339",
      b: "#8FB0D0", bSoft: "#E7EDF3", bInk: "#34506B",
    }),
  },
  {
    // 黑白灰當基底，線條與按鈕用有彩度的顏色點綴
    id: "mono", zh: "黑白簡約", en: "Monochrome",
    swatches: ["#161616", "#FFFFFF", "#EDEDED", "#F2C230", "#E5533D", "#3D7BE8"],
    vars: make({
      ground: "#F6F6F6", header: "#FFFFFF", rule: "#E5E5E5", rule2: "#CFCFCF",
      dark: "#161616", dark2: "#202020", darkLine: "#333333", darkText: "#C9C9C9", darkDim: "#8A8A8A", darkInk: "#FFFFFF", darkBtn: "#F2C230", onDarkBtn: "#161616", mark: "#F2C230",
      ink: "#141414", ink2: "#555555", ink3: "#8E8E8E",
      btn: "#F2C230", onBtn: "#141414",
      mid: "#F2C230", midSoft: "#FDF5DA", midInk: "#5C4500", onMid: "#141414",
      a: "#E5533D", aSoft: "#FCE9E5", aInk: "#B3321F",
      b: "#3D7BE8", bSoft: "#E6EEFC", bInk: "#2456B0",
    }),
  },
];

const gf = (q: string) => `https://fonts.googleapis.com/css2?${q}&display=swap`;

export const FONTS: FontSet[] = [
  {
    id: "serif", zh: "優雅襯線", en: "Elegant serif", sample: "Fraunces・思源宋體",
    href: gf("family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Instrument+Sans:wght@400..700&family=Noto+Serif+TC:wght@500;600;700&family=Chiron+Hei+HK:wght@400;500;700"),
    vars: {},
  },
  {
    id: "tight", zh: "現代俐落", en: "Modern tight", sample: "Inter Tight・思源黑體",
    href: gf("family=Inter+Tight:wght@400..800&family=Noto+Sans+TC:wght@400;500;700;900"),
    vars: { "--display": '"Inter Tight", "Noto Sans TC", sans-serif', "--font": '"Inter Tight", "Noto Sans TC", "Microsoft JhengHei", sans-serif', "--dw": "700", "--dls": "-.03em" },
  },
  {
    id: "editorial", zh: "雜誌編輯", en: "Editorial", sample: "Playfair・仙人掌明體",
    href: gf("family=Playfair+Display:ital,wght@0,400..800;1,400..800&family=Cactus+Classical+Serif&family=Source+Sans+3:wght@400..700&family=Noto+Sans+TC:wght@400;500;700"),
    vars: { "--display": '"Playfair Display", "Cactus Classical Serif", serif', "--font": '"Source Sans 3", "Noto Sans TC", "Microsoft JhengHei", sans-serif', "--dw": "600", "--dls": "-.01em" },
  },
  {
    id: "geo", zh: "幾何科技", en: "Geometric", sample: "Sora・思源黑體",
    href: gf("family=Sora:wght@400..700&family=Noto+Sans+TC:wght@400;500;700"),
    vars: { "--display": '"Sora", "Noto Sans TC", sans-serif', "--font": '"Sora", "Noto Sans TC", "Microsoft JhengHei", sans-serif', "--dw": "600", "--dls": "-.025em" },
  },
  {
    id: "wenkai", zh: "手寫文楷", en: "Humanist", sample: "DM Serif・霞鶩文楷",
    href: gf("family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400..700&family=LXGW+WenKai+TC:wght@400;700"),
    vars: { "--display": '"DM Serif Display", "LXGW WenKai TC", serif', "--font": '"DM Sans", "LXGW WenKai TC", "Microsoft JhengHei", sans-serif', "--dw": "400", "--dls": "0" },
  },
  {
    id: "round", zh: "圓潤親切", en: "Rounded", sample: "Nunito・粉圓體",
    href: gf("family=Nunito:wght@400..900&family=Huninn"),
    vars: { "--display": '"Nunito", "Huninn", "Noto Sans TC", sans-serif', "--font": '"Nunito", "Huninn", "Noto Sans TC", "Microsoft JhengHei", sans-serif', "--dw": "800", "--dls": "-.01em" },
  },
  {
    id: "hand", zh: "手繪清新", en: "Hand-drawn", sample: "Quicksand・芫荽",
    href: gf("family=Quicksand:wght@400..700&family=Iansui"),
    vars: { "--display": '"Quicksand", "Iansui", sans-serif', "--font": '"Quicksand", "Iansui", "Noto Sans TC", "Microsoft JhengHei", sans-serif', "--dw": "700", "--dls": "0" },
  },
  {
    id: "classic", zh: "古典書卷", en: "Classic", sample: "Cormorant・思源宋體",
    href: gf("family=Cormorant+Garamond:ital,wght@0,500..700;1,500..700&family=Noto+Serif+TC:wght@500;600;700&family=Instrument+Sans:wght@400..700&family=Chiron+Hei+HK:wght@400;500;700"),
    vars: { "--display": '"Cormorant Garamond", "Noto Serif TC", serif', "--dw": "600", "--dls": "0" },
  },
];

export const findTheme = (id?: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];
export const findFont = (id?: string) => FONTS.find((f) => f.id === id) ?? FONTS[0];

/** 產生所有配色與字體的 CSS（放在 <head>，切換時只要改 html 的 data 屬性） */
export function themeCss() {
  const block = (sel: string, v: Vars) => (Object.keys(v).length ? `${sel}{${Object.entries(v).map(([k, x]) => `${k}:${x}`).join(";")}}` : "");
  return [
    ...THEMES.map((t) => block(`html[data-theme="${t.id}"]`, t.vars)),
    ...FONTS.map((f) => block(`html[data-font="${f.id}"]`, f.vars)),
  ].join("\n");
}
