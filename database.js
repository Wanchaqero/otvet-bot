const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * TourDatabase - класс для работы с БД туров
 */
class TourDatabase {
  constructor(dbPath = 'tours.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Инициализация БД
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Ошибка подключения к БД:', err);
          reject(err);
        } else {
          console.log('✅ Подключено к БД:', this.dbPath);
          this.initialized = true;
          resolve();
        }
      });
    });
  }

  /**
   * Создает таблицы если их нет
   */
  async createTables() {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(s => s.trim());

    for (const statement of statements) {
      await this.run(statement);
    }

    console.log('✅ Таблицы созданы/обновлены');
  }

  /**
   * Выполняет SQL команду (INSERT, UPDATE, DELETE)
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Ошибка SQL:', sql, err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Получает один результат
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ Ошибка SQL:', sql, err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Получает все результаты
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Ошибка SQL:', sql, err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Добавляет новый тур
   */
  async addTour(tour) {
    const sql = `
      INSERT INTO tours (
        title, location, description, duration, price, currency,
        group_size, includes, language, url, image_url, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      tour.title,
      tour.location,
      tour.description,
      tour.duration || null,
      tour.price,
      tour.currency || 'USD',
      tour.group_size || null,
      tour.includes ? JSON.stringify(tour.includes) : null,
      tour.language || 'русский',
      tour.url,
      tour.image_url || null,
      tour.category || null
    ];

    try {
      const result = await this.run(sql, params);
      return result.id;
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        console.log('⚠️ Тур с такой ссылкой уже существует:', tour.url);
        return null;
      }
      throw err;
    }
  }

  /**
   * Получает все активные туры
   */
  async getAllTours() {
    const sql = `
      SELECT * FROM tours
      WHERE is_active = 1
      ORDER BY created_at DESC
    `;
    const tours = await this.all(sql);
    return this.parseTours(tours);
  }

  /**
   * Ищет туры по локации
   */
  async searchByLocation(location) {
    const sql = `
      SELECT * FROM tours
      WHERE is_active = 1
      AND (
        location LIKE ?
        OR title LIKE ?
        OR description LIKE ?
      )
      ORDER BY price ASC
    `;

    const searchTerm = `%${location}%`;
    const tours = await this.all(sql, [searchTerm, searchTerm, searchTerm]);
    return this.parseTours(tours);
  }

  /**
   * Ищет туры по цене
   */
  async searchByPrice(minPrice, maxPrice) {
    const sql = `
      SELECT * FROM tours
      WHERE is_active = 1
      AND price BETWEEN ? AND ?
      ORDER BY price ASC
    `;

    const tours = await this.all(sql, [minPrice, maxPrice]);
    return this.parseTours(tours);
  }

  /**
   * Ищет туры по категории
   */
  async searchByCategory(category) {
    const sql = `
      SELECT * FROM tours
      WHERE is_active = 1
      AND category LIKE ?
      ORDER BY price ASC
    `;

    const tours = await this.all(sql, [`%${category}%`]);
    return this.parseTours(tours);
  }

  /**
   * Поиск по строке (как в TourSearcher)
   */
  async search(query) {
    if (!query || query.trim().length === 0) {
      return this.getAllTours();
    }

    // Поиск по разным полям с разными весами
    const sql = `
      SELECT * FROM tours
      WHERE is_active = 1
      AND (
        title LIKE ?
        OR description LIKE ?
        OR location LIKE ?
        OR category LIKE ?
      )
      ORDER BY
        CASE WHEN title LIKE ? THEN 0 ELSE 1 END,
        price ASC
    `;

    const searchTerm = `%${query}%`;
    const tours = await this.all(sql, [
      searchTerm, searchTerm, searchTerm, searchTerm, searchTerm
    ]);

    return this.parseTours(tours);
  }

  /**
   * Получает тур по ID
   */
  async getTourById(id) {
    const sql = 'SELECT * FROM tours WHERE id = ? AND is_active = 1';
    const tour = await this.get(sql, [id]);
    return tour ? this.parseTour(tour) : null;
  }

  /**
   * Получает популярные туры
   */
  async getPopularTours(limit = 5) {
    const sql = `
      SELECT * FROM tours
      WHERE is_active = 1
      ORDER BY review_count DESC, rating DESC
      LIMIT ?
    `;

    const tours = await this.all(sql, [limit]);
    return this.parseTours(tours);
  }

  /**
   * Обновляет тур
   */
  async updateTour(id, updates) {
    const allowedFields = [
      'title', 'location', 'description', 'duration',
      'price', 'group_size', 'includes', 'url',
      'image_url', 'category', 'is_active'
    ];

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('Нет полей для обновления');
    }

    values.push(id);

    const sql = `
      UPDATE tours
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.run(sql, values);
  }

  /**
   * Удаляет тур (мягкое удаление)
   */
  async deleteTour(id) {
    const sql = 'UPDATE tours SET is_active = 0 WHERE id = ?';
    await this.run(sql, [id]);
  }

  /**
   * Получает статистику
   */
  async getStats() {
    const total = await this.get('SELECT COUNT(*) as count FROM tours WHERE is_active = 1');
    const avgPrice = await this.get('SELECT AVG(price) as avg FROM tours WHERE is_active = 1');
    const byLocation = await this.all(`
      SELECT location, COUNT(*) as count
      FROM tours
      WHERE is_active = 1
      GROUP BY location
    `);

    return {
      totalTours: total.count,
      averagePrice: avgPrice.avg,
      byLocation: byLocation
    };
  }

  /**
   * Сохраняет поисковый запрос (для аналитики)
   */
  async logSearch(userId, query, resultsCount, selectedTourId = null) {
    const sql = `
      INSERT INTO search_queries (user_id, query, results_count, selected_tour_id)
      VALUES (?, ?, ?, ?)
    `;

    await this.run(sql, [userId, query, resultsCount, selectedTourId]);
  }

  /**
   * Добавляет тур в избранное
   */
  async addToFavorites(userId, tourId) {
    const sql = `
      INSERT OR IGNORE INTO favorites (user_id, tour_id)
      VALUES (?, ?)
    `;

    await this.run(sql, [userId, tourId]);
  }

  /**
   * Получает избранные туры пользователя
   */
  async getFavorites(userId) {
    const sql = `
      SELECT t.* FROM tours t
      JOIN favorites f ON t.id = f.tour_id
      WHERE f.user_id = ? AND t.is_active = 1
      ORDER BY f.created_at DESC
    `;

    const tours = await this.all(sql, [userId]);
    return this.parseTours(tours);
  }

  /**
   * Создает бронирование
   */
  async createBooking(booking) {
    const sql = `
      INSERT INTO bookings (
        user_id, user_name, user_email, user_phone,
        tour_id, booking_date, group_size, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      booking.user_id,
      booking.user_name,
      booking.user_email,
      booking.user_phone,
      booking.tour_id,
      booking.booking_date,
      booking.group_size,
      booking.total_price
    ];

    const result = await this.run(sql, params);
    return result.id;
  }

  /**
   * Закрывает БД
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            console.log('✅ БД закрыта');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Парсит JSON поля в турах
   */
  parseTours(tours) {
    return tours.map(tour => this.parseTour(tour));
  }

  /**
   * Парсит JSON в одном туре
   */
  parseTour(tour) {
    if (tour.includes && typeof tour.includes === 'string') {
      try {
        tour.includes = JSON.parse(tour.includes);
      } catch {
        tour.includes = [];
      }
    }
    return tour;
  }

  /**
   * Экспортирует туры в JSON
   */
  async exportToJSON(filePath = 'tours-export.json') {
    const tours = await this.getAllTours();
    const data = {
      tours: tours,
      exportedAt: new Date().toISOString(),
      totalCount: tours.length
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Туры экспортированы в ${filePath}`);
    return filePath;
  }

  /**
   * Импортирует туры из JSON
   */
  async importFromJSON(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let addedCount = 0;

    for (const tour of data.tours) {
      try {
        await this.addTour(tour);
        addedCount++;
      } catch (err) {
        console.log(`⚠️ Не удалось добавить тур: ${tour.title}`);
      }
    }

    console.log(`✅ Импортировано туров: ${addedCount}`);
    return addedCount;
  }
}

module.exports = TourDatabase;
