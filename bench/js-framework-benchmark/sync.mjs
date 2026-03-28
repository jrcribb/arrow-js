import { benchmarkArrowMode, ensureBenchmarkRepo, syncArrowBenchmark } from './lib.mjs'

ensureBenchmarkRepo()
syncArrowBenchmark()
console.log(
  `Synced the ${benchmarkArrowMode === 'local' ? 'local runtime-backed' : 'npm-backed'} Arrow benchmark source into the official js-framework-benchmark Arrow entry`
)
