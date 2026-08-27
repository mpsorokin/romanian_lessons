# Добавление уроков и рассказов

> English version: [adding-content.md](./adding-content.md)

Это руководство описывает, как добавлять новые уроки и рассказы в приложение для изучения румынского языка. Контент — это Markdown-файлы с YAML frontmatter; код приложения менять не нужно.

## Обзор

| Тип | Папка | Маршрут |
| --- | --- | --- |
| Уроки | `src/content/lessons/` | `/lessons/{id}` |
| Рассказы | `src/content/stories/` | `/stories/{id}` |

Приложение автоматически находит все `.md` файлы в этих папках при сборке и запуске dev-сервера. Отдельный реестр или index-файл не нужен.

```
src/content/lessons/*.md  ──┐
                            ├──► content.ts ──► списки и ридеры
src/content/stories/*.md  ──┘
```

## Схема frontmatter

Каждый файл начинается с блока YAML между `---`:

```yaml
---
id: lesson-08
order: 8
title: Transportul
subtitle: Транспорт
level: A1
wordCount: 45
---
```

### Обязательные поля

| Поле | Тип | Описание |
| --- | --- | --- |
| `id` | string | Уникальный идентификатор **глобально** — среди всех уроков и рассказов |
| `order` | number | Порядок отображения в списке (сортировка по возрастанию) |
| `title` | string | Заголовок на румынском |

### Необязательные поля

| Поле | Описание |
| --- | --- |
| `subtitle` | Подзаголовок на русском — показывается в списках и в ридере |
| `level` | Уровень CEFR (`A1`, `A2` и т.д.); если не указан, в UI отображается `A1` |
| `wordCount` | Примерное число слов — задаётся вручную, не считается автоматически |

## Соглашения об именовании

Это конвенции существующего контента, а не жёсткие правила парсера:

| Элемент | Формат | Пример |
| --- | --- | --- |
| Имя файла | `{NN}-{slug}.md` | `08-transport.md` |
| ID урока | `lesson-{NN}` | `lesson-08` |
| ID рассказа | `story-{NN}` | `story-06` |
| `order` | Целое число в последовательности | `8` |
| `title` | Румынский | `Transportul` |
| `subtitle` | Русский | `Транспорт` |

Имя файла и `id` могут не совпадать — на маршрутизацию и сортировку влияют только поля `id` и `order` из frontmatter.

**Текущий контент:** 7 уроков (`lesson-01`…`lesson-07`), 5 рассказов (`story-01`…`story-05`).

## Как добавить новый урок

1. Создайте файл `src/content/lessons/08-{slug}.md` (следующий номер после последнего урока).
2. Добавьте frontmatter с уникальным `id: lesson-08` и `order: 8`.
3. Напишите тело урока на румынском в Markdown.
4. Укажите `wordCount` — примерное количество слов в тексте.
5. Убедитесь, что `id` не совпадает ни с одним существующим уроком или рассказом.
6. Сохраните файл — dev-сервер подхватит изменения через HMR.
7. Проверьте список `/lessons` и страницу `/lessons/lesson-08`.

## Как добавить новый рассказ

1. Создайте файл `src/content/stories/06-{slug}.md`.
2. Добавьте frontmatter с `id: story-06`, `order: 6` и остальными полями.
3. Напишите текст рассказа на румынском.
4. Укажите `wordCount` — от него зависит отображение прогресса чтения.
5. Сохраните и проверьте `/stories` и `/stories/story-06`.

## Формат Markdown

Текст рендерится через `react-markdown` с плагином `remark-gfm`. Поддерживаются:

- заголовки `#`, `##`, `###`
- **жирный текст** и обычные списки
- цитаты `>`
- таблицы GFM
- горизонтальные линии `---`

### Пример урока

Файл: `src/content/lessons/01-salutari.md`

```markdown
---
id: lesson-01
order: 1
title: Salutări
subtitle: Приветствия
level: A1
wordCount: 20
---

# Salutări

**Bună ziua!** Eu sunt Ana din București. Tu ești student. Noi învățăm limba română împreună.

## Cuvinte noi

| Română | Русский |
| --- | --- |
| bună | привет |
| ziua | день |
| salut | здравствуй |
| mulțumesc | спасибо |

> Începe cu un zâmbet și cu un simplu „Bună!”.

### Expresii utile

- **Bună!** — Привет!
- **Bună ziua!** — Добрый день!
- **La revedere!** — До свидания!
```

### Пример рассказа

Файл: `src/content/stories/01-seara-bucuresti.md`

```markdown
---
id: story-01
order: 1
title: O seară în București
subtitle: Вечер в Бухаресте
level: A1
wordCount: 180
---

# O seară în București

Este vineri seara. Ana și prietenul ei, Mihai, merg pe jos prin centrul Bucureștiului. Străzile sunt aglomerate, dar atmosfera este calmă.

Se opresc lângă o librărie și privesc vitrinele. Ana găsește o carte despre istoria orașului. Mihai propune să bea o cafea într-un loc mic din apropiere.

> Bucureștiul este diferit în fiecare seară.
```

## Отличия уроков и рассказов в приложении

| | Урок | Рассказ |
| --- | --- | --- |
| Прогресс | Статус: новый / текущий / пройден | Процент прокрутки + «Прочитано» |
| Завершение | Кнопка «Завершить урок» | Кнопка «Отметить прочитанным» + авто-прогресс по скроллу |
| Заголовок в ридере | «Урок NN · A1» | «Рассказ NN · A1» + progress bar |
| Открытие | Автоматически помечается «текущим» | Прогресс сохраняется по позиции скролла |

## Типичные ошибки

Frontmatter разбирается и проверяется на этапе сборки. Ошибка роняет `npm run build` и показывает оверлей в `npm run dev`, поэтому битый файл не попадёт в прод.

| Ошибка | Причина |
| --- | --- |
| `Missing YAML frontmatter` | Нет блока `---` в начале файла |
| `Invalid id/order/title` | Поле пропущено или пустое |
| `expected a number` | `order` или `wordCount` не число |
| `Duplicate content id` | Один и тот же `id` у двух файлов (в том числе урок + рассказ) |
| `Duplicate order` | Одинаковый `order` у двух уроков или у двух рассказов |

## Проверка

```bash
npm run dev
```

Откройте в браузере:

- `/lessons` — новый урок в списке
- `/lessons/{id}` — содержимое и кнопка завершения
- `/stories` — новый рассказ в списке
- `/stories/{id}` — прогресс чтения и кнопка «Отметить прочитанным»

## Что не нужно делать

- Не редактировать `src/lib/content.ts`, роуты или компоненты
- Не добавлять TypeScript-импорты для нового контента
- Не создавать index- или registry-файлы

Достаточно добавить `.md` файл в нужную папку с корректным frontmatter.
