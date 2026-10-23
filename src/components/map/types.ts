export type MapPoint = { id: string; name: string; lat: number; lng: number };

export type MapProps = {
  workplaces: [MapPoint & { label: string }, MapPoint & { label: string }];
  picks: (MapPoint & { rank: number; tooltip: string })[];
  others: (MapPoint & { note: string })[];
  listings: (MapPoint & { top: boolean })[];
  /** true：地圖縮放到房源；false：顯示工作地與推薦地區全貌 */
  focusListings?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  apiKey?: string;
  mapId?: string;
};

export const COLOR_A = "#8246AF";
export const COLOR_B = "#0070BD";
