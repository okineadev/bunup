import { type DefineConfigItem, defineWorkspace } from "bunup";

const COMMON_OPTIONS: Partial<DefineConfigItem> = {
    outDir: "dist",
    minify: true,
    splitting: false,
    target: "bun",
    format: ["esm"],
};

export default defineWorkspace([
    {
        name: "bunup",
        root: ".",
        config: [
            {
                ...COMMON_OPTIONS,
                entry: ["src/index.ts"],
                dts: true,
            },
            {
                ...COMMON_OPTIONS,
                entry: ["src/cli.ts"],
            },
            {
                ...COMMON_OPTIONS,
                entry: { plugins: "src/plugins/built-in/index.ts" },
                dts: true,
            },
        ],
    },
    {
        name: "create-bunup",
        root: "create-bunup",
        config: [
            {
                ...COMMON_OPTIONS,
                entry: ["src/index.ts"],
            },
        ],
    },
]);
