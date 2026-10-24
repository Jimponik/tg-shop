import React from 'react';

// Линейные иллюстрации-заглушки, пока нет фотографий товаров.
const PATHS = {
  jacket: (
    <>
      <path d="M36 16 Q50 6 64 16" />
      <path d="M36 16 L22 24 L12 72 L22 74 L27 46 L27 88 L73 88 L73 46 L78 74 L88 72 L78 24 L64 16" />
      <path d="M36 16 Q38 26 50 28 Q62 26 64 16" />
      <path d="M50 28 L50 88" />
      <path d="M31 60 h13 v13 h-13 z M56 60 h13 v13 h-13 z" />
      <path d="M27 82 H73" />
    </>
  ),
  overshirt: (
    <>
      <path d="M40 14 L50 22 L60 14" />
      <path d="M40 14 L24 20 L14 66 L23 68 L28 42 L28 88 L72 88 L72 42 L77 68 L86 66 L76 20 L60 14" />
      <path d="M50 22 L50 88" />
      <path d="M32 34 h12 v12 h-12 z M56 34 h12 v12 h-12 z M32 34 l6 4 l6 -4 M56 34 l6 4 l6 -4" />
      <circle cx="50" cy="52" r="0.8" /><circle cx="50" cy="64" r="0.8" /><circle cx="50" cy="76" r="0.8" />
    </>
  ),
  knit: (
    <>
      <path d="M40 16 Q50 26 60 16" />
      <path d="M40 16 L24 22 L14 72 L24 74 L29 44 L29 88 L71 88 L71 44 L76 74 L86 72 L76 22 L60 16" />
      <path d="M29 82 H71 M29 85 H71" />
      <path d="M15 68 L24 70 M15 65 L25 67" />
      <path d="M85 68 L76 70 M85 65 L75 67" />
      <path d="M38 18 Q50 30 62 18" />
    </>
  ),
  trousers: (
    <>
      <path d="M30 12 H70 L76 90 H57 L50 36 L43 90 H24 Z" />
      <path d="M30 18 H70" />
      <path d="M50 18 L50 36" />
      <path d="M27 50 h11 v14 h-11 z M62 50 h11 v14 h-11 z" />
      <path d="M27 50 l5.5 3 l5.5 -3 M62 50 l5.5 3 l5.5 -3" />
    </>
  ),
  cap: (
    <>
      <path d="M18 64 Q18 34 50 32 Q80 34 80 64 Z" />
      <path d="M80 64 Q92 64 96 72 L60 72 Q66 66 80 64" />
      <path d="M50 32 L50 64 M34 36 Q38 50 36 64 M66 36 Q62 50 64 64" />
      <circle cx="50" cy="31" r="1.6" />
    </>
  ),
  bag: (
    <>
      <path d="M20 40 H80 V80 H20 Z" />
      <path d="M20 52 H80" />
      <path d="M30 60 H70 V74 H30 Z" />
      <path d="M26 40 Q30 12 50 10 Q70 12 74 40" />
      <path d="M46 52 v5 h8 v-5" />
    </>
  ),
};

export default function GarmentIcon({ type }) {
  const shape = PATHS[type] || PATHS.jacket;
  // Две «проходки»: еле заметный контур + точечный пунктир поверх — в стиле частиц
  return (
    <svg viewBox="0 0 100 100" className="garment" fill="none" stroke="currentColor"
      strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <g strokeWidth="0.8" opacity="0.22">{shape}</g>
      <g className="garment-dots" strokeWidth="1.5" strokeDasharray="0 2.3">{shape}</g>
    </svg>
  );
}
