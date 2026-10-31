// Markdown для документов: GFM (таблицы/списки/код) + кастомный рендер —
// fence-блоки рисуются «терминальными окнами». Внешние компоненты
// (h2 с id, кросс-ссылки, внешние ссылки) подмешиваются через
// extraComponents.

import ReactMarkdown, { type Components } from 'react-markdown'
import { Children, isValidElement, type ReactNode } from 'react'
import remarkGfm from 'remark-gfm'

export type MarkdownComponents = Pick<Components, 'a' | 'h2' | 'pre'>

const extractCode = (node: ReactNode): string => {
  if (node == null) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractCode).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractCode(node.props.children)
  }
  return ''
}

const TerminalPre: Components['pre'] = ({ children }) => {
  let lang = ''
  let code = ''
  Children.forEach(children, (child) => {
    if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) {
      return
    }
    const el = child
    const m = /language-(\w+)/.exec(el.props.className ?? '')
    if (m) {
      lang = m[1]
      code = extractCode(el.props.children)
    }
  })
  return (
    <div className="term">
      <div className="term-bar">
        <span className="t-dot red"></span>
        <span className="t-dot yellow"></span>
        <span className="t-dot green"></span>
        <em>{lang || 'sh'}</em>
      </div>
      <pre className="term-pre">
        <code>{code || extractCode(children)}</code>
      </pre>
    </div>
  )
}

export const Markdown = ({
  text,
  extraComponents
}: {
  text: string
  extraComponents?: MarkdownComponents
}) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{ pre: TerminalPre, ...extraComponents }}
  >
    {text}
  </ReactMarkdown>
)
