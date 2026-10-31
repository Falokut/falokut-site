// falokut.ru — визитка. Логика контента — как в polygon-docs-ui:
// один файл в content/ = один документ, выбор — по hash (#/doc/<path>),
// дерево документов — в верхнем нав-баре, TOC («Содержание») — в
// ненавязчивом правом сайдбаре, кросс-ссылки между документами в md.
// На дефолтном документе — hero с «терминалом».

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react'

import { GopherEgg } from './GopherEgg'
import { HeroTerminal } from './Terminal'
import { Markdown, type MarkdownComponents } from './Markdown'
import {
  allDocFiles,
  buildTree,
  defaultDoc,
  dirMeta,
  docFiles,
  type DocsNode
} from './docsTree'
import { Statusbar } from './Statusbar'

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .trim()
    .replace(/\s+/g, '-')

/** Текущий документ — из hash (#/doc/<path>), иначе дефолтный. */
const parseHash = (): string => {
  const d = window.location.hash.match(/^#\/doc\/(.+)$/)
  const path = d?.[1]
  if (path && docFiles[path] !== undefined) return path
  return defaultDoc
}

// Кросс-ссылка в markdown: относительный путь (от каталога текущего
// дока) или абсолютный (от корня content/) -> ключ в docFiles.
const resolveDocLink = (basePath: string, href: string): string => {
  const raw = href.startsWith('/') ? href.slice(1) : basePath + href
  const parts = raw.split('/').filter((p) => p !== '' && p !== '.')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') {
      out.pop()
      continue
    }
    out.push(p)
  }
  return out.join('/')
}

// Содержание документа: заголовки «## …» (вне блоков кода), первый
// заголовок — это title документа, в TOC не идёт.
const docToc = (path: string): { id: string; title: string }[] => {
  const items: { id: string; title: string }[] = []
  let inCode = false
  for (const line of (docFiles[path] ?? '').split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inCode = !inCode
      continue
    }
    if (inCode) continue
    const m = line.match(/^##\s+(.*)$/)
    if (m) items.push({ id: slugify(m[1]), title: m[1] })
  }
  return items.slice(1)
}

// Дерево документов в нав-баре: файлы — ссылки, директории — группы.
const NavTree = ({
  nodes,
  sel,
  onPick
}: {
  nodes: DocsNode[]
  sel: string
  onPick: (path: string) => void
}) => (
  <>
    {nodes.map((node) =>
      node.kind === 'file' ? (
        <a
          key={node.key}
          className={node.key === sel ? 'active' : undefined}
          href={`#/doc/${node.key}`}
          onClick={(e) => {
            e.preventDefault()
            onPick(node.key)
          }}
        >
          {node.title}
        </a>
      ) : (
        <span key={node.key} className="nav-group">
          <span className="nav-dir-label">{node.title}</span>
          <NavTree nodes={node.children ?? []} sel={sel} onPick={onPick} />
        </span>
      )
    )}
  </>
)

const Hero = ({ onPick }: { onPick: (path: string) => void }) => (
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
        <button type="button" className="btn primary" onClick={() => onPick('projects.md')}>
          Проекты
        </button>
        <button type="button" className="btn ghost" onClick={() => onPick('contacts.md')}>
          Связаться
        </button>
      </div>
      <p className="hero-meta">
        <span className="dot"></span> Saint-Petersburg · Go · PostgreSQL ·
        распределённые системы
      </p>
    </div>
    <HeroTerminal />
  </section>
)

const App = () => {
  const [sel, setSel] = useState<string>(parseHash)

  const tree = useMemo(() => buildTree(allDocFiles), [])
  const rootMeta = dirMeta('')
  const toc = useMemo(() => docToc(sel), [sel])

  useEffect(() => {
    const onHash = () => setSel(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goTo = (path: string) => {
    window.location.hash = `#/doc/${path}`
    setSel(path)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const isHome = sel === defaultDoc
  const body = (docFiles[sel] ?? '').replace(/^##[^\n]*\n/, '')

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const components: MarkdownComponents = {
    // Заголовки «## …» получают id — якоря для TOC и ссылок «#заголовок».
    h2: (props) => {
      const {
        node,
        children,
        ...rest
      } = props as {
        node?: { children?: { value?: string }[] }
        children?: ReactNode
      } & Record<string, unknown>
      const text = node?.children?.[0]?.value ?? ''
      return (
        <h2 id={slugify(text)} {...rest}>
          {children}
        </h2>
      )
    },
    // Ссылки: путь к .md — переход между документами; «#заголовок» —
    // скролл без смены hash; внешние — в новой вкладке.
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
      const onClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
        if (typeof href !== 'string' || href === '') return
        if (href.startsWith('#/')) return
        if (href.startsWith('#')) {
          e.preventDefault()
          document
            .getElementById(href.slice(1))
            ?.scrollIntoView({ behavior: 'smooth' })
          return
        }
        if (external) return
        const [rawPath, anchor] = href.split('#')
        const base = sel.replace(/[^/]*$/, '')
        const resolved = resolveDocLink(base, rawPath)
        if (docFiles[resolved] !== undefined) {
          e.preventDefault()
          goTo(resolved)
          if (anchor) {
            window.setTimeout(() => {
              document
                .getElementById(anchor)
                ?.scrollIntoView({ behavior: 'smooth' })
            }, 150)
          }
        }
      }
      return (
        <a
          href={href}
          onClick={onClick}
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
          <a
            className="logo"
            href={`#/doc/${defaultDoc}`}
            onClick={(e) => {
              e.preventDefault()
              goTo(defaultDoc)
            }}
          >
            {rootMeta.title ?? 'falokut'}
          </a>
          <nav className="nav-links">
            <NavTree nodes={tree} sel={sel} onPick={goTo} />
          </nav>
        </div>
      </header>

      <div className={`layout${toc.length > 0 ? ' toc-open' : ''}`}>
        <main className="content" id="top">
          {isHome ? <Hero onPick={goTo} /> : null}
          <section className="section">
            <article className="markdown">
              <Markdown text={body} extraComponents={components} />
            </article>
          </section>
        </main>
        {toc.length > 0 ? (
          <aside className="toc">
            <div className="section-label">Содержание</div>
            {toc.map((item) => (
              <button
                key={item.id}
                type="button"
                className="toc-item"
                onClick={() => scrollToHeading(item.id)}
              >
                {item.title}
              </button>
            ))}
          </aside>
        ) : null}
      </div>

      <Statusbar />
    </div>
  )
}

export default App
