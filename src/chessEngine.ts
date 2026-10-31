// Stockfish 19 (lite, single-threaded, WASM) в web worker: сырой
// UCI-протокол по postMessage. Файлы движка лежат в public/stockfish/
// (Vite копирует их в build как есть, MIME — application/wasm).
// Личка движка: GPL-3.0 (nmrugg/stockfish.js, build v19.0.1).

const ENGINE_URL = '/stockfish/stockfish-19-lite-single.js'

/** Сила хода: skill — «Skill Level» Stockfish, depth — глубина. */
export type EngineLevel = { label: string; skill: number; depth: number }

export const ENGINE_LEVELS: EngineLevel[] = [
  { label: 'Легко', skill: 2, depth: 8 },
  { label: 'Средне', skill: 10, depth: 14 },
  { label: 'Сложно', skill: 20, depth: 18 }
]

type Engine = {
  worker: Worker
  ready: Promise<void>
  /** Генерация: растёт на каждый «bestmove»; старые ответы сбрасываются. */
  generation: number
}

let engine: Engine | null = null
let bestMoveResolve: ((move: string | null) => void) | null = null
let infoListener: ((score: number | null) => void) | null = null

// «info depth N … score cp 45 / mate 3 …» -> оценка от лица белых
// (+) или чёрных (−), либо «мат в N».
const parseInfo = (line: string): number | null => {
  const mate = line.match(/score mate (-?)(\d+)/)
  if (mate) return (mate[1] === '-' ? -1 : 1) * (100000 + Number(mate[2]))
  const cpM = line.match(/score cp (-?\d+)/)
  return cpM === null ? null : Number(cpM[1]) / 100
}

/** Движок один на страницу; повторные вызовы — тот же worker. */
export const ensureEngine = (): Promise<void> => {
  if (engine !== null) return engine.ready
  const worker = new Worker(ENGINE_URL)
  const st: Engine = {
    worker,
    generation: 0,
    ready: new Promise((resolve) => {
      worker.onmessage = (ev: MessageEvent) => {
        const line = typeof ev.data === 'string' ? ev.data : ''
        if (line === 'uciok') {
          worker.postMessage('setoption name Ponder value false')
          worker.postMessage('setoption name MultiPV value 1')
          worker.postMessage('isready')
          return
        }
        if (line === 'readyok') {
          resolve()
          return
        }
        if (line.startsWith('info ')) {
          if (infoListener !== null) infoListener(parseInfo(line))
          return
        }
        if (line.startsWith('bestmove')) {
          if (bestMoveResolve === null) return
          const token = line.split(/\s+/)[1]
          const done = bestMoveResolve
          bestMoveResolve = null
          done(token !== undefined && token !== '0000' ? token : null)
        }
      }
    })
  }
  engine = st
  worker.postMessage('uci')
  return st.ready
}

/** Живая оценка позиции (для индикатора), null — нет данных. */
export const setEvalListener = (fn: ((score: number | null) => void) | null) => {
  infoListener = fn
}

/**
 * Лучший ход Stockfish на позицию fen: строка UCI («e2e4», «e7e8q»)
 * или null, если движок не ответил за 60 секунд.
 */
export const engineBestMove = async (
  fen: string,
  level: EngineLevel
): Promise<string | null> => {
  if (engine === null) await ensureEngine()
  const st = engine
  if (st === null) return null
  // Если прошлый поиск ещё жив — останови (ответ отбросим по генерации).
  st.generation += 1
  const gen = st.generation
  st.worker.postMessage('stop')
  st.worker.postMessage(`position fen ${fen}`)
  st.worker.postMessage(`setoption name Skill Level value ${level.skill}`)
  st.worker.postMessage(`go depth ${level.depth}`)
  return await new Promise<string | null>((resolve) => {
    bestMoveResolve = (move) => {
      if (st.generation === gen) resolve(move)
    }
    window.setTimeout(() => {
      if (st.generation === gen) {
        bestMoveResolve = null
        resolve(null)
      }
    }, 60000)
  })
}
