// Общее состояние приложения: какая пасхалка открыта и выбегает ли
// крыса по экрану (откуда и в какую сторону). Терминал (gopher) и
// статус-бар (Мышь) читают его через useStore.

import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from 'react'

export type EggState = 'none' | 'gopher' | 'rat'
export type RatRun = { x: number; dir: 'left' | 'right' }

type Store = {
  egg: EggState
  setEgg: (e: EggState) => void
  ratRun: RatRun | null
  startRatRun: (x: number) => void
  finishRatRun: () => void
}

const Ctx = createContext<Store | null>(null)

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [egg, setEgg] = useState<EggState>('none')
  const [ratRun, setRatRun] = useState<RatRun | null>(null)
  // Старт под курсором, бег в сторону от него.
  const startRatRun = (x: number) => {
    const dir: RatRun['dir'] = x < window.innerWidth / 2 ? 'right' : 'left'
    setRatRun({ x, dir })
  }
  // Добежала до края — карточка «Мышь».
  const finishRatRun = () => {
    setRatRun(null)
    setEgg('rat')
  }
  return (
    <Ctx.Provider
      value={{ egg, setEgg, ratRun, startRatRun, finishRatRun }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useStore = (): Store => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore вне StoreProvider')
  return c
}
