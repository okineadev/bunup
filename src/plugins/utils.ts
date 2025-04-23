import type { BunupBunPlugin, Plugin } from "./types";

export function filterBunupBunPlugins(plugins: Plugin[]): BunupBunPlugin[] {
    return plugins.filter((p): p is BunupBunPlugin => p.type === "bun");
}
