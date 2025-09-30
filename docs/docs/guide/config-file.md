# Configuration File

Most build options can be set directly on the CLI, but a configuration file is recommended for **advanced scenarios**.  

You’ll need it when you want to:

- Add plugins  
- Implement custom logic (e.g. complex post-build operations, custom style injection)  
- Configure Bunup [workspaces](/docs/guide/workspaces)  
- Manage multiple build targets

## Getting Started

Create a `bunup.config.ts` file in your project root:

```ts [bunup.config.ts]
import { defineConfig } from 'bunup';

export default defineConfig({
  // ...your configuration options go here
});
```

This is the simplest way to centralize and reuse your build configuration.

## Multiple Configurations

Bunup supports exporting an **array of configurations**, useful when you want to build for multiple environments or formats in a single run:

```ts [bunup.config.ts]
export default defineConfig([
  {
    entry: "src/index.ts",
    name: 'node',
    format: 'esm',
    target: 'node',
  },
  {
    entry: "src/index.ts",
    name: 'browser',
    format: ['esm', 'iife'],
    target: 'browser',
    outDir: 'dist/browser',
  },
]);
```

With this setup, Bunup will build both Node.js and browser bundles.

## Named Configurations

Each build configuration can have a **name**. This improves log readability, especially when running multiple builds.

::: code-group

```sh [CLI]
bunup --name my-library
```

```ts [bunup.config.ts]
export default defineConfig({
  name: 'my-library',
});
```

:::

When working with multiple configurations, naming helps identify each build clearly:

```ts [bunup.config.ts]
export default defineConfig([
  {
    name: 'node-build',
    entry: "src/index.ts",
    format: 'esm',
    target: 'node',
    // ...other options
  },
  {
    name: 'browser-build',
    entry: "src/index.ts",
    format: ['esm', 'iife'],
    target: 'browser',
    // ...other options
  },
]);
```
