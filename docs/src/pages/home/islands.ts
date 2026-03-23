import { ScrollSpyNav } from '../../components/ScrollSpyNav'
import { CopyPageMenu } from '../../components/CopyPageMenu'
import { CliCommand, resolveCliCommandProps } from '../../components/CliCommand'
import { SignupCallout } from '../../components/SignupCallout'
import { hydrateEachIsland, hydrateIntoRoot } from '../../islands'
import { homeNavGroups } from './nav'
import { HeroChat } from './Hero'

export async function hydrateHomeIslands() {
  await hydrateIntoRoot('home-mobile-nav-root', ScrollSpyNav(homeNavGroups).mobile())
  await hydrateIntoRoot('home-sidebar-nav-root', ScrollSpyNav(homeNavGroups).sidebar())
  await hydrateIntoRoot('hero-chat-root', HeroChat())
  await hydrateEachIsland('[data-island="cli-command"]', (root) =>
    CliCommand(resolveCliCommandProps({
      command: root.getAttribute('data-command'),
      ariaLabel: root.getAttribute('data-aria-label'),
    }))
  )
  await hydrateEachIsland('[data-island="copy-page-menu"]', (root) =>
    CopyPageMenu({ markdownPath: root.dataset.markdownPath || '/docs.md' })
  )
  await hydrateEachIsland('[data-island="signup-callout"]', () =>
    SignupCallout()
  )
}
