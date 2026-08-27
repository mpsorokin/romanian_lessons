# Промпт: добавить урок или рассказ

> Инструкция по формату: [dobavlenie-kontenta.md](./dobavlenie-kontenta.md) · English: [adding-content.md](./adding-content.md)

Скопируй блок ниже в чат с AI (Cursor, ChatGPT и т.д.), заполни поля в `[...]` и приложи этот файл или ссылки на образцы:
- урок → `src/content/lessons/01-salutari.md`
- рассказ → `src/content/stories/01-seara-bucuresti.md`

---

## Шаблон промпта

```
Создай новый файл контента для приложения изучения румынского языка.

Тип: [урок / рассказ]
Тема: [например: транспорт, в аптеке, выходные на море]
Уровень: [A1 / A2]
Следующий номер: [8 для урока → lesson-08, order: 8 / 6 для рассказа → story-06, order: 6]
Имя файла: [08-transport.md / 06-weekend-mare.md]

Сохрани результат в:
- урок → src/content/lessons/{имя-файла}.md
- рассказ → src/content/stories/{имя-файла}.md

## Frontmatter (обязательный формат)

Файл начинается с YAML frontmatter между ---, как в эталонах.

Урок:

---
id: lesson-01
order: 1
title: Salutări
subtitle: Приветствия
level: A1
wordCount: 20
---

Рассказ:

---
id: story-01
order: 1
title: O seară în București
subtitle: Вечер в Бухаресте
level: A1
wordCount: 180
---

Правила:
- id: lesson-{NN} или story-{NN} — уникален среди ВСЕХ уроков и рассказов
- order: число, совпадает с номером в последовательности
- title: на румынском
- subtitle: перевод title на русский
- level: CEFR (A1, A2…)
- wordCount: примерное число слов в теле текста (считай вручную, не автоматически)

## Тело файла

### Если урок

Структура как в src/content/lessons/01-salutari.md:
- # {title} — заголовок
- короткий вводный абзац на румынском (2–4 предложения)
- ## Cuvinte noi — таблица | Română | Русский |
- > цитата с советом или примером диалога
- ### Expresii utile — список «**румынский** — русский перевод»
- --- и короткое заключение (1–2 предложения)

Объём: 20–50 слов для короткого урока A1.

### Если рассказ

Структура как в src/content/stories/01-seara-bucuresti.md:
- # {title}
- 3–5 абзацев связного текста на румынском (герои Ana, Mihai — по желанию)
- > одна цитата-рефлексия в конце

Объём: 120–250 слов для A1.

## Markdown

Поддерживается GFM: заголовки, **жирный**, списки, таблицы, цитаты, ---.
Не используй HTML. Не добавляй код, ссылки на внешние ресурсы и пояснения вне markdown-файла.

## Вывод

Верни только готовый .md файл — frontmatter + тело. Без комментариев до и после.
Проверь: id уникален, order — число, wordCount соответствует тексту.
```

---

## Быстрые примеры заполнения

### Новый урок №8

```
Тип: урок
Тема: общественный транспорт в Бухаресте
Уровень: A1
Следующий номер: 8 → lesson-08, order: 8
Имя файла: 08-transport.md
```

### Новый рассказ №6

```
Тип: рассказ
Тема: первый поход в аптеку
Уровень: A1
Следующий номер: 6 → story-06, order: 6
Имя файла: 06-farmacie.md
```

---

## Эталон frontmatter

### Урок

Из [`src/content/lessons/01-salutari.md`](../src/content/lessons/01-salutari.md):

```yaml
---
id: lesson-01
order: 1
title: Salutări
subtitle: Приветствия
level: A1
wordCount: 20
---
```

### Рассказ

Из [`src/content/stories/01-seara-bucuresti.md`](../src/content/stories/01-seara-bucuresti.md):

```yaml
---
id: story-01
order: 1
title: O seară în București
subtitle: Вечер в Бухаресте
level: A1
wordCount: 180
---
```

## Текущие номера

| Тип | Последний | Следующий id / order |
| --- | --- | --- |
| Урок | `lesson-07` | `lesson-08`, order: 8 |
| Рассказ | `story-05` | `story-06`, order: 6 |

После добавления файла проверь `/lessons` или `/stories` через `npm run dev`.
