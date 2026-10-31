// Мемори: 4×4, 8 пар символов. Кликаешь две карты — совпали остаются,
// нет — переворачиваются обратно. Цель — найти все пары за минимум ходов.

import { useState } from 'react'

const SYMBOLS = ['🐹', '🐭', '🐢', '🦊', '🐸', '🦉', '🐞', '🐠']

type Card = { id: number; symbol: string; matched: boolean }

const makeCards = (): Card[] => {
  const doubled = [...SYMBOLS, ...SYMBOLS]
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[doubled[i], doubled[j]] = [doubled[j], doubled[i]]
  }
  return doubled.map((symbol, i) => ({ id: i, symbol, matched: false }))
}

export const GameMemory = () => {
  const [cards, setCards] = useState<Card[]>(makeCards)
  const [open, setOpen] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)

  const allMatched = cards.every((c) => c.matched)
  const pairs = cards.filter((c) => c.matched).length / 2

  const flip = (i: number) => {
    if (lock || allMatched || cards[i].matched || open.includes(i)) return
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return
    setMoves((m) => m + 1)
    const [a, b] = next
    if (cards[a].symbol === cards[b].symbol) {
      setCards((cs) =>
        cs.map((c, idx) =>
          idx === a || idx === b ? { ...c, matched: true } : c
        )
      )
      setOpen([])
    } else {
      setLock(true)
      window.setTimeout(() => {
        setOpen([])
        setLock(false)
      }, 700)
    }
  }

  const reset = () => {
    setCards(makeCards())
    setOpen([])
    setMoves(0)
    setLock(false)
  }

  return (
    <div className="memory">
      <div className="memory-score">
        <span>Ходы · {moves}</span>
        <span>
          Пары · {pairs}/{SYMBOLS.length}
        </span>
      </div>
      <div className="memory-board">
        {cards.map((c, i) => {
          const shown = c.matched || open.includes(i)
          return (
            <button
              key={c.id}
              type="button"
              className={`mem-card${shown ? ' shown' : ''}${
                c.matched ? ' matched' : ''
              }`}
              onClick={() => flip(i)}
              aria-label={shown ? c.symbol : 'Скрытая карта'}
            >
              <span className="mem-face">{shown ? c.symbol : '?'}</span>
            </button>
          )
        })}
      </div>
      {allMatched ? (
        <p className="memory-win">Нашёл все пары за {moves} ходов! 🎉</p>
      ) : null}
      <button type="button" className="btn ghost memory-reset" onClick={reset}>
        Заново
      </button>
    </div>
  )
}
