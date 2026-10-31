# falokut-site

Сайт-визитка: **Vite + React + TS + react-markdown** (тот же стек, что
polygon-docs-ui). Логика контента — как в docs-ui: **один markdown-файл
в `content/` = один документ**, дерево документов — в верхнем нав-баре,
выбор — по hash (`#/doc/<path>`), TOC («Содержание») — в ненавязчивом
правом сайдбаре, кросс-ссылки между документами — прямо в markdown.

## Структура

```
content/        markdown-контент: about, stack, oss, projects, contacts
                + meta.json (название, порядок документов в nav)
src/
  App.tsx       layout: nav с деревом, TOC-сайдбар, hero на дефолтном документе
  docsTree.ts   import.meta.glob('/content/**/*.md') + meta.json -> дерево
  Markdown.tsx  react-markdown: fence-блоки как «терминалы», кросс-ссылки,
                h2-якоря; компоненты подмешиваются из App
  Terminal.tsx  анимация «терминала» в hero (whoami / go build ./...)
  GopherEgg.tsx пасхалка: набери «gopher» с клавиатуры
  Statusbar.tsx vim-статусбар с uptime
  style.css     тёмная тема, акцент — Go-синий #00ADD8
cfg/nginx.conf  nginx (SPA-fallback + долгий кеш /assets/)
```

## Маршруты

Дефолтный документ — первый в порядке `content/meta.json` (`about.md`):
без hash сайт открывает `#/doc/about.md`.

```
#/doc/about.md
#/doc/stack.md
#/doc/oss.md
#/doc/projects.md
#/doc/contacts.md
```

Кросс-ссылка в markdown — путь к файлу (относительный от каталога
текущего дока или абсолютный от корня `content/`, с поддержкой `../`):

```markdown
Подробнее — в [стек](stack.md) и [open source](/oss.md).
```

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
