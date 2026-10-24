import React from 'react';

const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

export const IconSearch = () => (
  <svg {...base}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const IconBag = () => (
  <svg {...base}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const IconHome = () => (
  <svg {...base}><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4v-9z" /></svg>
);
export const IconHeart = ({ filled }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);
export const IconBack = () => (
  <svg {...base}><path d="M15 5l-7 7 7 7" /></svg>
);
export const IconPlus = () => (
  <svg {...base}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconCheck = ({ size = 20 }) => (
  <svg {...base} width={size} height={size} strokeWidth={2.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconClose = () => (
  <svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
