import * as esbuild from 'esbuild'
import genTemplates from '../src/genTemplates.js'

genTemplates('templates').then((templates) => {
  const define = {
    CACHED_TEMPLATES: JSON.stringify(templates),
  }

  esbuild.build({
    entryPoints: ['src/kizma.js'],
    bundle: true,
    minify: true,
    outdir: 'bin',
    platform: 'node',
    define,
    packages: 'external',
    outExtension: { '.js': '.cjs' },
  })
})
