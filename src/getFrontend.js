const INPUT_TYPE_MAP = {
  string: 'text',
  number: 'number',
}

const getForm = (schema) => {
  const inputs = schema.parameters.map(
    (param) => {
      const id = param.parameterName
      const inputType = INPUT_TYPE_MAP[param.typeName]
      const input = 
        `<input name=${param.parameterName} id="${id}" type="${inputType}"></input>`
      const label =
        `<label for="${id}">${param.parameterName}${input}</label>`
      return label
    }
  )
  const button = `<button>${schema.functionName}</button>`
  return `<form id="${schema.formId}">${inputs.join('')}${button}</form>`
}

const getScript = (schema) => {
  const {filePath, ...kizmaData} = schema
  const scriptBody = `window.KIZMA_DATA = ${JSON.stringify(kizmaData)}`
  return `<script>${scriptBody}</script>`
}

const getFrontend = ({templates, schema})  => {
  const apiPath = schema.apiPath
  const formId = schema.formId
  const outContent = templates['module'].content
    .replace('%TITLE%', schema.moduleName)
    .replaceAll('%DESCRIPTION%', schema.description)
    .replace('%FORM%', getForm(schema))
    .replace('%KIZMA%', getScript(schema))
  
  return outContent
}

export default getFrontend
