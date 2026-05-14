/**
 * Claude Analyzer - анализирует сложные запросы пользователя через Claude AI
 *
 * Использует Claude для:
 * - Извлечения ключевых слов и фильтров из текста
 * - Понимания контекста (даты, количество людей, бюджет)
 * - Определения подходящих туров
 */

const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAnalyzer {
  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY не установлен в переменных окружения');
    }

    this.client = new Anthropic({
      apiKey: apiKey
    });
  }

  /**
   * Анализирует запрос пользователя и извлекает ключевые слова для поиска
   */
  async analyzeQuery(userQuery) {
    try {
      const prompt = `Ты помощник туристического агентства BerúPeru. Проанализируй запрос туриста и извлеки ключевую информацию.

Запрос туриста:
"${userQuery}"

Верни JSON с этой информацией:
{
  "locations": ["список локаций из запроса: Лима, Паракас, Кузко и т.д."],
  "keywords": ["ключевые слова для поиска: музеи, пешком, приключение"],
  "duration": "если указана длительность отпуска",
  "group_size": "если указано количество людей",
  "budget": "если указан бюджет",
  "special_interests": ["специфические места или достопримечательности"],
  "dates": "если указаны даты",
  "summary": "краткое резюме запроса на русском"
}

Верни ТОЛЬКО JSON без дополнительного текста!`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Получаем ответ
      const responseText = message.content[0].text;

      // Парсим JSON
      const analysis = JSON.parse(responseText);

      console.log('✅ Claude проанализировал запрос:', analysis.summary);

      return analysis;

    } catch (error) {
      console.error('❌ Ошибка анализа Claude:', error.message);
      throw error;
    }
  }

  /**
   * Генерирует улучшенный ответ с рекомендациями на основе найденных туров
   */
  async generateResponse(userQuery, foundTours) {
    try {
      if (foundTours.length === 0) {
        return this.generateNoToursResponse(userQuery);
      }

      const toursData = foundTours.map(tour => ({
        title: tour.title,
        location: tour.location,
        price: tour.price,
        duration: tour.duration,
        description: tour.description,
        url: tour.url
      }));

      const prompt = `Ты помощник туристического агентства BerúPeru.

Запрос туриста:
"${userQuery}"

Найдены эти туры:
${JSON.stringify(toursData, null, 2)}

Создай дружелюбный и профессиональный ответ туристу на русском языке:
1. Подтверди что ты понял его запрос
2. Дай краткий комментарий о его интересах/времени/бюджете
3. Объясни почему эти туры подходят именно ему
4. Предложи синтез туров (если нужны 2+ дня)
5. Упомяни что можешь помочь с бронированием

Будь лаконичен (3-4 абзаца), но информативен!`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return message.content[0].text;

    } catch (error) {
      console.error('❌ Ошибка генерации ответа:', error.message);
      // Если Claude не сработал, возвращаем простой ответ
      return this.generateSimpleResponse(foundTours);
    }
  }

  /**
   * Генерирует ответ когда туры не найдены
   */
  async generateNoToursResponse(userQuery) {
    try {
      const prompt = `Ты помощник туристического агентства BerúPeru. Туристы с таким запросом в наших турах не нашлись:

"${userQuery}"

Напиши дружелюбный ответ на русском, который:
1. Благодарит за интерес
2. Объясняет почему туры не нашлись
3. Предлагает альтернативу или уточнить запрос
4. Дает контактную информацию для консультации

Будь позитивным и помогающим!`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return message.content[0].text;

    } catch (error) {
      return '❌ Туры с вашими параметрами не найдены. Пожалуйста, попробуйте уточнить запрос или напишите на smm@omarat.info для консультации.';
    }
  }

  /**
   * Генерирует простой ответ если Claude недоступен
   */
  generateSimpleResponse(tours) {
    if (tours.length === 0) {
      return '❌ Туры не найдены. Попробуйте другой поисковый запрос.';
    }

    let response = `✅ Найдено туров: ${tours.length}\n\n`;

    for (const tour of tours) {
      response += `📍 ${tour.title}\n`;
      response += `💵 $${tour.price} | ⏱️ ${tour.duration}\n`;
      response += `🔗 ${tour.url}\n\n`;
    }

    return response;
  }

  /**
   * Извлекает поисковые термины из анализа для поиска в БД
   */
  extractSearchTerms(analysis) {
    const terms = [];

    // Добавляем локации
    if (analysis.locations && Array.isArray(analysis.locations)) {
      terms.push(...analysis.locations);
    }

    // Добавляем ключевые слова
    if (analysis.keywords && Array.isArray(analysis.keywords)) {
      terms.push(...analysis.keywords);
    }

    // Добавляем специфические интересы
    if (analysis.special_interests && Array.isArray(analysis.special_interests)) {
      terms.push(...analysis.special_interests);
    }

    // Убираем дубли
    return [...new Set(terms)];
  }
}

module.exports = ClaudeAnalyzer;
