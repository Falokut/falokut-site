// Секции сайта: markdown-файлы из каталога content/ (вшиты в бандл при
// сборке через import.meta.glob). Перечень и порядок секций задаются
// здесь; первый заголовок «## …» в файле дублирует title и отрезается.

export type Section = {
  id: string
  title: string
  text: string
}

const mdModules = import.meta.glob('/content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

const pick = (file: string): string =>
  (mdModules[`/content/${file}`] ?? '').replace(/^##[^\n]*\n/, '')

export const sections: Section[] = [
  { id: 'about', title: 'Обо мне', text: pick('about.md') },
  { id: 'stack', title: 'Стек', text: pick('stack.md') },
  { id: 'oss', title: 'Open Source', text: pick('oss.md') },
  { id: 'projects', title: 'Проекты', text: pick('projects.md') },
  { id: 'contacts', title: 'Контакты', text: pick('contacts.md') }
]
