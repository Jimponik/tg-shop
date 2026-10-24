import { tgCall } from './_lib/telegram.js';
import { SHOP_NAME } from '../shared/config.js';

// Webhook бота: Telegram присылает сюда все сообщения.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('Bot webhook is alive');

  // Защита: Telegram передаёт секрет, указанный при setWebhook
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const msg = req.body?.message;
    const text = msg?.text || '';
    const chatId = msg?.chat?.id;

    if (chatId && text.startsWith('/start')) {
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `Добро пожаловать в «${SHOP_NAME}»! 🛍\n\nНажмите кнопку ниже, чтобы открыть каталог.`,
        reply_markup: {
          inline_keyboard: [[{ text: '🛒 Открыть магазин', web_app: { url: process.env.WEBAPP_URL } }]],
        },
      });
    } else if (chatId && text.startsWith('/id')) {
      // Удобно, чтобы узнать ADMIN_CHAT_ID (работает и в группе)
      await tgCall('sendMessage', { chat_id: chatId, text: `ID этого чата: ${chatId}` });
    } else if (chatId) {
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: 'Чтобы сделать заказ, откройте магазин кнопкой «Магазин» внизу или командой /start',
      });
    }
  } catch (err) {
    console.error(err);
  }
  // Всегда 200, иначе Telegram будет повторять запрос
  return res.status(200).json({ ok: true });
}
