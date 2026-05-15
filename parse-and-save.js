/**
 * Скрипт для парсинга сайта и сохранения туров в БД
 *
 * Используйте этот скрипт ОДИН РАЗ:
 * npm install cheerio node-fetch
 * node parse-and-save.js
 */

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const TourDatabase = require('./database');

class ToursParserAndSaver {
  constructor(baseURL, dbPath = 'tours.db') {
    this.baseURL = baseURL;
    this.db = new TourDatabase(dbPath);
    this.tours = [];
  }

  /**
   * Главный метод парсинга
   */
  async parse(skipDbInit = false) {
    try {
      console.log('🔍 Начинаем парсинг сайта:', this.baseURL);

      // Инициализируем БД только если не передали готовое соединение
      if (!skipDbInit) {
        await this.db.initialize();
        await this.db.createTables();
      }

      // Получаем список страниц туров
      const tourPages = await this.getTourPages();
      console.log(`📄 Найдено ${tourPages.length} страниц туров`);

      if (tourPages.length === 0) {
        console.log('⚠️ Туры не найдены. Проверьте структуру сайта.');
        return;
      }

      // Парсим каждую страницу
      for (let i = 0; i < tourPages.length; i++) {
        const page = tourPages[i];
        console.log(`\n[${i + 1}/${tourPages.length}] Парсинг: ${page.title}`);
        await this.parseTourPage(page);
      }

      // Сохраняем в БД
      await this.saveToDB();

      console.log(`\n✅ Готово! Добавлено туров: ${this.tours.length}`);

      if (!skipDbInit) {
        const stats = await this.db.getStats();
        console.log('\n📊 Статистика:');
        console.log(`  • Всего туров: ${stats.totalTours}`);
        console.log(`  • Средняя цена: $${stats.averagePrice.toFixed(2)}`);
        console.log(`  • По локациям:`, stats.byLocation);
        await this.db.close();
      }

      return this.tours;

    } catch (error) {
      console.error('❌ Ошибка при парсинге:', error.message);
      if (!skipDbInit) await this.db.close();
    }
  }

  get browserHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    };
  }

  /**
   * Получает список всех страниц с турами со сайта
   */
  async getTourPages() {
    try {
      const response = await fetch(this.baseURL, {
        headers: this.browserHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const pages = [];

      // Ищем ссылки на туры (для WordPress и обычных сайтов)
      // Адаптируйте селекторы под ваш сайт!
      const selectors = [
        'a.tour-link',          // Класс tour-link
        'article h2 a',         // В статьях
        'article a',            // Все ссылки в статьях
        'a[href*="/tur"]',      // URL содержит /tur
        '.post a',              // В постах
        '.product a'            // В продуктах
      ];

      for (const selector of selectors) {
        $(selector).each((i, elem) => {
          const href = $(elem).attr('href');

          // Берём текстовый контент; если пусто — берём alt у img внутри ссылки
          let text = $(elem).text().trim();
          if (!text) {
            text = $(elem).find('img').attr('alt') || '';
          }

          // Пропускаем если текст содержит HTML-теги (сломанный парсинг)
          if (text.includes('<') || text.includes('>')) return;

          if (href && this.isRelevantTourLink(text, href)) {
            const fullUrl = href.startsWith('http')
              ? href
              : new URL(href, this.baseURL).href;

            if (!pages.some(p => p.url === fullUrl)) {
              pages.push({ url: fullUrl, title: text || 'Без названия' });
            }
          }
        });
      }

      return [...new Map(pages.map(p => [p.url, p])).values()];
    } catch (error) {
      console.error('❌ Ошибка при получении списка:', error.message);
      return [];
    }
  }

  /**
   * Проверяет релевантна ли ссылка для тура
   */
  isRelevantTourLink(text, href) {
    if (!href) return false;

    const keywords = ['тур', 'tour', 'tur', 'excursi', 'экскурс'];
    const textLower = text.toLowerCase();
    const hrefLower = href.toLowerCase();

    return keywords.some(kw => textLower.includes(kw) || hrefLower.includes(kw));
  }

  /**
   * Парсит одну страницу тура
   */
  async parseTourPage(page) {
    try {
      const response = await fetch(page.url, {
        headers: this.browserHeaders
      });

      if (!response.ok) {
        console.log(`  ⚠️ Ошибка загрузки (HTTP ${response.status})`);
        return;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const tour = {
        title: this.extractTitle(page.title, $),
        location: this.extractLocation(html, $),
        description: this.extractDescription($),
        duration: this.extractDuration($, html),
        price: this.extractPrice($, html),
        currency: 'USD',
        group_size: this.extractGroupSize($, html),
        includes: this.extractIncludes($, html),
        language: this.extractLanguage(html),
        url: page.url,
        image_url: this.extractImageUrl($),
        category: this.extractCategory(html, $)
      };

      if (tour.title && !tour.title.includes('<')) {
        this.tours.push(tour);
        const priceStr = tour.price > 0 ? `$${tour.price}` : 'цена по запросу';
        console.log(`  ✅ ${tour.title} - ${priceStr}`);
      } else {
        console.log(`  ⚠️ Пропущен: ${page.title.substring(0, 60)}`);
      }

    } catch (error) {
      console.log(`  ⚠️ Ошибка парсинга: ${error.message}`);
    }
  }

  extractTitle(pageTitle, $) {
    const h1 = $('h1').first().text().trim();
    const h2 = $('h2').first().text().trim();
    return h1 || h2 || pageTitle || 'Тур';
  }

  extractLocation(html, $) {
    const locations = [
      'Лима', 'Lima',
      'Кузко', 'Cusco',
      'Священная долина', 'Sacred Valley',
      'Мачу-Пикчу', 'Machu Picchu',
      'Икитос', 'Iquitos',
      'Наска', 'Nazca'
    ];

    for (const loc of locations) {
      if (html.includes(loc)) {
        return loc;
      }
    }

    return 'Перу';
  }

  extractDescription($, limit = 200) {
    let text = $('p').first().text().trim();

    // Если нет параграфа, ищем другие элементы
    if (!text) {
      text = $('.description, .tour-desc, .post-content')
        .first()
        .text()
        .trim();
    }

    // Обрезаем до лимита
    if (text.length > limit) {
      text = text.substring(0, limit) + '...';
    }

    return text || 'Описание не доступно';
  }

  extractDuration($, html) {
    const text = $('body').text();
    // Ищет: "3 часа", "3-4 часа", "3 hours" и т.д.
    const match = text.match(/(\d+)\s*-?\s*(\d+)?\s*(час|hours|ч|h)/i);

    if (match) {
      return match[2]
        ? `${match[1]}-${match[2]} часов`
        : `${match[1]} часов`;
    }

    return 'Не указано';
  }

  extractPrice($, html) {
    // Цены на сайте обычно выделены <strong>: "1150 долларов" или "200$"
    const candidates = [];

    const pricePatterns = [
      /(\d[\d\s]*)\s*долларов/i,          // "1150 долларов"
      /(\d[\d\s,]*)\s*\$/,                // "200$"
      /\$\s*(\d[\d\s,]*)/,                // "$200"
      /(\d[\d\s,]*)\s*USD/i,              // "200 USD"
      /USD\s*(\d[\d\s,]*)/i,              // "USD 200"
      /стоимость[^.]{0,30}?(\d{2,})/i,   // "стоимость ... 200"
      /от\s+(\d{2,})\s*(?:долларов|\$)/i, // "от 200 долларов"
    ];

    // Сначала ищем в выделенных тегах (strong, b)
    $('strong, b').each((i, el) => {
      const t = $(el).text().trim();
      for (const p of pricePatterns) {
        const m = t.match(p);
        if (m) {
          const num = parseFloat(m[1].replace(/[\s,]/g, ''));
          if (num >= 10 && num <= 200000) candidates.push(num);
        }
      }
    });

    if (candidates.length > 0) return Math.min(...candidates);

    // Fallback: весь текст страницы, но только числа от 10 и выше
    const bodyText = $('body').text();
    for (const p of pricePatterns) {
      const m = bodyText.match(p);
      if (m) {
        const num = parseFloat(m[1].replace(/[\s,]/g, ''));
        if (num >= 10 && num <= 200000) return num;
      }
    }

    return 0;
  }

  extractGroupSize($, html) {
    const text = $('body').text();
    const match = text.match(/(до|up to|до\s)\s*(\d+)\s*(человек|people|persons|чел)/i);

    if (match) {
      return `до ${match[2]} человек`;
    }

    const match2 = text.match(/(максимум|maximum)\s+(\d+)/i);
    if (match2) {
      return `до ${match2[2]} человек`;
    }

    return 'до 5 человек';
  }

  extractIncludes($, html) {
    const includes = [];
    const keywords = {
      'гид': ['гид', 'guide', 'гід'],
      'транспорт': ['транспорт', 'transport', 'машина', 'car'],
      'еда': ['еда', 'обед', 'food', 'lunch', 'завтрак'],
      'вход': ['вход', 'entrance', 'ticket', 'admission'],
      'страховка': ['страховка', 'insurance'],
      'напитки': ['напитки', 'drinks', 'вода']
    };

    const text = $('body').text().toLowerCase();

    for (const [item, words] of Object.entries(keywords)) {
      if (words.some(word => text.includes(word.toLowerCase()))) {
        includes.push(item);
      }
    }

    return includes.length > 0 ? includes : ['гид', 'транспорт'];
  }

  extractLanguage(html) {
    if (html.toLowerCase().includes('русский') ||
        html.toLowerCase().includes('russian')) {
      return 'русский';
    }

    if (html.toLowerCase().includes('english') ||
        html.toLowerCase().includes('inglés')) {
      return 'english';
    }

    return 'русский';
  }

  extractImageUrl($) {
    const img = $('img').first().attr('src');
    return img || null;
  }

  extractCategory(html, $) {
    const categories = [];

    if (html.toLowerCase().includes('музей')) categories.push('музей');
    if (html.toLowerCase().includes('пешком') || html.toLowerCase().includes('hiking')) {
      categories.push('пешком');
    }
    if (html.toLowerCase().includes('приключение')) categories.push('приключение');
    if (html.toLowerCase().includes('культур')) categories.push('культурный');

    return categories.join(', ') || 'туристический';
  }

  /**
   * Сохраняет туры в БД
   */
  async saveToDB() {
    console.log(`\n💾 Сохраняю ${this.tours.length} туров в БД...`);

    for (let i = 0; i < this.tours.length; i++) {
      try {
        await this.db.addTour(this.tours[i]);
      } catch (error) {
        console.log(`  ⚠️ Ошибка при сохранении: ${this.tours[i].title}`);
      }
    }

    console.log('✅ Все туры сохранены в БД');
  }
}

// Использование
async function main() {
  const parser = new ToursParserAndSaver('https://beruperu.omarat.info/');
  await parser.parse();
}

// Запуск
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ToursParserAndSaver;
