# 📋 Обзор всех файлов

## 🎯 Основные файлы

### bot.js
```javascript
const ALLOWED_USERS = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(',').map(id => parseInt(id.trim()))
  : [7575536082];
```
**Что:** Основной Telegram бот
**Проверяет:** ID пользователя перед тем как дать доступ
**Команды:** /start, /help, /stats, поиск туров
**Использует:** database.js для работы с БД

---

### database.js
```
Методы:
- initialize()      - подключиться к БД
- createTables()    - создать таблицы
- search(query)     - поиск туров
- addTour(tour)     - добавить тур
- logSearch()       - логировать поиск (аналитика)
```
**Что:** Класс для работы с SQLite БД
**Таблицы:** tours, search_queries, favorites, bookings

---

### schema.sql
```sql
CREATE TABLE tours (
  id, title, location, description, duration,
  price, currency, group_size, includes,
  language, url, image_url, rating,
  review_count, category, is_active, ...
)
```
**Что:** Структура базы данных
**Индексы:** По location, category, price, title для скорости

---

## 🔧 Конфигурация

### .env
```bash
TELEGRAM_BOT_TOKEN=123456:ABCdefGHIjklmnoPQRstuvWXYZ
ALLOWED_USERS=7575536082,123456789,987654321
```
**Что:** Конфиг с токеном и разрешенными пользователями
**ВАЖНО:** Добавьте ваш токен и ID!

---

### package.json
```json
{
  "dependencies": {
    "node-telegram-bot-api": "^0.64.0",
    "sqlite3": "^5.1.6",
    "dotenv": "^16.0.0",
    "cheerio": "^1.0.0-rc.12",
    "node-fetch": "^2.6.11"
  }
}
```
**Что:** Зависимости проекта
**Scripts:**
- `npm start` - запуск бота
- `npm run parse` - парсинг сайта
- `npm run init` - инициализация БД

---

### .gitignore
**Что:** Файлы которые не закидываются на GitHub
**Содержит:** node_modules/, .env, *.db, логи

---

## 📊 Парсинг

### parse-and-save.js
```javascript
// Спарсить сайт:
npm run parse

// Создает файл tours.db с турами
```
**Что:** Скрипт для парсинга вашего сайта
**Процесс:**
1. Получает список страниц с турами
2. Парсит каждую страницу
3. Извлекает: название, цену, описание, ссылку
4. Сохраняет в БД

---

### init-db.js
```javascript
// Инициализировать БД с примерами:
node init-db.js
```
**Что:** Создает БД с 5 примерами туров
**Используйте:** если не хотите парсить свой сайт сразу

---

## 📚 Документация

### START_HERE.md
**Что:** **НАЧНИТЕ ОТСЮДА!**
Краткая инструкция что делать

### README.md
**Что:** Полная документация проекта
Возможности, команды, примеры

### DEPLOYMENT.md
**Что:** Как развернуть на GitHub → Railway
Пошаговая инструкция

### FILES_OVERVIEW.md
**Что:** Этот файл. Описание всех файлов

---

## 🔄 Как всё работает вместе

```
┌─────────────────────────────────────────┐
│        Telegram (пользователь)          │
│     пишет: "туры по Лиме"              │
└──────────────┬──────────────────────────┘
               │
         ┌─────▼─────┐
         │  bot.js   │ ← проверяет ALLOWED_USERS
         └─────┬─────┘
               │
         ┌─────▼──────────────┐
         │  database.js       │
         │  search(query)     │
         └─────┬──────────────┘
               │
         ┌─────▼──────────────┐
         │  tours.db (БД)     │
         │  SELECT * FROM     │
         │  tours WHERE       │
         │  title LIKE %query%│
         └─────┬──────────────┘
               │
         ┌─────▼──────────────┐
         │  Результаты найдены│
         │  Отправляем в      │
         │  Telegram          │
         └────────────────────┘
```

---

## 📈 Первый раз использования

### Локально (для тестирования)

```bash
# 1. Установить зависимости
npm install

# 2. Инициализировать БД с примерами
node init-db.js

# 3. Добавить токен в .env
# TELEGRAM_BOT_TOKEN=...

# 4. Запустить бота
npm start
```

### На Railway (продакшен)

```bash
# 1. Закинуть файлы на GitHub
git push

# 2. На Railway.app добавить переменные:
#    TELEGRAM_BOT_TOKEN
#    ALLOWED_USERS

# 3. Railway автоматически:
#    npm install
#    npm start
```

---

## 🗂️ Структура каталога

```
F:\Work\SiteBD/
├── bot.js                 ← Основной бот
├── database.js            ← Класс БД
├── schema.sql             ← Структура БД
├── parse-and-save.js      ← Парсер
├── init-db.js             ← Инициализация
├── package.json           ← Зависимости
├── .env                   ← Конфигурация
├── .gitignore             ← Что не на GitHub
├── tours.db               ← БД (создается)
├── README.md              ← Документация
├── DEPLOYMENT.md          ← Развертывание
├── START_HERE.md          ← Начните отсюда!
└── FILES_OVERVIEW.md      ← Этот файл
```

---

## ✅ Чек-лист перед GitHub

- [ ] Все файлы в папке `F:\Work\SiteBD`
- [ ] .env содержит реальный TELEGRAM_BOT_TOKEN
- [ ] ALLOWED_USERS содержит ваш ID
- [ ] Нет `node_modules/` (в .gitignore)
- [ ] Нет старых `tours.db` (если парсили)

---

## 🚀 После GitHub → Railway

- [ ] Проект создан на Railway.app
- [ ] Переменные добавлены
- [ ] Логи показывают "🤖 Бот запущен..."
- [ ] Бот отвечает в Telegram на `/start`
- [ ] Поиск работает: "туры по Лиме"

---

## 📞 Быстрая помощь

| Проблема | Решение |
|----------|---------|
| Бот не запускается | Проверьте TELEGRAM_BOT_TOKEN в .env и Railway |
| "У вас нет доступа" | Добавьте ваш ID в ALLOWED_USERS |
| Туры не найдены | Запустите `npm run init-db.js` или `npm run parse` |
| БД пустая | Используйте init-db.js для примеров |
| npm install ошибка | На Railway это работает автоматически |

---

**Всё готово!** Начните с START_HERE.md 🚀
