import { html } from '@arrow-js/core'

interface NavItem {
  id: string
  label: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    title: 'Essentials',
    items: [
      { id: 'what-is-arrow', label: 'What is Arrow' },
      { id: 'quick-start', label: 'Quickstart' },
      { id: 'components', label: 'Components' },
    ],
  },
  {
    title: 'API',
    items: [
      { id: 'reactive-data', label: 'Reactive (r)' },
      { id: 'watching-data', label: 'Watch (w)' },
      { id: 'templates', label: 'HTML (t)' },
      { id: 'ssr', label: 'SSR' },
      { id: 'hydration', label: 'Hydration' },
      { id: 'ecosystem', label: 'Ecosystem' },
    ],
  },
  {
    title: 'Examples',
    items: [{ id: 'examples', label: 'Playground' }],
  },
]

function NavGroupView(group: NavGroup) {
  return html`
    <div class="mb-6">
      <div class="nav-group-title">${group.title}</div>
      ${group.items.map(
        (item) =>
          html`<a href="${`#${item.id}`}" class="nav-link">${item.label}</a>`
      )}
    </div>
  `
}

export function Navigation() {
  return html`
    <nav
      class="hidden lg:block w-56 shrink-0 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto"
    >
      ${navigation.map((group) => NavGroupView(group))}
    </nav>
  `
}
