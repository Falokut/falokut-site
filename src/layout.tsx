// Каркас страницы: sticky-нав (лого · текущая страница ·
// гамбургер-меню со списком страниц), ненавязчивый TOC справа
// (разделы и подблоки текущей страницы), статус-бар внизу.
// Пасхалка с крысой — три быстрых клика по статус-бару.

import { Fragment, useState, type ReactNode } from 'react'

import { navPages, pageById, siteTitle, tocSections } from './data'
import { currentPageId, navigate, useHash } from './router'
import { Statusbar } from './Statusbar'
import { useStore } from './store'

const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const Nav = () => {
  const hash = useHash()
  const pageId = currentPageId(hash)
  const [open, setOpen] = useState(false)
  const current = pageById(pageId)
  const goto = (id: string) => {
    setOpen(false)
    navigate(id)
  }
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="logo" href={`#/${navPages[0].id}`}>
          {siteTitle}
        </a>
        <span className="nav-page">{current?.title}</span>
        <button
          type="button"
          className={`hamburger${open ? ' open' : ''}`}
          aria-label="Меню"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>
      {open ? (
        <nav className="menu">
          {navPages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`menu-item${pageId === p.id ? ' active' : ''}`}
              onClick={() => goto(p.id)}
            >
              <span className="menu-idx">
                {String(i + 1).padStart(2, '0')}
              </span>
              {p.title}
            </button>
          ))}
        </nav>
      ) : null}
    </header>
  )
}

const Toc = () => {
  const hash = useHash()
  const pageId = currentPageId(hash)
  return (
    <aside className="toc">
      <div className="section-label">Содержание</div>
      {tocSections(pageId).map((s) => (
        <Fragment key={s.id}>
          <button
            type="button"
            className="toc-item"
            onClick={() => scrollToId(s.id)}
          >
            {s.heading}
          </button>
          {s.subs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              className="toc-item sub"
              onClick={() => scrollToId(sub.id)}
            >
              {sub.heading}
            </button>
          ))}
        </Fragment>
      ))}
    </aside>
  )
}

export const Layout = ({ children }: { children: ReactNode }) => {
  const { startRatRun } = useStore()
  return (
    <div className="page">
      <Nav />
      <div className="layout">
        <main className="content" id="top">
          {children}
        </main>
        <Toc />
      </div>
      <Statusbar onTripleClick={startRatRun} />
    </div>
  )
}
