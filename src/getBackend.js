const getBackend = ({templates, schemas, inDir, outDir}) => {
  const imports = schemas.map(
    ({safeFullModuleName, relativePath}) =>
      `import ${safeFullModuleName} from './${inDir}/${relativePath}'`
  ).join('\n')

  const handlers = schemas.map((schema) => {
    const relativePath = schema.relativePath
    const safeFullModuleName = schema.safeFullModuleName
    const apiPath = schema.apiPath
    const moduleSchema = JSON.stringify(schema)
    return `'${apiPath}':{fn:${safeFullModuleName}, schema: ${moduleSchema}}`
  }).join(',\n')

  const contents = templates['backend'].content
    .replace('/*IMPORTS*/', imports)
    .replace('/*HANDLERS*/', handlers)
    .replace('%STATIC_DIR%', outDir)

  return contents
}
export default getBackend

if (import.meta.vitest) {
  it('backend', () => {
    const input = {
      templates: {
        backend: {
          content: '/*IMPORTS*/\n/*HANDLERS*/',
        },
      },
      schemas: [
        {
          relativePath: 'a/file.ts',
          apiPath: 'api/file',
          safeFullModuleName: 'a_file',
        }
      ],
      inDir: 'in-dir',
      outDir: 'out-dir',
    }
    const generated = getBackend(input)

    const res = "import a_file from './in-dir/a/file.ts'\n'api/file':{fn:a_file, schema: {\"relativePath\":\"a/file.ts\",\"apiPath\":\"api/file\",\"safeFullModuleName\":\"a_file\"}}"
    expect(generated).toBe(res)
  })
}
