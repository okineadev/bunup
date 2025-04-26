import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";

import { ITERATIONS } from "./constants.ts";

export async function runBenchmarksForBundlers(bundlers) {
    const results = [];

    console.log("Performing warmup builds...");

    for (const bundler of bundlers) {
        for (const dts of [false, true]) {
            const options = bundler.options(dts);
            console.log(`Warming up ${bundler.name} (dts: ${dts})...`);
            await bundler.buildFn(options);
        }
    }
    console.log("Warmup complete. Starting benchmark...\n");

    for (const dts of [false, true]) {
        for (const bundler of bundlers) {
            const options = bundler.options(dts);
            let totalTime = 0;

            for (let i = 0; i < ITERATIONS; i++) {
                const start = performance.now();
                await bundler.buildFn(options);
                totalTime += performance.now() - start;
            }

            const averageTime = totalTime / ITERATIONS;
            results.push({
                name: bundler.name,
                format: "esm, cjs",
                dts,
                averageTime,
            });
        }
    }

    return results;
}

function formatBenchmarkResults(results) {
    const bundlerGroups = {};

    for (const result of results) {
        if (!bundlerGroups[result.name]) {
            bundlerGroups[result.name] = {};
        }
        bundlerGroups[result.name][result.dts ? "withDts" : "withoutDts"] =
            `${result.averageTime.toFixed(2)}ms`;
    }

    const lines = [];
    for (const bundlerName in bundlerGroups) {
        const withoutDts = bundlerGroups[bundlerName].withoutDts || "N/A";
        const withDts = bundlerGroups[bundlerName].withDts || "N/A";
        lines.push(
            `${bundlerName}: ${withoutDts} - ${bundlerName} (+dts): ${withDts}`,
        );
    }

    return lines.join("\n");
}

export async function saveBenchmarkResults(results, filePath) {
    const formattedResults = formatBenchmarkResults(results);
    await fs.writeFile(filePath, formattedResults, "utf-8");
    console.log(`Benchmark results saved to ${filePath}`);
}

export async function appendBenchmarkResults(newResults, filePath) {
    try {
        let existingContent = "";
        try {
            existingContent = await fs.readFile(filePath, "utf-8");
            if (existingContent && !existingContent.endsWith("\n")) {
                existingContent += "\n";
            }
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
        }

        const newFormattedResults = formatBenchmarkResults(newResults);

        const combinedContent = existingContent + newFormattedResults;
        await fs.writeFile(filePath, combinedContent, "utf-8");
        console.log(`Updated benchmark results in ${filePath}`);
    } catch (error) {
        console.error(`Error appending benchmark results: ${error.message}`);
        throw error;
    }
}
