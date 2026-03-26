import { reactive } from '@arrow-js/core'
import { sandbox, type HostBridge } from './index'

const plain = sandbox({
  source: {
    'main.ts': `export default html\`<div>plain</div>\``,
  },
})

const reactiveConfig = reactive({
  debug: true,
  shadowDOM: false,
  source: {
    'main.ts': `export default html\`<div>reactive</div>\``,
  },
})

const reactiveResult = sandbox(reactiveConfig)

const hostBridge: HostBridge = {
  'host-bridge:greetings': {
    getGreeting(name) {
      return { message: `Hello ${String(name)}` }
    },
  },
}

const bridgedResult = sandbox(
  {
    source: {
      'main.ts': `export default html\`<div>bridged</div>\``,
    },
  },
  undefined,
  hostBridge
)

void plain
void reactiveResult
void bridgedResult
