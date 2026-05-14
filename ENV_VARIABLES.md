# 🔐 Переменные окружения

**ВАЖНО:** Этот проект БЕЗ файла `.env`!

Все переменные окружения устанавливаются напрямую:
- На Railway.app в разделе **Variables**
- На локальной машине в PowerShell/bash

---

## 📋 Требуемые переменные

### ОБЯЗАТЕЛЬНЫЕ:

| Переменная | Значение | Пример |
|-----------|----------|--------|
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather | `123456:ABCdef...` |
| `ALLOWED_USERS` | ID в Telegram (через запятую) | `7575536082,123456789` |

### ОПЦИОНАЛЬНО:

| Переменная | Значение | Пример |
|-----------|----------|--------|
| `ANTHROPIC_API_KEY` | Ключ Claude API (для ИИ) | `sk-ant-xxxxx` |

---

## 🚀 На Railway.app

### Шаг 1: Создать проект

1. railway.app → **"New Project"**
2. **"Deploy from GitHub"** → выберите `Wanchaqero/otvet-bot`

### Шаг 2: Добавить переменные

После развертывания перейдите на вкладку **"Variables"**:

Нажимайте **"+ New Variable"** для каждой:

**Переменная 1:**
```
KEY: TELEGRAM_BOT_TOKEN
VALUE: 123456:ABCdefGHIjklmnoPQRstuvWXYZ
```

**Переменная 2:**
```
KEY: ALLOWED_USERS
VALUE: 7575536082,123456789
```

**Переменная 3 (если нужен ИИ):**
```
KEY: ANTHROPIC_API_KEY
VALUE: sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

### Шаг 3: Save

Нажмите **"Save"** → Railway автоматически перезагрузит бота!

---

## 💻 Локально (для тестирования)

### Windows PowerShell

```powershell
$env:TELEGRAM_BOT_TOKEN="123456:ABCdef..."
$env:ALLOWED_USERS="7575536082,123456789"
$env:ANTHROPIC_API_KEY="sk-ant-xxxxx"

npm start
```

### macOS/Linux (bash)

```bash
export TELEGRAM_BOT_TOKEN="123456:ABCdef..."
export ALLOWED_USERS="7575536082,123456789"
export ANTHROPIC_API_KEY="sk-ant-xxxxx"

npm start
```

### Или создайте скрипт .env.sh

```bash
#!/bin/bash
export TELEGRAM_BOT_TOKEN="123456:ABCdef..."
export ALLOWED_USERS="7575536082,123456789"
export ANTHROPIC_API_KEY="sk-ant-xxxxx"

npm start
```

Потом:
```bash
bash .env.sh
```

---

## 🔑 Как получить значения

### TELEGRAM_BOT_TOKEN

1. Откройте Telegram
2. Найдите **@BotFather**
3. Отправьте `/newbot`
4. Следуйте инструкциям
5. Скопируйте токен

### ALLOWED_USERS

1. Откройте Telegram
2. Найдите **@userinfobot**
3. Нажмите **Start**
4. Скопируйте ваш ID

Остальные люди → их ID через запятую:
```
7575536082,123456789,987654321
```

### ANTHROPIC_API_KEY

1. Откройте [console.anthropic.com](https://console.anthropic.com)
2. Перейдите на **"API keys"**
3. Нажмите **"Create Key"**
4. Скопируйте ключ

---

## ✅ Проверка

### На Railway

Смотрите логи:
```
✅ Разрешенные пользователи: 7575536082
🤖 Бот запущен и ожидает сообщения...
```

### Локально

Если все верно:
```
✅ БД инициализирована
📊 В БД загружено туров: X
🤖 Бот запущен и ожидает сообщения...
```

Если ошибка:
```
❌ ОШИБКА: не установлена переменная окружения TELEGRAM_BOT_TOKEN
```

---

## 🚨 ВАЖНО

- ✅ **Переменные НЕ должны быть в .env файле**
- ✅ **Добавляйте напрямую на Railway**
- ✅ **.env в .gitignore** (если его создадите)
- ✅ **Не коммитьте ключи на GitHub**

---

## 🔍 Порядок проверки переменных

Бот ищет переменные в таком порядке:

1. **Переменные окружения ОС** (установленные в системе)
2. **Railway Variables** (если развернут)
3. **Значения по умолчанию** (если есть)

---

**Готово!** Все переменные идут напрямую, без .env файла! 🚀
