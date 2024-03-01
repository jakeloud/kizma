export default {
  test: {
    globals: true,
    includeSource: ['src/**/*.js'],
    coverage: {
      enabled: true,
      include: ['src/**/*.js'],
      exclude: ['src/kizma.js'], // <- cli wrapper (no logic)
    },
  },
}
