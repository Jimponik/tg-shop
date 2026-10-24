// Одноразовая настройка бота после деплоя:
//   BOT_TOKEN=... WEBAPP_URL=https://your-app.vercel.app WEBHOOK_SECRET=... npm run setup-bot
// Скрипт регистрирует webhook, кнопку меню «Магазин» и список команд.

const { BOT_TOKEN, WEBAPP_URL, WEBHOOK_SECRET } = process.env;
if (!BOT_TOKEN || !WEBAPP_URL) {
  console.error('Укажите BOT_TOKEN и WEBAPP_URL');
  process.exit(1);
}
const base = WEBAPP_URL.replace(/\/$/, '');

async function call(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  console.log(`${data.ok ? '✅' : '❌'} ${method}`, data.ok ? '' : data.description);
  return data;
}

await call('setWebhook', {
  url: `${base}/api/bot`,
  allowed_updates: ['message'],
  drop_pending_updates: true,
  ...(WEBHOOK_SECRET ? { secret_token: WEBHOOK_SECRET } : {}),
});
await call('setChatMenuButton', {
  menu_button: { type: 'web_app', text: 'Магазин', web_app: { url: base } },
});
await call('setMyCommands', {
  commands: [
    { command: 'start', description: 'Открыть магазин' },
    { command: 'id', description: 'Показать ID чата' },
  ],
});
