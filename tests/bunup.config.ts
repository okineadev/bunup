import { defineConfig } from "../dist/index.mjs";
import { lintUnusedExports } from "../dist/plugins.mjs";

export default defineConfig({
    entry: ["fixtures/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    plugins: [
        lintUnusedExports({
            include: "fixtures/**/*.ts",
            exclude: "node_modules/**",
        }),
    ],
});
