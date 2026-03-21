import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: {
    file: "../custom_components/everything_presence_pro/frontend/everything-presence-pro-panel.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    resolve(),
    json(),
    typescript(),
    terser(),
  ],
};
