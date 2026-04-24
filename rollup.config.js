import resolve from "@rollup/plugin-node-resolve";

import typescript from "rollup-plugin-typescript2";
import terser from "@rollup/plugin-terser";

import pkg from "./package.json";

const minifyExtension = (pathToFile) => pathToFile.replace(/\.js$/, ".min.js");

const allExternalDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
const external = allExternalDeps.length
  ? (id) => allExternalDeps.some((dep) => id === dep || id.startsWith(dep + "/"))
  : () => false;

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    {
      file: minifyExtension(pkg.main),
      format: "cjs",
      plugins: [terser()],
    },
    {
      file: pkg.module,
      format: "es",
    },
  ],
  plugins: [
    resolve(),
    typescript({
      typescript: require("typescript"),
    }),
  ],
  external,
};
