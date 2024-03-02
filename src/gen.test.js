import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import gen from './gen'

it('smoke pass', async () => {
  const res = await gen('__mocks__/smoke', 'public', 'templates', true)
  expect(res).toEqual(expect.any(String))
})

it('smoke pass + modified template', async () => {
  this.CACHED_TEMPLATES = {
    'styles': { content: '' },
  }
  const outdirPath = resolve('public')
  await rm(outdirPath, {
    force: true, recursive: true,
  })
  const res = await gen('__mocks__/smoke', 'public', 'templates', true)
  expect(res).toEqual(expect.any(String))
})
