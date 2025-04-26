# CLI Options

Bunup supports various command-line options:

```sh
bunup [...entries] [options]
```

| Option                             | Alias       | Description                                                                                                                                     | Default          |
| ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `--entry <path>`                   |             | Entry file path [↗](/docs#entry-points)                                                                                                | `[]`             |
| `--entry.<name> <path>`            |             | Named entry file path [↗](/docs#named-entries)                                                                                         | -                |
| `--out-dir <dir>`                  | `-o`        | Output directory [↗](/docs#output-directory)                                                                                           | `dist`           |
| `--format <formats>`               | `-f`        | Output formats (comma-separated: esm,cjs,iife) [↗](/docs#output-formats)                                                               | `cjs`            |
| `--minify`                         | `-m`        | Enable all minification options [↗](/docs#minification)                                                                                | `false`          |
| `--minify-whitespace`              | `-mw`       | Minify whitespace [↗](/docs#granular-minification-control)                                                                             | `false`          |
| `--minify-identifiers`             | `-mi`       | Minify identifiers [↗](/docs#granular-minification-control)                                                                            | `false`          |
| `--minify-syntax`                  | `-ms`       | Minify syntax [↗](/docs#granular-minification-control)                                                                                 | `false`          |
| `--watch`                          | `-w`        | Watch mode [↗](/docs#watch-mode)                                                                                                       | `false`          |
| `--dts`                            | `-d`        | Generate TypeScript declarations [↗](/docs#typescript-declarations)                                                                    | `false`          |
| `--external <deps>`                | `-e`        | External dependencies (comma-separated) [↗](/docs#external-dependencies)                                                               | `[]`             |
| `--no-external <deps>`             | `-ne`       | Force include dependencies (comma-separated) [↗](/docs#including-specific-external-dependencies)                                       | -                |
| `--target <target>`                | `-t`        | Target environment (node, browser, bun) [↗](/docs#target-environments)                                                                 | `node`           |
| `--clean`                          | `-c`        | Clean output directory before build [↗](/docs#cleaning-the-output-directory)                                                           | `true`           |
| `--splitting`                      | `-s`        | Enable code splitting [↗](/docs#code-splitting)                                                                                        | Format dependent |
| `--sourcemap <type>`               | `-sm`       | Sourcemap generation (none,linked,external,inline) [↗](/docs#source-maps)                                                              | `none`           |
| `--banner <text>`                  | `-bn`       | Text to add at the beginning of output files [↗](/docs#banner-and-footer)                                                              | -                |
| `--footer <text>`                  | `-ft`       | Text to add at the end of output files [↗](/docs#banner-and-footer)                                                                    | -                |
| `--public-path <url>`              | `-pp`       | Prefix to be appended to import paths in bundled code [↗](/docs#public-path)                                                           | -                |
| `--name <name>`                    | `-n`        | Name for this build configuration [↗](/docs#named-configurations)                                                                      | -                |
| `--resolve-dts <value>`            | `-rd`       | Resolve external types for declaration files (can be boolean flag or comma-separated package list) [↗](/docs#resolving-external-types) | `false`          |
| `--dts-only`                       | `-do`       | Generate only TypeScript declaration files without JavaScript output [↗](/docs#declaration-only-generation)                            | `false`          |
| `--preferred-tsconfig-path <path>` | `-tsconfig` | Path to preferred tsconfig file used for typescript declaration files generation [↗](/docs#custom-typescript-configuration)            | -                |
| `--bytecode`                       | `-bc`       | Generate bytecode for JavaScript/TypeScript entrypoints to improve startup times [↗](/docs#bytecode)                                   | `false`          |
| `--silent`                         |             | Disable logging during the build process                                                                                                        | `false`          |
| `--shims`                          |             | Inject Node.js compatibility shims for ESM/CJS interoperability [↗](/docs#node-js-compatibility-shims)                                 | `false`          |
| `--env <mode>`                     |             | Control environment variable handling (inline, disable or PREFIX\_\*) [↗](/docs#environment-variables)                                 | -                |
| `--config <path>`                  |             | Specify a custom path to the configuration file                                                                                                 | -                |
| `--onSuccess <command>`            |             | Command to execute after a successful build                                                                                                     | -                |
| `--filter <packages>`              |             | Build only specific packages in a workspace (comma-separated) [↗](/docs/guide/workspaces#building-specific-packages)                                       | -                |
| `--version`                        | `-v`        | Display version information                                                                                                                     | -                |
| `--help`                           | `-h`        | Display help information                                                                                                                        | -                |
