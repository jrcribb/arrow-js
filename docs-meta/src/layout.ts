import { html } from '@arrow-js/core'
import { Header } from './components/Header'
import { Footer } from './components/Footer'

export function layout(content: unknown) {
  return html`
    <div class="min-h-screen flex flex-col">
      ${Header()}
      <main class="flex-1 pt-16">${content}</main>
      ${Footer()}
    </div>
  `
}
