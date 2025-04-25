import path from "node:path";

import {
    bundle as buncheeBuild,
    type BundleConfig as BuncheeOptions,
} from "bunchee";
import { build as tsdownBuild, type Options as TsdownOptions } from "tsdown";
import {
    build as unbuildBuild,
    type BuildOptions as UnbuildOptions,
} from "unbuild";
import {
    build as bunupBuild,
    type BuildOptions as BunupOptions,
} from "../../dist/index.mjs";

import { ENTRY_POINT, RESULTS_FILE } from "./constants";
import { runBenchmarksForBundlers, saveBenchmarkResults } from "./utils.js";
import type { Bundler } from "./types";

const bundlers: Bundler[] = [
    {
        name: "bunup",
        buildFn: (options: BunupOptions) => bunupBuild(options),
        options: (dts): BunupOptions => ({
            entry: [ENTRY_POINT],
            outDir: "dist/bunup",
            format: ["esm", "cjs"],
            dts,
            clean: true,
            // tree shaking is always enabled, so we don't need to pass treeshake: true
            // https://bun.sh/blog/bun-bundler?utm_source=chatgpt.com#tree-shaking
        }),
    },
    {
        name: "tsdown",
        buildFn: tsdownBuild,
        options: (dts): TsdownOptions => ({
            entry: [ENTRY_POINT],
            outDir: "dist/tsdown",
            format: ["esm", "cjs"],
            ...(dts && {
                dts: {
                    isolatedDeclarations: true,
                },
            }),
            treeshake: true,
            clean: true,
        }),
    },
    {
        name: "unbuild",
        buildFn: (options: UnbuildOptions) =>
            // @ts-expect-error
            unbuildBuild(process.cwd(), false, options),
        options: (dts): UnbuildOptions => ({
            // @ts-expect-error
            entries: [ENTRY_POINT],
            outDir: "dist/unbuild",
            format: ["esm", "cjs"],
            failOnWarn: false,
            declaration: dts,
            clean: true,
        }),
    },
    {
        name: "bunchee",
        buildFn: (options: BuncheeOptions) => buncheeBuild("", options),
        options: (dts): BuncheeOptions => ({
            // @ts-expect-error
            format: ["esm", "cjs"],
            clean: true,
            // @ts-expect-error
            dts,
        }),
    },
];

async function runBenchmarks() {
    try {
        const results = await runBenchmarksForBundlers(bundlers);
        const benchmarkFilePath = path.resolve(process.cwd(), RESULTS_FILE);
        await saveBenchmarkResults(results, benchmarkFilePath);
    } catch (error) {
        console.error("Benchmarking failed:", error);
    }
}

runBenchmarks();
