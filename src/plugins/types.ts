import type { BuildOptions } from "../options";
import type { BunPlugin } from "../types";

export type BuildResult = {
    outDir: string;
    formats: string[];
};

export type BunupPluginHooks = {
    /**
     * Run before the build process starts
     */
    beforeBuild?: (options: BuildOptions) => void | Promise<void>;

    /**
     * Run after all build formats have been successfully processed
     */
    afterBuild?: (result: BuildResult) => void | Promise<void>;
};

export type BunupBunPlugin = {
    type: "bun";
    name?: string;
    plugin: BunPlugin;
};

export type BunupPlugin = {
    type: "bunup";
    name?: string;
    plugin: BunupPluginHooks;
};

export type Plugin = BunupBunPlugin | BunupPlugin;
