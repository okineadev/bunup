import { generateDtsForEntry } from './dts/generate'
import {
	BunupBuildError,
	BunupDTSBuildError,
	isIsolatedDeclError,
	parseErrorMessage,
} from './errors'
import {
	filterTypeScriptEntries,
	getAssetNamingFormat,
	getChunkNamingFormat,
	getEntryNamingFormat,
	normalizeEntryToProcessableEntries,
} from './helpers/entry'
import { loadPackageJson, loadTsconfig } from './loaders'
import { logger, setSilent } from './logger'
import {
	type BuildOptions,
	createBuildOptions,
	getResolvedBytecode,
	getResolvedDefine,
	getResolvedEnv,
	getResolvedMinify,
	getResolvedSourcemap,
	getResolvedSplitting,
} from './options'
import { externalPlugin } from './plugins/internal/external'
import { injectShimsPlugin } from './plugins/internal/shims'
import type { BuildOutput } from './plugins/types'
import {
	filterBunupBunPlugins,
	filterBunupPlugins,
	runPluginBuildDoneHooks,
	runPluginBuildStartHooks,
} from './plugins/utils'
import type { BunPlugin } from './types'
import {
	cleanOutDir,
	getDefaultDtsExtention,
	getDefaultOutputExtension,
	getShortFilePath,
	isModulePackage,
} from './utils'

export async function build(
	partialOptions: Partial<BuildOptions>,
	rootDir: string = process.cwd(),
): Promise<void> {
	const buildOutput: BuildOutput = {
		files: [],
	}

	const options = createBuildOptions(partialOptions)

	if (!options.entry || options.entry.length === 0 || !options.outDir) {
		throw new BunupBuildError(
			'Nothing to build. Please make sure you have provided a proper bunup configuration or cli arguments.',
		)
	}

	if (options.clean) {
		cleanOutDir(rootDir, options.outDir)
	}

	setSilent(options.silent)

	const { packageJson, path } = await loadPackageJson(rootDir)

	if (packageJson && path) {
		logger.cli(`Using ${getShortFilePath(path, 2)}`, {
			muted: true,
			identifier: options.name,
			once: `${path}:${options.name}`,
		})
	}

	const bunupPlugins = filterBunupPlugins(options.plugins)

	await runPluginBuildStartHooks(bunupPlugins, options)

	const processableEntries = normalizeEntryToProcessableEntries(options.entry)

	const packageType = packageJson?.type as string | undefined

	if (!options.dtsOnly) {
		const plugins: BunPlugin[] = [
			externalPlugin(options, packageJson),
			...filterBunupBunPlugins(options.plugins).map((p) => p.plugin),
		]

		const buildPromises = options.format.flatMap((fmt) =>
			processableEntries.map(async (entry) => {
				const extension =
					options.outputExtension?.({
						format: fmt,
						packageType,
						options,
						entry,
					}).js ?? getDefaultOutputExtension(fmt, packageType)

				const result = await Bun.build({
					entrypoints: [`${rootDir}/${entry.fullPath}`],
					format: fmt,
					naming: {
						entry: getEntryNamingFormat(
							entry.outputBasePath,
							extension,
						),
						chunk: getChunkNamingFormat(entry.outputBasePath),
						asset: getAssetNamingFormat(entry.outputBasePath),
					},
					splitting: getResolvedSplitting(options.splitting, fmt),
					bytecode: getResolvedBytecode(options.bytecode, fmt),
					define: getResolvedDefine(
						options.define,
						options.shims,
						options.env,
						fmt,
					),
					minify: getResolvedMinify(options),
					outdir: `${rootDir}/${options.outDir}`,
					target: options.target,
					sourcemap: getResolvedSourcemap(options.sourcemap),
					loader: options.loader,
					drop: options.drop,
					banner: options.banner,
					footer: options.footer,
					publicPath: options.publicPath,
					env: getResolvedEnv(options.env),
					plugins: [
						...plugins,
						injectShimsPlugin({
							format: fmt,
							target: options.target,
							shims: options.shims,
						}),
					],
					throw: false,
				})

				if (!result.success) {
					for (const log of result.logs) {
						if (log.level === 'error') {
							throw new BunupBuildError(log.message)
						}
						if (log.level === 'warning') logger.warn(log.message)
						else if (log.level === 'info') logger.info(log.message)
					}
				}

				// Add all outputs (main file, chunks, assets) to build output
				for (const file of result.outputs) {
					buildOutput.files.push({
						fullPath: file.path,
						relativePathToRootDir: file.path.replace(
							`${rootDir}/`,
							'',
						),
					})
				}

				const relativePathToRootDir = getRelativePathToRootDir(
					options.outDir,
					entry.outputBasePath,
					extension,
				)

				// Only log the main file for cleaner console output
				logger.progress(fmt.toUpperCase(), relativePathToRootDir, {
					identifier: options.name,
				})
			}),
		)

		await Promise.all(buildPromises)
	}

	if (options.dts || options.dtsOnly) {
		const tsconfig = await loadTsconfig(
			rootDir,
			options.preferredTsconfigPath,
		)

		if (tsconfig.path) {
			logger.cli(`Using ${getShortFilePath(tsconfig.path, 2)}`, {
				muted: true,
				identifier: options.name,
				once: `${tsconfig.path}:${options.name}`,
			})
		}

		const formatsToProcessDts = options.format.filter((fmt) => {
			if (
				fmt === 'iife' &&
				!isModulePackage(packageType) &&
				options.format.includes('cjs')
			) {
				return false
			}
			return true
		})

		const dtsEntry =
			typeof options.dts === 'object' && options.dts.entry
				? normalizeEntryToProcessableEntries(options.dts.entry)
				: filterTypeScriptEntries(processableEntries)

		try {
			await Promise.all(
				dtsEntry.map(async (entry) => {
					const content = await generateDtsForEntry(
						entry.fullPath,
						options,
						tsconfig,
						rootDir,
					)

					await Promise.all(
						formatsToProcessDts.map(async (fmt) => {
							const extension =
								options.outputExtension?.({
									format: fmt,
									packageType,
									options,
									entry,
								}).dts ??
								getDefaultDtsExtention(fmt, packageType)

							const relativePathToRootDir =
								getRelativePathToRootDir(
									options.outDir,
									entry.outputBasePath,
									extension,
								)

							const outputPath = getFullPath(
								rootDir,
								relativePathToRootDir,
							)

							buildOutput.files.push({
								fullPath: outputPath,
								relativePathToRootDir,
							})

							await Bun.write(outputPath, content)

							logger.progress('DTS', relativePathToRootDir, {
								identifier: options.name,
							})
						}),
					)
				}),
			)
		} catch (error) {
			if (isIsolatedDeclError(error)) {
				throw error
			}
			throw new BunupDTSBuildError(parseErrorMessage(error))
		}
	}

	await runPluginBuildDoneHooks(bunupPlugins, options, buildOutput)

	if (options.onSuccess) {
		await options.onSuccess(options)
	}
}

function getRelativePathToRootDir(
	outputDir: string,
	outputBasePath: string,
	extension: string,
): string {
	return `${outputDir}/${outputBasePath}${extension}`
}

function getFullPath(rootDir: string, relativePathToRootDir: string): string {
	return `${rootDir}/${relativePathToRootDir}`
}
