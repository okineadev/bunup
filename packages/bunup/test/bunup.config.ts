import { defineConfig } from '../src'

export default defineConfig([
	{
		entry: ['fixtures/index.tsx'],
		name: 'node',
		format: 'esm',
		target: 'node',
	},
	{
		entry: ['fixtures/index.tsx'],
		name: 'browser',
		format: ['esm', 'iife'],
		target: 'browser',
		outDir: 'dist/browser',
	},
])
