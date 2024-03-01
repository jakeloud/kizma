import { readdir, stat } from 'node:fs/promises'
import { resolve, parse } from 'node:path'

/**
 * example return [
 *   "src/test.txt",
 *   "src/sub/a.js"
 * ]
 */
const findAllFilesInDir = async (dirName) => {
  const files = await readdir(resolve(dirName))
  const PromiseForFile = (file) => {
    const fn = async () => {
      const filePath = resolve(dirName, file)
      const fileName = parse(filePath).name

      const stats = await stat(filePath)
      if (stats.isDirectory()) {
        const fileData = await findAllFilesInDir(filePath)
        return fileData.map(({relativePath, ...rest}) =>
          ({relativePath: [file, relativePath].join('/'), ...rest})
        )
      }
      return {relativePath: fileName, filePath, fileName}
    }
    return fn()
  }

  const filesArray = await Promise.all(files.map(PromiseForFile))

  return filesArray.flat()
}

const genProject = async (inDir) => {
  return await findAllFilesInDir(inDir)
}

export default genProject

if (import.meta.vitest) {
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
}
