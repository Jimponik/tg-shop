// Общие настройки магазина — используются и фронтендом, и сервером.
export const SHOP_NAME = 'FIELD ARCHIVE';
export const SHOP_TAGLINE = 'AW/26 — Garment dyed outerwear';
export const FULLSCREEN = true; // открывать на весь экран на телефонах (Telegram 8.0+)

// Баннер новой коллекции в каталоге
export const BANNER = {
  label: 'Новая коллекция',
  title: 'Осень — Зима\n2026',
  text: 'Окрашено после пошива. Каждая вещь — свой оттенок.',
  button: 'Смотреть',
  category: 'outerwear', // какую категорию открыть по кнопке
};
export const CURRENCY = 'BYN'; // ISO-код: BYN, RUB, USD, EUR...
export const DELIVERY_PRICE = 15; // стоимость доставки
export const FREE_DELIVERY_FROM = 400; // бесплатная доставка от этой суммы (0 — отключить)

export function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function calcDelivery(subtotal) {
  if (subtotal <= 0) return 0;
  if (FREE_DELIVERY_FROM > 0 && subtotal >= FREE_DELIVERY_FROM) return 0;
  return DELIVERY_PRICE;
}
