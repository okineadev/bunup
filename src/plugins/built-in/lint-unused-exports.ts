import path from "node:path";
import { Glob } from "bun";
import pc from "picocolors";
import { parseErrorMessage } from "../../errors";
import type { BunupPlugin } from "../types";

interface UnusedExportsLinterConfig {
    include: string;
    exclude?: string;
    level?: "warn" | "error";
    ignoreExports?: string[];
}

interface Position {
    line: number;
    column: number;
}

interface ExportInfo {
    filePath: string;
    name: string;
    position: Position;
    isType?: boolean;
}

interface UnusedExportsLinterResult {
    unusedExports: ExportInfo[];
    fileCount: number;
    exportCount: number;
}

export function lintUnusedExports(
    config: UnusedExportsLinterConfig,
): BunupPlugin {
    return {
        type: "bunup",
        name: "lint-unused-exports",
        plugin: {
            afterBuild: async () => {
                const result = await run(config);
                if (
                    result.unusedExports.length > 0 &&
                    config.level === "error"
                ) {
                    process.exitCode = 1;
                }
            },
        },
    };
}

async function run(
    config: UnusedExportsLinterConfig,
): Promise<UnusedExportsLinterResult> {
    const { include, exclude, level = "warn", ignoreExports = [] } = config;

    const filePaths = await collectFilePaths(include, exclude);

    if (filePaths.length === 0) {
        console.log(pc.green("No files found matching the pattern"));
        return { unusedExports: [], fileCount: 0, exportCount: 0 };
    }

    const fileContents = new Map<string, string>();
    await Promise.all(
        filePaths.map(async (filePath) => {
            try {
                fileContents.set(filePath, await Bun.file(filePath).text());
            } catch (error) {
                console.error(pc.red(`Failed to read ${pc.gray(filePath)}`));
            }
        }),
    );

    const allExports: ExportInfo[] = [];
    for (const [filePath, content] of fileContents.entries()) {
        try {
            allExports.push(...extractExports(content, filePath));
        } catch (error) {
            console.error(
                pc.red(`Failed to extract exports from ${pc.gray(filePath)}`),
            );
        }
    }

    const unusedExports = findUnusedExports(
        allExports,
        fileContents,
        ignoreExports,
    );

    if (unusedExports.length > 0) {
        reportUnusedExports(unusedExports, filePaths.length, level);
    } else {
        console.log(pc.green("No unused exports found"));
    }

    return {
        unusedExports,
        fileCount: filePaths.length,
        exportCount: allExports.length,
    };
}

async function collectFilePaths(
    includePattern: string,
    excludePattern?: string,
): Promise<string[]> {
    try {
        const includeGlob = new Glob(includePattern);
        const excludeGlob = excludePattern ? new Glob(excludePattern) : null;
        const filePaths: string[] = [];

        for await (const filePath of includeGlob.scan({
            cwd: process.cwd(),
            absolute: true,
            onlyFiles: true,
        })) {
            const relativePath = path.relative(process.cwd(), filePath);
            if (excludeGlob?.match(relativePath)) continue;

            const fileExt = path.extname(filePath).toLowerCase();
            if (
                [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(fileExt)
            ) {
                filePaths.push(filePath);
            }
        }

        return filePaths;
    } catch (error) {
        console.error(
            pc.red(`Error collecting files: ${parseErrorMessage(error)}`),
        );
        return [];
    }
}

function getPosition(content: string, index: number): Position {
    const lines = content.substring(0, index).split("\n");
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
    };
}

function extractExports(content: string, filePath: string): ExportInfo[] {
    const exports: ExportInfo[] = [];
    const fileExt = path.extname(filePath).toLowerCase();
    const isTypeScript = fileExt === ".ts" || fileExt === ".tsx";

    const namedExportRegex = /export\s+(?:type\s+)?{([^}]*)}/g;
    let match: RegExpExecArray | null;

    match = namedExportRegex.exec(content);
    while (match !== null) {
        const position = getPosition(content, match.index);
        const isType = match[0].includes("type {");
        const exportBlock = match[1];

        for (const part of exportBlock.split(",")) {
            const trimmedPart = part.trim();
            if (!trimmedPart) continue;

            const asMatch = trimmedPart.match(/(\w+)(?:\s+as\s+(\w+))?/);
            if (asMatch) {
                const exportName = asMatch[2] || asMatch[1];
                exports.push({ filePath, name: exportName, position, isType });
            }
        }
        match = namedExportRegex.exec(content);
    }

    const declExportRegex =
        /export\s+(?:type\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    match = declExportRegex.exec(content);
    while (match !== null) {
        const position = getPosition(content, match.index);
        const isType = match[0].includes("type ");
        exports.push({ filePath, name: match[1], position, isType });
        match = declExportRegex.exec(content);
    }

    const defaultNamedRegex = /export\s+default\s+(function|class)\s+(\w+)/g;
    match = defaultNamedRegex.exec(content);
    while (match !== null) {
        const position = getPosition(content, match.index);
        exports.push({ filePath, name: match[2], position });
        exports.push({ filePath, name: "default", position });
        match = defaultNamedRegex.exec(content);
    }

    const defaultExportRegex = /export\s+default\s+(\w+)(?!\s*[:(])/g;
    match = defaultExportRegex.exec(content);
    while (match !== null) {
        exports.push({
            filePath,
            name: "default",
            position: getPosition(content, match.index),
        });
        match = defaultExportRegex.exec(content);
    }

    const anonymousDefaultRegex =
        /export\s+default\s+(?:{|function|\(|new\s|\[)/m;
    const anonymousMatch = content.match(anonymousDefaultRegex);
    if (anonymousMatch && anonymousMatch.index !== undefined) {
        exports.push({
            filePath,
            name: "default",
            position: getPosition(content, anonymousMatch.index),
        });
    }

    if (isTypeScript) {
        const typeExportRegex = /export\s+(interface|type|enum)\s+(\w+)/g;
        match = typeExportRegex.exec(content);
        while (match !== null) {
            exports.push({
                filePath,
                name: match[2],
                position: getPosition(content, match.index),
                isType: true,
            });
            match = typeExportRegex.exec(content);
        }
    }

    return exports;
}

function findUnusedExports(
    allExports: ExportInfo[],
    fileContents: Map<string, string>,
    ignoreExports: string[] = [],
): ExportInfo[] {
    const exportsToCheck = allExports.filter(
        (exp) =>
            exp.name !== "default" &&
            exp.name.length > 1 &&
            /^[\w$]+$/.test(exp.name) &&
            !path.basename(exp.filePath).startsWith("index.") &&
            !ignoreExports.includes(exp.name),
    );

    const contentCache = new Map<string, string>();

    return exportsToCheck.filter((exportInfo) => {
        const { filePath, name, isType } = exportInfo;

        if (!contentCache.has(filePath)) {
            const combinedContent = Array.from(fileContents.entries())
                .filter(([path]) => path !== filePath)
                .map(([_, content]) => content)
                .join("\n");
            contentCache.set(filePath, combinedContent);
        }

        const combinedContent = contentCache.get(filePath);
        if (!combinedContent) {
            return false;
        }

        if (!combinedContent.includes(name)) {
            return true;
        }

        return !isExportUsed(combinedContent, name, isType);
    });
}

function isExportUsed(
    content: string,
    exportName: string,
    isType = false,
): boolean {
    const patterns = [
        new RegExp(`import\\s+{[^}]*\\b${exportName}\\b[^}]*}\\s+from`, "m"),
        new RegExp(
            `import\\s+type\\s+{[^}]*\\b${exportName}\\b[^}]*}\\s+from`,
            "m",
        ),
        new RegExp(`import\\s+\\b${exportName}\\b\\s+from`, "m"),
        new RegExp(`import\\s+\\*\\s+as\\s+\\b${exportName}\\b\\s+from`, "m"),
        new RegExp(
            `\\{[^}]*\\b${exportName}\\b[^}]*\\}\\s*=\\s*require\\(`,
            "m",
        ),
        new RegExp(`\\.${exportName}\\b`, "g"),
        new RegExp(`\\['${exportName}'\\]|\\["${exportName}"\\]`, "g"),
        new RegExp(`<${exportName}[\\s/>]`, "g"),
        new RegExp(`\\b${exportName}\\(`, "g"),
    ];

    if (isType) {
        patterns.push(
            new RegExp(`extends\\s+\\b${exportName}\\b`, "g"),
            new RegExp(`implements\\s+\\b${exportName}\\b`, "g"),
            new RegExp(`:\\s*\\b${exportName}\\b`, "g"),
            new RegExp(`<${exportName}>`, "g"),
        );
    }

    return patterns.some((pattern) => pattern.test(content));
}

function reportUnusedExports(
    unusedExports: ExportInfo[],
    fileCount: number,
    level: "warn" | "error",
): void {
    console.log("");
    const message = `Found ${unusedExports.length} unused ${
        unusedExports.length === 1 ? "export" : "exports"
    } across ${fileCount} files:`;
    if (level === "error") {
        console.error(pc.red(message));
    } else {
        console.warn(pc.yellow(message));
    }

    for (const { filePath, name, position } of unusedExports) {
        const relativePath = path.relative(process.cwd(), filePath);
        const message = `   ${pc.gray(`${relativePath} (${position.line}:${position.column}):`)} ${pc.blue(name)}`;

        if (level === "warn") {
            console.warn(message);
        } else {
            console.error(message);
        }
    }
    console.log("");
}
