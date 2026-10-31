// md-блок ```hero — лендинг: текстовая колонка (kicker, имя, lead, CTA,
// строка статуса) + живой терминал. Параметры задаются в
// content/index.md внутри блока:
//   строка 1 — kicker, строка 2 — имя, далее — строки lead;
//   cta: Название|id-страницы|url — кнопки (первая — primary);
//   meta: … — строка статуса с «зелёной точкой».
// **слово** в lead — акцентным цветом.

import { Fragment, useMemo, type ReactNode } from 'react'

import { resolvePage } from './data'
import { HeroTerminal } from './Terminal'
import { useStore } from './store'

type Cta = { label: string; href: string; external: boolean }
type HeroSpec = {
  kicker: string
  name: string
  lead: string[]
  ctas: Cta[]
  meta: string
}

const parseHero = (text: string): HeroSpec => {
  const lines = text.split('\n')
  const spec: HeroSpec = {
    kicker: lines[0]?.trim() ?? '',
    name: lines[1]?.trim() ?? '',
    lead: [],
    ctas: [],
    meta: ''
  }
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '') continue
    const cta = /^cta:\s*(.+?)\s*\|\s*(.+)$/.exec(line)
    if (cta) {
      const target = cta[2].trim()
      const external = /^(https?:|mailto:|tel:)/i.test(target)
      const page = external ? undefined : resolvePage(target)
      spec.ctas.push({
        label: cta[1].trim(),
        href: external ? target : `#/${page ?? target}`,
        external
      })
      continue
    }
    const meta = /^meta:\s*(.+)$/.exec(line)
    if (meta) {
      spec.meta = meta[1].trim()
      continue
    }
    spec.lead.push(line)
  }
  return spec
}

// **слово** в строке — акцент.
const renderEmphasis = (line: string): ReactNode[] => {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index))
    parts.push(
      <span key={m.index} className="accent">
        {m[1]}
      </span>
    )
    last = m.index + m[0].length
  }
  if (last < line.length) parts.push(line.slice(last))
  return parts
}

export const HeroBlock = ({ content }: { content: string }) => {
  const { setEgg } = useStore()
  const spec = useMemo(() => parseHero(content), [content])
  return (
    <div className="hero">
      <div className="hero-text">
        <p className="kicker">{spec.kicker}</p>
        <h1>{spec.name}</h1>
        <p className="lead">
          {spec.lead.map((l, i) => (
            <Fragment key={i}>
              {i > 0 ? <br /> : null}
              {renderEmphasis(l)}
            </Fragment>
          ))}
        </p>
        {spec.ctas.length > 0 ? (
          <div className="cta">
            {spec.ctas.map((c, i) => (
              <a
                key={c.label}
                className={`btn ${i === 0 ? 'primary' : 'ghost'}`}
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {c.label}
              </a>
            ))}
          </div>
        ) : null}
        {spec.meta !== '' ? (
          <p className="hero-meta">
            <span className="dot"></span> {spec.meta}
          </p>
        ) : null}
      </div>
      <HeroTerminal onGopher={() => setEgg('gopher')} />
    </div>
  )
}
