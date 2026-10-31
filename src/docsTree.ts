// Дерево контента: markdown-файлы из каталога content/ (вшиты в бандл
// при сборке через import.meta.glob). Логика — как в polygon-docs-ui:
// директория = папка в дереве; название папки — из meta.json в директории:
//   {"title": "...", "description": "...", "order": ["a.md", ...]}
// Один файл = один документ; выбор — по hash (#/doc/<path>).

export type DocMeta = {
  title?: string
  description?: string
  /** Порядок элементов уровня (имена файлов/папок). Без него — по алфавиту. */
  order?: string[]
}

export type DocsNode = {
  key: string
  name: string
  title: string
  kind: 'dir' | 'file'
  children?: DocsNode[]
}

// Vite 5.4: query '?raw' в самом паттерне glob даёт пустой результат —
// задаём его в options (query + import: 'default').
const mdModules = import.meta.glob('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>
const jsonModules = import.meta.glob('/content/**/*.json', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

// Ключи glob — '/content/<path>' (root-относительный паттерн).
const normalize = (key: string): string => key.replace(/^.*?content\//, '')

/** Относительный путь (без content/) -> содержимое markdown. */
export const docFiles: Record<string, string> = Object.fromEntries(
  Object.entries(mdModules).map(([key, content]) => [normalize(key), content])
)

const metas: Record<string, DocMeta> = {}
for (const [key, raw] of Object.entries(jsonModules)) {
  const path = normalize(key)
  if (!path.endsWith('meta.json')) continue
  try {
    metas[path] = JSON.parse(raw) as DocMeta
  } catch {
    // битый meta.json не фатален: название папки = её имя
  }
}

/** meta.json директории ('' — корень content/). */
export const dirMeta = (dir: string): DocMeta =>
  (metas[dir ? `${dir}/meta.json` : 'meta.json'] ?? {}) as DocMeta

const firstSegment = (path: string): string => {
  const i = path.indexOf('/')
  return i === -1 ? path : path.slice(0, i)
}

const fileTitle = (name: string): string =>
  name.replace(/\.md$/i, '').replace(/[-_]+/g, ' ')

/** Заголовок документа: первый «## …» в файле, иначе имя файла. */
export const docTitle = (path: string): string => {
  const m = (docFiles[path] ?? '').match(/^##[ \t]+(.+)$/m)
  if (m) return m[1].trim()
  return fileTitle(path.split('/').pop() ?? path)
}

/** Дерево уровня `dir` из списка всех файлов (порядок — из meta.json). */
export const buildTree = (files: string[], dir = ''): DocsNode[] => {
  const prefix = dir ? `${dir}/` : ''
  const order = dirMeta(dir).order
  const cmp = (a: string, b: string): number => {
    const ia = order?.indexOf(a) ?? -1
    const ib = order?.indexOf(b) ?? -1
    if (ia === -1 && ib === -1) return a < b ? -1 : a > b ? 1 : 0
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  }
  const subs = files
    .filter((f) => f.startsWith(prefix))
    .map((f) => f.slice(prefix.length))
    .sort(cmp)
  const dirs = new Set<string>()
  const filesHere: DocsNode[] = []
  for (const sub of subs) {
    const head = firstSegment(sub)
    if (sub.includes('/')) {
      dirs.add(head)
    } else {
      filesHere.push({
        key: prefix + sub,
        name: head,
        title: docTitle(prefix + sub),
        kind: 'file'
      })
    }
  }
  const dirNodes: DocsNode[] = [...dirs].sort(cmp).map((d) => {
    const path = prefix + d
    const meta = dirMeta(path)
    return {
      key: path,
      name: d,
      title: meta.title ?? d,
      kind: 'dir',
      children: buildTree(files, path)
    }
  })
  return [...dirNodes, ...filesHere]
}

export const allDocFiles = Object.keys(docFiles).sort()

/** Дефолтный документ — первый файл в порядке дерева. */
export const defaultDoc = buildTree(allDocFiles).find(
  (n) => n.kind === 'file'
)?.key ?? allDocFiles[0]
