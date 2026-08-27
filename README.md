# Calea

Небольшая студия чтения для изучения румынского языка: уроки и рассказы с прогрессом в браузере.

## Возможности

- Уроки и рассказы в Markdown с YAML frontmatter
- Ридер с настройками шрифта и размера текста
- Локальный прогресс чтения (сохраняется в `localStorage`)
- Статистика и профиль

## Стек

- React 19 + TypeScript
- Vite 8
- React Router (`HashRouter`)
- Контент: Markdown в `src/content/`

## Локальный запуск

```bash
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173/`.

### Сборка и превью

```bash
npm run build
npm run preview
```

Сборка кладёт клиент в `dist/client`. Дополнительно скрипт готовит артефакты для OpenAI Sites — для GitHub Pages нужна только папка `dist/client`.

### Проверки

```bash
npm run typecheck
npm run test:sites
```

## Добавление контента

Новые уроки и рассказы — это `.md` файлы в `src/content/`. Код приложения менять не нужно.

- [Добавление уроков и рассказов](docs/dobavlenie-kontenta.md)
- [Промпт для AI](docs/prompt-add-content.md)
- English: [adding-content.md](docs/adding-content.md)

## Деплой на GitHub Pages

Приложение уже настроено для статического хостинга: относительные пути (`base: "./"`) и `HashRouter` — отдельный `404.html` не нужен.

### Автоматический деплой

В репозитории есть workflow [`.github/workflows/github-pages.yml`](.github/workflows/github-pages.yml). При push в ветку `main` он собирает проект и публикует содержимое `dist/client`.

**Один раз настройте GitHub:**

1. Запушьте репозиторий на GitHub.
2. Откройте **Settings → Pages**.
3. В **Build and deployment → Source** выберите **GitHub Actions**.
4. Дождитесь успешного запуска workflow (вкладка **Actions**).

Сайт будет доступен по адресу:

```
https://<username>.github.io/<repo>/
```

Например: `https://alex.github.io/romanian_learn/`

### Ручной деплой (локально)

Если нужно опубликовать вручную без Actions:

```bash
npm run build
```

Загрузите содержимое папки `dist/client` в ветку `gh-pages` или включите Pages из папки `/docs` — главное, чтобы в корне сайта лежал `index.html` из `dist/client`.

## Структура проекта

```
src/
  content/
    lessons/     # уроки (*.md)
    stories/     # рассказы (*.md)
  pages/         # экраны приложения
  features/      # прогресс, настройки ридера
docs/            # документация по контенту
```

## Лицензия

Приватный проект (`private: true` в `package.json`).
