const http = require('node:http')
const url = require('node:url')
const path = require('node:path')
const { readFileSync, existsSync, statSync } = require('node:fs')

require('dotenv').config()
const PORT = process.env.PORT || 8080

/*IMPORTS*/

const STATIC_DIR = '%STATIC_DIR%'

const isPromise = (v) => 
  v => typeof v === 'object' && typeof v.then === 'function'

const handlers = {
  /*HANDLERS*/
}

const getHandler = (pathname) => handlers[pathname]

const executeHandler = async ({ fn, schema, parsedBody }) => {
  const argsArray = schema.parameters.map((paramSchema) => {
    const incoming = parsedBody[paramSchema.parameterName]
    if (incoming === undefined) {
      return undefined
    }
    if (paramSchema.typeName === 'string') {
      return incoming.toString()
    }
    if (paramSchema.typeName === 'number') {
      return Number(incoming)
    }
  })
  const thisArg = null

  try {
    const result = fn.apply(thisArg, argsArray)
    if (isPromise(result)) {
      return await result
    } else {
      return result
    }
  } catch(e) {
    console.log({e})
    return null
  }
}


const api = async (req, res, parsedBody) => {
  const pathname = url.parse(req.url).pathname
  const handler = getHandler(pathname)
  if (handler == null) {
    res.statusCode = 404
    res.end()
    return null
  }
  const { fn, schema } = handler
  const result = await executeHandler({ fn, schema, parsedBody })
  if (result === null) {
    res.statusCode = 500
    res.end()
  } else {
    res.write(JSON.stringify(result))
    res.end()
  }
}


const handle = async (req, res) => {
  const pathname = url.parse(req.url).pathname
  if (req.method === 'GET') {
    const pathname = url.parse(req.url).pathname
    const filePath = path.resolve(path.join(STATIC_DIR, pathname))
    if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
      res.write(readFileSync(filePath, 'utf8'))
    } else {
      res.statusCode = 404
      res.end()
    }
  } else if (req.method === 'POST') {
    try {
      let body = ''
      await new Promise<void>((resolve, reject) => {
        req.on('data', data => {
          body += data
          if (body.length > 1024) {
            req.socket.destroy()
            reject()
          }
        })
        req.on('end', async () => {
          let parsedBody
          try {
            parsedBody = JSON.parse(body)
          } catch(e) {
            parsedBody = {}
          }
          try {
            await api(req, res, parsedBody)
            resolve()
          } catch(e) {
            reject()
          }
        })
      })
    } catch(e) {}
  }
  res.end()
}

const server = http.createServer(handle)
server.listen(PORT, () => {
  console.log(`listening on port: ${server.address().port}`)
})
