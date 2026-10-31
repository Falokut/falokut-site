// «Терминал» в hero: печатает команды последовательно с курсором,
// в конце курсор мигает — как в настоящем шелле.

import { useEffect, useState } from 'react'

type Line = { text: string; prompt?: boolean; ok?: boolean }

const LINES: Line[] = [
  { prompt: true, text: 'whoami' },
  { text: 'timur' },
  { prompt: true, text: 'cat stack.txt' },
  { text: 'go · postgresql · kafka · prometheus' },
  { prompt: true, text: 'go build ./...' },
  { text: '✓ compiled in 1.2s', ok: true }
]

type Pos = { line: number; char: number }

export const HeroTerminal = () => {
  const [pos, setPos] = useState<Pos>({ line: 0, char: 0 })
  const done = pos.line >= LINES.length

  useEffect(() => {
    if (done) return
    const line = LINES[pos.line]
    const finished = pos.char >= line.text.length
    // Пауза перед командой с промптом — будто человек думает.
    const delay = finished ? 420 : line.prompt ? 320 : 42
    const t = window.setTimeout(() => {
      setPos((p) =>
        finished ? { line: p.line + 1, char: 0 } : { line: p.line, char: p.char + 1 }
      )
    }, delay)
    return () => window.clearTimeout(t)
  }, [pos, done])

  return (
    <div className="term" aria-hidden="true">
      <div className="term-bar">
        <span className="t-dot red"></span>
        <span className="t-dot yellow"></span>
        <span className="t-dot green"></span>
        <em>bash — 80×24</em>
      </div>
      <div className="term-body">
        {LINES.map((l, i) => {
          if (i > pos.line) return null
          const full = i < pos.line
          const isTyping = i === pos.line && !done
          const text = full || !isTyping ? l.text : l.text.slice(0, pos.char)
          return (
            <p key={i} className={l.ok ? 'ok' : undefined}>
              {l.prompt ? <span className="prompt">$</span> : null}
              {text}
              {isTyping ? <span className="cursor"></span> : null}
            </p>
          )
        })}
        {done ? (
          <p>
            <span className="prompt">$</span> <span className="cursor"></span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
