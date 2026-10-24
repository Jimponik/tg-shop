import { useEffect, useRef } from 'react';
import { FULLSCREEN } from '../shared/config.js';

export const tg = window.Telegram?.WebApp;
// Внутри Telegram initData не пустой. В обычном браузере — пустой (режим разработки).
export const isTelegram = Boolean(tg && tg.initData);

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor?.('#000000');
    tg.setBackgroundColor?.('#000000');
    tg.setBottomBarColor?.('#000000');
    tg.disableVerticalSwipes?.(); // чтобы прокрутка не сворачивала приложение
    tg.MainButton?.hide();

    // Полноэкранный режим (Bot API 8.0+) — только на телефонах
    const mobile = ['ios', 'android', 'android_x'].includes(tg.platform);
    if (FULLSCREEN && mobile && tg.isVersionAtLeast?.('8.0')) {
      tg.requestFullscreen?.();
      document.documentElement.classList.add('tg-fullscreen');
    }
  } catch {}
}

export function haptic(type = 'light') {
  try {
    if (type === 'success' || type === 'error') tg?.HapticFeedback?.notificationOccurred(type);
    else if (type === 'select') tg?.HapticFeedback?.selectionChanged();
    else tg?.HapticFeedback?.impactOccurred(type);
  } catch {}
}

/** Нативная кнопка «Назад» Telegram. */
export function useBackButton(visible, onClick) {
  const handlerRef = useRef(onClick);
  handlerRef.current = onClick;

  useEffect(() => {
    if (!isTelegram) return;
    const handler = () => handlerRef.current?.();
    tg.BackButton.onClick(handler);
    return () => tg.BackButton.offClick(handler);
  }, []);

  useEffect(() => {
    if (!isTelegram) return;
    if (visible) tg.BackButton.show();
    else tg.BackButton.hide();
  }, [visible]);
}

/** Избранное: localStorage (в Telegram тоже работает), с защитой от ошибок. */
export function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch {
    return [];
  }
}
export function saveFavorites(list) {
  try {
    localStorage.setItem('favorites', JSON.stringify(list));
  } catch {}
}

/** Анимация «точка летит в корзину». */
export function flyToCart(fromEl) {
  try {
    const target = document.querySelector('[data-cart-target]');
    if (!fromEl || !target || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'fly-dot';
    document.body.appendChild(dot);
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    const anim = dot.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
        { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) scale(1.3)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.4)`, opacity: 0.2 },
      ],
      { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' }
    );
    anim.onfinish = () => dot.remove();
  } catch {}
}
