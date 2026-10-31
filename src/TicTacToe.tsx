// Крестики-нолики против Gopher (minimax — непобедимый). Игрок — X и
// ходит первым; счёт копится между партиями, «Новая партия» сбрасывает
// только доску, «Сбросить счёт» — и счёт тоже.

import { useEffect, useState } from 'react'

type Cell = '' | 'X' | 'O'
type Board = Cell[]

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
] as const

const WINNER = (b: Board): Cell | 'draw' | null => {
  for (const [a, c, d] of LINES) {
    if (b[a] !== '' && b[a] === b[c] && b[a] === b[d]) return b[a]
  }
  return b.every((x) => x !== '') ? 'draw' : null
}

// Оценка — с точки зрения O (Gopher): O-ход максимизирует, X-ход —
// минимизирует (без чередования Gopher легко проигрывал).
const MINIMAX = (b: Board, player: Cell): number => {
  const w = WINNER(b)
  if (w === 'O') return 1
  if (w === 'X') return -1
  if (w === 'draw') return 0
  const maximizing = player === 'O'
  let best = maximizing ? -Infinity : Infinity
  for (let i = 0; i < 9; i++) {
    if (b[i] === '') {
      b[i] = player
      const s = MINIMAX(b, player === 'O' ? 'X' : 'O')
      b[i] = ''
      if (maximizing ? s > best : s < best) best = s
    }
  }
  return best
}

// Лучший ход для O: среди равных по minimax выбираем случайно — так
// Gopher не предсказуем и партия не выглядит одинаково.
const bestMove = (b: Board): number => {
  let best = -Infinity
  let moves: number[] = []
  for (let i = 0; i < 9; i++) {
    if (b[i] === '') {
      b[i] = 'O'
      const s = MINIMAX(b, 'X')
      b[i] = ''
      if (s > best) {
        best = s
        moves = [i]
      } else if (s === best) {
        moves.push(i)
      }
    }
  }
  return moves[Math.floor(Math.random() * moves.length)]
}

const emptyBoard = (): Board => Array<Cell>(9).fill('')

export const TicTacToe = () => {
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [thinking, setThinking] = useState(false)
  const [scores, setScores] = useState({ x: 0, o: 0, d: 0 })

  const result = WINNER(board)
  const over = result !== null
  const countX = board.filter((c) => c === 'X').length
  const countO = board.filter((c) => c === 'O').length
  const myTurn = countX === countO && !over

  // Gopher ходит, когда крестиков на одну клетку больше ноликов.
  useEffect(() => {
    if (over || countX !== countO + 1) return
    setThinking(true)
    const t = window.setTimeout(() => {
      const nb = [...board]
      nb[bestMove(nb)] = 'O'
      setBoard(nb)
      setThinking(false)
    }, 450)
    return () => window.clearTimeout(t)
  }, [board, over, countX, countO])

  // Счёт: результат меняется только в момент победы/ничьей.
  useEffect(() => {
    if (result === 'X') setScores((s) => ({ ...s, x: s.x + 1 }))
    else if (result === 'O') setScores((s) => ({ ...s, o: s.o + 1 }))
    else if (result === 'draw') setScores((s) => ({ ...s, d: s.d + 1 }))
  }, [result])

  const play = (i: number) => {
    if (!myTurn || board[i] !== '') return
    const nb = [...board]
    nb[i] = 'X'
    setBoard(nb)
  }

  const status =
    result === 'X'
      ? 'Ты выиграл!'
      : result === 'O'
        ? 'Gopher победил 🐹'
        : result === 'draw'
          ? 'Ничья'
          : thinking
            ? 'Gopher думает…'
            : 'Ход: ты (X)'

  return (
    <div className="ttt">
      <div className="ttt-scores">
        <span className="ttt-score">
          Ты <b>X</b> · {scores.x}
        </span>
        <span className="ttt-score dim">Ничьи · {scores.d}</span>
        <span className="ttt-score">
          Gopher <b>O</b> · {scores.o}
        </span>
      </div>
      <div className="ttt-board" aria-label="Игровое поле 3 на 3">
        {board.map((c, i) => (
          <button
            key={i}
            type="button"
            className={`ttt-cell${c === 'X' ? ' x' : ''}${
              c === 'O' ? ' o' : ''
            }`}
            onClick={() => play(i)}
            disabled={!myTurn || c !== ''}
            aria-label={`Клетка ${i + 1}${c !== '' ? `, ${c}` : ', пусто'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <p
        className={`ttt-status${
          result === 'X' ? ' win' : result === 'O' ? ' lose' : ''
        }`}
      >
        {status}
      </p>
      <div className="ttt-actions">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setBoard(emptyBoard())
            setThinking(false)
          }}
        >
          Новая партия
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setScores({ x: 0, o: 0, d: 0 })}
        >
          Сбросить счёт
        </button>
      </div>
    </div>
  )
}
