import { resolveTsImportPath } from "ts-import-resolver";
import { parseErrorMessage } from "../errors";
import type { TsConfigData } from "../loaders";
import { logger } from "../logger";
import { isDtsFile, isTypeScriptSourceCodeFile } from "./utils";

const importRegex = /^\s*import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm;
const exportRegex = /^\s*export\s+.*from\s+['"]([^'"]+)['"]/gm;
const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const importEqualsRegex =
    /import\s+\w+\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const referencePathRegex =
    /\/\/\/\s*<reference\s+path\s*=\s*['"]([^'"]+)['"]\s*\/>/g;
const referenceTypesRegex =
    /\/\/\/\s*<reference\s+types\s*=\s*['"]([^'"]+)['"]\s*\/>/g;

function extractImports(sourceText: string): Set<string> {
    const imports = new Set<string>();
    const regexes = [
        importRegex,
        exportRegex,
        dynamicImportRegex,
        requireRegex,
        importEqualsRegex,
        referencePathRegex,
        referenceTypesRegex,
    ];

    for (const regex of regexes) {
        const matches = sourceText.matchAll(regex);
        for (const match of matches) {
            if (match[1]) {
                imports.add(match[1]);
            }
        }
    }

    return imports;
}

export async function collectTsFiles(
    entry: string,
    tsconfig: TsConfigData,
    rootDir: string,
): Promise<Set<string>> {
    const visited = new Set<string>([entry]);
    const toVisit = [entry];

    while (toVisit.length) {
        const current = toVisit.pop();
        if (!current) continue;

        try {
            const sourceText = await Bun.file(current).text();
            const imports = extractImports(sourceText);

            for (const importPath of imports) {
                const resolvedImport = tsconfig.tsconfig
                    ? resolveTsImportPath({
                          path: importPath,
                          importer: current,
                          tsconfig: tsconfig.tsconfig,
                          rootDir,
                      })
                    : null;

                if (
                    !resolvedImport ||
                    !(
                        isTypeScriptSourceCodeFile(resolvedImport) ||
                        isDtsFile(resolvedImport)
                    )
                )
                    continue;

                if (!visited.has(resolvedImport)) {
                    visited.add(resolvedImport);
                    toVisit.push(resolvedImport);
                }
            }
        } catch (error) {
            logger.warn(
                `Error processing ${current}: ${parseErrorMessage(error)}`,
            );
        }
    }

    return visited;
}
