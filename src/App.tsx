// Точка входа: провайдер состояния, каркас (нав/TOC/статус-бар),
// роутер страниц и пасхалки-модалки. Весь контент — в
// content/index.md: одна страница = один «## …», спец-блоки
// ```hero и ```games рендерятся компонентами (HeroBlock / GamesBlock).

import { Egg } from './Egg'
import { Layout } from './layout'
import { RatRunner } from './RatRunner'
import { Router } from './router'
import { StoreProvider, useStore } from './store'

const Eggs = () => {
  const { egg, setEgg, ratRun, finishRatRun } = useStore()
  return (
    <>
      {ratRun ? <RatRunner run={ratRun} onDone={finishRatRun} /> : null}
      <Egg
        open={egg === 'gopher'}
        onClose={() => setEgg('none')}
        emoji="🐹"
        anim="hop"
        title="Gopher found!"
        text={
          <>
            // Ты нашёл пасхалку. Gopher доволен.
            <br />
            // Esc — закрыть.
          </>
        }
      />
      <Egg
        open={egg === 'rat'}
        onClose={() => setEgg('none')}
        emoji="🐭"
        anim="wiggle"
        title="Мышь"
        text={
          <>
            // Это Мышь — твоя крыса. Она тоже рада.
            <br />
            // Esc — закрыть.
          </>
        }
      />
    </>
  )
}

const App = () => (
  <StoreProvider>
    <Layout>
      <Router />
    </Layout>
    <Eggs />
  </StoreProvider>
)

export default App
