// 2048: 4×4, стрелки двигают плитки, одинаковые сливаются. Цел — 2048.
// Палитра плиток — тёмная, под тему сайта.

import { useCallback, useEffect, useState, type CSSProperties } from 'react'

const SIZE = 4

type Grid = number[]

const emptyGrid = (): Grid => Array(16).fill(0)

const newTile = (g: Grid): Grid => {
  const empty: number[] = []
  for (let i = 0; i < g.length; i++) if (g[i] === 0) empty.push(i)
  if (empty.length === 0) return g
  const ng = [...g]
  ng[empty[Math.floor(Math.random() * empty.length)]] =
    Math.random() < 0.9 ? 2 : 4
  return ng
}

// Сдвиг одного ряда влево со сливанием; возвращает ряд и прибавку к счёту.
const slideRow = (row: number[]): { row: number[]; gained: number } => {
  const arr = row.filter((x) => x !== 0)
  let gained = 0
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2
      gained += arr[i]
      arr.splice(i + 1, 1)
    }
  }
  while (arr.length < SIZE) arr.push(0)
  return { row: arr, gained }
}

const transpose = (g: Grid): Grid => {
  const ng = Array(16).fill(0)
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) ng[c * SIZE + r] = g[r * SIZE + c]
  return ng
}

const reverseRows = (g: Grid): Grid => {
  const ng = [...g]
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE / 2; c++) {
      const a = r * SIZE + c
      const b = r * SIZE + (SIZE - 1 - c)
      const t = ng[a]
      ng[a] = ng[b]
      ng[b] = t
    }
  return ng
}

const moveLeft = (g: Grid): { grid: Grid; gained: number; moved: boolean } => {
  let gained = 0
  const ng: number[] = []
  for (let r = 0; r < SIZE; r++) {
    const res = slideRow(g.slice(r * SIZE, r * SIZE + SIZE))
    gained += res.gained
    ng.push(...res.row)
  }
  let moved = false
  for (let i = 0; i < ng.length; i++) if (ng[i] !== g[i]) moved = true
  return { grid: ng, gained, moved }
}

const canMove = (g: Grid): boolean => {
  for (let i = 0; i < g.length; i++) {
    if (g[i] === 0) return true
    const r = Math.floor(i / SIZE)
    const c = i % SIZE
    if (c < SIZE - 1 && g[i] === g[i + 1]) return true
    if (r < SIZE - 1 && g[i] === g[i + SIZE]) return true
  }
  return false
}

// Тёмная палитра: от приглушённого к яркому акценту по мере роста плитки.
const TILE: Record<number, CSSProperties> = {
  2: { background: '#1b2536', color: '#c9d4e4' },
  4: { background: '#22304a', color: '#d5deec' },
  8: { background: '#0e4d5e', color: '#eaf6fa' },
  16: { background: '#0a6b7a', color: '#eaf6fa' },
  32: { background: '#0a8095', color: '#eaf6fa' },
  64: { background: '#00add8', color: '#04121a' },
  128: { background: '#19bdec', color: '#04121a' },
  256: { background: '#3ee0c4', color: '#04121a' },
  512: { background: '#4ade80', color: '#04121a' },
  1024: { background: '#a3e635', color: '#04121a' },
  2048: { background: '#facc15', color: '#1a1500' }
}
const tileStyle = (v: number): CSSProperties =>
  v === 0 ? {} : TILE[Math.min(v, 2048)] ?? TILE[2048]

type Dir = 'left' | 'right' | 'up' | 'down'

export const Game2048 = () => {
  const [grid, setGrid] = useState<Grid>(() => newTile(newTile(emptyGrid())))
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)

  const doMove = useCallback(
    (dir: Dir) => {
      if (over) return
      let g = grid
      if (dir === 'right') g = reverseRows(g)
      else if (dir === 'up') g = transpose(g)
      else if (dir === 'down') g = reverseRows(transpose(g))
      const res = moveLeft(g)
      let ng = res.grid
      if (dir === 'right') ng = reverseRows(ng)
      else if (dir === 'up') ng = transpose(ng)
      else if (dir === 'down') ng = reverseRows(transpose(ng))
      if (!res.moved) return
      ng = newTile(ng)
      setGrid(ng)
      const ns = score + res.gained
      setScore(ns)
      setBest((b) => Math.max(b, ns))
      if (ng.some((v) => v >= 2048)) setWon(true)
      if (!canMove(ng)) setOver(true)
    },
    [grid, over, score]
  )

  useEffect(() => {
    const map: Record<string, Dir> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down'
    }
    const onKey = (e: KeyboardEvent) => {
      const d = map[e.key]
      if (d) {
        e.preventDefault()
        doMove(d)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doMove])

  const reset = () => {
    setGrid(newTile(newTile(emptyGrid())))
    setScore(0)
    setOver(false)
    setWon(false)
  }

  return (
    <div className="g2048">
      <div className="g2048-score">
        <span>Счёт · {score}</span>
        <span>Рекорд · {best}</span>
      </div>
      <div className="g2048-wrap">
        <div className="g2048-board">
          {grid.map((v, i) => (
            <div key={i} className="tile" style={tileStyle(v)}>
              {v === 0 ? '' : v}
            </div>
          ))}
        </div>
        {over ? (
          <div className="g2048-overlay">
            <p>Ходов больше нет</p>
            <button type="button" className="btn primary" onClick={reset}>
              Заново
            </button>
          </div>
        ) : null}
      </div>
      {won ? (
        <p className="g2048-won">2048 собран! 🎉 Можно продолжать.</p>
      ) : null}
      <button type="button" className="btn ghost g2048-reset" onClick={reset}>
        Заново
      </button>
      <p className="g2048-hint">Стрелки — двигать плитки. Собери 2048.</p>
    </div>
  )
}
