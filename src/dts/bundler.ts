import { build } from "rolldown";
import { dts } from "rolldown-plugin-dts";
import { BunupDTSBuildError, parseErrorMessage } from "../errors";
import type { TsConfigData } from "../loaders";
import { logger } from "../logger";
import type { BuildOptions } from "../options";
import { typesResolvePlugin } from "../plugins/internal/types-resolve";
import type { DtsMap } from "./generator";
import {
    addDtsVirtualPrefix,
    dtsShouldTreatAsExternal,
    getDtsPathFromSourceCodePath,
} from "./utils";
import { gerVirtualFilesPlugin } from "./virtual-files";

export async function bundleDts(
    entryFile: string,
    dtsMap: DtsMap,
    options: BuildOptions,
    packageJson: Record<string, unknown> | null,
    tsconfig: TsConfigData,
    rootDir: string,
): Promise<string> {
    const entryDtsPath = getDtsPathFromSourceCodePath(entryFile);
    const initialDtsEntry = addDtsVirtualPrefix(entryDtsPath);

    const dtsResolve =
        typeof options.dts === "object" && "resolve" in options.dts
            ? options.dts.resolve
            : undefined;

    try {
        const { output } = await build({
            input: initialDtsEntry,
            output: {
                dir: options.outDir,
            },
            write: false,
            ...(tsconfig.path && {
                resolve: {
                    tsconfigFilename: tsconfig.path,
                },
            }),
            onwarn(warning, handler) {
                if (
                    [
                        "UNRESOLVED_IMPORT",
                        "CIRCULAR_DEPENDENCY",
                        "EMPTY_BUNDLE",
                    ].includes(warning.code ?? "")
                )
                    return;
                handler(warning);
            },
            plugins: [
                gerVirtualFilesPlugin(dtsMap, tsconfig, rootDir),
                dtsResolve && typesResolvePlugin(tsconfig, dtsResolve),
                dts({
                    dtsInput: true,
                    emitDtsOnly: true,
                }),
            ],
            external: (source) =>
                dtsShouldTreatAsExternal(
                    source,
                    options,
                    packageJson,
                    dtsResolve,
                ),
        });

        if (!output[0]?.code) {
            logger.warn(
                `Generated empty declaration file for entry "${entryFile}"`,
                {
                    muted: true,
                },
            );

            return "";
        }

        return output[0].code;
    } catch (error) {
        throw new BunupDTSBuildError(
            `DTS bundling failed for entry "${entryFile}": ${parseErrorMessage(error)}`,
        );
    }
}
