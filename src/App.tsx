// falokut.ru — одностраничная визитка. Один md-файл в content/ = один
// раздел; все разделы — на одной странице (порядок — content/meta.json).
// Логика — как в polygon-docs-ui: дерево «документов» (разделов) — в
// верхнем нав-баре, TOC — только подзаголовки ТЕКУЩЕГО раздела, в
// ненавязчивом правом сайдбаре. Контент вшивается в бандл при сборке
// через import.meta.glob, порядок разделов — content/meta.json,
// кросс-ссылки между разделами — прямо в markdown ([раздел](file.md)).

import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { GopherEgg } from './GopherEgg'
import { HeroTerminal } from './Terminal'
import { Markdown, type MarkdownComponents } from './Markdown'
import { allDocFiles, buildTree, dirMeta, docFiles } from './docsTree'
import { Statusbar } from './Statusbar'

type Section = {
  id: string
  title: string
  body: string
}

type Block = {
  heading: string | null
  id: string | null
  text: string
}

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .trim()
    .replace(/\s+/g, '-')

const fileSlug = (key: string): string =>
  key.replace(/\.md$/i, '').replace(/[-_]+/g, '-').toLowerCase()

// Разделы: файлы дерева в порядке meta.json; body — без title
// (первого «## …»).
const buildSections = (): Section[] =>
  buildTree(allDocFiles)
    .filter((n) => n.kind === 'file')
    .map((n) => ({
      id: fileSlug(n.key),
      title: n.title,
      body: (docFiles[n.key] ?? '').replace(/^##[^\n]*\n/, '')
    }))

// Разбивка body на блоки по «## …» (вне блоков кода): заголовок идёт к
// тексту, который СЛЕДУЕТ за ним; id блока — `<раздел>-<slug>`, уникален
// на всю страницу и совпадает с TOC.
const splitBlocks = (body: string, baseId: string): Block[] => {
  const blocks: Block[] = []
  let buf: string[] = []
  let inCode = false
  let curHeading: string | null = null
  let curId: string | null = null
  const flush = () => {
    const text = buf.join('\n').trim()
    buf = []
    if (text === '') return
    blocks.push({ heading: curHeading, id: curId, text })
  }
  for (const line of body.split('\n')) {
    if (line.trimStart().startsWith('```')) inCode = !inCode
    const m = inCode ? null : line.match(/^##\s+(.*)$/)
    if (m) {
      flush()
      curHeading = m[1]
      curId = `${baseId}-${slugify(curHeading)}`
      continue
    }
    buf.push(line)
  }
  flush()
  return blocks
}

// Кросс-ссылка в markdown: путь к .md (относительный или абсолютный от
// корня content/, с «../») -> id раздела, на который скроллить.
const resolveSection = (href: string): string | undefined => {
  const raw = href.startsWith('/') ? href.slice(1) : href
  const parts = raw.split('/').filter((p) => p !== '' && p !== '.')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') {
      out.pop()
      continue
    }
    out.push(p)
  }
  const key = out.join('/')
  if (docFiles[key] === undefined) return undefined
  return fileSlug(key)
}

const App = () => {
  const sections = useMemo(buildSections, [])
  const bySection = useMemo(() => {
    const m = new Map<string, Block[]>()
    for (const s of sections) m.set(s.id, splitBlocks(s.body, s.id))
    return m
  }, [sections])
  const rootMeta = dirMeta('')

  const [active, setActive] = useState(sections[0]?.id ?? '')

  // TOC: подзаголовки активного раздела (сам раздел — это уже nav).
  const toc = useMemo(() => {
    const blocks = bySection.get(active) ?? []
    return blocks
      .filter((b) => b.heading !== null && b.id !== null)
      .map((b) => ({ id: b.id as string, title: b.heading as string }))
  }, [bySection, active])

  // Scroll-spy: активный раздел — тот, что пересекает середину экрана.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-35% 0px -55% 0px' }
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [sections])

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Ссылки: путь к .md — анкер на раздел (переход с плавным скроллом);
  // «#якорь» — как есть; внешние — в новой вкладке.
  const components: MarkdownComponents = {
    a: (props) => {
      const {
        node,
        href,
        children,
        ...rest
      } = props as {
        node?: unknown
        href?: string
        children?: ReactNode
      } & Record<string, unknown>
      const external =
        typeof href === 'string' && /^(https?:|mailto:|tel:)/i.test(href)
      let finalHref = href
      if (typeof href === 'string' && !external && !href.startsWith('#')) {
        const id = resolveSection(href)
        if (id !== undefined) finalHref = `#${id}`
      }
      return (
        <a
          href={finalHref}
          {...rest}
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {children}
        </a>
      )
    }
  }

  return (
    <div className="page">
      <GopherEgg />

      <header className="nav">
        <div className="nav-inner">
          <a className="logo" href={`#${sections[0]?.id ?? 'top'}`}>
            {rootMeta.title ?? 'falokut'}
          </a>
          <nav className="nav-links">
            {sections.map((s) => (
              <a
                key={s.id}
                className={active === s.id ? 'active' : undefined}
                href={`#${s.id}`}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="layout">
        <main className="content" id="top">
          <section className="hero">
            <div className="hero-text">
              <p className="kicker">// привет</p>
              <h1>Timur</h1>
              <p className="lead">
                Go <span className="accent">backend</span>-разработчик.
                <br />
                Строю микросервисы и распределённые системы —
                <br />
                надёжные, наблюдаемые и приятные в работе.
              </p>
              <div className="cta">
                <a className="btn primary" href="#projects">
                  Проекты
                </a>
                <a className="btn ghost" href="#contacts">
                  Связаться
                </a>
              </div>
              <p className="hero-meta">
                <span className="dot"></span> Saint-Petersburg · Go ·
                PostgreSQL · распределённые системы
              </p>
            </div>
            <HeroTerminal />
          </section>

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="section">
              <h2 className="h2">
                <span className="h2-index">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              {(bySection.get(s.id) ?? []).map((b, j) => (
                <div key={j} className="block" id={b.id ?? undefined}>
                  {b.heading !== null ? (
                    <h3 className="h3">{b.heading}</h3>
                  ) : null}
                  <Markdown text={b.text} extraComponents={components} />
                </div>
              ))}
            </section>
          ))}
        </main>

        <aside className="toc">
          {toc.length > 0 ? (
            <>
              <div className="section-label">Содержание</div>
              {toc.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="toc-item"
                  onClick={() => scrollToId(item.id)}
                >
                  {item.title}
                </button>
              ))}
            </>
          ) : null}
        </aside>
      </div>

      <Statusbar />
    </div>
  )
}

export default App
