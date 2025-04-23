import type { BunPlugin } from "../types";

export type BunupBunPlugin = {
    type: "bun";
    name?: string;
    plugin: BunPlugin;
};

export type Plugin = BunupBunPlugin;
