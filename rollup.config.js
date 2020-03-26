import typescript from 'rollup-plugin-typescript2'

import pkg from './package.json'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
  external: [
    "fs",
    "stream",
    "path",
    "events",
    "rxjs",
    "rxjs/operators",
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],

  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
  ],
}
