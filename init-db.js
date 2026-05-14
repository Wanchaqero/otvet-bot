/**
 * Инициализация БД с примерами туров
 * Используйте локально при первой установке
 */

const TourDatabase = require('./database');

async function initDatabase() {
  const db = new TourDatabase('tours.db');

  try {
    // Инициализируем БД
    await db.initialize();
    await db.createTables();
    console.log('✅ Таблицы созданы');

    // Примеры туров
    const tours = [
      {
        title: "Тур по Лиме без музеев",
        location: "Лима",
        description: "3-часовая экскурсия по основным достопримечательностям центра Лимы. Посетите историческую площадь Пласа Майор, изучите колониальную архитектуру, посетите церкви и увидите панорамные виды на город.",
        duration: "3 часа",
        price: 200,
        currency: "USD",
        group_size: "до 5 человек",
        includes: ["гид", "транспорт"],
        language: "русский",
        url: "https://beruperu.omarat.info/tur-po-lime-bez-muzeev/",
        image_url: "https://beruperu.omarat.info/images/lima-tour.jpg",
        category: "городской"
      },
      {
        title: "Тур по Лиме с музеем Ларко",
        location: "Лима",
        description: "4-5 часовой тур по Лиме с посещением знаменитого музея Ларко. Музей содержит одну из лучших коллекций доиспанского искусства в Перу. Затем прогулка по историческому центру города.",
        duration: "4-5 часов",
        price: 300,
        currency: "USD",
        group_size: "до 5 человек",
        includes: ["русскоязычный гид", "транспорт", "вход в музей"],
        language: "русский",
        url: "https://beruperu.omarat.info/city-tur-lima-tur-v-muzei-larko/",
        image_url: "https://beruperu.omarat.info/images/larco-museum.jpg",
        category: "музей"
      },
      {
        title: "Священная долина инков",
        location: "Кузко",
        description: "Полный день в Священной долине с посещением трех основных arqueológicos памятников: Ollantaytambo, Pisac и местного рынка. Узнайте об истории инков и традиционной культуре андских народов.",
        duration: "8 часов",
        price: 450,
        currency: "USD",
        group_size: "до 8 человек",
        includes: ["профессиональный гид", "транспорт", "обед", "входные билеты"],
        language: "русский",
        url: "https://beruperu.omarat.info/sacred-valley-tour/",
        image_url: "https://beruperu.omarat.info/images/sacred-valley.jpg",
        category: "культурный"
      },
      {
        title: "Мачу-Пикчу из Куско",
        location: "Мачу-Пикчу",
        description: "Незабываемый день в древнем городе инков Мачу-Пикчу. Поезд в горах, прогулка по руинам с опытным гидом, узнайте секреты инженерии инков. Один из 7 чудес света!",
        duration: "12 часов",
        price: 650,
        currency: "USD",
        group_size: "до 10 человек",
        includes: ["гид", "поезд туда-обратно", "вход в Мачу-Пикчу", "транспорт"],
        language: "русский",
        url: "https://beruperu.omarat.info/machu-picchu-tour/",
        image_url: "https://beruperu.omarat.info/images/machu-picchu.jpg",
        category: "историческое"
      },
      {
        title: "Линии Наски",
        location: "Наска",
        description: "Полет над знаменитыми линиями Наски - древними геоглифами, созданными цивилизацией Наска. Увидите рисунки колибри, обезьяны, паука с высоты птичьего полета.",
        duration: "4 часа",
        price: 350,
        currency: "USD",
        group_size: "до 4 человек",
        includes: ["гид", "самолет", "страховка"],
        language: "русский",
        url: "https://beruperu.omarat.info/nazca-lines-tour/",
        image_url: "https://beruperu.omarat.info/images/nazca-lines.jpg",
        category: "приключение"
      }
    ];

    // Добавляем туры в БД
    console.log('\n📝 Добавляю примеры туров в БД...');
    for (const tour of tours) {
      try {
        await db.addTour(tour);
        console.log(`✅ ${tour.title}`);
      } catch (error) {
        console.log(`⚠️ Ошибка: ${tour.title} - ${error.message}`);
      }
    }

    // Показываем статистику
    const stats = await db.getStats();
    console.log('\n✅ БД инициализирована!');
    console.log('\n📊 Статистика:');
    console.log(`  • Всего туров: ${stats.totalTours}`);
    console.log(`  • Средняя цена: $${stats.averagePrice.toFixed(2)}`);
    console.log(`  • По локациям:`, stats.byLocation);

    await db.close();
    console.log('\n✅ Готово! Можно запускать бот: npm start');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await db.close();
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
