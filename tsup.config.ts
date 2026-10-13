import { defineConfig } from 'tsup'

/**
 * `bundle: false` is load-bearing, not a preference. With bundling on, esbuild hoists
 * shared code into anonymous chunks and drops the 'use client' directive on the way, so
 * CarouselStrip and PaginationNav end up reachable from the server entry with no
 * directive at all. Compiling file to file keeps every module's own directive, which is
 * what React Server Components need to draw the boundary.
 *
 * React stays external: two copies of React in one tree is a broken app.
 */
export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  bundle: false,
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
  external: ['react', 'react-dom', 'next'],
})
