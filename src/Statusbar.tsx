// Статус-бар в духе vim: uptime со момента открытия страницы
// и немного местного колорита.

import { useEffect, useState } from 'react'

export const Statusbar = () => {
  const [up, setUp] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => setUp((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  const mm = String(Math.floor(up / 60)).padStart(2, '0')
  const ss = String(up % 60).padStart(2, '0')

  return (
    <footer className="statusbar">
      <span>-- FALOKUT --</span>
      <span className="sb-mid">Go backend · Saint-Petersburg</span>
      <span>LF · UTF-8</span>
      <span>
        uptime {mm}:{ss}
      </span>
    </footer>
  )
}
