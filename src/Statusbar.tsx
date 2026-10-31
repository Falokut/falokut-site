// Статус-бар в духе vim: uptime + местный колорит. Три быстрых клика по
// нему — пасхалка с крысой Мышью.

import { useEffect, useRef, useState, type MouseEvent } from 'react'

export const Statusbar = ({
  onTripleClick
}: {
  onTripleClick?: (x: number) => void
}) => {
  const [up, setUp] = useState(0)
  const clicks = useRef(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const t = window.setInterval(() => setUp((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const mm = String(Math.floor(up / 60)).padStart(2, '0')
  const ss = String(up % 60).padStart(2, '0')

  const onClick = (e: MouseEvent<HTMLElement>) => {
    if (!onTripleClick) return
    clicks.current += 1
    window.clearTimeout(timer.current)
    if (clicks.current >= 3) {
      clicks.current = 0
      onTripleClick(e.clientX)
      return
    }
    timer.current = window.setTimeout(() => {
      clicks.current = 0
    }, 1200)
  }

  return (
    <footer className="statusbar" onClick={onClick}>
      <span>-- FALOKUT --</span>
      <span className="sb-mid">Go backend · Saint-Petersburg</span>
      <span>LF · UTF-8</span>
      <span>
        uptime {mm}:{ss}
      </span>
    </footer>
  )
}
