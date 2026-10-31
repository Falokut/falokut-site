// Шахматы против Stockfish (lite, WASM, web worker): правила —
// chess.js, ходы — UCI-протокол через chessEngine. Игрок ходит
// кликами (фигура → клетка), движок отвечает с короткой паузой.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess, type Color, type Move, type Square } from 'chess.js'

import {
  ENGINE_LEVELS,
  engineBestMove,
  ensureEngine,
  setEvalListener
} from './chessEngine'

// Заполненные глифы для обоих цветов — цвет даёт CSS.
const GLYPH: Record<string, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟'
}
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

type GameOver = { title: string; text: string }

const opponent = (c: Color): Color => (c === 'w' ? 'b' : 'w')

/** Строка оценки: cp (от лица белых, ×100) или мат. */
const evalText = (s: number): string => {
  if (Math.abs(s) >= 100000) {
    const n = Math.abs(s) - 100000
    return `${s < 0 ? '−' : ''}M${n}`
  }
  return `${s < 0 ? '−' : '+'}${Math.abs(s).toFixed(2)}`
}

export const ChessGame = () => {
  const chessRef = useRef<Chess | null>(null)
  if (chessRef.current === null) chessRef.current = new Chess()
  const chess = chessRef.current

  const [playerColor, setPlayerColor] = useState<Color>('w')
  const [fen, setFen] = useState(() => chess.fen())
  const [turn, setTurn] = useState<Color>('w')
  const [selected, setSelected] = useState<string | null>(null)
  const [legal, setLegal] = useState<Move[]>([])
  const [thinking, setThinking] = useState(false)
  const [evalScore, setEvalScore] = useState<number | null>(null)
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null
  )
  const [over, setOver] = useState<GameOver | null>(null)
  const [levelIdx, setLevelIdx] = useState(1)
  // Генерация партии: старый ответ движка не попадает в новую партию.
  const genRef = useRef(0)

  // Предзагрузка WASM-движка (1.8MB) при открытии страницы: первый
  // ход не ждёт загрузки.
  useEffect(() => {
    void ensureEngine()
  }, [])

  const describeOver = useCallback((): GameOver => {
    const ec = opponent(playerColor)
    if (chess.isCheckmate())
      return chess.turn() === ec
        ? { title: 'Мат', text: 'Победа — Stockfish сдаётся 🎉' }
        : { title: 'Мат', text: 'Stockfish победил.' }
    if (chess.isStalemate())
      return { title: 'Пат', text: 'Ничья: ходов нет, но мата нет.' }
    return {
      title: 'Ничья',
      text: 'Тройное повторение, материала не хватает или 50 ходов.'
    }
  }, [chess, playerColor])

  // Синхронизация UI с положением; rethink — запустить ход движка.
  // color передаём явно, а не из замыкания: newGame() меняет
  // playerColor через setState, и в этом же вызове state ещё старый.
  const resync = useCallback(
    (rethink: boolean, color: Color) => {
      setFen(chess.fen())
      setTurn(chess.turn())
      setSelected(null)
      setLegal([])
      setEvalScore(null)
      const hist = chess.history({ verbose: true })
      const last = hist.length > 0 ? hist[hist.length - 1] : undefined
      setLastMove(
        last !== undefined ? { from: last.from, to: last.to } : null
      )
      if (chess.isGameOver()) {
        setThinking(false)
        setOver(describeOver())
        return
      }
      if (rethink && chess.turn() !== color) {
        setThinking(true)
        const gen = ++genRef.current
        window.setTimeout(() => {
          if (genRef.current !== gen) return
          void engineBestMove(chess.fen(), ENGINE_LEVELS[levelIdx]).then(
            (token) => {
              if (genRef.current !== gen) return
              if (token === null) {
                setThinking(false)
                setOver({
                  title: 'Движок молчит',
                  text: 'Stockfish не ответил за минуту. Заново.'
                })
                return
              }
              try {
                chess.move({
                  from: token.slice(0, 2),
                  to: token.slice(2, 4),
                  promotion: token.length > 4 ? token[4] : 'q'
                })
              } catch {
                setThinking(false)
                setOver({
                  title: 'Странный ход',
                  text: 'Движок предложил нелегальный ход. Заново.'
                })
                return
              }
              resync(true, color)
            }
          )
        }, 350)
      } else {
        setThinking(false)
      }
    },
    [chess, describeOver, levelIdx]
  )

  useEffect(() => {
    setEvalListener((s) => setEvalScore(s))
    return () => setEvalListener(null)
  }, [])

  // Игрок: фигура → клетка. Промоция — сразу ладья.
  const onSquare = (sq: string) => {
    if (over !== null || thinking || turn !== playerColor) return
    if (selected !== null) {
      const mv = legal.find((m) => m.to === sq)
      if (mv !== undefined) {
        chess.move({ from: mv.from, to: mv.to, promotion: 'q' })
        resync(true, playerColor)
        return
      }
    }
    const piece = chess.get(sq as Square)
    if (piece !== undefined && piece.color === playerColor) {
      setSelected(sq)
      setLegal(chess.moves({ square: sq as Square, verbose: true }))
      return
    }
    setSelected(null)
    setLegal([])
  }

  const newGame = (color: Color) => {
    genRef.current += 1
    chess.reset()
    setPlayerColor(color)
    setOver(null)
    setLastMove(null)
    // color — явно: setPlayerColor ещё не применён в этом вызове.
    resync(true, color)
  }

  const takeBack = () => {
    if (thinking) return
    genRef.current += 1
    chess.undo()
    // Вернуть ход и ответ движка: позиция снова за игроком.
    if (chess.turn() !== playerColor && chess.history().length > 0)
      chess.undo()
    resync(true, playerColor)
  }

  // Ориентация доски: у игрока всегда «свои» фигуры внизу.
  const rows = playerColor === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
  const cols =
    playerColor === 'w' ? FILES : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
  const board = chess.board()
  const inCheck = chess.inCheck()
  let checkSquare: string | null = null
  if (inCheck) {
    for (const row of board)
      for (const cell of row)
        if (
          cell !== null &&
          cell.type === 'k' &&
          cell.color === turn
        )
          checkSquare = cell.square
  }

  const moves = chess.history()
  const pairs: Array<[string, string]> = []
  for (let i = 0; i < moves.length; i += 2)
    pairs.push([moves[i], moves[i + 1] ?? ''])

  const status =
    over !== null
      ? over.title
      : thinking
        ? 'Stockfish думает…'
        : `${chess.turn() === 'w' ? 'Белые' : 'Чёрные'} — ваш ход${
            inCheck ? ' · шах!' : ''
          }`

  return (
    <div className="chess">
      <div className="chess-top">
        <span className={`chess-eval${thinking ? ' live' : ''}`}>
          {evalScore !== null ? `оценка ${evalText(evalScore)}` : 'оценка —'}
        </span>
        <span className="chess-status">{status}</span>
        <select
          className="chess-select"
          value={levelIdx}
          onChange={(e) => setLevelIdx(Number(e.target.value))}
          aria-label="Сила Stockfish"
        >
          {ENGINE_LEVELS.map((l, i) => (
            <option key={l.label} value={i}>
              {l.label} · ~{l.elo}
            </option>
          ))}
        </select>
      </div>
      <div className="chess-board-wrap">
        <div className="chess-board-frame">
          <div
            className="chess-board"
            role="grid"
            aria-label="Доска 8×8"
            data-fen={fen}
          >
            {rows.map((rank, ri) =>
              cols.map((file, ci) => {
                const sq = `${file}${rank}`
                const cell = board[8 - rank][FILES.indexOf(file)]
                const isLast =
                  lastMove !== null &&
                  (lastMove.from === sq || lastMove.to === sq)
                const isTarget = legal.some((m) => m.to === sq)
                const cls = [
                  ri + ci % 2 === 0 ? 'light' : 'dark',
                  isLast ? 'last' : '',
                  selected === sq ? 'sel' : '',
                  isTarget ? 'target' : '',
                  checkSquare === sq ? 'check' : ''
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <button
                    type="button"
                    key={sq}
                    className={`chess-sq ${cls}`}
                    onClick={() => onSquare(sq)}
                    aria-label={sq}
                  >
                    {cell !== null ? (
                      <span
                        className={`chess-pc ${
                          cell.color === 'w' ? 'pw' : 'pb'
                        }`}
                      >
                        {GLYPH[cell.type]}
                      </span>
                    ) : null}
                    {ci === 0 ? (
                      <i className="coord rank">{rank}</i>
                    ) : null}
                    {ri === 7 ? (
                      <i className="coord file">{file}</i>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
          {over !== null ? (
            <div className="chess-overlay">
              <p className="chess-over-title">{over.title}</p>
              <p>{over.text}</p>
              <button
                type="button"
                className="btn primary"
                onClick={() => newGame(playerColor)}
              >
                Снова
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="chess-moves">
        {pairs.length === 0 ? (
          <span className="dim">Ходов пока нет.</span>
        ) : (
          pairs.map(([w, b], i) => (
            <span key={i} className="chess-move-pair">
              <em>{i + 1}.</em>
              <b>{w}</b>
              {b !== '' ? <b>{b}</b> : <span className="dim">·</span>}
            </span>
          ))
        )}
      </div>
      <div className="chess-ctrl">
        <div className="chess-colors" role="group" aria-label="Цвет">
          <button
            type="button"
            className={`btn ghost${playerColor === 'w' ? ' active' : ''}`}
            onClick={() => newGame('w')}
          >
            ♙ Белые
          </button>
          <button
            type="button"
            className={`btn ghost${playerColor === 'b' ? ' active' : ''}`}
            onClick={() => newGame('b')}
          >
            ♟ Чёрные
          </button>
        </div>
        <div className="chess-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => newGame(playerColor)}
          >
            Заново
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={takeBack}
            disabled={moves.length === 0 || thinking}
          >
            Вернуть ход
          </button>
        </div>
      </div>
      <p className="chess-hint dim">
        Клик — фигура, клик — клетка. Промоция: пешка сразу становится
        ферзем. Движок — Stockfish 19 (lite, WASM), ходит в web worker.
      </p>
    </div>
  )
}
