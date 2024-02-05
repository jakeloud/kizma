#!/usr/bin/env node
var x=Object.create;var w=Object.defineProperty;var C=Object.getOwnPropertyDescriptor;var j=Object.getOwnPropertyNames;var M=Object.getPrototypeOf,_=Object.prototype.hasOwnProperty;var L=(t,e,o,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of j(e))!_.call(t,r)&&r!==o&&w(t,r,{get:()=>e[r],enumerable:!(n=C(e,r))||n.enumerable});return t};var F=(t,e,o)=>(o=t!=null?x(M(t)):{},L(e||!t||!t.__esModule?w(o,"default",{value:t,enumerable:!0}):o,t));var p={backend:{content:`const http = require('node:http')\r
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
`}};var u=require("node:fs/promises"),g=require("node:path"),O=F(require("esbuild"),1);var T=F(require("typescript"),1),R=(t,e)=>t.flags&T.default.SymbolFlags.Alias?e.getAliasedSymbol(t):t,k=(t,e)=>({parameterName:t.name,typeName:e.typeToString(e.getTypeOfSymbolAtLocation(t,t.valueDeclaration))}),B=(t,e)=>t.getCallSignatures()[0].getParameters().map(n=>k(n,e)),U=(t,e)=>{let o=e.getTypeOfSymbolAtLocation(t,t.declarations[0]);return{functionName:t.name,description:T.default.displayPartsToString(t.getDocumentationComment(e)),parameters:B(o,e)}},H=t=>{let e=T.default.createProgram([t],{}),o=e.getSourceFile(t),n=e.getTypeChecker(),i=n.getExportsOfModule(n.getSymbolAtLocation(o)).find(c=>c.escapedName==="default");if(!i)return null;let a=R(i,n);return U(a,n)},b=H;var J={string:"text",number:"number"},K=t=>{let e=t.parameters.map(n=>{let r=n.parameterName,i=J[n.typeName],a=`<input name=${n.parameterName} id="${r}" type="${i}"></input>`;return`<label for="${r}">${n.parameterName}${a}</label>`}),o=`<button>${t.functionName}</button>`;return`<form id="${t.formId}">${e.join("")}${o}</form>`},Z=t=>{let{filePath:e,...o}=t;return`<script>${`window.KIZMA_DATA = ${JSON.stringify(o)}`}</script>`},z=({templates:t,schema:e})=>{let o=e.apiPath,n=e.formId;return t.module.content.replace("%TITLE%",e.moduleName).replaceAll("%DESCRIPTION%",e.description).replace("%FORM%",K(e)).replace("%KIZMA%",Z(e))},N=z;var P=require("node:fs/promises"),S=require("node:path"),$=async t=>{let e=await(0,P.readdir)((0,S.resolve)(t)),o=r=>(async()=>{let a=(0,S.resolve)(t,r),s=(0,S.parse)(a).name;return(await(0,P.stat)(a)).isDirectory()?(await $(a)).map(({relativePath:f,...m})=>({relativePath:[r,f].join("/"),...m})):{relativePath:s,filePath:a,fileName:s}})();return(await Promise.all(e.map(o))).flat()},Y=async t=>await $(t),A=Y;var E=require("node:fs/promises");var q="templates",G=async()=>{if(typeof p<"u")return p;let t=await A(q);return(await Promise.all(t.map(({filePath:o,relativePath:n})=>new Promise((r,i)=>{(0,E.readFile)(o,"utf-8").then(a=>r({relativePath:n,content:a}),a=>i(a))})))).reduce((o,{relativePath:n,content:r})=>Object.assign(o,{[n]:{content:r}}),{})},I=G;var Q=({templates:t,schemas:e,inDir:o,outDir:n})=>{let r=e.map(({safeFullModuleName:s,relativePath:c})=>`import ${s} from './${o}/${c}'`).join(`
`),i=e.map(s=>{let c=s.relativePath,l=s.safeFullModuleName,f=s.apiPath,m=JSON.stringify(s);return`'${f}':{fn:${l}, schema: ${m}}`}).join(`,
`);return t.backend.content.replace("/*IMPORTS*/",r).replace("/*HANDLERS*/",i).replace("%ROOT%",o).replace("%STATIC_DIR%",n)},D=Q;var V="api",W="public",X=async t=>{let e=(0,g.resolve)(t);await(0,u.rm)(e,{force:!0,recursive:!0}),await(0,u.mkdir)(e,{recursive:!0})},tt=async(t=V,e=W)=>{let o=await A(t);await X(e);let n=await I(),r=o.map(({filePath:c,relativePath:l,fileName:f})=>{let m=b(c),d=l.replaceAll(/(\/|\.)/g,"_"),y={filePath:c,relativePath:l,safeFullModuleName:d,moduleName:f,apiPath:`/${t}/${l}`,formId:`/${t}/${l}`,outFile:(0,g.resolve)(e,`${l}.html`)};return Object.assign(m,y)}),i=r.map(c=>(async()=>{let f=N({templates:n,schema:c}),m=c.outFile,d=(0,g.parse)(m).dir;try{await stat(d)}catch{await(0,u.mkdir)(d,{recursive:!0})}await(0,u.writeFile)(m,f)})()),a=[{templateName:"client",relativeOutFile:"client.js"},{templateName:"styles",relativeOutFile:"styles.css"}].map(({templateName:c,relativeOutFile:l})=>(async()=>{let m=n[c].content,d=(0,g.resolve)(e,l),y=(0,g.parse)(d).dir;try{await stat(y)}catch{await(0,u.mkdir)(y,{recursive:!0})}await(0,u.writeFile)(d,m)})());await Promise.all(i.concat(a));let s=D({templates:n,schemas:r,inDir:t,outDir:e});await O.build({stdin:{contents:s,resolveDir:".",sourcefile:"server.ts",loader:"ts"},bundle:!0,platform:"node",outfile:"server.cjs",external:["dotenv"]})},v=tt;v();
