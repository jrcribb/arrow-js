import { execFileSync, spawnSync } from 'node:child_process'
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const rootDir = resolve(__dirname, '../..')
export const benchmarkTag = process.env.JS_FRAMEWORK_BENCHMARK_TAG ?? 'chrome142'
export const benchmarkRepoDir =
  process.env.JS_FRAMEWORK_BENCHMARK_DIR ??
  resolve(rootDir, `.cache/js-framework-benchmark-${benchmarkTag}`)
export const benchmarkRepoUrl =
  'https://github.com/krausest/js-framework-benchmark.git'
export const benchmarkBuildZipUrl =
  process.env.JS_FRAMEWORK_BENCHMARK_BUILD_URL ??
  `https://github.com/krausest/js-framework-benchmark/releases/download/${benchmarkTag}/build.zip`
export const benchmarkArrowMode =
  process.env.JS_FRAMEWORK_BENCHMARK_ARROW_MODE ?? 'published'

const benchmarkBuildZipPath = join(benchmarkRepoDir, 'build.zip')
const benchmarkBuildMarker = join(
  benchmarkRepoDir,
  'frameworks',
  'keyed',
  'lit',
  'dist',
  'main.js'
)

export function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: 'inherit',
    ...options,
  })
}

function getCorePackage() {
  return JSON.parse(
    readFileSync(join(rootDir, 'packages', 'core', 'package.json'), 'utf8')
  )
}

export function getPublishedCoreVersion() {
  return getCorePackage().version
}

export function getVersionLabel() {
  const sha = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: rootDir,
    encoding: 'utf8',
  })
  const suffix = sha.status === 0 ? `+${sha.stdout.trim()}` : ''
  return `${getPublishedCoreVersion()}${suffix}`
}

function assertBenchmarkArrowMode(mode) {
  if (mode === 'published' || mode === 'local') {
    return
  }

  throw new Error(
    `Unknown JS framework benchmark Arrow mode: ${mode}. Expected "published" or "local".`
  )
}

export function ensureBenchmarkRepo({ install = false } = {}) {
  if (!existsSync(benchmarkRepoDir)) {
    mkdirSync(dirname(benchmarkRepoDir), { recursive: true })
    run('git', [
      'clone',
      '--depth',
      '1',
      '--branch',
      benchmarkTag,
      benchmarkRepoUrl,
      benchmarkRepoDir,
    ])
  }

  if (
    install &&
    !existsSync(join(benchmarkRepoDir, 'webdriver-ts', 'dist', 'benchmarkRunner.js'))
  ) {
    run('npm', ['ci'], { cwd: benchmarkRepoDir })
    run('npm', ['run', 'install-local'], { cwd: benchmarkRepoDir })
  }

  if (
    install &&
    (!existsSync(benchmarkBuildMarker) ||
      (existsSync(benchmarkBuildZipPath) && statSync(benchmarkBuildZipPath).size === 0))
  ) {
    if (!existsSync(benchmarkBuildZipPath) || statSync(benchmarkBuildZipPath).size === 0) {
      run('curl', ['-L', benchmarkBuildZipUrl, '-o', benchmarkBuildZipPath])
    }
    run('unzip', ['-oq', benchmarkBuildZipPath], { cwd: benchmarkRepoDir })
  }
}

function frameworkDir(keyed) {
  return join(benchmarkRepoDir, 'frameworks', keyed ? 'keyed' : 'non-keyed', 'arrowjs')
}

function createArrowMainSource(keyed, mode) {
  const title = keyed ? 'ArrowJS (keyed)' : 'ArrowJS (non-keyed)'
  const importPath = mode === 'local' ? './arrow.js' : '@arrow-js/core'
  const rows = `() => {
        const items = data.items
        const rows = new Array(items.length)
        for (let i = 0; i < items.length; i++) {
          rows[i] = getRowView(items[i])
        }
        return rows
      }`
  return `import { reactive, html } from '${importPath}';
let data = reactive({
  items: [],
  selected: undefined,
});

let rowId = 1;
const rowViews = new WeakMap();
const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
const add = () => data.items.push(...buildData(1000)),
  clear = () => {
    data.items.length = 0;
    data.selected = undefined;
  },
  partialUpdate = () => {
    const items = data.items;
    for (let i = 0; i < items.length; i += 10) {
      items[i].label += ' !!!';
    }
  },
  run = () => {
    data.items = buildData(1000);
    data.selected = undefined;
  },
  runLots = () => {
    data.items = buildData(10000);
    data.selected = undefined;
  },
  swapRows = () => {
    const items = data.items;
    if (items.length > 998) {
      const item = items[1];
      items[1] = items[998];
      items[998] = item;
    }
  };

function getRowView(row) {
  let view = rowViews.get(row);
  if (view) return view;
  const id = row.id;
  view = html\`<tr class="\${() => data.selected === id ? 'danger' : ''}" data-id="\${id}"><td class="col-md-1">\${id}</td><td class="col-md-4"><a data-action="select">\${() => row.label}</a></td><td class="col-md-1"><a data-action="remove"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td><td class="col-md-6"></td></tr>\`${keyed ? `.key(id)` : ''};
  rowViews.set(row, view);
  return view;
}

function handleRowClick(event) {
  const target = event.target instanceof Element
    ? event.target.closest('[data-action]')
    : null;
  if (!target) return;
  const action = target.getAttribute('data-action');
  const id = Number(target.closest('tr')?.getAttribute('data-id'));
  if (!id) return;
  if (action === 'select') {
    data.selected = id;
    return;
  }
  if (action === 'remove') {
    const idx = data.items.findIndex((row) => row.id === id);
    if (idx > -1) data.items.splice(idx, 1);
  }
}

function _random(max) { return Math.round(Math.random() * 1000) % max; };

function buildData(count = 1000) {
  const data = new Array(count);
  for (var i = 0; i < count; i++)
    data[i] = { id: rowId++, label: adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)] };
  return data;
}
html\`<div class="container">
  <div class="jumbotron">
  <div class="row">
    <div class="col-md-6">
      <h1>${title}</h1>
    </div>
    <div class="col-md-6">
      <div class="row">
        <div class="col-sm-6 smallpad">
          <button type="button" class="btn btn-primary btn-block" id="run" @click="\${run}">Create 1,000 rows</button>
        </div>
        <div class="col-sm-6 smallpad">
          <button type="button" class="btn btn-primary btn-block" id="runlots" @click="\${runLots}">Create 10,000
            rows</button>
        </div>
        <div class="col-sm-6 smallpad">
          <button type="button" class="btn btn-primary btn-block" id="add" @click="\${add}">Append 1,000 rows</button>
        </div>
        <div class="col-sm-6 smallpad">
          <button type="button" class="btn btn-primary btn-block" id="update" @click="\${partialUpdate}">Update every
            10th row</button>
        </div>
        <div class="col-sm-6 smallpad">
          <button type="button" class="btn btn-primary btn-block" id="clear" @click="\${clear}">Clear</button>
        </div>
        <div class="col-sm-6 smallpad">
          <button type="button" class="btn btn-primary btn-block" id="swaprows" @click="\${swapRows}">Swap Rows</button>
        </div>
      </div>
    </div>
  </div>
  </div>
  <table class="table table-hover table-striped test-data">
    <tbody @click="\${handleRowClick}">
      \${${rows}}
    </tbody>
  </table>
  <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>
\`(document.getElementById('main'))
`
}

function createArrowIndexHtml(keyed, mode) {
  const title = keyed ? 'ArrowJS • Keyed' : 'ArrowJS • Non-keyed'
  const entryPoint = mode === 'local' ? 'src/Main.js' : 'dist/main.js'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link href="/css/currentStyle.css" rel="stylesheet" />
</head>
<body>
  <div id="main"></div>
  <script type="module" src="${entryPoint}"></script>
</body>
</html>
`
}

function syncLocalArrowRuntime(srcDir) {
  const distFile = join(rootDir, 'packages', 'core', 'dist', 'index.mjs')
  const distChunksDir = join(rootDir, 'packages', 'core', 'dist', 'chunks')
  if (!existsSync(distFile)) {
    throw new Error('Missing packages/core/dist/index.mjs. Run `pnpm build:runtime` first.')
  }
  if (!existsSync(distChunksDir)) {
    throw new Error('Missing packages/core/dist/chunks. Run `pnpm build:runtime` first.')
  }

  const chunkTargetDir = join(srcDir, 'chunks')

  copyFileSync(distFile, join(srcDir, 'arrow.js'))
  rmSync(chunkTargetDir, { recursive: true, force: true })
  cpSync(distChunksDir, chunkTargetDir, { recursive: true })
}

function syncArrowPackageJson(packagePath, mode) {
  const pkg = existsSync(packagePath)
    ? JSON.parse(readFileSync(packagePath, 'utf8'))
    : {}
  pkg.name = 'js-framework-benchmark-arrowjs'
  pkg.version = '1.0.0'
  pkg.description = 'ArrowJS demo'
  pkg['js-framework-benchmark'] ??= {}
  pkg['js-framework-benchmark'].frameworkHomeURL = 'https://www.arrow-js.com/'

  if (mode === 'local') {
    pkg['js-framework-benchmark'].frameworkVersion = getVersionLabel()
    delete pkg['js-framework-benchmark'].frameworkVersionFromPackage
    delete pkg.scripts
    delete pkg.dependencies
    delete pkg.devDependencies
  } else {
    delete pkg['js-framework-benchmark'].frameworkVersion
    pkg['js-framework-benchmark'].frameworkVersionFromPackage = '@arrow-js/core'
    pkg.scripts = {
      dev: 'esbuild src/Main.js --bundle --format=esm --target=es2020 --outfile=dist/main.js --watch',
      'build-prod':
        'esbuild src/Main.js --bundle --format=esm --minify --target=es2020 --outfile=dist/main.js',
    }
    pkg.dependencies = {
      '@arrow-js/core': getPublishedCoreVersion(),
    }
    pkg.devDependencies = {
      esbuild: '0.27.4',
    }
  }

  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)
}

export function syncArrowBenchmark({ mode = benchmarkArrowMode } = {}) {
  assertBenchmarkArrowMode(mode)

  for (const keyed of [true, false]) {
    const targetDir = frameworkDir(keyed)
    const srcDir = join(targetDir, 'src')
    const packagePath = join(targetDir, 'package.json')
    const indexPath = join(targetDir, 'index.html')
    const mainPath = join(srcDir, 'Main.js')

    mkdirSync(srcDir, { recursive: true })

    if (mode === 'local') {
      syncLocalArrowRuntime(srcDir)
      rmSync(join(targetDir, 'dist'), { recursive: true, force: true })
    } else {
      rmSync(join(srcDir, 'arrow.js'), { force: true })
      rmSync(join(srcDir, 'chunks'), { recursive: true, force: true })
    }

    writeFileSync(mainPath, createArrowMainSource(keyed, mode))
    writeFileSync(indexPath, createArrowIndexHtml(keyed, mode))
    syncArrowPackageJson(packagePath, mode)
  }
}

export function buildArrowBenchmark({ mode = benchmarkArrowMode } = {}) {
  assertBenchmarkArrowMode(mode)

  if (mode === 'local') {
    return
  }

  for (const keyed of [true, false]) {
    const targetDir = frameworkDir(keyed)
    run('npm', ['install'], { cwd: targetDir })
    run('npm', ['run', 'build-prod'], { cwd: targetDir })
  }
}
