import { html } from '@arrow-js/core'
import { layout } from './layout'
import { HomePage } from './pages/home/index'
import { DocsPage } from './pages/docs/index'

function normalizePath(url: string) {
  const pathname = new URL(url, 'http://arrow.local').pathname
  return pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname
}

function createHomePage() {
  return {
    title: 'Arrow — Reactive UI in Pure JavaScript',
    description:
      'A < 3KB runtime with zero dependencies. Observable data, declarative DOM, and SSR built on platform primitives.',
    view: layout(HomePage()),
  }
}

function createDocsPage() {
  return {
    title: 'Documentation — Arrow',
    description:
      'Learn Arrow: reactive data, templates, components, SSR, and hydration.',
    view: layout(DocsPage()),
  }
}

export function createPage(url: string) {
  const pathname = normalizePath(url)

  if (pathname === '/docs') {
    return createDocsPage()
  }

  return createHomePage()
}
