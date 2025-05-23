import { describe, expect, it } from 'bun:test'
import {
	getDtsPathFromSourceCodePath,
	getSourceCodePathFromDtsPath,
	isSourceCodeFile,
	isTypeScriptSourceCodeFile,
} from '../src/dts/utils'

describe('DTS Utils', () => {
	describe('getDtsPathFromSourceCodePath', () => {
		it('converts .ts to .d.ts', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/file.ts')).toBe(
				'/path/to/file.d.ts',
			)
		})

		it('converts .tsx to .d.ts', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/component.tsx')).toBe(
				'/path/to/component.d.ts',
			)
		})

		it('converts .mts to .d.mts', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/module.mts')).toBe(
				'/path/to/module.d.mts',
			)
		})

		it('converts .cts to .d.cts', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/commonjs.cts')).toBe(
				'/path/to/commonjs.d.cts',
			)
		})

		it('converts .js to .d.ts', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/file.js')).toBe(
				'/path/to/file.d.ts',
			)
		})

		it('converts .jsx to .d.ts', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/component.jsx')).toBe(
				'/path/to/component.d.ts',
			)
		})

		it('converts .mjs to .d.ts', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/module.mjs')).toBe(
				'/path/to/module.d.ts',
			)
		})

		it('converts .cjs to .d.ts', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/commonjs.cjs')).toBe(
				'/path/to/commonjs.d.ts',
			)
		})

		it('handles paths with multiple dots', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/file.spec.ts')).toBe(
				'/path/to/file.spec.d.ts',
			)
		})

		it('handles paths with no extension', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/file')).toBe(
				'/path/to/file.d.ts',
			)
		})

		it('handles empty string', () => {
			expect(getDtsPathFromSourceCodePath('')).toBe('.d.ts')
		})

		it('does not convert .d.ts files', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/file.d.ts')).toBe(
				'/path/to/file.d.ts',
			)
		})

		it('does not convert .d.mts files', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/file.d.mts')).toBe(
				'/path/to/file.d.mts',
			)
		})

		it('does not convert .d.cts files', () => {
			expect(getDtsPathFromSourceCodePath('/path/to/file.d.cts')).toBe(
				'/path/to/file.d.cts',
			)
		})
	})

	describe('getSourceCodePathFromDtsPath', () => {
		it('converts .d.ts to .ts', () => {
			expect(getSourceCodePathFromDtsPath('/path/to/file.d.ts')).toBe(
				'/path/to/file.ts',
			)
		})

		it('converts .d.mts to .mts', () => {
			expect(getSourceCodePathFromDtsPath('/path/to/module.d.mts')).toBe(
				'/path/to/module.mts',
			)
		})

		it('converts .d.cts to .cts', () => {
			expect(
				getSourceCodePathFromDtsPath('/path/to/commonjs.d.cts'),
			).toBe('/path/to/commonjs.cts')
		})

		it('does not convert source code files', () => {
			expect(getSourceCodePathFromDtsPath('/path/to/file.ts')).toBe(
				'/path/to/file.ts',
			)
			expect(getSourceCodePathFromDtsPath('/path/to/component.tsx')).toBe(
				'/path/to/component.tsx',
			)
			expect(getSourceCodePathFromDtsPath('/path/to/module.mts')).toBe(
				'/path/to/module.mts',
			)
			expect(getSourceCodePathFromDtsPath('/path/to/file.js')).toBe(
				'/path/to/file.js',
			)
			expect(getSourceCodePathFromDtsPath('/path/to/component.jsx')).toBe(
				'/path/to/component.jsx',
			)
		})

		it('handles paths with multiple dots', () => {
			expect(
				getSourceCodePathFromDtsPath('/path/to/file.spec.d.ts'),
			).toBe('/path/to/file.spec.ts')
		})

		it('handles non-source and non-dts files', () => {
			expect(getSourceCodePathFromDtsPath('/path/to/file.json')).toBe(
				'/path/to/file.json',
			)
		})

		it('handles empty string', () => {
			expect(getSourceCodePathFromDtsPath('')).toBe('')
		})
	})

	describe('isSourceCodeFile', () => {
		it('returns true for TypeScript files', () => {
			expect(isSourceCodeFile('/path/to/file.ts')).toBe(true)
			expect(isSourceCodeFile('/path/to/component.tsx')).toBe(true)
			expect(isSourceCodeFile('/path/to/module.mts')).toBe(true)
			expect(isSourceCodeFile('/path/to/commonjs.cts')).toBe(true)
		})

		it('returns true for JavaScript files', () => {
			expect(isSourceCodeFile('/path/to/file.js')).toBe(true)
			expect(isSourceCodeFile('/path/to/component.jsx')).toBe(true)
			expect(isSourceCodeFile('/path/to/module.mjs')).toBe(true)
			expect(isSourceCodeFile('/path/to/commonjs.cjs')).toBe(true)
		})

		it('returns false for non-source code files', () => {
			expect(isSourceCodeFile('/path/to/file.json')).toBe(false)
			expect(isSourceCodeFile('/path/to/image.png')).toBe(false)
			expect(isSourceCodeFile('/path/to/style.css')).toBe(false)
			expect(isSourceCodeFile('/path/to/file.d.ts')).toBe(false)
		})

		it('handles paths with multiple dots', () => {
			expect(isSourceCodeFile('/path/to/file.spec.ts')).toBe(true)
			expect(isSourceCodeFile('/path/to/component.test.tsx')).toBe(true)
			expect(isSourceCodeFile('/path/to/module.min.js')).toBe(true)
		})

		it('handles paths with no extension', () => {
			expect(isSourceCodeFile('/path/to/file')).toBe(false)
		})

		it('handles empty string', () => {
			expect(isSourceCodeFile('')).toBe(false)
		})
	})

	describe('isTypeScriptSourceCodeFile', () => {
		it('returns true for TypeScript files', () => {
			expect(isTypeScriptSourceCodeFile('/path/to/file.ts')).toBe(true)
			expect(isTypeScriptSourceCodeFile('/path/to/component.tsx')).toBe(
				true,
			)
			expect(isTypeScriptSourceCodeFile('/path/to/module.mts')).toBe(true)
			expect(isTypeScriptSourceCodeFile('/path/to/commonjs.cts')).toBe(
				true,
			)
		})

		it('returns false for JavaScript files', () => {
			expect(isTypeScriptSourceCodeFile('/path/to/file.js')).toBe(false)
			expect(isTypeScriptSourceCodeFile('/path/to/component.jsx')).toBe(
				false,
			)
			expect(isTypeScriptSourceCodeFile('/path/to/module.mjs')).toBe(
				false,
			)
			expect(isTypeScriptSourceCodeFile('/path/to/commonjs.cjs')).toBe(
				false,
			)
		})

		it('returns false for declaration files', () => {
			expect(isTypeScriptSourceCodeFile('/path/to/file.d.ts')).toBe(false)
			expect(isTypeScriptSourceCodeFile('/path/to/module.d.mts')).toBe(
				false,
			)
			expect(isTypeScriptSourceCodeFile('/path/to/commonjs.d.cts')).toBe(
				false,
			)
		})

		it('returns false for non-script files', () => {
			expect(isTypeScriptSourceCodeFile('/path/to/file.json')).toBe(false)
			expect(isTypeScriptSourceCodeFile('/path/to/image.png')).toBe(false)
			expect(isTypeScriptSourceCodeFile('/path/to/style.css')).toBe(false)
		})

		it('handles paths with multiple dots', () => {
			expect(isTypeScriptSourceCodeFile('/path/to/file.spec.ts')).toBe(
				true,
			)
			expect(
				isTypeScriptSourceCodeFile('/path/to/component.test.tsx'),
			).toBe(true)
			expect(isTypeScriptSourceCodeFile('/path/to/module.min.ts')).toBe(
				true,
			)
		})

		it('handles paths with no extension', () => {
			expect(isTypeScriptSourceCodeFile('/path/to/file')).toBe(false)
		})

		it('handles empty string', () => {
			expect(isTypeScriptSourceCodeFile('')).toBe(false)
		})
	})
})
