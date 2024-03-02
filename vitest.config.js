export default {
  test: {
    globals: true,
    coverage: {
      enabled: true,
      include: ['src/**/*.js'],
      exclude: ['src/kizma.js'], // <- cli wrapper (no logic)
    },
  },
}
