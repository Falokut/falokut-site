// Контент сайта: md-файлы в content/ — один файл = одна страница
// (как в docs-ui, но без сайдбара-дерева: выбор страницы — в
// гамбургер-меню). Внутри страницы:
//   ```hero — лендинг (HeroBlock), рисуется перед разделами;
//   «## …» — раздел (h2 + номер), «### …» — подблок (h3, в TOC);
//   ```ttt / ```2048 / ```memory — игра в разделе (TicTacToe /
//   Game2048 / GameMemory);
//   остальные fence — «терминальные окна» (Markdown).
// Порядок и названия страниц — content/meta.json.

const mdModules = import.meta.glob('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>
const jsonModules = import.meta.glob('/content/**/*.json', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

// Ключи glob — '/content/<path>' (root-относительный паттерн).
const normalize = (key: string): string => key.replace(/^.*?content\//, '')

/** Относительный путь (без content/) -> содержимое. */
const files: Record<string, string> = Object.fromEntries(
  Object.entries(mdModules).map(([key, content]) => [normalize(key), content])
)
const meta = (jsonModules['/content/meta.json'] !== undefined
  ? JSON.parse(jsonModules['/content/meta.json'])
  : {}) as {
  title?: string
  pages?: { file: string; title?: string }[]
}

export type SubBlock = { heading: string; id: string; text: string }
export type GameId = 'ttt' | '2048' | 'memory'
export type Section = {
  heading: string
  id: string
  intro: string
  subs: SubBlock[]
  game: GameId | null
}
export type PageBlocks = { hero: string | null; sections: Section[] }
export type PageDef = { id: string; title: string; blocks: PageBlocks }

const GAME_FENCES = ['ttt', '2048', 'memory'] as const

/** Название для лого в навигации. */
export const siteTitle = meta.title ?? 'falokut'

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .trim()
    .replace(/\s+/g, '-')

const fileSlug = (name: string): string =>
  name.replace(/\.md$/i, '').replace(/[-_]+/g, '-').toLowerCase()

// Разбор страницы: hero-фенс в преамбуле, разделы «## …» с подблоками
// «### …», игровые фенсы в разделе. Маркеры спец-фенсов не попадают
// в текст; обычные code-fence остаются (их рендерит Markdown).
const parsePage = (raw: string, baseId: string): PageBlocks => {
  const sections: Section[] = []
  const heroLines: string[] = []
  let cur: Section | null = null
  let sub: { heading: string; id: string } | null = null
  let intro: string[] = []
  let subLines: string[] = []
  let inFence = false
  let fence: 'hero' | GameId | 'code' = 'code'
  const push = (line: string) => {
    if (fence === 'hero') heroLines.push(line)
    else if (sub !== null) subLines.push(line)
    else intro.push(line)
  }
  const endSub = () => {
    if (cur !== null && sub !== null)
      cur.subs.push({
        heading: sub.heading,
        id: sub.id,
        text: subLines.join('\n').trim()
      })
    sub = null
    subLines = []
  }
  const endSection = () => {
    endSub()
    if (cur !== null) cur.intro = intro.join('\n').trim()
    cur = null
    intro = []
  }
  for (const line of raw.split('\n')) {
    const t = line.trimStart()
    if (inFence) {
      if (t.startsWith('```')) {
        if (fence !== 'hero' && fence !== 'code' && cur !== null)
          cur.game = fence
        inFence = false
        fence = 'code'
      } else {
        push(line)
      }
      continue
    }
    if (t.startsWith('```')) {
      const lang = t.slice(3).trim().toLowerCase()
      fence =
        lang === 'hero'
          ? 'hero'
          : (GAME_FENCES as readonly string[]).includes(lang)
            ? (lang as GameId)
            : 'code'
      inFence = true
      if (fence !== 'code') continue
      push(line)
      continue
    }
    const secM = line.match(/^##\s+(.*)$/)
    if (secM) {
      endSection()
      const heading = secM[1].trim()
      cur = {
        heading,
        id: `${baseId}-${slugify(heading)}`,
        intro: '',
        subs: [],
        game: null
      }
      sections.push(cur)
      continue
    }
    const subM = line.match(/^###\s+(.*)$/)
    if (subM) {
      endSub()
      const heading = subM[1].trim()
      sub = {
        heading,
        id:
          cur !== null
            ? `${cur.id}-${slugify(heading)}`
            : `${baseId}-${slugify(heading)}`
      }
      continue
    }
    push(line)
  }
  endSection()
  const hero = heroLines.join('\n').trim()
  return { hero: hero === '' ? null : hero, sections }
}

// Заголовок страницы: из meta.json, иначе первый «## …» в файле.
const docTitle = (raw: string, file: string): string => {
  const m = raw.match(/^##[ \t]+(.+)$/m)
  if (m) return m[1].trim()
  return file.replace(/\.md$/i, '').replace(/[-_]+/g, ' ')
}

/** Страницы в порядке meta.json — список для гамбургер-меню. */
export const pages: PageDef[] = (meta.pages ?? []).map((p) => {
  const raw = files[p.file] ?? ''
  const id = fileSlug(p.file)
  return {
    id,
    title: p.title ?? docTitle(raw, p.file),
    blocks: parsePage(raw, id)
  }
})

/** То же, что pages, для навигации. */
export const navPages: PageDef[] = pages

export const pageById = (id: string): PageDef | undefined =>
  pages.find((p) => p.id === id)

/** TOC страницы: разделы с подблоками (id — якоря для скролла). */
export const tocSections = (id: string): Section[] =>
  pageById(id)?.blocks.sections ?? []

// Кросс-ссылка в md: id страницы, её название или <имя>.md -> #/<id>.
export const resolvePage = (href: string): string | undefined => {
  const raw = href
    .replace(/^#\//, '')
    .replace(/^\//, '')
    .replace(/\.md$/i, '')
  const lower = raw.toLowerCase()
  const byId = pages.find((p) => p.id === lower)
  if (byId) return byId.id
  return pages.find((p) => p.title.toLowerCase() === lower)?.id
}

// Куда ведёт CTA: на страницу, на раздел-якорь, наружу —
// или не распознано.
export type LinkTarget =
  | { kind: 'page'; id: string }
  | { kind: 'section'; pageId: string; id: string }
  | { kind: 'external'; href: string }
  | { kind: 'unknown'; href: string }

export const resolveLink = (href: string): LinkTarget => {
  if (/^(https?:|mailto:|tel:)/i.test(href)) return { kind: 'external', href }
  const lower = href
    .replace(/^#\//, '')
    .replace(/^\//, '')
    .replace(/\.md$/i, '')
    .toLowerCase()
  const byId = pages.find((p) => p.id === lower)
  if (byId) return { kind: 'page', id: byId.id }
  const byTitle = pages.find((p) => p.title.toLowerCase() === lower)
  if (byTitle) return { kind: 'page', id: byTitle.id }
  for (const p of pages)
    for (const s of p.blocks.sections)
      if (s.heading.toLowerCase() === lower)
        return { kind: 'section', pageId: p.id, id: s.id }
  return { kind: 'unknown', href }
}
