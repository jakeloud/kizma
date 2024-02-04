import { readFile } from 'node:fs/promises'

import genProject from './genProject.js'

const TEMPLATES_DIR = 'templates'

/** Templates are inlined into bin after compilation */
const genTemplates = async () => {
  if (typeof CACHED_TEMPLATES !== 'undefined') {
    return CACHED_TEMPLATES
  }

  const project = await genProject(TEMPLATES_DIR)
  const templates = await Promise.all(project.map(
    ({filePath, relativePath}) => new Promise((resolve, reject) => {
      readFile(filePath, 'utf-8').then(
        (content) => resolve({relativePath, content}),
        (err) => reject(err)
      )
    })
  ))
  return templates.reduce(
    (acc, {relativePath, content}) => Object.assign(
      acc,
      {[relativePath]: {content}}
    ),
    {}
  )
}

export default genTemplates
