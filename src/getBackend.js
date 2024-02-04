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
    .replace('%ROOT%', inDir)
    .replace('%STATIC_DIR%', outDir)

  return contents
}
export default getBackend
