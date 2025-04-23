import pc from "picocolors";

type FormatType = "ESM" | "CJS" | "IIFE" | "DTS" | string;

interface LogOptions {
    muted?: boolean;
    verticalSpace?: boolean;
    identifier?: string;
    once?: string;
}

interface ProgressOptions extends LogOptions {
    size?: string;
}

let silent = false;

export function setSilent(value: boolean | undefined) {
    silent = value ?? false;
}

class Logger {
    private static instance: Logger;
    private loggedOnceMessages = new Set<string>();

    public readonly MAX_LABEL_LENGTH = 3;
    public readonly MAX_MESSAGE_LENGTH = 25;

    private cliColor = pc.blue;
    private mutedColor = pc.dim;
    private infoColor = pc.cyan;
    private warnColor = pc.yellow;
    private errorColor = pc.red;
    private sizeColor = pc.green;
    private defaultColor = pc.white;

    private progressFgColorMap: Record<string, (text: string) => string> = {
        ESM: pc.yellow,
        CJS: pc.green,
        IIFE: pc.magenta,
        DTS: pc.blue,
    };

    private progressBgColorMap: Record<string, (text: string) => string> = {
        ESM: pc.bgYellow,
        CJS: pc.bgGreen,
        IIFE: pc.bgMagenta,
        DTS: pc.bgBlue,
    };

    public labels = {
        cli: "CLI",
        info: "INFO",
        warn: "WARN",
        error: "ERROR",
    };

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public dispose(): void {
        this.loggedOnceMessages.clear();
    }

    private shouldLog(options?: LogOptions): boolean {
        if (!options?.once) return true;
        if (this.loggedOnceMessages.has(options.once)) return false;
        this.loggedOnceMessages.add(options.once);
        return true;
    }

    public formatMessage({
        fgColor,
        bgColor,
        label,
        message,
        size,
        identifier,
        muted,
    }: {
        fgColor: (text: string) => string;
        bgColor: (text: string) => string;
        label: string;
        message: string;
        size?: string;
        identifier?: string;
        muted?: boolean;
    }): string {
        const padding = " ".repeat(
            Math.max(0, this.MAX_LABEL_LENGTH - label.length),
        );
        const formattedMessage = muted ? this.mutedColor(message) : message;

        if (size) {
            const [path, ...rest] = formattedMessage.split(" ");
            const messagePadding = " ".repeat(
                Math.max(0, this.MAX_MESSAGE_LENGTH - path.length),
            );
            const identifierPart = identifier
                ? ` ${bgColor(pc.black(` "${identifier}" `))}`
                : "";
            return `${fgColor(label)} ${padding}${path}${messagePadding} ${this.sizeColor(size)} ${rest.join(" ")}${identifierPart}`;
        }

        const identifierPart = identifier
            ? `   ${bgColor(pc.black(` "${identifier}" `))}`
            : "";
        return `${fgColor(label)} ${padding}${formattedMessage}${identifierPart}`;
    }

    public output(
        message: string,
        options: LogOptions = {},
        logFn = console.log,
    ): void {
        if (silent || !this.shouldLog(options)) return;
        if (options.verticalSpace) console.log("");
        logFn(message);
        if (options.verticalSpace) console.log("");
    }

    public cli(message: string, options: LogOptions = {}): void {
        const formattedMessage = this.formatMessage({
            fgColor: this.cliColor,
            bgColor: pc.bgBlue,
            label: this.labels.cli,
            message,
            identifier: options.identifier,
            muted: options.muted,
        });
        this.output(formattedMessage, options);
    }

    public info(message: string, options: LogOptions = {}): void {
        const formattedMessage = this.formatMessage({
            fgColor: this.infoColor,
            bgColor: pc.bgCyan,
            label: this.labels.info,
            message,
            identifier: options.identifier,
            muted: options.muted,
        });
        this.output(formattedMessage, options);
    }

    public warn(message: string, options: LogOptions = {}): void {
        const formattedMessage = this.formatMessage({
            fgColor: this.warnColor,
            bgColor: pc.bgYellow,
            label: this.labels.warn,
            message,
            identifier: options.identifier,
            muted: options.muted,
        });
        this.output(formattedMessage, options, console.warn);
    }

    public error(message: string, options: LogOptions = {}): void {
        const formattedMessage = this.formatMessage({
            fgColor: this.errorColor,
            bgColor: pc.bgRed,
            label: this.labels.error,
            message,
            identifier: options.identifier,
            muted: options.muted,
        });
        this.output(formattedMessage, options, console.error);
    }

    private getProgressFgColor(label: string): (text: string) => string {
        for (const [key, colorFn] of Object.entries(this.progressFgColorMap)) {
            if (label.includes(key)) return colorFn;
        }
        return this.defaultColor;
    }

    private getProgressBgColor(label: string): (text: string) => string {
        for (const [key, colorFn] of Object.entries(this.progressBgColorMap)) {
            if (label.includes(key)) return colorFn;
        }
        return pc.bgWhite;
    }

    public progress(
        label: FormatType,
        message: string,
        sizeOrOptions?: string | ProgressOptions,
        identifier?: string,
    ): void {
        let size: string | undefined;
        let actualIdentifier: string | undefined;
        let options: LogOptions = {};

        if (typeof sizeOrOptions === "string") {
            size = sizeOrOptions;
            actualIdentifier = identifier;
        } else if (sizeOrOptions) {
            size = sizeOrOptions.size;
            actualIdentifier = sizeOrOptions.identifier;
            options = sizeOrOptions;
        }

        const fgColor = this.getProgressFgColor(label);
        const bgColor = this.getProgressBgColor(label);

        const formattedMessage = this.formatMessage({
            fgColor,
            bgColor,
            label,
            message,
            size,
            identifier: actualIdentifier,
            muted: options.muted,
        });

        this.output(formattedMessage, options);
    }
}

export const logger = Logger.getInstance();
