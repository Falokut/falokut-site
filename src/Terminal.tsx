// «Терминал» в hero: сначала печатает команды, затем становится живым —
// по клику фокусируется и принимает ввод. Команда gopher открывает
// пасхалку; есть также clear / help / whoami, остальное — not found.

import { useEffect, useRef, useState } from 'react'

type Line = { text: string; prompt?: boolean; ok?: boolean; dim?: boolean }

const LINES: Line[] = [
  { prompt: true, text: 'whoami' },
  { text: 'timur' },
  { prompt: true, text: 'cat stack.txt' },
  { text: 'go · postgresql · kafka · prometheus' },
  { prompt: true, text: 'go build ./...' },
  { text: '✓ compiled in 1.2s', ok: true },
  { text: '# терминал живой — введи команду', dim: true }
]

const HELP = 'команды: gopher · clear · cls · help · whoami'

// Сколько строк истории держать: окно фиксированное, лишние строки
// уходят в скролл и не «пухнут».
const MAX_HISTORY = 12

type Pos = { line: number; char: number }

export const HeroTerminal = ({ onGopher }: { onGopher: () => void }) => {
  const [pos, setPos] = useState<Pos>({ line: 0, char: 0 })
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<Line[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)
  const done = pos.line >= LINES.length

  // Авто-набор: печать команд со случайной для человека интонацией.
  useEffect(() => {
    if (done) return
    const line = LINES[pos.line]
    const finished = pos.char >= line.text.length
    const delay = finished ? 420 : line.prompt ? 320 : 42
    const t = window.setTimeout(() => {
      setPos((p) =>
        finished
          ? { line: p.line + 1, char: 0 }
          : { line: p.line, char: p.char + 1 }
      )
    }, delay)
    return () => window.clearTimeout(t)
  }, [pos, done])

  // Окно фиксированное: новые строки — вниз, всегда на последнем.
  useEffect(() => {
    const el = bodyRef.current
    if (el !== null) el.scrollTop = el.scrollHeight
  }, [pos, history, input, done])

  // Выполнение введённой команды (только когда набор дописан).
  const runCommand = (raw: string) => {
    const cmd = raw.trim()
    setInput('')
    if (cmd === '') return
    const out: Line[] = [{ prompt: true, text: cmd }]
    switch (cmd) {
      case 'gopher':
        out.push({ text: 'gopher found 🐹', ok: true })
        setHistory((h) => [...h, ...out].slice(-MAX_HISTORY))
        onGopher()
        break
      case 'clear':
      case 'cls':
      case 'clean':
        setHistory([])
        break
      case 'help':
      case '?':
        out.push({ text: HELP, dim: true })
        setHistory((h) => [...h, ...out].slice(-MAX_HISTORY))
        break
      case 'whoami':
        out.push({ text: 'timur' })
        setHistory((h) => [...h, ...out].slice(-MAX_HISTORY))
        break
      default:
        out.push({ text: `bash: ${cmd}: command not found`, dim: true })
        setHistory((h) => [...h, ...out].slice(-MAX_HISTORY))
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!done || document.activeElement !== bodyRef.current) return
    if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(input)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      setInput((s) => s.slice(0, -1))
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      setInput((s) => s + e.key)
    }
  }

  const lineClass = (l: Line) =>
    l.ok ? 'ok' : l.dim ? 'dim' : undefined

  return (
    <div className="term">
      <div className="term-bar">
        <span className="t-dot red"></span>
        <span className="t-dot yellow"></span>
        <span className="t-dot green"></span>
        <em>{done ? 'bash — живой' : 'bash — 80×24'}</em>
      </div>
      <div
        className="term-body"
        ref={bodyRef}
        tabIndex={done ? 0 : -1}
        aria-label="Интерактивный терминал: введи команду"
        onKeyDown={onKeyDown}
      >
        {LINES.map((l, i) => {
          if (!done && i > pos.line) return null
          const full = done || i < pos.line
          const isTyping = !done && i === pos.line
          const text = full || !isTyping ? l.text : l.text.slice(0, pos.char)
          return (
            <p key={i} className={lineClass(l)}>
              {l.prompt ? <span className="prompt">$</span> : null}
              {text}
              {isTyping ? <span className="cursor"></span> : null}
            </p>
          )
        })}
        {done ? (
          <>
            {history.map((l, i) => (
              <p key={`h-${i}`} className={lineClass(l)}>
                {l.prompt ? <span className="prompt">$</span> : null}
                {l.text}
              </p>
            ))}
            <p>
              <span className="prompt">$</span>{' '}
              <span>{input}</span>
              <span className="cursor"></span>
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}
