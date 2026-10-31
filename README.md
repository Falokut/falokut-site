# falokut-site

Сайт-визитка: **Vite + React + TS + react-markdown** (тот же стек, что
polygon-docs-ui). Одностраничный: **один markdown-файл в `content/` =
один раздел**, все разделы — на одной странице (порядок — `content/meta.json`).
Логика — как в docs-ui: контент вшивается в бандл при сборке
(`import.meta.glob`), заголовки и порядок — из `meta.json`, кросс-ссылки
между разделами — прямо в markdown.

## Структура

```
content/        markdown-контент: about, stack, oss, projects, contacts
                + meta.json (название, порядок разделов)
src/
  App.tsx       одна страница: nav с деревом разделов (scroll-spy), hero,
                разделы из md, TOC-сайдбар справа
  docsTree.ts   import.meta.glob('/content/**/*.md') + meta.json -> дерево
  Markdown.tsx  react-markdown: fence-блоки как «терминалы», кросс-ссылки
  Terminal.tsx  анимация «терминала» в hero (whoami / go build ./...)
  GopherEgg.tsx пасхалка: набери «gopher» с клавиатуры
  Statusbar.tsx vim-статусбар с uptime
  style.css     тёмная тема, акцент — Go-синий #00ADD8
cfg/nginx.conf  nginx (SPA-fallback + долгий кеш /assets/)
```

## Навигация

- Разделы — якоря на одной странице: `#about`, `#stack`, `#oss`,
  `#projects`, `#contacts`; nav и TOC подсвечивают текущий.
- Кросс-ссылка в markdown — путь к файлу (относительный или абсолютный
  от корня `content/`, с поддержкой `../`):

  ```markdown
  Подробнее — в [стек](stack.md) и [open source](/oss.md).
  ```

  Ссылка превращается в анкер на раздел.

## Локально

```bash
npm install
npm start        # http://localhost:8080
npm run build    # build/
npx tsc --noEmit # проверка типов
```

## Деплой (на сервере, где крутится traefik из n8n-compose)

```bash
git clone git@github.com:Falokut/falokut-site.git /opt/falokut-site
cd /opt/falokut-site
docker compose up -d --build
```

Traefik подхватит контейнер по label'ам (`Host(falokut.ru)`, резолвер
`mytlschallenge`) и выдаст Let's Encrypt сертификат для `falokut.ru`
(TLS challenge).

Обновление контента:

```bash
cd /opt/falokut-site
git pull
docker compose up -d --build
```

## Приколы

- Терминал в hero печатает `whoami` / `go build ./...`.
- Пасхалка: набери **gopher** (буквы считаются где угодно) —
  появится gopher. Esc — закрыть.
- Статус-бар внизу — uptime страницы в духе vim.
- Fence-блоки в markdown рисуются «терминальными окнами».

## Требования к DNS

- `falokut.ru` → A → IP сервера (для сертификата и самого сайта).
