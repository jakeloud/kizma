import { rm, mkdir, writeFile } from 'node:fs/promises'
import { resolve, parse } from 'node:path'

import * as esbuild from 'esbuild'

import getSchema from './getSchema.js'
import getFrontend from './getFrontend.js'
import genProject from './genProject.js'
import genTemplates from './genTemplates.js'
import getBackend from './getBackend.js'

const DEFAULT_IN_DIR = 'api'
const DEFAULT_OUT_DIR = 'public'
const DEFAULT_TEMPLATES_DIR = 'templates'

const gen = async (
  inDir = DEFAULT_IN_DIR,
  outDir = DEFAULT_OUT_DIR,
  templatesDir = DEFAULT_TEMPLATES_DIR,
  generateFrontend = false,
) => {
  const project = await genProject(inDir)
  const templates = await genTemplates(templatesDir)

  const schemas = project.map(({filePath, relativePath, fileName}) => {
    const schema = getSchema(filePath)
    const safeFullModuleName = relativePath
      .replaceAll(/(\/|\.)/g, '_')

    const additionalData = {
      filePath,
      relativePath,
      safeFullModuleName,
      moduleName: fileName,
      apiPath: `/${inDir}/${relativePath}`,
      formId: `/${inDir}/${relativePath}`,
      outFile: resolve(outDir, `${relativePath}.html`),
    }

    return Object.assign(schema, additionalData)
  })

  if (generateFrontend) {
    const outdirPath = resolve(outDir)
    await rm(outdirPath, { force: true, recursive: true })
    await mkdir(outdirPath, { recursive: true })

    const frontendTasks = schemas.map((schema) => {
      const fn = async () => {
        const frontendContent = getFrontend({templates, schema})
        const outFile = schema.outFile
        const frontendDir = parse(outFile).dir
        try {
          await stat(frontendDir)
        } catch(e) {
          await mkdir(frontendDir, { recursive: true })
        }
        await writeFile(outFile, frontendContent)
      }
      return fn()
    })

    const staticTasks = [
      { templateName: 'client', relativeOutFile: 'client.js' },
      { templateName: 'styles', relativeOutFile: 'styles.css' },
    ].map(({templateName, relativeOutFile}) => {
      const fn = async () => {
        const staticContent = templates[templateName].content
        const outFile = resolve(outDir, relativeOutFile)
        const staticDir = parse(outFile).dir
        try {
          await stat(staticDir)
        } catch(e) {
          await mkdir(staticDir, { recursive: true })
        }
        await writeFile(outFile, staticContent)
      }
      return fn()
    })

    await Promise.all(frontendTasks.concat(staticTasks))
  }

  const backendCode = getBackend({templates, schemas, inDir, outDir})
  await esbuild.build({
    stdin: {
      contents: backendCode,
      resolveDir: '.',
      sourcefile: 'server.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    outfile: 'server.cjs',
    external: ['dotenv'],
  })

  return backendCode
}

export default gen
