# falokut-site

Сайт-визитка: **Vite + React + TS + react-markdown** (тот же стек, что
polygon-docs-ui). Контент — markdown в `content/*.md`, вшивается в бандл
при сборке через `import.meta.glob` (см. `src/contentTree.ts`):
обновление контента = правка `.md` + пересборка образа.

## Структура

```
content/        markdown-контент секций (about, stack, oss, projects, contacts)
src/
  App.tsx       layout: nav со scroll-spy, hero, секции, статус-бар
  contentTree.ts import.meta.glob('/content/*.md') -> секции
  Markdown.tsx  react-markdown: fence-блоки как «терминалы», внешние ссылки
  Terminal.tsx  анимация «терминала» в hero (whoami / go build ./...)
  GopherEgg.tsx пасхалка: набери «gopher» с клавиатуры
  Statusbar.tsx vim-статусбар с uptime
  style.css     тёмная тема, акцент — Go-синий #00ADD8
cfg/nginx.conf  nginx (SPA-fallback + долгий кеш /assets/)
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
