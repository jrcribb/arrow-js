import { expect, test } from '@playwright/test'

test('home page is server rendered without javascript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
  })
  const page = await context.newPage()

  await page.goto('/')

  await expect(page.locator('h1')).toHaveText('Reactivity without the Framework')
  await expect(page.locator('#hydration-probe')).toContainText('Clicks: 0')

  await context.close()
})

test('docs page is server rendered without javascript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
  })
  const page = await context.newPage()

  await page.goto('/docs/')

  await expect(page.locator('#essentials')).toHaveText('Essentials')
  await expect(page.locator('nav.navigation')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('Changelog')

  await context.close()
})

test('home page hydrates component state without remounting the app root', async ({
  page,
}) => {
  await trackAppRootReplacements(page)
  await page.goto('/')

  const probe = page.locator('#hydration-probe')
  const shell = page.locator('#hydration-probe-shell')

  await expect
    .poll(() => page.evaluate(() => window.__arrowAppReplaceChildrenCalls))
    .toBe(0)
  await expect(probe).toHaveText('Clicks: 0')
  await probe.click()
  await expect(probe).toHaveText('Clicks: 1')
  await shell.click()
  await expect(probe).toHaveText('Clicks: 1')
})

test('home page repairs a tampered async subtree without remounting the app root', async ({
  page,
}) => {
  await trackAppRootReplacements(page)
  await tamperDocument(page, '/', (html) =>
    html.replace(
      '<script type="module" src="/src/entry-client.js"></script>',
      '<script>document.getElementById("hydration-probe")?.remove()</script><script type="module" src="/src/entry-client.js"></script>'
    )
  )
  await page.goto('/')

  const probe = page.locator('#hydration-probe')

  await expect
    .poll(() => page.evaluate(() => window.__arrowAppReplaceChildrenCalls))
    .toBe(0)
  await expect(probe).toContainText('Clicks: 0')
  await probe.click()
  await expect(probe).toHaveText('Clicks: 1')
})

test('docs page hydrates navigation without remounting the app root', async ({
  page,
}) => {
  await trackAppRootReplacements(page)
  await page.goto('/docs/')

  const selection = page.locator('nav.navigation .selection')

  await expect
    .poll(() => page.evaluate(() => window.__arrowAppReplaceChildrenCalls))
    .toBe(0)
  await selection.click()
  await expect(selection).toHaveAttribute('data-is-open', 'true')
  const article = page.locator('article')
  const box = await article.boundingBox()

  if (!box) {
    throw new Error('Unable to measure docs article content.')
  }

  await page.mouse.click(box.x + box.width / 2, box.y + 32)
  await expect(selection).not.toHaveAttribute('data-is-open', 'true')
})

test('shared header shows icon controls and theme toggle works', async ({ page }) => {
  await page.goto('/docs/')

  await expect(page.locator('a[aria-label="GitHub"]')).toBeVisible()
  await expect(page.locator('a[aria-label="Follow on X"]')).toBeVisible()
  await expect(page.locator('.social-links li')).toHaveCount(4)

  const html = page.locator('html')
  const toggle = page.locator('#theme-toggle')

  await expect(html).toHaveAttribute('data-theme', 'light')
  await toggle.click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
})

test('docs TypeScript examples expose Twoslash hover data', async ({ page }) => {
  const messages = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(msg.text())
    }
  })

  await page.goto('/docs/')

  await expect
    .poll(() => page.locator('pre.twoslash').count())
    .toBeGreaterThan(14)

  const block = page.locator('pre.twoslash').first()
  await expect(block).toBeVisible()

  const hoverToken = block.locator('.twoslash-hover').first()
  const box = await hoverToken.boundingBox()

  if (!box) {
    throw new Error('Unable to measure Twoslash hover token.')
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

  await expect(block.locator('.twoslash-popup-container').first()).toBeVisible()
  expect(messages).toEqual([])
})

test('home and docs code samples highlight Arrow template HTML segments', async ({ page }) => {
  await page.goto('/')

  const heroCode = page.locator('#hero .hero-code pre.shiki').first()
  await expect(heroCode).toHaveClass(/one-light/)
  await expect(heroCode).toHaveClass(/one-dark-pro/)

  const heroHtmlTokens = await heroCode.locator('code .line span').evaluateAll((nodes) => {
    const tokens = new Map<string, string>()

    for (const node of nodes) {
      const text = node.textContent ?? ''
      const style = node.getAttribute('style') ?? ''

      if (
        text === 'button' ||
        text === ' @click' ||
        text === '      Clicked '
      ) {
        tokens.set(text, style)
      }
    }

    return Object.fromEntries(tokens)
  })

  expect(heroHtmlTokens.button).toContain('--shiki-light:#E45649')
  expect(heroHtmlTokens[' @click']).toContain('--shiki-light:#986801')
  expect(heroHtmlTokens['      Clicked ']).toContain('--shiki-light:#50A14F')
  expect(heroHtmlTokens.button).not.toBe(heroHtmlTokens[' @click'])

  await page.goto('/docs/')

  await expect.poll(() => page.locator('article pre.shiki').count()).toBeGreaterThan(10)

  const docsArrowHtmlTokens = await page.locator('article pre.shiki code .line span').evaluateAll(
    (nodes) =>
      nodes
        .map((node) => ({
          text: node.textContent,
          style: node.getAttribute('style') ?? '',
        }))
        .filter((token) => token.text === 'button' || token.text === ' @click')
  )

  expect(docsArrowHtmlTokens).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        text: 'button',
        style: expect.stringContaining('--shiki-light:#E45649'),
      }),
      expect.objectContaining({
        text: ' @click',
        style: expect.stringContaining('--shiki-light:#986801'),
      }),
    ])
  )
})

test('docs examples link into the playground and changelog is absent', async ({
  page,
}) => {
  await page.goto('/docs/')

  await expect(page.locator('article')).not.toContainText('Changelog')
  await expect(page.locator('.docs-example-card')).toHaveCount(6)
  await expect(page.locator('.docs-example-card a[href^="/play/"]')).toHaveCount(6)
})

async function trackAppRootReplacements(page) {
  await page.addInitScript(() => {
    const original = Element.prototype.replaceChildren
    window.__arrowAppReplaceChildrenCalls = 0

    Element.prototype.replaceChildren = function (...args) {
      if (this instanceof Element && this.id === 'app') {
        window.__arrowAppReplaceChildrenCalls += 1
      }

      return original.apply(this, args)
    }
  })
}

async function tamperDocument(page, pathname, mutate) {
  await page.route('**/*', async (route) => {
    const request = route.request()

    if (request.resourceType() !== 'document') {
      await route.fallback()
      return
    }

    const url = new URL(request.url())
    if (url.pathname !== pathname) {
      await route.fallback()
      return
    }

    const response = await route.fetch()
    const body = await response.text()

    await route.fulfill({
      response,
      body: mutate(body),
      headers: {
        ...response.headers(),
        'content-type': 'text/html; charset=utf-8',
      },
    })
  })
}
