/**
 * Represents a bundler configuration for benchmarking purposes.
 */
export type Bundler = {
    /**
     * The name of the bundler (e.g., `bunup`, `tsdown`, `unbuild`, `bunchee`).
     */
    name: string;

    /**
     * The function that performs the build process for the bundler.
     * @param options - The bundler-specific options. The type of options is `any` because each bundler has its own options type.
     * @returns A Promise that resolves when the build is complete. Can return `undefined` or `any` depending on the bundler's build function.
     */
    buildFn: (options: any) => Promise<undefined | any>;

    /**
     * A bundler-specific options.
     * @param dts - A boolean indicating whether to generate declaration files (.d.ts).
     * @returns The bundler-specific options. The type of options is `any` because each bundler has its own options type.
     */
    options: (dts: boolean) => any;
};
