# Kloda API

Фулстек веб-приложение с карточками, по которым можно обучаться, готовиться к собеседованиям, повторять и
закреплять пройденный материал.

- Бэкенд: [api.kloda.fediaev.ru](https://api.kloda.fediaev.ru).
- Фронтенд: [github.com/SergFediaev/kloda](https://github.com/SergFediaev/kloda).

## 🚀 Стек технологий

- Фреймворк: [ElysiaJS](https://elysiajs.com/integrations/cheat-sheet.html).
- Типизация: Elysia [TypeBox](https://github.com/sinclairzx81/typebox)
  и [TypeScript](https://www.typescriptlang.org/docs) — полная типизация всех маршрутов и моделей.
- База данных: [PostgreSQL 16](https://www.postgresql.org/docs/16/index.html).
- ORM: [Drizzle ORM](https://orm.drizzle.team/docs/overview).
    - Query API и автоматическая миграция.
    - Таблицы пользователей, карточек и категорий связаны между собой через внешние ключи.
    - Промежуточные таблицы с каскадным удалением.
- Линтер и форматер: [Biome](https://biomejs.dev/guides/getting-started).
- Среда выполнения и пакетный менеджер: [Bun](https://bun.sh/docs).
- Контейнеризация: [Docker](https://docs.docker.com/get-started) — развёртывание через
  платформу [Coolify](https://coolify.io/docs) на выделенной машине с Ubuntu Server LTS (minimized).
- Документация: [Swagger Plugin](https://github.com/elysiajs/elysia-swagger) — автоматическая документация API.
- Логирование: [Logixlysia Plugin](https://github.com/PunGrumpy/logixlysia)
  и [IP Plugin](https://github.com/gaurishhs/elysia-ip).
- Аудит производительности: [Server Timing Plugin](https://github.com/elysiajs/server-timing).
- CORS: [CORS Plugin](https://github.com/elysiajs/elysia-cors).
- JWT: [JWT Plugin](https://github.com/elysiajs/elysia-jwt) — refresh и access
  токены.
- Ограничение запросов: [Rate Limit Plugin](https://github.com/rayriffy/elysia-rate-limit) — настроены
  ограничения частоты запросов для разных окружений.
- Статические файлы: [Static Plugin](https://github.com/elysiajs/elysia-static) — обслуживание статических файлов
  домашней страницы бэкенда (HTML, CSS, JS, изображения).
- Конвенции:
    - [Семантическое версионирование](https://semver.org).
    - [Соглашение о коммитах](https://www.conventionalcommits.org/en/v1.0.0).
- Стиль кода: Flat Code, Guard Clause.

## 🔑 Основные возможности

## `/auth`

- Аутентификация и авторизация пользователя с помощью access и refresh токенов:
    - `/register` — регистрация по username, email и паролю.
    - `/login`, `/logout`, `/me`.
    - `/refresh` — обновление access токена с помощью refresh токена в cookie.
- Хеширование:
    - Пароль — `Bun.password.hash()`.
    - Refresh токен — `Bun.CryptoHasher('sha512')`.
- Middleware:
    - `authenticate.ts` — опциональная аутентификация по access bearer-токену, которая возвращает пользователя с
      динамическими данными по его карточкам (лайки, дизлайки, избранное).
    - `authorize.ts` обязательная авторизация пользователя, которой защищены маршруты с операциями над карточками.
- User Agent: [UAParser.js](https://github.com/faisalman/ua-parser-js) — парсинг и запись данных в БД вместе с refresh
  токеном.

## `/cards`

- Полный CRUD: создание, чтение, обновление и удаление карточек.
- Пагинация карточек.
- Поиск карточек по заголовку и контенту с учётом категорий.
- Сортировка карточек:
    - По ID, заголовку, контенту, автору.
    - По количеству лайков, дизлайков, добавлений в избранное.
    - По дате создания/обновления.
- Порядок карточек: по убыванию и возрастанию.
- Лайк, дизлайк и добавление карточки в избранное — доступно только авторизованному пользователю.
- Редактирование и удаление карточки — доступно только автору карточки.
- Удаление всех созданных карточек пользователя.
- Динамические категории:
    - Категории в созданной карточке, которых ещё нет в базе данных, будут созданы и подтянуты автоматически.
    - Если удаляется карточка, которая была единственной в категории, то вместе с карточкой удаляется осиротевшая
      категория.

`/cards/export` — конвертация и экспорт всех созданных карточек пользователя в формате CSV с
помощью [CSV stringifier](https://csv.js.org/stringify/).

`/cards/random` — случайная карточка с учётом категорий и ID текущей карточки из аргументов.

## `/cards/ID`

- Получение карточки по ID с учётом категорий.
- Вычисление соседних карточек и позиции запрашиваемой карточки.
- Динамический подсчёт количества карточек в категориях.
- Если запрашиваемая карточка не найдена, то будет возвращена первая карточка из переданных категорий.

## `/cards/import`

- Парсинг данных из [Google Sheets API](https://developers.google.com/sheets/api/guides/concepts) с конвертацией в
  карточки.
- Возможность пропустить первый ряд/колонку в таблице.
- Запись импортированных карточек с категориями в базу данных.

`/categories` — получение категорий с динамическим подсчётом количества карточек в них.

## `/users`

- Пагинация пользователей.
- Поиск пользователей по username и email.
- Сортировка пользователей:
    - По ID, username, email.
    - По количеству созданных, избранных, лайкнутых или дизлайкнутых карточек.
    - По дате регистрации/последнего логина.
- Порядок пользователей: по убыванию и возрастанию.
- Динамический подсчёт всех созданных, лайкнутых, дизлайкнутых и избранных карточек пользователя.


- `/uptime` — аптайм бэкенда в реальном времени по веб-сокетам [uWebSocket](https://github.com/uNetworking/uWebSockets).


- `/stats` — общая статистика карточек и пользователей в базе данных.

## `sql.ts`

Вспомогательные функции для базы данных:

- Нормализация данных.
- Составные запросы для извлечения и записи данных.
- Динамические агрегации категорий и статусов карточек.
- Удаление пустых категорий.
- И многое другое.