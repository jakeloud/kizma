import { readFile } from 'node:fs/promises'

import genProject from './genProject.js'

/** Templates are inlined into bin after compilation */
const genTemplates = async (templatesDir) => {
  const project = await genProject(templatesDir)
  const templates = await Promise.all(project.map(
    ({filePath, relativePath}) => new Promise((resolve, reject) => {
      readFile(filePath, 'utf-8').then(
        (content) => resolve({relativePath, content}),
        (err) => reject(err)
      )
    })
  ))

  const keyedTemplates = templates.reduce(
    (acc, {relativePath, content}) => Object.assign(
      acc,
      {[relativePath]: {content}}
    ),
    {}
  )

  if (typeof CACHED_TEMPLATES === 'undefined') {
    return keyedTemplates
  }
  return Object.assign(CACHED_TEMPLATES, keyedTemplates)
}

export default genTemplates
