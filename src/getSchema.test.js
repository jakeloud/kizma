import getSchema from './getSchema'

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

