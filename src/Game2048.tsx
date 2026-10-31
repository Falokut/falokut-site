// 2048: 4×4, стрелки двигают плитки. Плитки скользят на новое место
// (CSS transition), слияние — пульс, новая плитка — pop-in. Цель — 2048.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties
} from 'react'

const SIZE = 4
const SLIDE_MS = 140

type Dir = 'left' | 'right' | 'up' | 'down'
type Tile = {
  id: number
  value: number
  row: number
  col: number
  isNew?: boolean
  merged?: boolean
  removed?: boolean
  /** Новое значение после слияния (показывается во второй фазе). */
  mergeValue?: number
}

let nextId = 1
const newId = (): number => nextId++

// Случайная плитка на пустую клетку (0.9 — двойка, иначе четвёрка).
const spawn = (tiles: Tile[]): Tile | null => {
  const occupied = new Set(tiles.map((t) => t.row * SIZE + t.col))
  const empty: number[] = []
  for (let i = 0; i < SIZE * SIZE; i++) if (!occupied.has(i)) empty.push(i)
  if (empty.length === 0) return null
  const cell = empty[Math.floor(Math.random() * empty.length)]
  return {
    id: newId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row: Math.floor(cell / SIZE),
    col: cell % SIZE,
    isNew: true
  }
}

const initTiles = (): Tile[] => {
  const ts: Tile[] = []
  const a = spawn(ts)
  if (a) ts.push(a)
  const b = spawn(ts)
  if (b) ts.push(b)
  return ts
}

// Сдвиг в dir: существующие плитки получают новые row/col (анимирует
// transition), пара-слияние: «выживший» помнит mergeValue, «поглощённая»
// едет под него и помечается removed (убирается после хода).
const applyMove = (
  tiles: Tile[],
  dir: Dir
): { tiles: Tile[]; gained: number; moved: boolean } => {
  const vertical = dir === 'up' || dir === 'down'
  const reverse = dir === 'right' || dir === 'down'
  const out: Tile[] = []
  let gained = 0
  let moved = false
  for (let line = 0; line < SIZE; line++) {
    const lineTiles: Tile[] = []
    for (let i = 0; i < SIZE; i++) {
      const row = vertical ? (reverse ? SIZE - 1 - i : i) : line
      const col = vertical ? line : (reverse ? SIZE - 1 - i : i)
      const t = tiles.find((x) => x.row === row && x.col === col)
      if (t !== undefined) lineTiles.push(t)
    }
    let slot = 0
    let i = 0
    while (i < lineTiles.length) {
      const t = lineTiles[i]
      const row = vertical ? (reverse ? SIZE - 1 - slot : slot) : line
      const col = vertical ? line : (reverse ? SIZE - 1 - slot : slot)
      const t2 = i + 1 < lineTiles.length ? lineTiles[i + 1] : undefined
      if (t2 !== undefined && t2.value === t.value) {
        const target = t.value * 2
        gained += target
        if (t.row !== row || t.col !== col || t2.row !== row || t2.col !== col)
          moved = true
        out.push({ ...t, row, col, mergeValue: target, merged: true, isNew: false })
        out.push({ ...t2, row, col, merged: false, removed: true, isNew: false })
        i += 2
      } else {
        if (t.row !== row || t.col !== col) moved = true
        out.push({ ...t, row, col, merged: false, isNew: false, removed: false })
        i += 1
      }
      slot += 1
    }
  }
  return { tiles: out, gained, moved }
}

const canMove = (ts: Tile[]): boolean => {
  const g: number[][] = Array.from({ length: SIZE }, () =>
    Array<number>(SIZE).fill(0)
  )
  for (const t of ts) g[t.row][t.col] = t.value
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === 0) return true
      if (c + 1 < SIZE && g[r][c] === g[r][c + 1]) return true
      if (r + 1 < SIZE && g[r][c] === g[r + 1][c]) return true
    }
  return false
}

export const Game2048 = () => {
  const [tiles, setTiles] = useState<Tile[]>(initTiles)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const lockRef = useRef(false)

  const doMove = useCallback(
    (dir: Dir) => {
      if (lockRef.current || over) return
      const res = applyMove(tiles, dir)
      if (!res.moved) return
      lockRef.current = true
      setTiles(res.tiles)
      const ns = score + res.gained
      setScore(ns)
      setBest((b) => Math.max(b, ns))
      // Вторая фаза: «поглощённые» уехали, слияние показывает новый
      // значение (пульс), новая плитка — pop-in.
      window.setTimeout(() => {
        const clean = res.tiles
          .filter((t) => !t.removed)
          .map((t) => ({
            id: t.id,
            value: t.mergeValue ?? t.value,
            row: t.row,
            col: t.col,
            isNew: false,
            merged: t.mergeValue !== undefined
          }))
        const fresh = spawn(clean)
        const final = fresh !== null ? [...clean, fresh] : clean
        // Победа: среди слияний этого хода появилось 2048 (и выше).
        if (
          res.tiles.some(
            (t) => t.mergeValue !== undefined && t.mergeValue >= 2048
          )
        )
          setWon(true)
        setTiles(final)
        if (!canMove(final)) setOver(true)
        lockRef.current = false
      }, SLIDE_MS + 20)
    },
    [tiles, over, score]
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
    setTiles(initTiles())
    setScore(0)
    setOver(false)
    setWon(false)
    lockRef.current = false
  }

  return (
    <div className="g2048">
      <div className="g2048-score">
        <span>Счёт · {score}</span>
        <span>Рекорд · {best}</span>
      </div>
      <div className="g2048-wrap">
        <div className="g2048-board">
          {Array.from({ length: SIZE * SIZE }, (_, i) => (
            <div key={i} className="g2048-cell" />
          ))}
          <div className="g2048-tiles">
            {tiles.map((t) => (
              <div
                key={t.id}
                className={`g2048-tile t${Math.min(t.value, 2048)}${
                  t.isNew ? ' new' : ''
                }${t.merged ? ' merged' : ''}`}
                style={{ '--x': t.col, '--y': t.row } as CSSProperties}
              >
                {t.value}
              </div>
            ))}
          </div>
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
