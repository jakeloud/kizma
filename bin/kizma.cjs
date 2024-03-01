#!/usr/bin/env node
var _=Object.create;var N=Object.defineProperty;var M=Object.getOwnPropertyDescriptor;var L=Object.getOwnPropertyNames;var h=Object.getPrototypeOf,R=Object.prototype.hasOwnProperty;var k=(t,e,o,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of L(e))!R.call(t,r)&&r!==o&&N(t,r,{get:()=>e[r],enumerable:!(n=M(e,r))||n.enumerable});return t};var $=(t,e,o)=>(o=t!=null?_(h(t)):{},k(e||!t||!t.__esModule?N(o,"default",{value:t,enumerable:!0}):o,t));var p={backend:{content:`const http = require('node:http')\r
const url = require('node:url')\r
const path = require('node:path')\r
const { readFileSync, existsSync, statSync } = require('node:fs')\r
\r
require('dotenv').config()\r
const PORT = process.env.PORT || 8080\r
\r
/*IMPORTS*/\r
\r
const rootDir = '%ROOT%'\r
const STATIC_DIR = '%STATIC_DIR%'\r
\r
const isPromise = (v) => \r
  v => typeof v === 'object' && typeof v.then === 'function'\r
\r
const handlers = {\r
  /*HANDLERS*/\r
}\r
\r
const getHandler = (pathname) => handlers[pathname]\r
\r
const executeHandler = async ({ fn, schema, parsedBody }) => {\r
  const argsArray = schema.parameters.map((paramSchema) => {\r
    const incoming = parsedBody[paramSchema.parameterName]\r
    if (incoming === undefined) {\r
      return undefined\r
    }\r
    if (paramSchema.typeName === 'string') {\r
      return incoming.toString()\r
    }\r
    if (paramSchema.typeName === 'number') {\r
      return Number(incoming)\r
    }\r
  })\r
  const thisArg = null\r
\r
  try {\r
    const result = fn.apply(thisArg, argsArray)\r
    if (isPromise(result)) {\r
      return await result\r
    } else {\r
      return result\r
    }\r
  } catch(e) {\r
    console.log({e})\r
    return null\r
  }\r
}\r
\r
\r
const api = async (req, res, parsedBody) => {\r
  const pathname = url.parse(req.url).pathname\r
  const handler = getHandler(pathname)\r
  if (handler == null) {\r
    res.statusCode = 404\r
    res.end()\r
    return null\r
  }\r
  const { fn, schema } = handler\r
  const result = await executeHandler({ fn, schema, parsedBody })\r
  if (result === null) {\r
    res.statusCode = 500\r
    res.end()\r
  } else {\r
    res.write(JSON.stringify(result))\r
    res.end()\r
  }\r
}\r
\r
\r
const handle = async (req, res) => {\r
  const pathname = url.parse(req.url).pathname\r
  if (req.method === 'GET') {\r
    const pathname = url.parse(req.url).pathname\r
    const filePath = path.resolve(path.join(STATIC_DIR, pathname))\r
    if (existsSync(filePath) && !statSync(filePath).isDirectory()) {\r
      res.write(readFileSync(filePath, 'utf8'))\r
    } else {\r
      res.statusCode = 404\r
      res.end()\r
    }\r
  } else if (req.method === 'POST') {\r
    try {\r
      let body = ''\r
      await new Promise<void>((resolve, reject) => {\r
        req.on('data', data => {\r
          body += data\r
          if (body.length > 1024) {\r
            req.socket.destroy()\r
            reject()\r
          }\r
        })\r
        req.on('end', async () => {\r
          let parsedBody\r
          try {\r
            parsedBody = JSON.parse(body)\r
          } catch(e) {\r
            parsedBody = {}\r
          }\r
          try {\r
            await api(req, res, parsedBody)\r
            resolve()\r
          } catch(e) {\r
            reject()\r
          }\r
        })\r
      })\r
    } catch(e) {}\r
  }\r
  res.end()\r
}\r
\r
const server = http.createServer(handle)\r
server.listen(PORT, () => {\r
  console.log(\`listening on port: \${server.address().port}\`)\r
})\r
`},client:{content:`window.addEventListener('load', () => {\r
  const { formId, apiPath } = window.KIZMA_DATA || {}\r
  const formElement = document.getElementById(formId)\r
\r
  const onFulfil = (result) => {\r
    const resultContainer = document.getElementById('result')\r
    resultContainer.innerText = JSON.stringify(result)\r
  }\r
\r
  const onSubmit = (event) => {\r
    const targetElement = event.target\r
    let body = {}\r
    for (const input of targetElement) {\r
      const {name, value} = input\r
      if (name) {\r
        body = Object.assign(body, {[name]: value})\r
      }\r
    }\r
    const prom = fetch(apiPath, {\r
      method: 'POST',\r
      body: JSON.stringify(body),\r
    })\r
    prom.then(r => r.json()).then(onFulfil)\r
    event.preventDefault()\r
  }\r
\r
  formElement.addEventListener('submit', onSubmit)\r
})\r
`},module:{content:`<!DOCTYPE html>\r
<html lang="en">\r
  <head>\r
    <title>%TITLE%</title>\r
    <meta name="description" content="%DESCRIPTION%">\r
    <meta charset="UTF-8" />\r
    <meta name="viewport" content="width=device-width,initial-scale=1" />\r
    <link rel="stylesheet" href="./styles.css">\r
    <link rel="preconnect" href="https://fonts.cdnfonts.com">\r
  </head>\r
  <body>\r
    <main class="container">\r
      <div class="description">%DESCRIPTION%</div>\r
      %FORM%\r
      <div id="result"></div>\r
      %KIZMA%\r
      <script src="/client.js"></script>\r
    </main>\r
  </body>\r
</html>\r
`},styles:{content:`@import url('https://fonts.cdnfonts.com/css/sofia-pro');\r
@import url('https://fonts.cdnfonts.com/css/cubano');\r
\r
body {\r
  background: linear-gradient(176deg,rgb(18,24,27) 50%,rgb(32,39,55) 100%);\r
  min-height: 100vh;\r
  background-attachment: fixed;\r
\r
  display: flex;\r
  flex-direction: column;\r
  align-items: center;\r
  margin: 0;\r
}\r
\r
\r
.container {\r
  box-sizing: border-box;\r
  width: 100%;\r
  max-width: 840px;\r
  padding: 1rem;\r
\r
  color: #d1d5db;\r
  font-size: 1rem;\r
  font-family: sofia pro,sans-serif;\r
  font-weight: 500;\r
}\r
\r
.container p {\r
  color: #d1d5db;\r
  font-size: 1rem;\r
  font-family: sofia pro,sans-serif;\r
  font-weight: 500;\r
}\r
\r
\r
.container h1 {\r
  font-family: Cubano, sans-serif;\r
  color: #fff;\r
  font-size: 2.5rem;\r
  font-weight: 400;\r
}\r
\r
.container button {\r
  font-family: Cubano, sans-serif;\r
  display: flex;\r
  justify-content: center;\r
  align-items: center;\r
  width: auto;\r
  height: auto;\r
  font-size: 1.25rem;\r
\r
  background: #fff;\r
  border: none;\r
  padding: 0.5rem 1rem;\r
\r
  box-shadow: 6px 6px 0 #000;\r
\r
  transition: all cubic-bezier(.4,0,.2,1) .3s;\r
\r
  cursor: pointer;\r
}\r
\r
.container form>* {\r
  margin: 1rem;\r
}\r
\r
\r
.container button:hover {\r
  color: #fff;\r
  box-shadow: 0 0 7px rgba(168,85,247,.5);\r
  background: rgb(147 51 234);\r
}\r
\r
.container label {\r
  font-family: sofia pro, sans-serif;\r
  font-size: 1rem;\r
  font-weight: 700;\r
  color: rgb(178 190 205);\r
  text-transform: capitalize;\r
  display: flex;\r
  flex-direction: column;\r
  width: fit-content;\r
}\r
\r
.container input:not([type]),\r
.container input[type="text"],\r
.container input[type="number"] {\r
  background: rgba(18, 24, 27, 0.5);\r
  border: none;\r
  border-bottom: 4px solid rgb(168, 85, 247);\r
  padding: 0.75rem;\r
  font-family: sofia pro, sans-serif;\r
  font-size: 1.25rem;\r
  font-weight: 400;\r
  color: #fff;\r
  transition: all cubic-bezier(.4,0,.2,1) .3s;\r
}\r
\r
.container input:not([type]):focus,\r
.container input[type="text"]:focus,\r
.container input[type="number"]:focus {\r
  outline: none;\r
\r
  background: rgba(28, 34, 37, 0.8);\r
}\r
\r
.container input::-moz-placeholder,\r
.container textarea::-moz-placeholder {\r
  opacity: 1;\r
  color: #9ca3af\r
}\r
\r
.container input::placeholder,\r
.container textarea::placeholder {\r
  opacity: 1;\r
  color: #9ca3af\r
}\r
\r
\r
::-webkit-scrollbar {\r
  height: .375rem;\r
  width: .375rem\r
}\r
\r
::-webkit-scrollbar-track {\r
  background-color: rgb(18 24 27);\r
}\r
\r
::-webkit-scrollbar-thumb {\r
  border-radius: .125rem;\r
  background-color: rgb(69 78 86);\r
}\r
\r
::-webkit-scrollbar-thumb:hover {\r
  background-color: rgb(108 121 131 / 0.9);\r
}\r
`}};var u=require("node:fs/promises"),d=require("node:path"),x=$(require("esbuild"),1);var P=$(require("typescript"),1),B=(t,e)=>t.flags&P.default.SymbolFlags.Alias?e.getAliasedSymbol(t):t,H=(t,e)=>({parameterName:t.name,typeName:e.typeToString(e.getTypeOfSymbolAtLocation(t,t.valueDeclaration))}),J=(t,e)=>t.getCallSignatures()[0].getParameters().map(n=>H(n,e)),K=(t,e)=>{let o=e.getTypeOfSymbolAtLocation(t,t.declarations[0]);return{functionName:t.name,description:P.default.displayPartsToString(t.getDocumentationComment(e)),parameters:J(o,e)}},Z=t=>{let e=P.default.createProgram([t],{}),o=e.getSourceFile(t),n=e.getTypeChecker(),c=n.getExportsOfModule(n.getSymbolAtLocation(o)).find(i=>i.escapedName==="default");if(!c)return null;let a=B(c,n);return K(a,n)},E=Z;var z={string:"text",number:"number"},Y=t=>{let e=t.parameters.map(n=>{let r=n.parameterName,c=z[n.typeName],a=`<input name=${n.parameterName} id="${r}" type="${c}"></input>`;return`<label for="${r}">${n.parameterName}${a}</label>`}),o=`<button>${t.functionName}</button>`;return`<form id="${t.formId}">${e.join("")}${o}</form>`},q=t=>{let{filePath:e,...o}=t;return`<script>${`window.KIZMA_DATA = ${JSON.stringify(o)}`}</script>`},G=({templates:t,schema:e})=>{let o=e.apiPath,n=e.formId;return t.module.content.replace("%TITLE%",e.moduleName).replaceAll("%DESCRIPTION%",e.description).replace("%FORM%",Y(e)).replace("%KIZMA%",q(e))},I=G;var F=require("node:fs/promises"),y=require("node:path"),D=async t=>{let e=await(0,F.readdir)((0,y.resolve)(t)),o=r=>(async()=>{let a=(0,y.resolve)(t,r),s=(0,y.parse)(a).name;return(await(0,F.stat)(a)).isDirectory()?(await D(a)).map(({relativePath:f,...m})=>({relativePath:[r,f].join("/"),...m})):{relativePath:s,filePath:a,fileName:s}})();return(await Promise.all(e.map(o))).flat()},Q=async t=>await D(t),b=Q;var O=require("node:fs/promises");var V=async t=>{let e=await b(t),n=(await Promise.all(e.map(({filePath:r,relativePath:c})=>new Promise((a,s)=>{(0,O.readFile)(r,"utf-8").then(i=>a({relativePath:c,content:i}),i=>s(i))})))).reduce((r,{relativePath:c,content:a})=>Object.assign(r,{[c]:{content:a}}),{});return typeof p>"u"?n:Object.assign(p,n)},j=V;var W=({templates:t,schemas:e,inDir:o,outDir:n})=>{let r=e.map(({safeFullModuleName:s,relativePath:i})=>`import ${s} from './${o}/${i}'`).join(`
`),c=e.map(s=>{let i=s.relativePath,l=s.safeFullModuleName,f=s.apiPath,m=JSON.stringify(s);return`'${f}':{fn:${l}, schema: ${m}}`}).join(`,
`);return t.backend.content.replace("/*IMPORTS*/",r).replace("/*HANDLERS*/",c).replace("%ROOT%",o).replace("%STATIC_DIR%",n)},v=W;var X="api",tt="public",et="templates",nt=async(t=X,e=tt,o=et,n=!1)=>{let r=await b(t),c=await j(o),a=r.map(({filePath:i,relativePath:l,fileName:f})=>{let m=E(i),T=l.replaceAll(/(\/|\.)/g,"_"),S={filePath:i,relativePath:l,safeFullModuleName:T,moduleName:f,apiPath:`/${t}/${l}`,formId:`/${t}/${l}`,outFile:(0,d.resolve)(e,`${l}.html`)};return Object.assign(m,S)});if(n){let i=(0,d.resolve)(e);await(0,u.rm)(i,{force:!0,recursive:!0}),await(0,u.mkdir)(i,{recursive:!0});let l=a.map(m=>(async()=>{let S=I({templates:c,schema:m}),A=m.outFile,g=(0,d.parse)(A).dir;try{await stat(g)}catch{await(0,u.mkdir)(g,{recursive:!0})}await(0,u.writeFile)(A,S)})()),f=[{templateName:"client",relativeOutFile:"client.js"},{templateName:"styles",relativeOutFile:"styles.css"}].map(({templateName:m,relativeOutFile:T})=>(async()=>{let A=c[m].content,g=(0,d.resolve)(e,T),w=(0,d.parse)(g).dir;try{await stat(w)}catch{await(0,u.mkdir)(w,{recursive:!0})}await(0,u.writeFile)(g,A)})());await Promise.all(l.concat(f))}let s=v({templates:c,schemas:a,inDir:t,outDir:e});return await x.build({stdin:{contents:s,resolveDir:".",sourcefile:"server.ts",loader:"ts"},bundle:!0,platform:"node",outfile:"server.cjs",external:["dotenv"]}),s},C=nt;C();
