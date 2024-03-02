# Kizma

Kizma is a wrapper around typescript files, that generates nodejs rest api and handy frontend for quick prototyping.
If you will ever need to migrate to full-blown framework, you can preserve all logic, as source code is plain ts without any specific framework lock-in.

Right now only `number` and `string` types are supported as function parameters.

## Usage

```
npm i -D kizma
```

api/example.ts
```ts
const add = (n: number) => n + 1
export default add
```

add this script to package.json for compilation
```
"build": "kizma"
```

## Options

pass `-f` to also generate frontend.
Output directory can be specified with `-o` default value being `public`.
example: `kizma -fo dist`

pass `-t` to override path to templates dir, default being `templates`.
example: `kizma -t boilerplate/backend`
