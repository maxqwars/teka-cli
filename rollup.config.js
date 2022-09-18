import typescriptPlugin from "rollup-plugin-typescript2";
import envFiles from "@jjldxz/rollup-plugin-env-files";

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
    envFiles({
      preventAssignment: true,
    }),
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
    "cli-table3",
    "node:fs",
    "node:path",
    "node:child_process",
    "node:os",
    "https",
    "colorette",
    "socks-proxy-agent"
  ],
};
