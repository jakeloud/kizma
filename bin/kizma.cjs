#!/usr/bin/env node
var M=Object.create;var F=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var _=Object.getOwnPropertyNames;var R=Object.getPrototypeOf,B=Object.prototype.hasOwnProperty;var H=(t,e,n,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of _(e))!B.call(t,o)&&o!==n&&F(t,o,{get:()=>e[o],enumerable:!(r=L(e,o))||r.enumerable});return t};var N=(t,e,n)=>(n=t!=null?M(R(t)):{},H(e||!t||!t.__esModule?F(n,"default",{value:t,enumerable:!0}):n,t));var u={backend:{content:`const http = require('node:http')\r
const url = require('node:url')\r
const path = require('node:path')\r
const { readFileSync, existsSync, statSync } = require('node:fs')\r
\r
require('dotenv').config()\r
const PORT = process.env.PORT || 8080\r
\r
/*IMPORTS*/\r
\r
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
`}};var p=require("node:fs/promises"),d=require("node:path"),x=N(require("esbuild"),1),D=require("esbuild-node-externals");var T=N(require("typescript"),1),K=(t,e)=>t.flags&T.default.SymbolFlags.Alias?e.getAliasedSymbol(t):t,U=(t,e)=>({parameterName:t.name,typeName:e.typeToString(e.getTypeOfSymbolAtLocation(t,t.valueDeclaration))}),Z=(t,e)=>t.getCallSignatures()[0].getParameters().map(r=>U(r,e)),z=(t,e)=>{let n=e.getTypeOfSymbolAtLocation(t,t.declarations[0]);return{functionName:t.name,description:T.default.displayPartsToString(t.getDocumentationComment(e)),parameters:Z(n,e)}},W=t=>{let e=T.default.createProgram([t],{}),n=e.getSourceFile(t),r=e.getTypeChecker(),o;try{o=r.getExportsOfModule(r.getSymbolAtLocation(n))}catch{return null}let i=o.find(c=>c.escapedName==="default");if(!i)return null;let s=K(i,r);return z(s,r)},h=W;var Y={string:"text",number:"number"},q=t=>{let e=t.parameters.map(r=>{let o=r.parameterName,i=Y[r.typeName],s=`<input name=${r.parameterName} id="${o}" type="${i}"></input>`;return`<label for="${o}">${r.parameterName}${s}</label>`}),n=`<button>${t.functionName}</button>`;return`<form id="${t.formId}">${e.join("")}${n}</form>`},G=t=>{let{filePath:e,...n}=t;return`<script>${`window.KIZMA_DATA = ${JSON.stringify(n)}`}</script>`},Q=({templates:t,schema:e})=>{let n=e.apiPath,r=e.formId;return t.module.content.replace("%TITLE%",e.moduleName).replaceAll("%DESCRIPTION%",e.description).replace("%FORM%",q(e)).replace("%KIZMA%",G(e))},v=Q;var S=require("node:fs/promises"),g=require("node:path"),E=async t=>{try{await(0,S.stat)((0,g.resolve)(t))}catch{return[]}let e=await(0,S.readdir)((0,g.resolve)(t)),n=o=>(async()=>{let s=(0,g.resolve)(t,o),a=(0,g.parse)(s).name;return(await(0,S.stat)(s)).isDirectory()?(await E(s)).map(({relativePath:f,...m})=>({relativePath:[o,f].join("/"),...m})):{relativePath:a,filePath:s,fileName:a}})();return(await Promise.all(e.map(n))).flat()},V=async t=>await E(t),A=V;var C=require("node:fs/promises");var X=async t=>{let e=await A(t),r=(await Promise.all(e.map(({filePath:o,relativePath:i})=>new Promise((s,a)=>{(0,C.readFile)(o,"utf-8").then(c=>s({relativePath:i,content:c}),c=>a(c))})))).reduce((o,{relativePath:i,content:s})=>Object.assign(o,{[i]:{content:s}}),{});return typeof u>"u"?r:Object.assign(u,r)},I=X;var tt=({templates:t,schemas:e,inDir:n,outDir:r})=>{let o=e.map(({safeFullModuleName:a,relativePath:c})=>`import ${a} from './${n}/${c}'`).join(`
`),i=e.map(a=>{let c=a.relativePath,l=a.safeFullModuleName,f=a.apiPath,m=JSON.stringify(a);return`'${f}':{fn:${l}, schema: ${m}}`}).join(`,
`);return t.backend.content.replace("/*IMPORTS*/",o).replace("/*HANDLERS*/",i).replace("%STATIC_DIR%",r)},j=tt;var et=async(t,e,n,r)=>{let o=await A(t),i=await I(n),s=o.map(({filePath:c,relativePath:l,fileName:f})=>{let m=h(c),w=l.replaceAll(/(\/|\.)/g,"_"),b={filePath:c,relativePath:l,safeFullModuleName:w,moduleName:f,apiPath:`/${t}/${l}`,formId:`/${t}/${l}`,outFile:(0,d.resolve)(e,`${l}.html`)};return Object.assign(m,b)});if(r){let c=(0,d.resolve)(e);await(0,p.rm)(c,{force:!0,recursive:!0}),await(0,p.mkdir)(c,{recursive:!0});let l=s.map(m=>(async()=>{let b=v({templates:i,schema:m}),P=m.outFile,y=(0,d.parse)(P).dir;try{await stat(y)}catch{await(0,p.mkdir)(y,{recursive:!0})}await(0,p.writeFile)(P,b)})()),f=[{templateName:"client",relativeOutFile:"client.js"},{templateName:"styles",relativeOutFile:"styles.css"}].map(({templateName:m,relativeOutFile:w})=>(async()=>{let P=i[m].content,y=(0,d.resolve)(e,w),$=(0,d.parse)(y).dir;try{await stat($)}catch{await(0,p.mkdir)($,{recursive:!0})}await(0,p.writeFile)(y,P)})());await Promise.all(l.concat(f))}let a=j({templates:i,schemas:s,inDir:t,outDir:e});return await x.build({stdin:{contents:a,resolveDir:".",sourcefile:"server.ts",loader:"ts"},bundle:!0,platform:"node",outfile:"server.cjs",plugins:[(0,D.nodeExternalsPlugin)()]}),a},O=et;var rt=t=>{let e=[],n=[];for(let r of t)r.startsWith("-")?r.substring(1).split("").forEach(o=>e.push(o)):n.push(r);return{modifiers:e,values:n}},ot=t=>{let e="public",n="templates",r="api",o=rt(t.splice(2)),i=o.modifiers.includes("f"),s=o.modifiers.filter(l=>l!=="f"),a=o.values;for(let l of s)switch(l){case"o":e=a.shift();break;case"t":n=a.shift();break;default:throw new Error(`Unknown modifier: -${l}`)}return a[0]&&(r=a[0]),[r,e,n,i]},k=ot;var nt=k(process.argv);O(...nt);
