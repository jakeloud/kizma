import genProject from './genProject'

it('project map', async () => {
  const res = await genProject('__mocks__/crawl-test')

  const excludeFilePath = res.map(
    ({fileName, relativePath}) => ({
      fileName, relativePath,
    })
  )
  expect(excludeFilePath).toStrictEqual(
    [
      {
        fileName: "index",
        relativePath: "index",
      },
      {
        fileName: "hello",
        relativePath: "person/hello",
      },
      {
        fileName: "id",
        relativePath: "person/id",
      },
    ]
  )
})

it('no such directory', async () => {
  const res = await genProject('__mocks__/this-does-not-exist')
  expect(res).toStrictEqual([])
})
