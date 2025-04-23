import { isExternal } from "../helpers/external";
import type { BuildOptions, DtsResolve } from "../options";
import { DTS_VIRTUAL_FILE_PREFIX } from "./virtual-files";

const JSTS_REGEX = /\.(js|mjs|cjs|ts|mts|cts|tsx|jsx)$/;

function isDtsFile(filePath: string): boolean {
    return (
        filePath.endsWith(".d.ts") ||
        filePath.endsWith(".d.mts") ||
        filePath.endsWith(".d.cts")
    );
}

export function isSourceCodeFile(filePath: string): boolean {
    return JSTS_REGEX.test(filePath) && !isDtsFile(filePath);
}

export function getDtsPathFromSourceCodePath(filePath: string): string {
    if (isDtsFile(filePath)) return filePath;

    if (filePath.endsWith(".mts")) return `${filePath.slice(0, -4)}.d.mts`;
    if (filePath.endsWith(".cts")) return `${filePath.slice(0, -4)}.d.cts`;

    if (JSTS_REGEX.test(filePath)) {
        return filePath.replace(JSTS_REGEX, ".d.ts");
    }

    return `${filePath}.d.ts`;
}

export function getSourceCodePathFromDtsPath(filePath: string): string {
    if (isSourceCodeFile(filePath)) return filePath;

    if (filePath.endsWith(".d.mts")) return `${filePath.slice(0, -6)}.mts`;
    if (filePath.endsWith(".d.cts")) return `${filePath.slice(0, -6)}.cts`;
    if (filePath.endsWith(".d.ts")) return `${filePath.slice(0, -5)}.ts`;

    return filePath;
}

export function isDtsVirtualFile(filePath: string): boolean {
    return filePath.startsWith(DTS_VIRTUAL_FILE_PREFIX);
}

export function removeDtsVirtualPrefix(filePath: string): string {
    return filePath.replace(DTS_VIRTUAL_FILE_PREFIX, "");
}

export function addDtsVirtualPrefix(filePath: string): string {
    return `${DTS_VIRTUAL_FILE_PREFIX}${filePath}`;
}

export function dtsShouldTreatAsExternal(
    source: string,
    options: BuildOptions,
    packageJson: Record<string, unknown> | null,
    dtsResolve: DtsResolve | undefined,
) {
    // When dtsResolve is true, don't treat any source as external because we need to treat all external types
    if (typeof dtsResolve === "boolean" && dtsResolve) {
        return false;
    }

    // When dtsResolve is an array, check if the source matches any pattern in the array
    // If it matches, don't treat it as external
    if (Array.isArray(dtsResolve)) {
        for (const pattern of dtsResolve) {
            if (typeof pattern === "string" && source === pattern) {
                return false;
            } else if (pattern instanceof RegExp && pattern.test(source)) {
                return false;
            }
        }
    }

    return isExternal(source, options, packageJson);
}
