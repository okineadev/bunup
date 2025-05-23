const COMMON_OPTIONS = {
	outDir: 'dist',
	minify: true,
	splitting: false,
	target: 'bun',
}

export default [
	{
		...COMMON_OPTIONS,
		format: ['esm', 'cjs'],
		entry: {
			index: 'src/index.ts',
			plugins: 'src/plugins/built-in/index.ts',
		},
		dts: true,
	},
	{
		...COMMON_OPTIONS,
		entry: { cli: 'src/cli/index.ts' },
		format: ['esm'],
	},
]
