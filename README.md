# Сайт для мероприятий

### Для установки приложения:
- Клонируйте репозиторий
- Запустите команды: make install, make db-migrate
- Создайте файл .env и напишите переменные окружения (PORT, SESSION_KEY)
- Для работы в develompent режиме создайте в корневой папке файл database.sqlite
- Для работы в production режиме создайте переменные для подключение к бд в postgresql (подробнее про подключение можно посмотреть в knexfile.js)
- Запустите приложение командой make start.
## О приложении:
Приложение представляет из себя сайт для остлеживания мероприятий в городе. Пользователь может посмотреть список всех мероприятий на главной странице и увидеть краткое описание для каждого события. Также можно зайти на страницу конкретного мероприятия, посмотреть более подробную информацию, проголосовать "я пойду" и добавить мероприятие в свой календарь. Можно зайти в режим администратора, которому доступно создавать новые мероприятия, изменять и удалять уже созданные.

Работающее приложение можно посмотреть здесь: https://city-events-production.up.railway.app/.
(Данные администратора: username: admin, password: 12345).