// Пасхалка: набери «gopher» где угодно на странице (каждая буква
// с клавиатуры считается) — появится gopher. Закрытие — Esc или клик.

import { useEffect, useRef, useState } from 'react'

const GOOPHER = [
  '    .--.',
  '   |o_o |',
  '   |:_/ |',
  '  //   \\ \\',
  ' (|     | )',
  "/'\\_   _/`\\",
  '\\___)=(___/'
].join('\n')

export const GopherEgg = () => {
  const [open, setOpen] = useState(false)
  const buffer = useRef('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-8)
      if (buffer.current.includes('gopher')) {
        buffer.current = ''
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  return (
    <div className="egg" onClick={() => setOpen(false)} role="presentation">
      <div className="egg-card" onClick={(e) => e.stopPropagation()}>
        <pre className="egg-gopher">{GOOPHER}</pre>
        <p className="egg-title">Gopher found!</p>
        <p className="egg-text">
          // Ты нашёл пасхалку. Gopher доволен.
          <br />
          // Esc — закрыть.
        </p>
        <button type="button" className="btn primary" onClick={() => setOpen(false)}>
          продолжить
        </button>
      </div>
    </div>
  )
}
