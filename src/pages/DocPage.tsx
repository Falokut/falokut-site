// Универсальная md-страница: разделы из content/<файл>.md.
// hero-фенс в преамбуле — лендинг (рисуется перед разделами, без
// h2 над ним); «## …» — раздел (h2 + номер); «### …» — подблок (h3);
// игровой фенс (```ttt/```2048/```memory/```chess) — сама игра.

import { type ReactNode } from 'react'

import { ChessGame } from '../ChessGame'
import { Game2048 } from '../Game2048'
import { GameMemory } from '../GameMemory'
import { HeroBlock } from '../HeroBlock'
import { pageById, resolvePage, type GameId } from '../data'
import { Markdown, type MarkdownComponents } from '../Markdown'
import { TicTacToe } from '../TicTacToe'

// Ссылки в md: внешние — в новой вкладке; id/название страницы или
// путь к .md — переход на страницу #/<id>.
const linkComponents: MarkdownComponents = {
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
      const id = resolvePage(href)
      if (id !== undefined) finalHref = `#/${id}`
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

const md = (text: string): ReactNode => (
  <Markdown text={text} extraComponents={linkComponents} />
)

const renderGame = (game: GameId): ReactNode =>
  game === 'ttt' ? (
    <TicTacToe />
  ) : game === '2048' ? (
    <Game2048 />
  ) : game === 'chess' ? (
    <ChessGame />
  ) : (
    <GameMemory />
  )

export const DocPage = ({ id }: { id: string }) => {
  const page = pageById(id)
  if (!page) return null
  const { hero, sections } = page.blocks
  return (
    <section id={id} className={`section${hero !== null ? ' hero-page' : ''}`}>
      {hero !== null ? <HeroBlock content={hero} /> : null}
      {sections.map((s, i) => (
        <div key={s.id} className="block sec" id={s.id}>
          <h2 className="h2">
            <span className="h2-index">
              {String(i + 1).padStart(2, '0')}
            </span>
            {s.heading}
          </h2>
          {s.intro !== '' ? md(s.intro) : null}
          {s.subs.map((sub) => (
            <div key={sub.id} className="block" id={sub.id}>
              <h3 className="h3">{sub.heading}</h3>
              {md(sub.text)}
            </div>
          ))}
          {s.game !== null ? renderGame(s.game) : null}
        </div>
      ))}
    </section>
  )
}
