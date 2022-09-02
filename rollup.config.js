import typescriptPlugin from "rollup-plugin-typescript2";

const dist = "build";

export default {
  input: "./src/index.ts",
  plugins: [
    typescriptPlugin(),
    {
      name: "retain-import-expression",
      resolveDynamicImport(specifier) {
        if (specifier === "node-fetch") return false;
        return null;
      },
      renderDynamicImport({ targetModuleId }) {
        if (targetModuleId === "node-fetch") {
          return {
            left: "import(",
            right: ")",
          };
        }

        return undefined;
      },
    },
  ],
  output: [
    {
      file: `${dist}/index.js`,
      format: "cjs",
    },
    {
      file: `${dist}/index.mjs`,
      format: "esm",
    },
  ],
  external: [
    "yargs",
    "cross-fetch",
    "yargs/helpers",
    "@maxqwars/metaform",
    "chalk",
    "cli-table3",
  ],
};
