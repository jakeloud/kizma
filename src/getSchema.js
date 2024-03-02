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
