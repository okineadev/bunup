import { generateDts } from "./dts";
import {
    BunupBuildError,
    BunupDTSBuildError,
    parseErrorMessage,
} from "./errors";
import {
    type ProcessableEntry,
    filterTypeScriptEntries,
    getEntryNamingFormat,
    normalizeEntryToProcessableEntries,
} from "./helpers/entry";
import { loadPackageJson, loadTsconfig } from "./loaders";
import { logger, setSilent } from "./logger";
import {
    type BuildOptions,
    type Format,
    createBuildOptions,
    getResolvedBytecode,
    getResolvedDefine,
    getResolvedEnv,
    getResolvedMinify,
    getResolvedSplitting,
} from "./options";
import { externalPlugin } from "./plugins/internal/external";
import { injectShimsPlugin } from "./plugins/internal/shims";
import { filterBunupBunPlugins } from "./plugins/utils";
import type { BunPlugin } from "./types";
import {
    cleanOutDir,
    formatFileSize,
    getDefaultDtsExtention,
    getDefaultOutputExtension,
    getShortFilePath,
    isModulePackage,
} from "./utils";

export const filesUsedToBundleDts: Set<string> = new Set<string>();

export async function build(
    partialOptions: Partial<BuildOptions>,
    rootDir: string = process.cwd(),
): Promise<void> {
    const options = createBuildOptions(partialOptions);

    if (!options.entry || options.entry.length === 0 || !options.outDir) {
        throw new BunupBuildError(
            "Nothing to build. Please make sure you have provided a proper bunup configuration or cli arguments.",
        );
    }

    if (options.clean) {
        cleanOutDir(rootDir, options.outDir);
    }

    setSilent(options.silent);

    const { packageJson, path } = await loadPackageJson(rootDir);

    if (packageJson && path) {
        logger.cli(`Using package.json: ${getShortFilePath(path, 2)}`, {
            muted: true,
            identifier: options.name,
            once: `${path}:${options.name}`,
        });
    }

    const processableEntries = normalizeEntryToProcessableEntries(
        options.entry,
    );

    const packageType = packageJson?.type as string | undefined;

    if (!options.dtsOnly) {
        const plugins: BunPlugin[] = [
            externalPlugin(options, packageJson),
            ...filterBunupBunPlugins(options.plugins ?? []).map(
                (p) => p.plugin,
            ),
        ];

        const buildPromises = options.format.flatMap((fmt) =>
            processableEntries.map((entry) => {
                return buildEntry(
                    options,
                    rootDir,
                    entry,
                    fmt,
                    packageType,
                    plugins,
                );
            }),
        );

        await Promise.all(buildPromises);
    }

    if (options.dts || options.dtsOnly) {
        const tsconfig = await loadTsconfig(
            rootDir,
            options.preferredTsconfigPath,
        );

        if (tsconfig.path) {
            logger.cli(
                `Using tsconfig: ${getShortFilePath(tsconfig.path, 2)}`,
                {
                    muted: true,
                    identifier: options.name,
                    once: `${tsconfig.path}:${options.name}`,
                },
            );
        }

        const formatsToProcessDts = options.format.filter((fmt) => {
            if (
                fmt === "iife" &&
                !isModulePackage(packageType) &&
                options.format.includes("cjs")
            ) {
                return false;
            }
            return true;
        });

        const dtsEntry =
            typeof options.dts === "object" && options.dts.entry
                ? normalizeEntryToProcessableEntries(options.dts.entry)
                : filterTypeScriptEntries(processableEntries);

        try {
            await Promise.all(
                dtsEntry.map(async (entry) => {
                    const content = await generateDts(
                        rootDir,
                        entry.fullEntryPath,
                        options,
                        tsconfig,
                        packageJson,
                    );

                    await Promise.all(
                        formatsToProcessDts.map(async (fmt) => {
                            const extension =
                                options.outputExtension?.({
                                    format: fmt,
                                    packageType,
                                    options,
                                    entry,
                                }).dts ??
                                getDefaultDtsExtention(fmt, packageType);

                            const relativePath = `${options.outDir}/${entry.name}${extension}`;
                            const outputPath = `${rootDir}/${relativePath}`;

                            await Bun.write(outputPath, content);
                            const fileSize = Bun.file(outputPath).size || 0;

                            logger.progress(
                                "DTS",
                                relativePath,
                                formatFileSize(fileSize),
                                options.name,
                            );
                        }),
                    );
                }),
            );
        } catch (error) {
            throw new BunupDTSBuildError(parseErrorMessage(error));
        }
    }

    if (options.onBuildSuccess) {
        await options.onBuildSuccess(options);
    }
}

async function buildEntry(
    options: BuildOptions,
    rootDir: string,
    entry: ProcessableEntry,
    fmt: Format,
    packageType: string | undefined,
    plugins: BunPlugin[],
): Promise<void> {
    const extension =
        options.outputExtension?.({
            format: fmt,
            packageType,
            options,
            entry,
        }).js ?? getDefaultOutputExtension(fmt, packageType);

    const result = await Bun.build({
        entrypoints: [`${rootDir}/${entry.fullEntryPath}`],
        format: fmt,
        naming: {
            entry: getEntryNamingFormat(entry.name, extension),
        },
        splitting: getResolvedSplitting(options.splitting, fmt),
        bytecode: getResolvedBytecode(options.bytecode, fmt),
        define: getResolvedDefine(
            options.define,
            options.shims,
            options.env,
            fmt,
        ),
        minify: getResolvedMinify(options),
        outdir: `${rootDir}/${options.outDir}`,
        target: options.target,
        sourcemap: options.sourcemap,
        loader: options.loader,
        drop: options.drop,
        banner: options.banner,
        footer: options.footer,
        publicPath: options.publicPath,
        env: getResolvedEnv(options.env),
        plugins: [
            ...plugins,
            injectShimsPlugin({
                format: fmt,
                target: options.target,
                shims: options.shims,
            }),
        ],
        throw: false,
    });

    if (!result.success) {
        for (const log of result.logs) {
            if (log.level === "error") throw new BunupBuildError(log.message);
            if (log.level === "warning") logger.warn(log.message);
            else if (log.level === "info") logger.info(log.message);
        }
    }

    const relativePath = `${options.outDir}/${entry.name}${extension}`;
    const outputPath = `${rootDir}/${relativePath}`;
    const fileSize = Bun.file(outputPath).size || 0;

    logger.progress(
        fmt.toUpperCase(),
        relativePath,
        formatFileSize(fileSize),
        options.name,
    );
}
