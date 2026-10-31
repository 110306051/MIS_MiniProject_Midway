/**
 * 標誌：兩條細線（酒紅＝第一個人、港灣藍＝第二個人）從兩側升起，
 * 斜向收攏成「M」，交會點是一個黃銅色的車站，外圈一道細環，代表你們的中間點。
 */
export default function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={(size * 30) / 36} viewBox="0 0 36 30" aria-hidden="true">
      <path d="M4.5 27 V5 L18 18.5" fill="none" stroke="var(--a)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31.5 27 V5 L18 18.5" fill="none" stroke="var(--b)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="18.5" r="6.2" fill="none" stroke="var(--mid)" strokeWidth="1" opacity=".55" />
      <circle cx="18" cy="18.5" r="3.4" fill="var(--mid)" />
    </svg>
  );
}
