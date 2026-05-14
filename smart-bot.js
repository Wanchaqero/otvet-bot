/**
 * Smart Bot v3 - с ИИ анализом от Claude
 *
 * Требуемые переменные окружения:
 * TELEGRAM_BOT_TOKEN=токен
 * ANTHROPIC_API_KEY=ключ Claude API (опционально)
 * ALLOWED_USERS=7575536082,123456789
 */

const TelegramBot = require('node-telegram-bot-api');
const TourDatabase = require('./database');
const ClaudeAnalyzer = require('./claude-analyzer');

// Получаем токены из переменных окружения
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!TOKEN) {
  console.error('❌ ОШИБКА: не установлена переменная окружения TELEGRAM_BOT_TOKEN');
  console.error('Установите на Railway → Variables → TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

if (!ANTHROPIC_KEY) {
  console.warn('⚠️ ANTHROPIC_API_KEY не установлена. Бот работает в базовом режиме (без ИИ анализа).');
}

// Разрешенные пользователи
const ALLOWED_USERS = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(',').map(id => parseInt(id.trim()))
  : [7575536082];

console.log('✅ Разрешенные пользователи:', ALLOWED_USERS);

const bot = new TelegramBot(TOKEN, { polling: true });
const db = new TourDatabase('tours.db');
let analyzer = null; // Claude analyzer (если ключ доступен)

// Состояние пользователей
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

    // Инициализируем Claude Analyzer если есть ключ
    if (ANTHROPIC_KEY) {
      try {
        analyzer = new ClaudeAnalyzer(ANTHROPIC_KEY);
        console.log('✅ Claude Analyzer активирован');
      } catch (error) {
        console.warn('⚠️ Не удалось инициализировать Claude:', error.message);
      }
    }

    // Проверяем что есть туры
    const stats = await db.getStats();
    console.log(`📊 В БД загружено туров: ${stats.totalTours}`);

    if (stats.totalTours === 0) {
      console.log('⚠️ В БД нет туров!');
      console.log('Запустите: node parse-and-save.js или node init-db.js');
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

  if (!isUserAllowed(userId)) {
    await bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
    return;
  }

  const userName = msg.from.first_name || 'Гость';
  userState.set(chatId, { lastSearch: null, useAI: !!analyzer });

  let welcomeText = `👋 Добро пожаловать, ${userName}!

🌍 Я помогу вам найти идеальный тур по Перу.

`;

  if (analyzer) {
    welcomeText += `🤖 Я использую ИИ для анализа ваших запросов! Вы можете написать:
• Простой запрос: "туры по Лиме"
• Сложный запрос: "Нас 2 человека, 12 дней отпуска. Нужны туры в Лиму, Паракас, Кузко и на Палкойо"

Я буду понимать контекст и предлагать подходящие туры! 🎯

Или используйте кнопки ниже:`;
  } else {
    welcomeText += `Напишите что вас интересует:
📍 "туры по Лиме"
🎨 "туры с музеями"
⏱️ "короткие туры"
💰 "дешевые туры"

Кнопки:`;
  }

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

  let helpText = `🤖 Доступные команды:

/start - Начать заново
/help - Эта справка
/stats - Статистика туров
/search <текст> - Поиск туров

`;

  if (analyzer) {
    helpText += `🤖 РЕЖИМ С ИИ:
Напишите любой запрос, и Claude AI поймет:
• "Нас 2 человека, 12 дней в сентябре..."
• "Хотим приключения с горами и музеями"
• Любые сложные комбинации!

`;
  }

  helpText += `📝 Примеры простых запросов:
• туры по Лиме
• музеи
• 3 часа
• дешевые
• все туры`;

  await bot.sendMessage(chatId, helpText);
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

    if (analyzer) {
      statsText += `\n🤖 Режим: <b>С ИИ анализом (Claude)</b>`;
    } else {
      statsText += `\n🔍 Режим: <b>Базовый поиск</b>`;
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
    // Показываем "печатает..."
    await bot.sendChatAction(chatId, 'typing');

    let tours = [];
    let responseMessage = '';

    // Если есть Claude Analyzer и текст длинный/сложный - используем ИИ
    if (analyzer && text.length > 50) {
      try {
        console.log('🤖 Используем Claude для анализа запроса...');

        // Анализируем запрос через Claude
        const analysis = await analyzer.analyzeQuery(text);

        // Извлекаем поисковые термины
        const searchTerms = analyzer.extractSearchTerms(analysis);

        // Ищем туры по каждому термину
        for (const term of searchTerms) {
          const foundTours = await db.search(term);
          tours.push(...foundTours);
        }

        // Убираем дубли по ID
        tours = tours.filter((tour, index, self) =>
          index === self.findIndex((t) => t.id === tour.id)
        );

        // Логируем поиск
        await db.logSearch(userId, text, tours.length);

        // Генерируем красивый ответ через Claude
        responseMessage = await analyzer.generateResponse(text, tours);

      } catch (error) {
        console.warn('⚠️ Claude анализ не сработал, используем базовый поиск:', error.message);
        // Fallback на базовый поиск
        tours = await db.search(text);
        responseMessage = null;
      }
    } else {
      // Базовый поиск (для коротких запросов или без Claude)
      tours = await db.search(text);
    }

    // Если нет сгенерированного сообщения, создаем стандартное
    if (!responseMessage) {
      if (tours.length === 0) {
        await bot.sendMessage(chatId,
          '❌ Туры не найдены.\n\n' +
          'Попробуйте:\n' +
          '• "туры по Лиме"\n' +
          '• "музеи"\n' +
          '• "все туры"'
        );
        return;
      }

      responseMessage = `✅ Найдено туров: <b>${tours.length}</b>\n\n`;
      for (let i = 0; i < Math.min(tours.length, 10); i++) {
        responseMessage += formatTourMessage(tours[i]);
      }

      if (tours.length > 10) {
        responseMessage += `\n... и еще ${tours.length - 10} туров\n`;
      }
    }

    // Сохраняем результаты
    userState.set(chatId, { lastSearch: tours });

    // Отправляем ответ со встроенными кнопками
    const inlineKeyboard = tours.slice(0, 3).map(tour => [{
      text: `${tour.title.substring(0, 30)}...`,
      url: tour.url
    }]);

    await bot.sendMessage(chatId, responseMessage, {
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

  msg += `💵 Цена: <b>$${tour.price}</b>`;
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
 * Обработка ошибок
 */
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
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
  if (analyzer) {
    console.log('🧠 Режим: SMART с ИИ анализом (Claude)');
  } else {
    console.log('🔍 Режим: Базовый поиск (без ИИ)');
  }
}

start().catch(error => {
  console.error('❌ Ошибка при запуске:', error);
  process.exit(1);
});

module.exports = bot;
