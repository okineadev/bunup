# Bunup Workspaces

Effortlessly manage **multiple packages in a monorepo** with Bunup’s built-in workspace support.  
With a single configuration file and a single command, you can build all your packages at once.

## Creating a Workspace Configuration

Define your workspace using the `defineWorkspace` function:

```ts [bunup.config.ts]
import { defineWorkspace } from "bunup";

export default defineWorkspace([
  // Package configurations go here
]);
```

## Package Configuration

Each package requires three properties:

| Property | Type                           | Description                                                  |
| -------- | ------------------------------ | ------------------------------------------------------------ |
| `name`   | `string`                       | Unique identifier for the package                            |
| `root`   | `string`                       | Path to the package directory, relative to the monorepo root |
| `config` | `BunupConfig \| BunupConfig[]` | Optional build configuration(s) for this package             |

👉 If you omit `config`, Bunup will use **defaults**:

* ESM-only build
* One of the [default entry points](/#default-entry-points) (e.g. `src/index.ts`)

This means for most packages you don’t need any configuration at all.

## Basic Usage

A minimal workspace with two packages:

```ts [bunup.config.ts]
import { defineWorkspace } from "bunup";

export default defineWorkspace([
  {
    name: "core",
    root: "packages/core",
    config: {
      entry: "src/index.ts",
      format: ["esm", "cjs"],
    },
  },
  {
    name: "utils",
    root: "packages/utils",
    // Uses default entry: src/index.ts
    // Uses default format: esm
  },
]);
```

Here, **`core`** has custom formats, while **`utils`** works out of the box with defaults.

## Shared Options

You can define **shared options** for all packages, reducing repetition:

```ts [bunup.config.ts]
import { defineWorkspace } from "bunup";

export default defineWorkspace(
  [
    {
      name: "core",
      root: "packages/core",
      config: {
        format: ["esm"], // overrides shared format
      },
    },
    {
      name: "utils",
      root: "packages/utils",
      // config is optional, shared options apply
    },
  ],
  {
    // Shared options
    format: ["esm", "cjs"],
    exports: true,
    unused: true,
  }
);
```

## Multiple Build Configurations

Each package can have multiple builds by passing an array:

```ts [bunup.config.ts]
import { defineWorkspace } from "bunup";

export default defineWorkspace([
  {
    name: "web",
    root: "packages/web",
    config: [
      {
        entry: "src/index.ts",
        name: "node",
        format: "esm",
        target: "node",
      },
      {
        entry: "src/index.ts",
        name: "browser",
        format: ["esm", "iife"],
        target: "browser",
        outDir: "dist/browser",
      },
    ],
  },
]);
```

::: tip
Use the `name` property inside each config to easily distinguish builds in logs.
:::

## Path Resolution

All paths in package configs are **relative to the package root**:

```
myproject/
├── packages/
│   ├── core/        <- package root
│   │   ├── src/     <- entries resolved here
│   │   └── dist/    <- outputs here
│   └── utils/
├── bunup.config.ts
└── package.json
```

Example:

```ts
{
  name: "core",
  root: "packages/core",
  config: {
    entry: "src/index.ts",  // resolves to packages/core/src/index.ts
    outDir: "dist",         // outputs to packages/core/dist/
  },
}
```

::: tip Plugin Paths
When using plugins (like [`copy`](/docs/builtin-plugins/copy)), paths are also resolved relative to the **package root**.
For example, `copy("assets/**/*.svg")` in the `core` package will copy from `packages/core/assets`.
:::

## Building Packages

### Build all packages

```sh
bunx bunup
```

### Watch mode

```sh
bunx bunup --watch
```

Bunup will watch **all packages** and rebuild only those that change.

### Build specific packages

Use the `--filter` option with package names:

```sh
bunx bunup --filter core,utils
# or in watch mode
bunx bunup --filter core,utils --watch
```

::: info Incremental Builds
Workspaces are **incremental**: only changed packages are rebuilt.
:::
