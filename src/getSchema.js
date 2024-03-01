// https://github.com/microsoft/TypeScript/issues/54018
import ts from 'typescript'

// https://stackoverflow.com/questions/58886590/typescript-compiler-how-to-navigate-to-the-definition-of-a-symbol
const getAliasedSymbolIfNecessary = (symbol, checker) => {
  if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    return checker.getAliasedSymbol(symbol)
  }
  return symbol
}

const getParameterSchema = (param, checker) => {
  return {
    parameterName: param.name,
    typeName: checker.typeToString(
      checker.getTypeOfSymbolAtLocation(
        param, param.valueDeclaration
      )
    )
  }
}
const getParametersSchema = (symbolType, checker) => {
  const parameters = symbolType
    .getCallSignatures()[0].getParameters()
  return parameters.map(
    (p) => getParameterSchema(p, checker)
  )
}

const getFunctionSchema = (symbol, checker) => {
  const symbolType =
    checker.getTypeOfSymbolAtLocation(
      symbol, symbol.declarations[0],
    )

  return {
    functionName: symbol.name,
    description: ts.displayPartsToString(
      symbol.getDocumentationComment(checker)
    ),
    parameters: getParametersSchema(symbolType, checker)
  }
}

const getSchema = (filePath) => {
  const program = ts.createProgram([filePath], {})
  const sourceFile = program.getSourceFile(filePath)
  const checker = program.getTypeChecker()
  
  let allExports
  try {
    allExports = checker.getExportsOfModule(
      checker.getSymbolAtLocation(sourceFile)
    )
  } catch (e) {
    return null
  }

  const defaultExportSymbol = allExports.find(
    e => e.escapedName === "default"
  )
  if (!defaultExportSymbol) {
    return null
  }

  const noAliasSymbol = getAliasedSymbolIfNecessary(
    defaultExportSymbol, checker
  )
  const defaultExportSchema = getFunctionSchema(
    noAliasSymbol, checker
  )

  return defaultExportSchema
}

export default getSchema

if (import.meta.vitest) {
  it('empty file doesn\'t throw', () => {
    const p = '__mocks__/empty.ts'
    const emptySchema = getSchema(p)
    expect(emptySchema).toBe(null)
  })

  it('file without default export doesn\'t throw', () => {
    const p = '__mocks__/noDefaultExport.ts'
    const noDefaultExportSchema = getSchema(p)
    expect(noDefaultExportSchema).toBe(null)
  })

  it('adder schema is correct', () => {
    const p = '__mocks__/adder.ts'
    const adderSchema = getSchema(p)
    expect(adderSchema).toEqual({
      description: 'Function that adds two numbers',
      functionName: 'add',
      parameters: [
        { parameterName: 'n', typeName: 'number', }
      ],
    })
  })

  it('type resolution works', () => {
    const p = '__mocks__/typeResolution.ts'
    const typeResolutionSchema = getSchema(p)
    const { typeName } = typeResolutionSchema.parameters[0]
    expect(typeName).toBe('number')
  })

  it('function resolution works', () => {
    const p = '__mocks__/functionResolution.ts'
    const functionResolutionSchema = getSchema(p)
    const {
      functionName, parameters,
    } = functionResolutionSchema
    expect(functionName).toBe('copy')
    expect(parameters[0].parameterName).toBe('x')
  })

  it('base types', () => {
    const p = '__mocks__/baseTypes.ts'
    const baseTypesSchema = getSchema(p)
    const { parameters } = baseTypesSchema
    const typeNames = parameters.map(p => p.typeName)
    expect(typeNames).toStrictEqual(['number', 'string'])
  })
}
