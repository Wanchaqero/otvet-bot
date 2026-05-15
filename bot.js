/**
 * Telegram Bot v2 - с проверкой ALLOWED_USERS и БД
 *
 * Требуемые переменные окружения:
 * TELEGRAM_BOT_TOKEN=токен
 * ALLOWED_USERS=7575536082,123456789,987654321
 */

const TelegramBot = require('node-telegram-bot-api');
const TourDatabase = require('./database');
const ToursParserAndSaver = require('./parse-and-save');

// Получаем токен из переменных окружения
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error('❌ ОШИБКА: не установлена переменная окружения TELEGRAM_BOT_TOKEN');
  console.error('Установите переменную окружения на Railway или локально');
  process.exit(1);
}

// Разрешенные пользователи
const ALLOWED_USERS = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(',').map(id => parseInt(id.trim()))
  : [7575536082];

console.log('✅ Разрешенные пользователи:', ALLOWED_USERS);

const botOptions = { polling: true };

if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  botOptions.request = { proxy };
  console.log(`🔗 Используется прокси: ${proxy}`);
}

const bot = new TelegramBot(TOKEN, botOptions);
const db = new TourDatabase('tours.db');

// Состояние пользователей (для сохранения истории)
const userState = new Map();

/**
 * Проверка прав доступа
 */
function isUserAllowed(userId) {
  return ALLOWED_USERS.includes(userId);
}

/**
 * Инициализация бота
 */
async function initBot() {
  try {
    // Подключаемся к БД
    await db.initialize();
    await db.createTables();
    console.log('✅ БД инициализирована');

    // Проверяем что есть туры, если нет — парсим сайт
    const stats = await db.getStats();
    console.log(`📊 В БД загружено туров: ${stats.totalTours}`);

    if (stats.totalTours === 0) {
      console.log('⚠️ БД пуста. Запускаю парсинг сайта...');
      try {
        const parser = new ToursParserAndSaver(
          process.env.SITE_URL || 'https://beruperu.omarat.info/',
          'tours.db'
        );
        parser.db = db;
        await parser.parse(true);
        const newStats = await db.getStats();
        console.log(`✅ Парсинг завершён. Загружено туров: ${newStats.totalTours}`);
      } catch (parseError) {
        console.error('❌ Ошибка парсинга:', parseError.message);
        console.log('Бот запустится, но база данных пуста.');
      }
    }

  } catch (error) {
    console.error('❌ Ошибка инициализации:', error.message);
    process.exit(1);
  }
}

/**
 * Команда /start
 */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Проверка прав доступа
  if (!isUserAllowed(userId)) {
    console.log(`⛔ Доступ запрещен для пользователя ${userId}`);
    await bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
    return;
  }

  const userName = msg.from.first_name || 'Гость';

  userState.set(chatId, { lastSearch: null });

  const welcomeText = `👋 Добро пожаловать, ${userName}!

🌍 Я помогу вам найти идеальный тур по Перу.

Что вас интересует? Напишите:
📍 "туры по Лиме"
🎨 "туры с музеями"
⏱️ "короткие туры"
💰 "дешевые туры"
⭐ "популярные туры"
📋 "все туры"

Или используйте кнопки ниже:`;

  await bot.sendMessage(chatId, welcomeText, {
    reply_markup: {
      keyboard: [
        ['🏙️ Туры по Лиме', '🎨 Туры с музеями'],
        ['⏱️ Короткие туры', '💰 Дешевые туры'],
        ['⭐ Популярные', '📋 Все туры']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
});

/**
 * Команда /help
 */
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isUserAllowed(userId)) {
    await bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
    return;
  }

  const helpText = `🤖 Доступные команды:

/start - Начать заново
/help - Эта справка
/stats - Статистика туров
/favorites - Мои избранные туры
/search <текст> - Поиск туров

📝 Примеры запросов:
• туры по Лиме
• музеи
• 3 часа
• дешевые
• все туры`;

  await bot.sendMessage(chatId, helpText);
});

/**
 * Команда /debug — показывает первые 5 туров из БД сырыми данными
 */
bot.onText(/\/debug/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isUserAllowed(userId)) return;

  try {
    const tours = await db.all('SELECT id, title, price, location, url FROM tours LIMIT 5');
    if (tours.length === 0) {
      await bot.sendMessage(chatId, '⚠️ БД пуста');
      return;
    }
    let text = `🔍 Первые ${tours.length} туров из БД:\n\n`;
    for (const t of tours) {
      text += `ID: ${t.id}\n`;
      text += `Название: ${t.title}\n`;
      text += `Цена: $${t.price}\n`;
      text += `Локация: ${t.location}\n`;
      text += `URL: ${t.url}\n\n`;
    }
    await bot.sendMessage(chatId, text);
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Ошибка: ${e.message}`);
  }
});

/**
 * Команда /stats
 */
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isUserAllowed(userId)) {
    await bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
    return;
  }

  try {
    const stats = await db.getStats();

    let statsText = `📊 Статистика туров:\n\n`;
    statsText += `📌 Всего туров: <b>${stats.totalTours}</b>\n`;
    statsText += `💰 Средняя цена: <b>$${stats.averagePrice.toFixed(2)}</b>\n\n`;
    statsText += `🗺️ По локациям:\n`;

    for (const loc of stats.byLocation) {
      statsText += `  • ${loc.location}: ${loc.count} туров\n`;
    }

    await bot.sendMessage(chatId, statsText, { parse_mode: 'HTML' });

  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении статистики');
  }
});

/**
 * Обработка текстовых сообщений
 */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Проверка прав доступа
  if (!isUserAllowed(userId)) {
    console.log(`⛔ Доступ запрещен для пользователя ${userId}`);
    await bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
    return;
  }

  // Пропускаем команды
  if (text.startsWith('/')) {
    return;
  }

  try {
    await bot.sendChatAction(chatId, 'typing');

    // Маппинг кнопок клавиатуры → поисковые запросы
    const buttonMap = {
      '🏙️ туры по лиме':   'Лима',
      '🎨 туры с музеями': 'музей',
      '⏱️ короткие туры':  'часов',
      '📋 все туры':        '',
      'все туры':           '',
      'все':                '',
    };

    const textLower = text.toLowerCase().trim();
    let searchQuery = text;
    let tours;

    if (textLower in buttonMap) {
      searchQuery = buttonMap[textLower];
    }

    // "💰 Дешевые туры" — сортируем по цене
    if (textLower === '💰 дешевые туры' || textLower === 'дешевые') {
      tours = (await db.getAllTours()).filter(t => t.price > 0).sort((a, b) => a.price - b.price);
    }
    // "⭐ Популярные" — просто все туры (рейтинга нет)
    else if (textLower === '⭐ популярные' || textLower === 'популярные') {
      tours = await db.getAllTours();
    }
    else {
      tours = await db.search(searchQuery);
      // Если ничего не нашли — пробуем getAllTours как запасной вариант
      if (tours.length === 0 && searchQuery !== '') {
        tours = await db.getAllTours();
      }
    }

    userState.set(chatId, { lastSearch: tours });
    await db.logSearch(userId, text, tours.length);

    if (tours.length === 0) {
      await bot.sendMessage(chatId, '❌ В базе данных пока нет туров. Попробуйте позже.');
      return;
    }

    // Форматируем и отправляем результаты
    let response = `✅ Найдено туров: <b>${tours.length}</b>\n\n`;

    for (let i = 0; i < Math.min(tours.length, 10); i++) {
      const tour = tours[i];
      response += formatTourMessage(tour);
    }

    if (tours.length > 10) {
      response += `\n... и еще ${tours.length - 10} туров\n`;
    }

    // Отправляем со встроенными кнопками
    const inlineKeyboard = tours.slice(0, 3).map(tour => [{
      text: `${tour.title.substring(0, 30)}...`,
      url: tour.url
    }]);

    await bot.sendMessage(chatId, response, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });

  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка при поиске');
  }
});

/**
 * Форматирует сообщение о туре
 */
function formatTourMessage(tour) {
  let msg = `📍 <b>${tour.title}</b>\n`;
  msg += `📍 Локация: ${tour.location}\n`;

  if (tour.duration) {
    msg += `⏱️ Длительность: ${tour.duration}\n`;
  }

  msg += `💵 Цена: <b>${tour.price > 0 ? '$' + tour.price : 'по запросу'}</b>`;
  if (tour.group_size) {
    msg += ` (${tour.group_size})\n`;
  } else {
    msg += `\n`;
  }

  if (tour.description) {
    const desc = tour.description.length > 100
      ? tour.description.substring(0, 100) + '...'
      : tour.description;
    msg += `📝 ${desc}\n`;
  }

  if (tour.includes && tour.includes.length > 0) {
    msg += `✅ Включено: ${tour.includes.join(', ')}\n`;
  }

  msg += `🔗 <a href="${tour.url}">Подробнее</a>\n`;
  msg += `\n`;

  return msg;
}

/**
 * Обработка ошибок polling с экспоненциальным backoff
 */
let pollingErrorCount = 0;
let pollingRestartTimer = null;

bot.on('polling_error', (error) => {
  const code = error.code || '';
  // socket hang up — нормальное завершение long-poll, не считаем ошибкой
  if (error.message && error.message.includes('socket hang up')) {
    pollingErrorCount = 0;
    return;
  }

  pollingErrorCount++;
  console.error(`❌ Polling error #${pollingErrorCount}: ${error.message}`);

  if (pollingRestartTimer) return;

  const delay = Math.min(1000 * 2 ** Math.min(pollingErrorCount, 6), 64000);
  console.log(`🔄 Перезапуск polling через ${delay / 1000}с...`);

  pollingRestartTimer = setTimeout(async () => {
    pollingRestartTimer = null;
    try {
      await bot.stopPolling();
      await bot.startPolling();
      pollingErrorCount = 0;
      console.log('✅ Polling восстановлен');
    } catch (e) {
      console.error('❌ Не удалось перезапустить polling:', e.message);
    }
  }, delay);
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Завершение работы...');
  await db.close();
  process.exit(0);
});

/**
 * Запуск бота
 */
async function start() {
  await initBot();
  console.log('🤖 Бот запущен и ожидает сообщения...');
  console.log('✅ База данных подключена (tours.db)');
  console.log(`🔒 Разрешенные пользователи: ${ALLOWED_USERS.join(', ')}`);
}

start().catch(error => {
  console.error('❌ Ошибка при запуске:', error);
  process.exit(1);
});

module.exports = bot;
