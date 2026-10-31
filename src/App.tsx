// falokut.ru — одностраничная визитка. Контент живёт в content/*.md
// (вшивается в бандл при сборке, см. contentTree.ts), оформление —
// здесь: nav со scroll-spy, hero с «терминалом», секции из markdown,
// статус-бар в духе vim и пасхалка-gopher.

import { useEffect, useState } from 'react'

import { GopherEgg } from './GopherEgg'
import { HeroTerminal } from './Terminal'
import { Markdown } from './Markdown'
import { sections } from './contentTree'
import { Statusbar } from './Statusbar'

const App = () => {
  const [active, setActive] = useState(sections[0].id)

  // Scroll-spy: активный пункт nav — секция, проходящая середину экрана.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-35% 0px -55% 0px' }
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [])

  return (
    <div className="page">
      <GopherEgg />

      <header className="nav">
        <div className="nav-inner">
          <a className="logo" href="#top">
            &lt;falokut&nbsp;/&gt;
          </a>
          <nav className="nav-links">
            {sections.map((s) => (
              <a
                key={s.id}
                className={active === s.id ? 'active' : undefined}
                href={`#${s.id}`}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-text">
            <p className="kicker">// привет</p>
            <h1>Timur</h1>
            <p className="lead">
              Go <span className="accent">backend</span>-разработчик.
              <br />
              Строю микросервисы и распределённые системы —
              <br />
              надёжные, наблюдаемые и приятные в работе.
            </p>
            <div className="cta">
              <a className="btn primary" href="#projects">
                Проекты
              </a>
              <a className="btn ghost" href="#contacts">
                Связаться
              </a>
            </div>
            <p className="hero-meta">
              <span className="dot"></span> Saint-Petersburg · Go · PostgreSQL ·
              распределённые системы
            </p>
          </div>
          <HeroTerminal />
        </section>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="section">
            <h2 className="h2">
              <span className="h2-index">{String(i + 1).padStart(2, '0')}</span>
              {s.title}
            </h2>
            <article className="markdown">
              <Markdown text={s.text} />
            </article>
          </section>
        ))}
      </main>

      <Statusbar />
    </div>
  )
}

export default App
