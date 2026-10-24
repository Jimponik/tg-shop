import { productsById } from '../shared/products.js';
import { formatPrice, calcDelivery, SHOP_NAME } from '../shared/config.js';
import { tgCall, escapeHtml, validateInitData } from './_lib/telegram.js';

const PAYMENT_LABELS = { card: 'Картой при получении', cash: 'Наличными курьеру' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { initData, items, customer } = req.body || {};

    // 1. Проверяем, что запрос действительно пришёл из Telegram
    const user = validateInitData(initData, process.env.BOT_TOKEN);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Откройте магазин через Telegram-бота' });
    }

    // 2. Пересчитываем сумму на сервере — цены с клиента не доверяем
    if (!Array.isArray(items) || !items.length || items.length > 100) {
      return res.status(400).json({ ok: false, error: 'Корзина пуста' });
    }
    const lines = [];
    let subtotal = 0;
    for (const { id, size, qty } of items) {
      const p = productsById[id];
      const q = Math.floor(Number(qty));
      if (!p || !(q > 0 && q <= 99) || !p.sizes.includes(size)) {
        return res.status(400).json({ ok: false, error: 'Некорректный товар в корзине' });
      }
      subtotal += p.price * q;
      lines.push(`• ${escapeHtml(p.title)} · ${escapeHtml(size)} · ${escapeHtml(p.color)} × ${q} = ${formatPrice(p.price * q)}`);
    }
    const delivery = calcDelivery(subtotal);
    const total = subtotal + delivery;

    const c = customer || {};
    const name = String(c.name || '').trim().slice(0, 100);
    const phone = String(c.phone || '').trim().slice(0, 30);
    const address = String(c.address || '').trim().slice(0, 300);
    const comment = String(c.comment || '').trim().slice(0, 500);
    const payment = PAYMENT_LABELS[c.payment] || PAYMENT_LABELS.card;
    if (!name || !phone || !address) {
      return res.status(400).json({ ok: false, error: 'Заполните имя, телефон и адрес' });
    }

    const orderId = Date.now().toString(36).slice(-6).toUpperCase();
    const userLink = user.username
      ? `@${escapeHtml(user.username)}`
      : `<a href="tg://user?id=${user.id}">${escapeHtml(user.first_name || 'покупатель')}</a>`;

    const summary = [
      ...lines,
      '',
      `Товары: ${formatPrice(subtotal)}`,
      `Доставка: ${delivery ? formatPrice(delivery) : 'бесплатно'}`,
      `<b>Итого: ${formatPrice(total)}</b>`,
    ].join('\n');

    // 3. Уведомление администратору
    const adminText = [
      `🛍 <b>Новый заказ #${orderId}</b>`,
      '',
      summary,
      '',
      `👤 ${escapeHtml(name)} (${userLink})`,
      `📞 ${escapeHtml(phone)}`,
      `📍 ${escapeHtml(address)}`,
      `💳 ${payment}`,
      comment ? `💬 ${escapeHtml(comment)}` : null,
    ]
      .filter((l) => l !== null)
      .join('\n');

    const adminChat = process.env.ADMIN_CHAT_ID;
    if (!adminChat) throw new Error('ADMIN_CHAT_ID is not set');
    await tgCall('sendMessage', { chat_id: adminChat, text: adminText, parse_mode: 'HTML' });

    // 4. Подтверждение покупателю (может не дойти, если он не запускал бота — это не ошибка)
    try {
      await tgCall('sendMessage', {
        chat_id: user.id,
        parse_mode: 'HTML',
        text: `✅ <b>Заказ #${orderId} принят!</b>\n\n${summary}\n\nМы свяжемся с вами для подтверждения.\n${escapeHtml(SHOP_NAME)}`,
      });
    } catch (e) {
      console.warn('Cannot notify customer:', e.message);
    }

    return res.status(200).json({ ok: true, orderId, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера, попробуйте позже' });
  }
}
