// Выбегающая Мышь: стартует под курсором (x из трипл-клика по
// статус-бару) и убегает в сторону от него до края экрана; время —
// по дистанции. На добегании вызывается onDone.

import { useMemo, type AnimationEvent, type CSSProperties } from 'react'

import type { RatRun } from './store'

export const RatRunner = ({
  run,
  onDone
}: {
  run: RatRun
  onDone: () => void
}) => {
  const duration = useMemo(() => {
    const vw = window.innerWidth
    const dist = run.dir === 'right' ? vw - run.x : run.x
    return Math.max(0.5, dist / 900)
  }, [run])
  const style = {
    animationDuration: `${duration.toFixed(2)}s`,
    '--rat-x': `${run.x}px`
  } as CSSProperties
  const onAnimEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (
      e.animationName !== 'rat-run-right' &&
      e.animationName !== 'rat-run-left'
    )
      return
    onDone()
  }
  return (
    <div
      className={`rat-run ${run.dir}`}
      style={style}
      onAnimationEnd={onAnimEnd}
    >
      <span className={`rat-flip${run.dir === 'right' ? ' flip' : ''}`}>
        <span className="rat-sprite">🐭</span>
      </span>
      <span
        className={`rat-dust-holder${run.dir === 'left' ? ' flip' : ''}`}
        aria-hidden="true"
      >
        <span className="rat-dust">💨</span>
      </span>
    </div>
  )
}
