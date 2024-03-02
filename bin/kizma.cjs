#!/usr/bin/env node
var R=Object.create;var x=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var B=Object.getOwnPropertyNames;var U=Object.getPrototypeOf,H=Object.prototype.hasOwnProperty;var q=(e,t,o,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of B(t))!H.call(e,a)&&a!==o&&x(e,a,{get:()=>t[a],enumerable:!(n=L(t,a))||n.enumerable});return e};var F=(e,t,o)=>(o=e!=null?R(U(e)):{},q(t||!e||!e.__esModule?x(o,"default",{value:e,enumerable:!0}):o,e));var p={backend:{content:`const http = require('node:http')\r
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
`}};var u=require("node:fs/promises"),g=require("node:path"),j=F(require("esbuild"),1);var N=F(require("typescript"),1),Y={},K=(e,t)=>e.flags&N.default.SymbolFlags.Alias?t.getAliasedSymbol(e):e,Z=(e,t)=>({parameterName:e.name,typeName:t.typeToString(t.getTypeOfSymbolAtLocation(e,e.valueDeclaration))}),z=(e,t)=>e.getCallSignatures()[0].getParameters().map(n=>Z(n,t)),W=(e,t)=>{let o=t.getTypeOfSymbolAtLocation(e,e.declarations[0]);return{functionName:e.name,description:N.default.displayPartsToString(e.getDocumentationComment(t)),parameters:z(o,t)}},d=e=>{let t=N.default.createProgram([e],{}),o=t.getSourceFile(e),n=t.getTypeChecker(),a;try{a=n.getExportsOfModule(n.getSymbolAtLocation(o))}catch{return null}let i=a.find(c=>c.escapedName==="default");if(!i)return null;let s=K(i,n);return W(s,n)},A=d;Y.vitest&&(it("empty file doesn't throw",()=>{let t=d("__mocks__/empty.ts");expect(t).toBe(null)}),it("file without default export doesn't throw",()=>{let t=d("__mocks__/noDefaultExport.ts");expect(t).toBe(null)}),it("adder schema is correct",()=>{let t=d("__mocks__/adder.ts");expect(t).toEqual({description:"Function that adds two numbers",functionName:"add",parameters:[{parameterName:"n",typeName:"number"}]})}),it("type resolution works",()=>{let t=d("__mocks__/typeResolution.ts"),{typeName:o}=t.parameters[0];expect(o).toBe("number")}),it("function resolution works",()=>{let t=d("__mocks__/functionResolution.ts"),{functionName:o,parameters:n}=t;expect(o).toBe("copy"),expect(n[0].parameterName).toBe("x")}),it("base types",()=>{let t=d("__mocks__/baseTypes.ts"),{parameters:o}=t,n=o.map(a=>a.typeName);expect(n).toStrictEqual(["number","string"])}));var G={string:"text",number:"number"},Q=e=>{let t=e.parameters.map(n=>{let a=n.parameterName,i=G[n.typeName],s=`<input name=${n.parameterName} id="${a}" type="${i}"></input>`;return`<label for="${a}">${n.parameterName}${s}</label>`}),o=`<button>${e.functionName}</button>`;return`<form id="${e.formId}">${t.join("")}${o}</form>`},V=e=>{let{filePath:t,...o}=e;return`<script>${`window.KIZMA_DATA = ${JSON.stringify(o)}`}</script>`},X=({templates:e,schema:t})=>{let o=t.apiPath,n=t.formId;return e.module.content.replace("%TITLE%",t.moduleName).replaceAll("%DESCRIPTION%",t.description).replace("%FORM%",Q(t)).replace("%KIZMA%",V(t))},E=X;var P=require("node:fs/promises"),_=require("node:path"),tt={},v=async e=>{let t=await(0,P.readdir)((0,_.resolve)(e)),o=a=>(async()=>{let s=(0,_.resolve)(e,a),r=(0,_.parse)(s).name;return(await(0,P.stat)(s)).isDirectory()?(await v(s)).map(({relativePath:f,...m})=>({relativePath:[a,f].join("/"),...m})):{relativePath:r,filePath:s,fileName:r}})();return(await Promise.all(t.map(o))).flat()},D=async e=>await v(e),w=D;tt.vitest&&it("project map",async()=>{let t=(await D("__mocks__/crawl-test")).map(({fileName:o,relativePath:n})=>({fileName:o,relativePath:n}));expect(t).toStrictEqual([{fileName:"index",relativePath:"index"},{fileName:"hello",relativePath:"person/hello"},{fileName:"id",relativePath:"person/id"}])});var $=require("node:fs/promises");var et=async e=>{let t=await w(e),n=(await Promise.all(t.map(({filePath:a,relativePath:i})=>new Promise((s,r)=>{(0,$.readFile)(a,"utf-8").then(c=>s({relativePath:i,content:c}),c=>r(c))})))).reduce((a,{relativePath:i,content:s})=>Object.assign(a,{[i]:{content:s}}),{});return typeof p>"u"?n:Object.assign(p,n)},k=et;var ot={},I=({templates:e,schemas:t,inDir:o,outDir:n})=>{let a=t.map(({safeFullModuleName:r,relativePath:c})=>`import ${r} from './${o}/${c}'`).join(`
`),i=t.map(r=>{let c=r.relativePath,l=r.safeFullModuleName,f=r.apiPath,m=JSON.stringify(r);return`'${f}':{fn:${l}, schema: ${m}}`}).join(`,
`);return e.backend.content.replace("/*IMPORTS*/",a).replace("/*HANDLERS*/",i).replace("%STATIC_DIR%",n)},C=I;ot.vitest&&it("backend",()=>{let t=I({templates:{backend:{content:`/*IMPORTS*/
/*HANDLERS*/`}},schemas:[{relativePath:"a/file.ts",apiPath:"api/file",safeFullModuleName:"a_file"}],inDir:"in-dir",outDir:"out-dir"});expect(t).toBe(`import a_file from './in-dir/a/file.ts'
'api/file':{fn:a_file, schema: {"relativePath":"a/file.ts","apiPath":"api/file","safeFullModuleName":"a_file"}}`)});var nt=async(e,t,o,n)=>{let a=await w(e),i=await k(o),s=a.map(({filePath:c,relativePath:l,fileName:f})=>{let m=A(c),h=l.replaceAll(/(\/|\.)/g,"_"),S={filePath:c,relativePath:l,safeFullModuleName:h,moduleName:f,apiPath:`/${e}/${l}`,formId:`/${e}/${l}`,outFile:(0,g.resolve)(t,`${l}.html`)};return Object.assign(m,S)});if(n){let c=(0,g.resolve)(t);await(0,u.rm)(c,{force:!0,recursive:!0}),await(0,u.mkdir)(c,{recursive:!0});let l=s.map(m=>(async()=>{let S=E({templates:i,schema:m}),b=m.outFile,y=(0,g.parse)(b).dir;try{await stat(y)}catch{await(0,u.mkdir)(y,{recursive:!0})}await(0,u.writeFile)(b,S)})()),f=[{templateName:"client",relativeOutFile:"client.js"},{templateName:"styles",relativeOutFile:"styles.css"}].map(({templateName:m,relativeOutFile:h})=>(async()=>{let b=i[m].content,y=(0,g.resolve)(t,h),T=(0,g.parse)(y).dir;try{await stat(T)}catch{await(0,u.mkdir)(T,{recursive:!0})}await(0,u.writeFile)(y,b)})());await Promise.all(l.concat(f))}let r=C({templates:i,schemas:s,inDir:e,outDir:t});return await j.build({stdin:{contents:r,resolveDir:".",sourcefile:"server.ts",loader:"ts"},bundle:!0,platform:"node",outfile:"server.cjs",external:["dotenv"]}),r},M=nt;var at=e=>{let t=[],o=[];for(let n of e)n.startsWith("-")?n.substring(1).split("").forEach(a=>t.push(a)):o.push(n);return{modifiers:t,values:o}},rt=e=>{let t="public",o="templates",n="api",a=at(e.splice(2)),i=a.modifiers.includes("f"),s=a.modifiers.filter(l=>l!=="f"),r=a.values;for(let l of s)switch(l){case"o":t=r.shift();break;case"t":o=r.shift();break;default:throw new Error(`Unknown modifier: -${l}`)}return r[0]&&(n=r[0]),[n,t,o,i]},O=rt;var st=O(process.argv);M(...st);
