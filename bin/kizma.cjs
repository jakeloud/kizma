#!/usr/bin/env node
var O=Object.create;var F=Object.defineProperty;var M=Object.getOwnPropertyDescriptor;var R=Object.getOwnPropertyNames;var L=Object.getPrototypeOf,B=Object.prototype.hasOwnProperty;var U=(e,t,n,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of R(t))!B.call(e,r)&&r!==n&&F(e,r,{get:()=>t[r],enumerable:!(o=M(t,r))||o.enumerable});return e};var P=(e,t,n)=>(n=e!=null?O(L(e)):{},U(t||!e||!e.__esModule?F(n,"default",{value:e,enumerable:!0}):n,e));var p={backend:{content:`const http = require('node:http')\r
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
`}};var u=require("node:fs/promises"),g=require("node:path"),I=P(require("esbuild"),1);var T=P(require("typescript"),1),z={},q=(e,t)=>e.flags&T.default.SymbolFlags.Alias?t.getAliasedSymbol(e):e,J=(e,t)=>({parameterName:e.name,typeName:t.typeToString(t.getTypeOfSymbolAtLocation(e,e.valueDeclaration))}),K=(e,t)=>e.getCallSignatures()[0].getParameters().map(o=>J(o,t)),Z=(e,t)=>{let n=t.getTypeOfSymbolAtLocation(e,e.declarations[0]);return{functionName:e.name,description:T.default.displayPartsToString(e.getDocumentationComment(t)),parameters:K(n,t)}},d=e=>{let t=T.default.createProgram([e],{}),n=t.getSourceFile(e),o=t.getTypeChecker(),r;try{r=o.getExportsOfModule(o.getSymbolAtLocation(n))}catch{return null}let c=r.find(i=>i.escapedName==="default");if(!c)return null;let s=q(c,o);return Z(s,o)},E=d;z.vitest&&(it("empty file doesn't throw",()=>{let t=d("__mocks__/empty.ts");expect(t).toBe(null)}),it("file without default export doesn't throw",()=>{let t=d("__mocks__/noDefaultExport.ts");expect(t).toBe(null)}),it("adder schema is correct",()=>{let t=d("__mocks__/adder.ts");expect(t).toEqual({description:"Function that adds two numbers",functionName:"add",parameters:[{parameterName:"n",typeName:"number"}]})}),it("type resolution works",()=>{let t=d("__mocks__/typeResolution.ts"),{typeName:n}=t.parameters[0];expect(n).toBe("number")}),it("function resolution works",()=>{let t=d("__mocks__/functionResolution.ts"),{functionName:n,parameters:o}=t;expect(n).toBe("copy"),expect(o[0].parameterName).toBe("x")}),it("base types",()=>{let t=d("__mocks__/baseTypes.ts"),{parameters:n}=t,o=n.map(r=>r.typeName);expect(o).toStrictEqual(["number","string"])}));var W={string:"text",number:"number"},Y=e=>{let t=e.parameters.map(o=>{let r=o.parameterName,c=W[o.typeName],s=`<input name=${o.parameterName} id="${r}" type="${c}"></input>`;return`<label for="${r}">${o.parameterName}${s}</label>`}),n=`<button>${e.functionName}</button>`;return`<form id="${e.formId}">${t.join("")}${n}</form>`},G=e=>{let{filePath:t,...n}=e;return`<script>${`window.KIZMA_DATA = ${JSON.stringify(n)}`}</script>`},Q=({templates:e,schema:t})=>{let n=t.apiPath,o=t.formId;return e.module.content.replace("%TITLE%",t.moduleName).replaceAll("%DESCRIPTION%",t.description).replace("%FORM%",Y(t)).replace("%KIZMA%",G(t))},x=Q;var N=require("node:fs/promises"),S=require("node:path"),$=async e=>{let t=await(0,N.readdir)((0,S.resolve)(e)),n=r=>(async()=>{let s=(0,S.resolve)(e,r),a=(0,S.parse)(s).name;return(await(0,N.stat)(s)).isDirectory()?(await $(s)).map(({relativePath:f,...m})=>({relativePath:[r,f].join("/"),...m})):{relativePath:a,filePath:s,fileName:a}})();return(await Promise.all(t.map(n))).flat()},V=async e=>await $(e),h=V;var D=require("node:fs/promises");var X=async e=>{let t=await h(e),o=(await Promise.all(t.map(({filePath:r,relativePath:c})=>new Promise((s,a)=>{(0,D.readFile)(r,"utf-8").then(i=>s({relativePath:c,content:i}),i=>a(i))})))).reduce((r,{relativePath:c,content:s})=>Object.assign(r,{[c]:{content:s}}),{});return typeof p>"u"?o:Object.assign(p,o)},v=X;var tt=({templates:e,schemas:t,inDir:n,outDir:o})=>{let r=t.map(({safeFullModuleName:a,relativePath:i})=>`import ${a} from './${n}/${i}'`).join(`
`),c=t.map(a=>{let i=a.relativePath,l=a.safeFullModuleName,f=a.apiPath,m=JSON.stringify(a);return`'${f}':{fn:${l}, schema: ${m}}`}).join(`,
`);return e.backend.content.replace("/*IMPORTS*/",r).replace("/*HANDLERS*/",c).replace("%STATIC_DIR%",o)},k=tt;var et=async(e,t,n,o)=>{let r=await h(e),c=await v(n),s=r.map(({filePath:i,relativePath:l,fileName:f})=>{let m=E(i),_=l.replaceAll(/(\/|\.)/g,"_"),b={filePath:i,relativePath:l,safeFullModuleName:_,moduleName:f,apiPath:`/${e}/${l}`,formId:`/${e}/${l}`,outFile:(0,g.resolve)(t,`${l}.html`)};return Object.assign(m,b)});if(o){let i=(0,g.resolve)(t);await(0,u.rm)(i,{force:!0,recursive:!0}),await(0,u.mkdir)(i,{recursive:!0});let l=s.map(m=>(async()=>{let b=x({templates:c,schema:m}),w=m.outFile,y=(0,g.parse)(w).dir;try{await stat(y)}catch{await(0,u.mkdir)(y,{recursive:!0})}await(0,u.writeFile)(w,b)})()),f=[{templateName:"client",relativeOutFile:"client.js"},{templateName:"styles",relativeOutFile:"styles.css"}].map(({templateName:m,relativeOutFile:_})=>(async()=>{let w=c[m].content,y=(0,g.resolve)(t,_),A=(0,g.parse)(y).dir;try{await stat(A)}catch{await(0,u.mkdir)(A,{recursive:!0})}await(0,u.writeFile)(y,w)})());await Promise.all(l.concat(f))}let a=k({templates:c,schemas:s,inDir:e,outDir:t});return await I.build({stdin:{contents:a,resolveDir:".",sourcefile:"server.ts",loader:"ts"},bundle:!0,platform:"node",outfile:"server.cjs",external:["dotenv"]}),a},C=et;var rt={},ot=e=>{let t=[],n=[];for(let o of e)o.startsWith("-")?o.substring(1).split("").forEach(r=>t.push(r)):n.push(o);return{modifiers:t,values:n}},nt=e=>{let t="public",n="templates",o="api",r=ot(e.splice(2)),c=r.modifiers.includes("f"),s=r.modifiers.filter(l=>l!=="f"),a=r.values;for(let l of s)switch(l){case"o":t=a.shift();break;case"t":n=a.shift();break;default:throw new Error(`Unknown modifier: -${l}`)}return a[0]&&(o=a[0]),[o,t,n,c]},j=nt;rt.vitest;var at=j(process.argv);C(...at);
