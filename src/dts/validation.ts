import fs from "node:fs/promises";
import path from "node:path";

import { BunupDTSBuildError } from "../errors";
import { isTypeScriptSourceCodeFile } from "./utils";

export async function validateInputs(
    rootDir: string,
    entry: string,
): Promise<{ absoluteRootDir: string; absoluteEntry: string }> {
    const absoluteRootDir = path.resolve(rootDir);
    const absoluteEntry = path.resolve(absoluteRootDir, entry);

    const isAbsoluteRootDirExists = await fs.exists(absoluteRootDir);

    if (!isAbsoluteRootDirExists) {
        throw new BunupDTSBuildError(
            `Root directory does not exist: ${absoluteRootDir}`,
        );
    }

    const isAbsoluteEntryExists = await Bun.file(absoluteEntry).exists();

    if (!isAbsoluteEntryExists) {
        throw new BunupDTSBuildError(
            `Entry file does not exist: ${absoluteEntry}`,
        );
    }

    if (!isTypeScriptSourceCodeFile(absoluteEntry)) {
        throw new BunupDTSBuildError(
            `Entry file must be a TypeScript file: ${absoluteEntry}`,
        );
    }

    if (path.relative(absoluteRootDir, absoluteEntry).startsWith("..")) {
        throw new BunupDTSBuildError(
            `Entry file must be within rootDir: ${absoluteEntry}`,
        );
    }

    return { absoluteRootDir, absoluteEntry };
}
