import { html } from '@arrow-js/core'
import { Hero } from './Hero'
import { Features } from './Features'
import { Philosophy } from './Philosophy'

export function HomePage() {
  return html`
    <div>
      ${Hero()}
      ${Features()}
      ${Philosophy()}
    </div>
  `
}
