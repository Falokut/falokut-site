// Универсальная «пасхалка-модалка»: крупный анимированный эмодзи +
// заголовок + текст + кнопка. Закрытие — Esc, клик по фону или кнопка.
// Используется и для gopher, и для крысы.

import { useEffect, type ReactNode } from 'react'

export const Egg = ({
  open,
  onClose,
  emoji,
  anim,
  title,
  text
}: {
  open: boolean
  onClose: () => void
  emoji: string
  anim?: 'hop' | 'wiggle'
  title: string
  text: ReactNode
}) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="egg" onClick={onClose} role="presentation">
      <div className="egg-card" onClick={(e) => e.stopPropagation()}>
        <div
          className={`egg-emoji${anim ? ` ${anim}` : ''}`}
          aria-hidden="true"
        >
          {emoji}
        </div>
        <p className="egg-title">{title}</p>
        <p className="egg-text">{text}</p>
        <button type="button" className="btn primary" onClick={onClose}>
          продолжить
        </button>
      </div>
    </div>
  )
}
