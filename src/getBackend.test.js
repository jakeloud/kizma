import getBackend from './getBackend'

if (import.meta.vitest) {
  it('backend', () => {
    const input = {
      templates: {
        backend: {
          content: '/*IMPORTS*/\n/*HANDLERS*/',
        },
      },
      schemas: [
        {
          relativePath: 'a/file.ts',
          apiPath: 'api/file',
          safeFullModuleName: 'a_file',
        }
      ],
      inDir: 'in-dir',
      outDir: 'out-dir',
    }
    const generated = getBackend(input)

    const res = "import a_file from './in-dir/a/file.ts'\n'api/file':{fn:a_file, schema: {\"relativePath\":\"a/file.ts\",\"apiPath\":\"api/file\",\"safeFullModuleName\":\"a_file\"}}"
    expect(generated).toBe(res)
  })
}
