# 🚀 НАЧНИТЕ С ЭТОГО ФАЙЛА

## ✅ Что готово

В папке `F:\Work\SiteBD` находится **полный готовый бот** для Railway.app:

```
✅ bot.js              - Бот с проверкой прав (ALLOWED_USERS)
✅ database.js         - БД SQLite
✅ parse-and-save.js   - Парсер сайта
✅ init-db.js          - Инициализация с примерами
✅ package.json        - Зависимости
✅ schema.sql          - Структура БД
✅ .env                - Конфигурация
✅ README.md           - Документация
✅ DEPLOYMENT.md       - Как развернуть
```

---

## 🎯 Что нужно сделать

### 1️⃣ Добавить токен бота в .env

Откройте `F:\Work\SiteBD\.env`:

```bash
TELEGRAM_BOT_TOKEN=СЮДА_ВСТАВЬТЕ_ТОКЕН_ОТ_БОТФАТЕРА
ALLOWED_USERS=7575536082,ВАШ_ВТОРОЙ_ID,ВАШ_ТРЕТИЙ_ID
```

**Как получить:**
- Токен: найдите @BotFather в Telegram → `/newbot`
- ID: найдите @userinfobot в Telegram → нажмите Start

### 2️⃣ Закинуть на GitHub

```bash
git init
git add .
git commit -m "BerúPeru Bot"
git branch -M main
git remote add origin https://github.com/ВАШ_USERNAME/beruperu-bot.git
git push -u origin main
```

### 3️⃣ Развернуть на Railway

1. Откройте railway.app
2. "New Project" → "Deploy from GitHub"
3. Выберите `beruperu-bot`
4. Добавьте переменные в **Variables**:
   - `TELEGRAM_BOT_TOKEN`
   - `ALLOWED_USERS`

**Готово!** 🎉 Бот работает!

---

## 📊 Как это работает

### День 1: Подготовка

```bash
# Локально:
npm install
npm run init-db        # Создает БД с примерами
```

Или парсьте свой сайт:
```bash
npm run parse          # Парсит beruperu.omarat.info
```

### День 2-∞: Бот в облаке

```
Пользователь → Telegram → бот.js → ищет в tours.db → результаты!
```

Бот работает 24/7 в облаке на Railway! 🌟

---

## 🔐 Проверка прав доступа

В боте встроена проверка ID:

```javascript
const ALLOWED_USERS = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(',').map(id => parseInt(id.trim()))
  : [7575536082];
```

Только люди с ID из этого списка могут писать боту!

---

## 💾 Папка содержит

### Основные файлы
- **bot.js** - Telegram бот с проверкой прав
- **database.js** - Работа с SQLite БД
- **package.json** - npm зависимости

### БД и парсинг
- **schema.sql** - Структура БД (туры, поиски, бронирования)
- **parse-and-save.js** - Парсит сайт один раз
- **init-db.js** - Инициализация БД с примерами туров

### Конфигурация
- **.env** - Токен и разрешенные пользователи
- **.gitignore** - Что не закидывать на GitHub
- **package.json** - Что установить

### Документация
- **README.md** - Полная документация проекта
- **DEPLOYMENT.md** - Как развернуть на Railway
- **START_HERE.md** - Этот файл

---

## ⚡ Быстрый чек-лист

- [ ] Скопировал токен в .env
- [ ] Добавил свой ID в ALLOWED_USERS
- [ ] Закинул файлы на GitHub
- [ ] Создал проект на Railway.app
- [ ] Добавил переменные на Railway
- [ ] Вижу в логах "🤖 Бот запущен..."
- [ ] Написал боту `/start` в Telegram

---

## 🚀 Следующие шаги

1. **Отредактируйте .env** - добавьте токен и свой ID
2. **Закиньте на GitHub** - все файлы из папки
3. **Развернули на Railway** - следуйте DEPLOYMENT.md
4. **Тестируйте** - напишите боту в Telegram!

---

## 📞 Поддержка

Если что-то не работает:

1. Проверьте логи на Railway
2. Убедитесь что переменные добавлены правильно
3. Проверьте что токен правильный (без пробелов)
4. Убедитесь что ваш ID в ALLOWED_USERS

---

## 🎉 Готово!

**Ваш бот готов!** Просто добавьте токен и закиньте на GitHub → Railway.

Вопросы? Читайте:
- **DEPLOYMENT.md** - развертывание
- **README.md** - полная документация
- **bot.js** - код бота с комментариями

---

**Happy coding!** 🚀
