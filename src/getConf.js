const parseArgv = (argv) => {
  const modifiers = []
  const values = []

  for (const arg of argv) {
    if (arg.startsWith('-')) {
      arg
        .substring(1)
        .split('')
        .forEach(l => modifiers.push(l))
    } else {
      values.push(arg)
    }
  }

  return { modifiers, values }
}

const getConf = (argv) => {
  let outDir = 'public'
  let templatesDir = 'templates'
  let inDir = 'api'

  const parsed = parseArgv(argv.splice(2))

  const generateFrontend = parsed.modifiers.includes('f')
  const modifiers = parsed.modifiers.filter(l => l !== 'f')
  const values = parsed.values

  for (const mod of modifiers) {
    switch (mod) {
      case 'o':
        outDir = values.shift()
        break;
      case 't':
        templatesDir = values.shift()
        break;
      default:
        throw new Error(`Unknown modifier: -${mod}`)
    }
  }

  if (values[0]) {
    inDir = values[0]
  }


  const conf = [
    inDir, outDir, templatesDir, generateFrontend,
  ]

  return conf
}

export default getConf
