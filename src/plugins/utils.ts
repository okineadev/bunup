import type { BuildOptions } from "../options";
import type { BuildResult, BunupBunPlugin, BunupPlugin, Plugin } from "./types";

export function filterBunupBunPlugins(plugins: Plugin[]): BunupBunPlugin[] {
    return plugins.filter((p): p is BunupBunPlugin => p.type === "bun");
}

export function filterBunupPlugins(plugins: Plugin[]): BunupPlugin[] {
    return plugins.filter((p): p is BunupPlugin => p.type === "bunup");
}

export async function runBeforeBuildHooks(
    plugins: Plugin[] | undefined,
    options: BuildOptions,
): Promise<void> {
    const bunupPlugins = filterBunupPlugins(plugins ?? []);

    for (const plugin of bunupPlugins) {
        if (plugin.plugin.beforeBuild) {
            await plugin.plugin.beforeBuild(options);
        }
    }
}

export async function runAfterBuildHooks(
    plugins: Plugin[] | undefined,
    result: BuildResult,
): Promise<void> {
    const bunupPlugins = filterBunupPlugins(plugins ?? []);

    for (const plugin of bunupPlugins) {
        if (plugin.plugin.afterBuild) {
            await plugin.plugin.afterBuild(result);
        }
    }
}
