// Лёгкий hash-роутер без зависимостей: #/<id> -> страница.
// Поддерживает бэк/форвард и прямые ссылки (синхронизация с
// location.hash). Все страницы — md-контент, рендерит DocPage
// (включая «Миниигры» — блок ```games в index.md).

import { useEffect, useState } from 'react'

import { navPages } from './data'
import { DocPage } from './pages/DocPage'

const readHash = (): string => window.location.hash.replace(/^#\/?/, '')

export const useHash = (): string => {
  const [h, setH] = useState(readHash)
  useEffect(() => {
    const on = () => setH(readHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return h
}

export const navigate = (id: string): void => {
  window.location.hash = `/${id}`
}

// Текущая страница из hash; невалидный/пустой hash — первая страница.
export const currentPageId = (hash: string): string =>
  hash && navPages.some((p) => p.id === hash) ? hash : navPages[0].id

export const Router = () => {
  const hash = useHash()
  const page = currentPageId(hash)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])
  return <DocPage id={page} />
}
